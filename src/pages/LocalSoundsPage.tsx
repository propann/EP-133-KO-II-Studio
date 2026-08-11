import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { LocalDirectoryHandle } from '../core/storage/localFolders';
import { chooseLocalDirectory } from '../core/storage/localFolders';
import { LOCAL_LIBRARY_FOLDER_KEY, SAMPLE_FOLDER_KEY, hasStoredPermission, loadDirectoryHandle, requestStoredPermission, saveDirectoryHandle } from '../core/storage/directoryHandleStore';
import { EP133_PADS } from '../core/project/pads';

interface FileEntryHandle { getFile(): Promise<File>; }
type Entry =
  | { kind: 'directory'; name: string; handle: LocalDirectoryHandle }
  | { kind: 'file'; name: string; handle: FileEntryHandle };

const GROUPS = ['A', 'B', 'C', 'D'] as const;
type Group = (typeof GROUPS)[number];
const AUDIO_PATTERN = /\.(wav|wave|aif|aiff|mp3|flac|ogg|m4a)$/i;
const padKey = (group: Group, pad: number) => `${group}:${pad}`;

interface Staged { fileName: string; handle: FileEntryHandle; sentAt?: string }

/** Nom de fichier sûr pour l'écriture disque (mêmes règles que `writeCloneManifest`). */
const safeFileName = (value: string) => value.trim().replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '') || 'son';

async function readEntries(dir: LocalDirectoryHandle): Promise<Entry[]> {
  const entries: Entry[] = [];
  for await (const handle of dir.values()) {
    if ('values' in handle) entries.push({ kind: 'directory', name: handle.name, handle });
    else if (AUDIO_PATTERN.test(handle.name)) entries.push({ kind: 'file', name: handle.name, handle });
  }
  entries.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'directory' ? -1 : 1));
  return entries;
}

/**
 * Banque de sons — ORDI : même principe de fenêtre que `SoundsPage` (banque
 * de sons DE LA MACHINE, groupes A–D + glisser-déposer) mais pour la
 * bibliothèque personnelle sur le disque de l'utilisateur, PAS pour l'état
 * réel de la machine. On ne réécrit jamais sur l'EP‑133 depuis ici — aucun
 * protocole d'écriture SysEx n'existe dans le projet, écrire dessus resterait
 * un mensonge d'interface. « ENVOYER » copie donc les fichiers choisis dans
 * le DOSSIER DE TRAVAIL déjà connecté depuis la Fiche personnage (le même
 * dossier que lit `SCANNER`/`CLONER`), sous `a-importer/` — une vraie
 * préparation sur disque, honnête sur ce qu'elle fait.
 */
export function LocalSoundsPage({ onBack }: { onBack: () => void }) {
  const [rootHandle, setRootHandle] = useState<LocalDirectoryHandle | null>(null);
  const [rootName, setRootName] = useState('');
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [stack, setStack] = useState<{ name: string; handle: LocalDirectoryHandle }[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [query, setQuery] = useState('');
  const [playingName, setPlayingName] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<Group>('A');
  const [selectedPad, setSelectedPad] = useState(1);
  const [staged, setStaged] = useState<Record<string, Staged>>({});
  const [sendState, setSendState] = useState<{ status: 'idle' | 'pending' | 'done' | 'error'; message: string }>({ status: 'idle', message: '' });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string>('');
  const draggingRef = useRef<{ fileName: string; handle: FileEntryHandle } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadDirectoryHandle(LOCAL_LIBRARY_FOLDER_KEY);
      if (!stored || cancelled) return;
      const granted = await hasStoredPermission(stored, 'read');
      if (cancelled) return;
      setRootHandle(stored);
      setRootName(stored.name);
      if (granted) { setNeedsReconnect(false); void enter(stored, []); } else setNeedsReconnect(true);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); }, []);

  const enter = async (handle: LocalDirectoryHandle, newStack: { name: string; handle: LocalDirectoryHandle }[]) => {
    setLoadingEntries(true);
    setStack(newStack);
    try { setEntries(await readEntries(handle)); } finally { setLoadingEntries(false); }
  };

  const chooseRoot = async () => {
    try {
      const handle = await chooseLocalDirectory('read');
      setRootHandle(handle);
      setRootName(handle.name);
      setNeedsReconnect(false);
      await enter(handle, []);
      // La mémorisation (IndexedDB) est un confort, pas une condition : si elle échoue
      // (navigation privée, quota…) on continue quand même à parcourir le dossier cette session.
      try { await saveDirectoryHandle(LOCAL_LIBRARY_FOLDER_KEY, handle); } catch { /* non mémorisé pour la prochaine visite, tant pis */ }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') window.alert(`Ouverture du dossier impossible : ${(error as Error)?.message || error}`);
    }
  };

  const reconnectRoot = async () => {
    if (!rootHandle) return;
    if (await requestStoredPermission(rootHandle, 'read')) { setNeedsReconnect(false); void enter(rootHandle, []); }
  };

  const openFolder = (entry: Entry & { kind: 'directory' }) => void enter(entry.handle, [...stack, { name: entry.name, handle: entry.handle }]);
  const goTo = (index: number) => {
    if (index < 0) { if (rootHandle) void enter(rootHandle, []); return; }
    const target = stack[index];
    void enter(target.handle, stack.slice(0, index + 1));
  };

  const preview = async (entry: Entry & { kind: 'file' }) => {
    if (playingName === entry.name) { audioRef.current?.pause(); setPlayingName(null); return; }
    const file = await entry.handle.getFile();
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    if (audioRef.current) { audioRef.current.src = url; void audioRef.current.play(); }
    setPlayingName(entry.name);
  };

  const stageFile = (group: Group, pad: number, fileName: string, handle: FileEntryHandle) => {
    setStaged((current) => ({ ...current, [padKey(group, pad)]: { fileName, handle } }));
  };
  const unstage = (group: Group, pad: number) => setStaged((current) => { const next = { ...current }; delete next[padKey(group, pad)]; return next; });

  const sendStaged = async () => {
    const entriesToSend = Object.entries(staged);
    if (!entriesToSend.length) return;
    setSendState({ status: 'pending', message: '' });
    try {
      let working = await loadDirectoryHandle(SAMPLE_FOLDER_KEY);
      if (!working) { setSendState({ status: 'error', message: 'AUCUN DOSSIER DE TRAVAIL — connecte-le d’abord depuis la FICHE PERSONNAGE.' }); return; }
      if (!await requestStoredPermission(working, 'readwrite')) { setSendState({ status: 'error', message: 'AUTORISATION D’ÉCRITURE REFUSÉE SUR LE DOSSIER DE TRAVAIL.' }); return; }
      const target = await working.getDirectoryHandle('a-importer', { create: true });
      const sentAt = new Date().toISOString();
      for (const [key, item] of entriesToSend) {
        const [group, pad] = key.split(':');
        const file = await item.handle.getFile();
        const destName = `${group}${String(pad).padStart(2, '0')}_${safeFileName(item.fileName)}`;
        const fileHandle = await target.getFileHandle(destName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();
      }
      setStaged((current) => Object.fromEntries(Object.entries(current).map(([key, item]) => [key, { ...item, sentAt }])));
      setSendState({ status: 'done', message: `${entriesToSend.length} SON(S) COPIÉ(S) DANS ${working.name}/a-importer` });
    } catch (error) {
      setSendState({ status: 'error', message: (error as Error)?.message || 'Échec de la copie.' });
    }
  };

  const filteredEntries = entries.filter((entry) => entry.name.toLowerCase().includes(query.trim().toLowerCase()));
  const stagedCount = Object.keys(staged).length;

  return <main className="local-sounds-page sound-library-page">
    <header className="module-header"><button onClick={onBack}>← ACCUEIL</button><div><small>BIBLIOTHÈQUE PERSO · ORDI</small><h1>BANQUE DE SONS — ORDI</h1></div><span className={rootHandle && !needsReconnect ? 'ready' : ''}>{rootHandle ? (needsReconnect ? 'AUTORISATION À RENOUVELER' : rootName) : 'AUCUN DOSSIER'}</span></header>

    {!rootHandle && <section className="local-empty">
      <p>Choisis le dossier de ta bibliothèque de sons personnelle sur l’ordinateur (celui d’avant le dossier de sauvegarde de la machine). Lecture seule — rien n’y est jamais modifié.</p>
      <button className="profile-connect" onClick={chooseRoot}>OUVRIR MA BIBLIOTHÈQUE</button>
    </section>}

    {rootHandle && needsReconnect && <section className="local-empty">
      <p>Le navigateur a besoin d’une confirmation pour relire « {rootName} ».</p>
      <button className="profile-connect" onClick={reconnectRoot}>RECONNECTER LE DOSSIER</button>
    </section>}

    {rootHandle && !needsReconnect && <section className="sound-machine-console local-console">
      <div className="sound-machine-topline local-topline">
        <div><small>DOSSIER</small><strong>{rootName}</strong></div>
        <nav className="local-breadcrumb" aria-label="Chemin">
          <button onClick={() => goTo(-1)}>{rootName}</button>
          {stack.map((item, index) => <button key={item.name + index} onClick={() => goTo(index)}>{item.name}</button>)}
        </nav>
        <button onClick={chooseRoot}>CHANGER DE DOSSIER</button>
        <button className={`sound-sync local-send ${stagedCount ? 'active' : ''}`} disabled={!stagedCount || sendState.status === 'pending'} onClick={sendStaged}>
          {sendState.status === 'pending' ? 'ENVOI…' : `ENVOYER · ${stagedCount}`}
        </button>
      </div>
      {sendState.status !== 'idle' && sendState.message && <p className={`local-send-feedback ${sendState.status}`}>{sendState.message}</p>}

      <div className="sound-machine-workspace">
        <section className="sound-pad-panel local-pad-panel">
          <header><div><small>PRÉPARATION</small><h2>PADS À REMPLIR</h2></div><small>CLIC SUR UN SON PUIS SUR UN PAD, OU GLISSE-DÉPOSE</small></header>
          <div className="sound-pad-machine">
            <nav className="sound-group-tabs" aria-label="Groupes">{GROUPS.map((group) => <button key={group} className={activeGroup === group ? 'active' : ''} aria-pressed={activeGroup === group} onClick={() => { setActiveGroup(group); setSelectedPad(1); }}><b>{group}</b><small>{Object.keys(staged).filter((key) => key.startsWith(`${group}:`)).length}/12</small></button>)}</nav>
            <div className="sound-pad-grid local-pad-grid">
              {EP133_PADS.map((visual, index) => {
                const pad = index + 1;
                const item = staged[padKey(activeGroup, pad)];
                return <button key={pad} style={{ '--pad-color': `var(--cat-${visual.category})` } as CSSProperties} className={`${selectedPad === pad ? 'selected' : ''} ${item ? 'changed' : ''} ${item?.sentAt ? 'sent' : ''}`} aria-pressed={selectedPad === pad}
                  onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }}
                  onDrop={(event) => { event.preventDefault(); const dragged = draggingRef.current; if (dragged) stageFile(activeGroup, pad, dragged.fileName, dragged.handle); }}
                  onClick={() => setSelectedPad(pad)}>
                  <span>{visual.key}</span>
                  <b>{item ? (item.sentAt ? '✓' : '●') : visual.name}</b>
                  <small>{item ? item.fileName.replace(AUDIO_PATTERN, '') : 'VIDE'}</small>
                  {item && <em onClick={(event) => { event.stopPropagation(); unstage(activeGroup, pad); }}>RETIRER</em>}
                </button>;
              })}
            </div>
          </div>
        </section>

        <section className="sound-bank-panel local-bank-panel">
          <header><div><small>{rootName}{stack.map((item) => ` / ${item.name}`).join('')}</small><h2>SONS DU DOSSIER</h2></div><span>{filteredEntries.length} ÉLÉMENT(S)</span></header>
          <div className="local-browser">
            <label className="local-search">RECHERCHER<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="NOM DE FICHIER OU DOSSIER" /></label>
            {loadingEntries && <p className="local-loading">Lecture du dossier…</p>}
            {!loadingEntries && <div className="local-entries">
              {filteredEntries.map((entry) => entry.kind === 'directory'
                ? <button key={entry.name} className="local-entry local-folder" onClick={() => openFolder(entry)}><b>📁</b><span>{entry.name}</span></button>
                : <div key={entry.name} className="local-entry local-file" draggable
                    onDragStart={(event) => { draggingRef.current = { fileName: entry.name, handle: entry.handle }; event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('text/plain', entry.name); }}
                    onDragEnd={() => { draggingRef.current = null; }}>
                    <button className="local-preview-btn" onClick={() => void preview(entry)} aria-label={playingName === entry.name ? 'Pause' : 'Écouter'}>{playingName === entry.name ? '⏸' : '▶'}</button>
                    <span title={entry.name}>{entry.name}</span>
                    <button className="local-assign-btn" onClick={() => stageFile(activeGroup, selectedPad, entry.name, entry.handle)}>→ {activeGroup}{selectedPad}</button>
                  </div>)}
              {!filteredEntries.length && <p>Aucun son ici.</p>}
            </div>}
          </div>
        </section>
      </div>
    </section>}

    <audio ref={audioRef} onEnded={() => setPlayingName(null)} hidden />
  </main>;
}
