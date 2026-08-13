import { useEffect, useState } from 'react';
import { decodeEp133ProjectTar, ep133ArchiveProjectToDocument } from '../../core/project/importers';

/**
 * Glisser-déposer de projets entre la machine (9 emplacements réels) et le
 * logiciel (démos + bibliothèque locale) — demande explicite de
 * l'utilisateur (13 août), avec un point de conception validé avant coup :
 * le glisser-déposer PRÉPARE le transfert (le point de dépôt choisit la
 * cible), une confirmation explicite séparée déclenche l'écriture réelle.
 *
 * Passe par le pont local (`tools/local_clone_bridge.py`, routes
 * `/projects/list`/`/projects/read`/`/projects/write`, ajoutées le même
 * jour) plutôt que de réimplémenter le compilateur binaire EP-133 en
 * TypeScript — ces routes réutilisent directement `epsysex.compile_project`
 * et le pipeline checkpoint/écriture/relecture octet à octet déjà validé en
 * conditions réelles avec `tools/send_project_to_machine.py` (copie
 * P01→P09 confirmée par l'utilisateur sur la machine).
 *
 * Décodage machine → logiciel : réutilise `decodeEp133ProjectTar`/
 * `ep133ArchiveProjectToDocument` (`importers.ts`), déjà éprouvés pour les
 * archives `.pak`/`.ppak` — aucun nouveau parseur binaire ici.
 */

interface MachineProjectEntry {
  slot: number;
  present: boolean;
  byteSize?: number;
  error?: string;
}

interface ProjectSource {
  origin: 'demo' | 'local' | 'machine';
  id: string;
  title: string;
}

interface StagedTransfer extends ProjectSource {
  stageId: string;
  direction: 'to-machine' | 'to-library';
  targetSlot?: number;
}

type TransferResult = { status: 'ok'; message: string } | { status: 'error'; message: string };

interface ProjectTransferProps {
  demoProjects: ReadonlyArray<{ id: string; title: string }>;
  localProjects: ReadonlyArray<{ id: string; title: string }>;
  /** Résout un projet démo ou local en document `ep.project.v1` complet — les cartes n'en portent qu'un résumé. */
  onGetProjectDocument: (origin: 'demo' | 'local', id: string) => Promise<Record<string, unknown> | null>;
  onImportMachineProject: (document: Record<string, unknown>, suggestedTitle: string) => void;
}

const DRAG_MIME = 'application/x-ep133-project-source';

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export function ProjectTransfer({ demoProjects, localProjects, onGetProjectDocument, onImportMachineProject }: ProjectTransferProps) {
  const [bridgeRoot, setBridgeRoot] = useState('');
  const [machineProjects, setMachineProjects] = useState<MachineProjectEntry[]>([]);
  const [listError, setListError] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const [staged, setStaged] = useState<StagedTransfer[]>([]);
  const [results, setResults] = useState<Record<string, TransferResult>>({});
  const [confirming, setConfirming] = useState(false);

  const refreshProjects = async () => {
    setListLoading(true);
    setListError('');
    try {
      const response = await fetch('/bridge/projects/list', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Pont indisponible (${response.status}).`);
      const value = await response.json() as { projects: MachineProjectEntry[] };
      setMachineProjects(value.projects);
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Impossible de lister les projets de la machine.');
      setMachineProjects([]);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetch('/bridge/health', { cache: 'no-store' }).then((response) => response.ok ? response.json() : Promise.reject()).then((value: { root: string }) => setBridgeRoot(value.root)).catch(() => setBridgeRoot(''));
  }, []);

  useEffect(() => {
    if (bridgeRoot) void refreshProjects();
  }, [bridgeRoot]);

  const stage = (transfer: Omit<StagedTransfer, 'stageId'>) => {
    setStaged((current) => [...current, { ...transfer, stageId: `${transfer.direction}:${transfer.origin}:${transfer.id}:${transfer.targetSlot ?? ''}:${Date.now()}` }]);
  };

  const unstage = (stageId: string) => setStaged((current) => current.filter((item) => item.stageId !== stageId));

  const onCardDragStart = (source: ProjectSource) => (event: React.DragEvent) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(DRAG_MIME, JSON.stringify(source));
  };

  const readDraggedSource = (event: React.DragEvent): ProjectSource | null => {
    const raw = event.dataTransfer.getData(DRAG_MIME);
    if (!raw) return null;
    try { return JSON.parse(raw) as ProjectSource; } catch { return null; }
  };

  const onMachineSlotDrop = (slot: number) => (event: React.DragEvent) => {
    event.preventDefault();
    const source = readDraggedSource(event);
    if (!source || source.origin === 'machine') return;
    stage({ ...source, direction: 'to-machine', targetSlot: slot });
  };

  const onLibraryColumnDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const source = readDraggedSource(event);
    if (!source || source.origin !== 'machine') return;
    stage({ ...source, direction: 'to-library' });
  };

  const confirmTransfers = async () => {
    if (!staged.length || confirming) return;
    const toMachine = staged.filter((item) => item.direction === 'to-machine');
    if (toMachine.length) {
      const list = toMachine.map((item) => `· P${String(item.targetSlot).padStart(2, '0')} ← ${item.title}`).join('\n');
      if (!window.confirm(`ÉCRIRE RÉELLEMENT SUR LA MACHINE ?\n\n${list}\n\nChaque emplacement listé sera remplacé (un checkpoint est écrit automatiquement avant, restaurable manuellement).`)) return;
    }
    setConfirming(true);
    // Séquentiel, jamais en parallèle : une seule session FILE à la fois sur
    // la machine (voir tools/local_clone_bridge.py, verrou epsysex).
    for (const item of staged) {
      try {
        if (item.direction === 'to-machine') {
          const document = await onGetProjectDocument(item.origin as 'demo' | 'local', item.id);
          if (!document) throw new Error('Document introuvable.');
          const response = await fetch('/bridge/projects/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slot: item.targetSlot, document }) });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(body.error || `Échec (${response.status}).`);
          setResults((current) => ({ ...current, [item.stageId]: { status: 'ok', message: `Écrit · checkpoint ${body.checkpoint}` } }));
        } else {
          const response = await fetch(`/bridge/projects/read?slot=${item.id}`, { cache: 'no-store' });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(body.error || `Échec (${response.status}).`);
          const bytes = base64ToBytes(body.tarBase64 as string);
          const archive = decodeEp133ProjectTar(bytes, `projects/P${String(item.id).padStart(2, '0')}.tar`);
          const document = ep133ArchiveProjectToDocument(archive, item.title);
          onImportMachineProject(document, item.title);
          setResults((current) => ({ ...current, [item.stageId]: { status: 'ok', message: 'Importé dans la bibliothèque locale' } }));
        }
      } catch (error) {
        setResults((current) => ({ ...current, [item.stageId]: { status: 'error', message: error instanceof Error ? error.message : 'Échec inattendu.' } }));
      }
    }
    setStaged([]);
    setConfirming(false);
    if (staged.some((item) => item.direction === 'to-machine')) void refreshProjects();
  };

  if (!bridgeRoot) return <section className="project-transfer">
    <h2>TRANSFERT DE PROJETS</h2>
    <p className="sound-transfer-note">Pont local non détecté (`tools/local_clone_bridge.py`) — nécessaire pour lister et transférer les projets de la machine. Voir <code>docs/PONT_LOCAL_CLONAGE.md</code>.</p>
  </section>;

  return <section className="project-transfer">
    <h2>TRANSFERT DE PROJETS</h2>
    <p className="sound-transfer-note">Glisse une carte sur un emplacement de la machine pour préparer une écriture, ou une carte machine vers la bibliothèque pour préparer un import — rien n'est écrit avant confirmation explicite ci-dessous.</p>
    <div className="project-transfer-columns">
      <div className="project-transfer-column">
        <header><h3>PROJETS MACHINE</h3><button onClick={() => void refreshProjects()} disabled={listLoading}>{listLoading ? '…' : '↻'}</button></header>
        {listError && <small className="profile-folder-warning">{listError}</small>}
        <div className="project-transfer-grid" onDragOver={(event) => event.preventDefault()} onDrop={onLibraryColumnDrop}>
          {machineProjects.map((entry) => <article
            key={entry.slot}
            className={`project-transfer-card machine-side ${entry.present ? 'present' : 'empty'}`}
            draggable={entry.present}
            onDragStart={entry.present ? onCardDragStart({ origin: 'machine', id: String(entry.slot), title: `PROJET P${String(entry.slot).padStart(2, '0')}` }) : undefined}
            onDragOver={(event) => event.preventDefault()}
            onDrop={onMachineSlotDrop(entry.slot)}
          ><i className="project-transfer-arrow left" aria-hidden="true" /><b>P{String(entry.slot).padStart(2, '0')}</b><small>{entry.present ? `${((entry.byteSize || 0) / 1000).toFixed(0)} KO` : entry.error || 'VIDE'}</small><i className="project-transfer-arrow right" aria-hidden="true" /></article>)}
        </div>
      </div>
      <div className="project-transfer-column">
        <header><h3>DÉMO + BIBLIOTHÈQUE</h3></header>
        <div className="project-transfer-grid">
          {demoProjects.map((demo) => <article className="project-transfer-card" key={`demo-${demo.id}`} draggable onDragStart={onCardDragStart({ origin: 'demo', id: demo.id, title: demo.title })}><i className="project-transfer-arrow left" aria-hidden="true" /><b>{demo.title}</b><small>DÉMO</small></article>)}
          {localProjects.map((project) => <article className="project-transfer-card" key={`local-${project.id}`} draggable onDragStart={onCardDragStart({ origin: 'local', id: project.id, title: project.title })}><i className="project-transfer-arrow left" aria-hidden="true" /><b>{project.title}</b><small>LOCAL</small></article>)}
        </div>
      </div>
    </div>
    <div className="project-transfer-queue">
      <h3>TRANSFERTS EN ATTENTE · {staged.length}</h3>
      {!staged.length && <p className="sound-transfer-note">Rien en attente.</p>}
      {staged.map((item) => <div className="project-transfer-queue-item" key={item.stageId}>
        <span>{item.direction === 'to-machine' ? `${item.title} → P${String(item.targetSlot).padStart(2, '0')} (MACHINE)` : `P${String(item.id).padStart(2, '0')} → BIBLIOTHÈQUE LOCALE`}</span>
        {results[item.stageId] && <small className={results[item.stageId].status === 'ok' ? 'profile-scan-feedback' : 'profile-folder-warning'}>{results[item.stageId].message}</small>}
        <button onClick={() => unstage(item.stageId)} disabled={confirming}>RETIRER</button>
      </div>)}
      <button className="sound-sync" disabled={!staged.length || confirming} onClick={() => void confirmTransfers()}>{confirming ? 'TRANSFERT EN COURS…' : `CONFIRMER · ${staged.length}`}</button>
    </div>
  </section>;
}
