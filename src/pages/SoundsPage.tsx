import { useEffect, useMemo, useRef, useState } from 'react';
import type { EditorGroup, EditorPadMode } from '../core/project/exporters';
import type { DeviceInventory, DeviceSoundIndex } from '../core/project/device';
import { loadDeviceProfile, saveDeviceProfile } from '../core/project/deviceProfile';
import { EP133_PADS } from '../core/project/pads';
import { officialGroupIndexFromNote, officialInternalPadFromNote } from '../core/midi/useWebMidi';
import type { LocalDirectoryHandle } from '../core/storage/localFolders';
import { SAMPLE_FOLDER_KEY, loadDirectoryHandle, requestStoredPermission } from '../core/storage/directoryHandleStore';

interface FileEntryHandle { getFile(): Promise<File>; }
type LocalEntry =
  | { kind: 'directory'; name: string; handle: LocalDirectoryHandle }
  | { kind: 'file'; name: string; handle: FileEntryHandle };
interface StagedLocalFile { fileName: string; handle: FileEntryHandle }

interface SoundsPageProps {
  inventory: DeviceInventory | null;
  soundIndex: DeviceSoundIndex | null;
  midiConnected: boolean;
  liveMidi: { note: number; velocity: number; timestamp: number } | null;
  padModes: Record<string, EditorPadMode>;
  onBack: () => void;
  onConnectMidi: () => void;
  onPadModeChange: (group: EditorGroup, pad: number, mode: EditorPadMode) => void;
  onPadPreview: (group: EditorGroup, pad: number, stagedSlot?: number) => void;
  /** Bibliothèque perso (dossier réglé depuis la Fiche personnage — cette page ne fait que la lire). */
  localLibraryHandle: LocalDirectoryHandle | null;
  localLibraryFolderName: string;
  localLibraryNeedsReconnect: boolean;
  onReconnectLocalLibrary: () => void;
}

const GROUPS: EditorGroup[] = ['A', 'B', 'C', 'D'];
const INTERNAL_PAD_ORDER = Array.from({ length: 12 }, (_, index) => index + 1);
const SOUND_BANKS = [
  { id: 'all', label: 'TOUS', range: '001–999', from: 1, to: 999 },
  { id: 'kick', label: 'KICK', range: '001–099', from: 1, to: 99 },
  { id: 'snare', label: 'SNARE', range: '100–199', from: 100, to: 199 },
  { id: 'hat', label: 'HI-HAT', range: '200–299', from: 200, to: 299 },
  { id: 'perc', label: 'PERC', range: '300–399', from: 300, to: 399 },
  { id: 'bass', label: 'BASS', range: '400–499', from: 400, to: 499 },
  { id: 'melodic', label: 'MELODIC', range: '500–599', from: 500, to: 599 },
  { id: 'fx', label: 'FX / USER', range: '600–699', from: 600, to: 699 },
  { id: 'user1', label: 'USER 1', range: '700–799', from: 700, to: 799 },
  { id: 'user2', label: 'USER 2', range: '800–899', from: 800, to: 899 },
  { id: 'extra', label: 'USER 3', range: '900–999', from: 900, to: 999 },
] as const;

const AUDIO_PATTERN = /\.(wav|wave|aif|aiff|mp3|flac|ogg|m4a)$/i;
const safeFileName = (value: string) => value.trim().replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '') || 'son';

async function readLocalEntries(dir: LocalDirectoryHandle): Promise<LocalEntry[]> {
  const entries: LocalEntry[] = [];
  for await (const handle of dir.values()) {
    if ('values' in handle) entries.push({ kind: 'directory', name: handle.name, handle });
    else if (AUDIO_PATTERN.test(handle.name)) entries.push({ kind: 'file', name: handle.name, handle });
  }
  entries.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'directory' ? -1 : 1));
  return entries;
}

const bankForSlot = (slot: number) => SOUND_BANKS.slice(1).find((bank) => slot >= bank.from && slot <= bank.to) || SOUND_BANKS[10];
const playModeName = (mode?: number) => mode === 1 ? 'KEYS' : mode === 2 ? 'LEGATO' : 'ONE';

export function SoundsPage({ inventory, soundIndex, midiConnected, liveMidi, padModes, onBack, onConnectMidi, onPadModeChange, onPadPreview, localLibraryHandle, localLibraryFolderName, localLibraryNeedsReconnect, onReconnectLocalLibrary }: SoundsPageProps) {
  const existingProfile = loadDeviceProfile(localStorage);
  const [deviceName, setDeviceName] = useState(existingProfile?.name || 'MON EP-133');
  const [capacityMb, setCapacityMb] = useState<64 | 128>(existingProfile?.capacityMb || 64);
  const [sampleFolderName, setSampleFolderName] = useState(existingProfile?.sampleFolderName || '');
  const [localSampleCount, setLocalSampleCount] = useState(existingProfile?.localSampleCount || 0);
  const [profileSaved, setProfileSaved] = useState(Boolean(existingProfile));
  const [activeGroup, setActiveGroup] = useState<EditorGroup>('A');
  const [selectedPad, setSelectedPad] = useState(1);
  const [activeBank, setActiveBank] = useState<(typeof SOUND_BANKS)[number]['id']>('all');
  const [query, setQuery] = useState('');
  const [livePad, setLivePad] = useState<number | null>(null);
  const [stagedAssignments, setStagedAssignments] = useState<Record<string, number>>({});
  // Affectations venues de la bibliothèque perso plutôt que de la banque machine — pad ou slot visé.
  const [stagedLocalPads, setStagedLocalPads] = useState<Record<string, StagedLocalFile>>({});
  const [stagedImports, setStagedImports] = useState<Record<number, StagedLocalFile>>({});
  const [importFeedback, setImportFeedback] = useState<{ status: 'done' | 'error'; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const usedMb = (soundIndex?.usedBytes || 0) / 1e6;
  const usedPercent = Math.min(100, usedMb / capacityMb * 100);

  // Bibliothèque perso : navigation en fil d'Ariane, un niveau à la fois (jamais de scan récursif —
  // certaines bibliothèques comptent des dizaines de milliers de fichiers).
  const [persoStack, setPersoStack] = useState<{ name: string; handle: LocalDirectoryHandle }[]>([]);
  const [persoEntries, setPersoEntries] = useState<LocalEntry[]>([]);
  const [persoLoading, setPersoLoading] = useState(false);
  const [persoQuery, setPersoQuery] = useState('');
  const [playingName, setPlayingName] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef('');
  const draggingLocalRef = useRef<StagedLocalFile | null>(null);

  const padsByNumber = useMemo(() => new Map(
    (inventory?.pads || []).filter((pad) => pad.group === activeGroup).map((pad) => [pad.pad, pad]),
  ), [activeGroup, inventory]);
  const currentPad = padsByNumber.get(selectedPad);
  const namesBySlot = useMemo(() => new Map(Object.entries(inventory?.sounds || {}).map(([slot, sound]) => [Number(slot), sound.name])), [inventory]);
  const selectedBank = SOUND_BANKS.find((bank) => bank.id === activeBank) || SOUND_BANKS[0];
  const filteredSounds = useMemo(() => (soundIndex?.sounds || []).filter((sound) => {
    const inBank = activeBank === 'all' || (sound.slot >= selectedBank.from && sound.slot <= selectedBank.to);
    const label = `${sound.slot} ${namesBySlot.get(sound.slot) || ''} ${sound.fileName}`.toLowerCase();
    return inBank && label.includes(query.trim().toLowerCase());
  }), [activeBank, namesBySlot, query, selectedBank, soundIndex]);
  const selectedMode = padModes[`${activeGroup}:${selectedPad - 1}`]
    || playModeName(currentPad?.playMode) as EditorPadMode;
  const changedSlots = useMemo(() => new Set(Object.values(stagedAssignments)), [stagedAssignments]);
  const changeCount = Object.keys(stagedAssignments).length + Object.keys(stagedLocalPads).length + Object.keys(stagedImports).length;
  const persoFolders = useMemo(() => persoEntries.filter((entry): entry is LocalEntry & { kind: 'directory' } => entry.kind === 'directory'), [persoEntries]);
  const filteredPersoFiles = useMemo(() => persoEntries.filter((entry): entry is LocalEntry & { kind: 'file' } => entry.kind === 'file' && entry.name.toLowerCase().includes(persoQuery.trim().toLowerCase())), [persoEntries, persoQuery]);

  useEffect(() => {
    if (!liveMidi || performance.now() - liveMidi.timestamp > 1000 || liveMidi.note < 36 || liveMidi.note > 83) return;
    const internalPad = officialInternalPadFromNote(liveMidi.note);
    const groupIndex = officialGroupIndexFromNote(liveMidi.note);
    if (internalPad === undefined || groupIndex === undefined) return;
    const group = GROUPS[groupIndex];
    setActiveGroup(group);
    setSelectedPad(internalPad);
    setLivePad(internalPad);
    const timer = window.setTimeout(() => setLivePad(null), 220);
    return () => window.clearTimeout(timer);
  }, [liveMidi]);

  // Recharge la racine dès que le dossier perso devient disponible/reconnecté (réglé depuis la Fiche personnage).
  useEffect(() => {
    if (!localLibraryHandle || localLibraryNeedsReconnect) { setPersoEntries([]); setPersoStack([]); return; }
    let cancelled = false;
    setPersoLoading(true);
    readLocalEntries(localLibraryHandle).then((entries) => { if (!cancelled) { setPersoEntries(entries); setPersoStack([]); } }).finally(() => { if (!cancelled) setPersoLoading(false); });
    return () => { cancelled = true; };
  }, [localLibraryHandle, localLibraryNeedsReconnect]);

  useEffect(() => () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); }, []);

  const enterPerso = (entry: LocalEntry & { kind: 'directory' }) => {
    const newStack = [...persoStack, { name: entry.name, handle: entry.handle }];
    setPersoLoading(true);
    setPersoStack(newStack);
    readLocalEntries(entry.handle).then(setPersoEntries).finally(() => setPersoLoading(false));
  };
  const gotoPerso = (index: number) => {
    const handle = index < 0 ? localLibraryHandle : persoStack[index].handle;
    if (!handle) return;
    const newStack = index < 0 ? [] : persoStack.slice(0, index + 1);
    setPersoLoading(true);
    setPersoStack(newStack);
    readLocalEntries(handle).then(setPersoEntries).finally(() => setPersoLoading(false));
  };
  const previewPerso = async (entry: LocalEntry & { kind: 'file' }) => {
    if (playingName === entry.name) { audioRef.current?.pause(); setPlayingName(null); return; }
    const file = await entry.handle.getFile();
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    if (audioRef.current) { audioRef.current.src = url; void audioRef.current.play(); }
    setPlayingName(entry.name);
  };

  const saveProfile = () => {
    saveDeviceProfile(localStorage, { name: deviceName, capacityMb, sampleFolderName, localSampleCount });
    setProfileSaved(true);
  };
  const chooseFolder = (files: FileList | null) => {
    const list = files ? [...files] : [];
    const firstPath = list[0]?.webkitRelativePath || '';
    setSampleFolderName(firstPath.split('/')[0] || 'DOSSIER SAMPLES');
    setLocalSampleCount(list.length);
    setProfileSaved(false);
  };
  const requestDelete = (slot: number) => {
    window.alert(`SUPPRESSION DU SLOT ${String(slot).padStart(3, '0')} VERROUILLÉE\n\nLa sauvegarde du son, le checkpoint et la relecture de contrôle doivent être disponibles avant toute suppression sur l’EP-133.`);
  };
  const stageSound = (group: EditorGroup, internalPad: number, slot: number) => {
    const original = inventory?.pads.find((pad) => pad.group === group && pad.pad === internalPad)?.slot;
    const key = `${group}:${internalPad - 1}`;
    setStagedAssignments((current) => {
      if (original === slot) { const next = { ...current }; delete next[key]; return next; }
      return { ...current, [key]: slot };
    });
    setStagedLocalPads((current) => { if (!(key in current)) return current; const next = { ...current }; delete next[key]; return next; });
    setActiveGroup(group);
    setSelectedPad(internalPad);
  };
  const stageLocalOnPad = (group: EditorGroup, internalPad: number, file: StagedLocalFile) => {
    const key = `${group}:${internalPad - 1}`;
    setStagedLocalPads((current) => ({ ...current, [key]: file }));
    setStagedAssignments((current) => { if (!(key in current)) return current; const next = { ...current }; delete next[key]; return next; });
    setActiveGroup(group);
    setSelectedPad(internalPad);
  };

  /**
   * SYNCHRONISER : pour les sons venus de la bibliothèque perso (pads ou slots visés), copie
   * réellement les fichiers dans le DOSSIER DE TRAVAIL déjà connecté (Fiche personnage), sous
   * `a-importer/` — une vraie préparation sur disque. Pour les réaffectations purement machine
   * (slot → pad, sans fichier perso), reste un plan verrouillé : aucun protocole d'écriture SysEx
   * n'existe dans ce projet, l'app ne doit jamais prétendre écrire sur l'EP-133 pour de vrai.
   */
  const requestSync = async () => {
    if (!changeCount || syncing) return;
    const localItems: Array<[string, StagedLocalFile]> = [
      ...Object.entries(stagedLocalPads).map(([key, file]) => [`pad-${key}`, file] as [string, StagedLocalFile]),
      ...Object.entries(stagedImports).map(([slot, file]) => [`slot-${slot}`, file] as [string, StagedLocalFile]),
    ];
    const deviceOnlyCount = Object.keys(stagedAssignments).length;
    if (!localItems.length) {
      const accepted = window.confirm(`PRÉPARER LA SYNCHRONISATION DE ${deviceOnlyCount} PAD(S) ?\n\nLes affectations locales resteront en orange. Aucune écriture ne sera envoyée sans checkpoint et relecture de contrôle.`);
      if (accepted) window.alert('PLAN DE SYNCHRONISATION PRÊT\n\nÉcriture machine encore verrouillée : compilation du projet, checkpoint et relecture binaire à valider.');
      return;
    }
    setSyncing(true);
    setImportFeedback(null);
    try {
      const working = await loadDirectoryHandle(SAMPLE_FOLDER_KEY);
      if (!working) { setImportFeedback({ status: 'error', message: 'AUCUN DOSSIER DE TRAVAIL — connecte-le depuis la FICHE PERSONNAGE.' }); return; }
      if (!await requestStoredPermission(working, 'readwrite')) { setImportFeedback({ status: 'error', message: 'AUTORISATION D’ÉCRITURE REFUSÉE SUR LE DOSSIER DE TRAVAIL.' }); return; }
      const target = await working.getDirectoryHandle('a-importer', { create: true });
      for (const [tag, item] of localItems) {
        const file = await item.handle.getFile();
        const destName = `${tag}_${safeFileName(item.fileName)}`;
        const fileHandle = await target.getFileHandle(destName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();
      }
      setImportFeedback({ status: 'done', message: `${localItems.length} SON(S) PERSO COPIÉ(S) DANS ${working.name}/a-importer${deviceOnlyCount ? ` · ${deviceOnlyCount} RÉAFFECTATION(S) MACHINE ENCORE VERROUILLÉE(S)` : ''}` });
    } catch (error) {
      setImportFeedback({ status: 'error', message: (error as Error)?.message || 'Échec de la copie.' });
    } finally {
      setSyncing(false);
    }
  };

  return <main className="sound-library-page sound-machine-page">
    <header className="module-header"><button onClick={onBack}>← ACCUEIL</button><div><small>MODULE 03 · SOUND MODE</small><h1>SONS & TRANSFERT EP‑133</h1></div><span className={soundIndex ? 'ready' : ''}>{soundIndex ? `MIROIR · ${soundIndex.soundCount} SONS` : 'AUCUN SCAN'}</span></header>

    <section className="sound-machine-console">
      <div className="sound-machine-topline"><div><small>MACHINE</small><strong>{profileSaved ? deviceName : 'PROFIL À ENREGISTRER'}</strong></div><div className="sound-memory"><span><b>{usedMb.toFixed(2)} MO</b> / {capacityMb} MO · THÉORIQUE <b>{usedMb.toFixed(2)} MO</b></span><i><span style={{ width: `${usedPercent}%` }} /></i><small>{changeCount ? `${changeCount} AFFECTATION(S) · +0 OCTET` : 'AUCUN CHANGEMENT PRÉPARÉ'}</small></div><button onClick={onConnectMidi}>{midiConnected ? 'EP-133 CONNECTÉ ✓' : 'CONNECTER EP-133'}</button><button className={`sound-sync ${changeCount ? 'active' : ''}`} disabled={!changeCount || syncing} onClick={() => void requestSync()}>{syncing ? 'ENVOI…' : `SYNCHRONISER · ${changeCount}`}</button></div>
      {importFeedback && <p className={`local-send-feedback ${importFeedback.status}`}>{importFeedback.message}</p>}
      <div className="sound-machine-workspace">
        <section className="sound-pad-panel">
          <header><div><small>PROJET {inventory?.project || '—'}</small><h2>GROUPES & PADS</h2></div><button className={`sound-keys-toggle ${selectedMode === 'KEYS' ? 'active' : ''}`} onClick={() => onPadModeChange(activeGroup, selectedPad - 1, selectedMode === 'KEYS' ? 'ONE' : 'KEYS')}><b>KEYS</b><small>{activeGroup} · {EP133_PADS[selectedPad - 1].key}</small></button></header>
          <div className="sound-pad-machine"><nav className="sound-group-tabs" aria-label="Groupes EP-133">{GROUPS.map((group) => <button key={group} className={activeGroup === group ? 'active' : ''} aria-pressed={activeGroup === group} onClick={() => { setActiveGroup(group); setSelectedPad(1); }}><b>{group}</b><small>{inventory?.pads.filter((pad) => pad.group === group).length || 0}/12</small></button>)}</nav>
          <div className="sound-pad-grid">{INTERNAL_PAD_ORDER.map((padNumber) => { const pad = padsByNumber.get(padNumber); const padKey = `${activeGroup}:${padNumber - 1}`; const localFile = stagedLocalPads[padKey]; const stagedSlot = stagedAssignments[padKey]; const slot = stagedSlot ?? pad?.slot; const sound = slot ? inventory?.sounds[String(slot)] : undefined; const bank = slot ? bankForSlot(slot) : null; const visual = EP133_PADS[padNumber - 1]; const changed = stagedSlot !== undefined || Boolean(localFile); return <button key={padNumber} className={`${selectedPad === padNumber ? 'selected' : ''} ${livePad === padNumber ? 'live' : ''} ${changed ? 'changed' : ''} bank-${bank?.id || 'empty'}`} aria-pressed={selectedPad === padNumber}
            onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }}
            onDrop={(event) => {
              event.preventDefault();
              const draggedLocal = draggingLocalRef.current;
              if (draggedLocal) { stageLocalOnPad(activeGroup, padNumber, draggedLocal); return; }
              const raw = event.dataTransfer.getData('application/x-ep133-slot') || event.dataTransfer.getData('text/plain');
              const droppedSlot = raw ? Number(raw) : NaN;
              if (Number.isInteger(droppedSlot) && droppedSlot > 0) stageSound(activeGroup, padNumber, droppedSlot);
            }}
            onClick={() => { setSelectedPad(padNumber); onPadPreview(activeGroup, padNumber - 1, stagedSlot); }}>
            <span>{visual.key}</span>
            <b>{localFile ? '●' : slot ? String(slot).padStart(3, '0') : '---'}</b>
            <small>{localFile ? localFile.fileName.replace(AUDIO_PATTERN, '') : sound?.name || (slot ? bank?.label : 'VIDE')}</small>
            {changed && <em>MODIFIÉ</em>}
          </button>; })}</div></div>
        </section>

        <section className="sound-bank-panel">
          <header><div><small>MÉMOIRE GLOBALE</small><h2>BANQUES DE SONS</h2></div><span>{filteredSounds.length} AFFICHÉS</span></header>
          <div className="sound-bank-browser">
            <div className="sound-bank-folders">{SOUND_BANKS.map((bank) => { const count = bank.id === 'all' ? soundIndex?.soundCount || 0 : soundIndex?.sounds.filter((sound) => sound.slot >= bank.from && sound.slot <= bank.to).length || 0; const capacity = bank.id === 'all' ? 999 : 100; const fill = Math.min(100, Math.round(count / capacity * 100)); return <button key={bank.id} className={`${activeBank === bank.id ? 'active' : ''} bank-${bank.id}`} aria-pressed={activeBank === bank.id} title={`${bank.label} · ${bank.range} · ${count}/${capacity}`} onClick={() => setActiveBank(bank.id)}><b>{bank.label}</b><span>{fill}%</span><i><span style={{ width: `${fill}%` }} /></i></button>; })}</div>
            <div className="sound-bank-results"><label>RECHERCHER<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="SLOT OU NOM" /></label><div>{filteredSounds.map((sound) => { const bank = bankForSlot(sound.slot); const changed = changedSlots.has(sound.slot); const proposedImport = stagedImports[sound.slot]; return <article key={sound.slot} draggable
              onDragStart={(event) => { event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('application/x-ep133-slot', String(sound.slot)); event.dataTransfer.setData('text/plain', String(sound.slot)); }}
              onDragOver={(event) => { if (draggingLocalRef.current) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } }}
              onDrop={(event) => { const draggedLocal = draggingLocalRef.current; if (!draggedLocal) return; event.preventDefault(); setStagedImports((current) => ({ ...current, [sound.slot]: draggedLocal })); }}
              className={`bank-${bank.id} ${changed || proposedImport ? 'changed' : ''}`}>
              <b>{String(sound.slot).padStart(3, '0')}</b>
              <div><strong>{namesBySlot.get(sound.slot) || sound.fileName.replace(/\.pcm$/i, '')}</strong><small>{proposedImport ? `SON PERSO PROPOSÉ · ${proposedImport.fileName}` : `${bank.label} · ${(sound.bytes / 1000).toFixed(1)} KO · GLISSER SUR UN PAD OU ICI`}</small></div>
              <button className="sound-delete" onClick={() => requestDelete(sound.slot)}>SUPPRIMER</button>
            </article>; })}{!filteredSounds.length && <p>Aucun son dans cette banque.</p>}</div></div>
          </div>
        </section>

        <section className="sound-bank-panel local-library-panel">
          <header><div><small>{localLibraryHandle ? `${localLibraryFolderName}${persoStack.map((item) => ` / ${item.name}`).join('')}` : 'ORDI'}</small><h2>BIBLIOTHÈQUE PERSO</h2></div><span>{filteredPersoFiles.length} AFFICHÉS</span></header>
          {!localLibraryHandle && <p className="local-library-hint">Connecte ta bibliothèque personnelle depuis la <b>FICHE PERSONNAGE</b> pour la parcourir ici.</p>}
          {localLibraryHandle && localLibraryNeedsReconnect && <div className="local-empty"><p>Autorisation à renouveler pour « {localLibraryFolderName} ».</p><button className="profile-connect" onClick={onReconnectLocalLibrary}>RECONNECTER</button></div>}
          {/* Même concept d'affichage que la banque de sons machine juste à côté : dossiers à
              gauche (ici les sous-dossiers du niveau courant, pas des banques fixes), fichiers
              filtrables à droite — mêmes classes .sound-bank-folders / .sound-bank-results. */}
          {localLibraryHandle && !localLibraryNeedsReconnect && <div className="sound-bank-browser">
            <div className="sound-bank-folders">
              {persoStack.length > 0 && <button onClick={() => gotoPerso(persoStack.length - 2)}><b>⬅</b><span>REMONTER</span></button>}
              {persoFolders.map((entry) => <button key={entry.name} onClick={() => enterPerso(entry)}><b>📁</b><span>{entry.name}</span></button>)}
              {!persoFolders.length && !persoLoading && <p className="local-no-subfolders">Aucun sous-dossier ici.</p>}
            </div>
            <div className="sound-bank-results">
              <label>RECHERCHER<input value={persoQuery} onChange={(event) => setPersoQuery(event.target.value)} placeholder="NOM DE FICHIER" /></label>
              {persoLoading && <p className="local-loading">Lecture…</p>}
              {!persoLoading && <div>
                {filteredPersoFiles.map((entry) => <article key={entry.name} draggable
                    onDragStart={(event) => { draggingLocalRef.current = { fileName: entry.name, handle: entry.handle }; event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('text/plain', entry.name); }}
                    onDragEnd={() => { draggingLocalRef.current = null; }}>
                  <button className="local-preview-btn" onClick={() => void previewPerso(entry)} aria-label={playingName === entry.name ? 'Pause' : 'Écouter'}>{playingName === entry.name ? '⏸' : '▶'}</button>
                  <div><strong>{entry.name}</strong><small>GLISSER SUR UN PAD OU UN SLOT MACHINE</small></div>
                  <button className="local-assign-btn" onClick={() => stageLocalOnPad(activeGroup, selectedPad, { fileName: entry.name, handle: entry.handle })}>→ {activeGroup}{selectedPad}</button>
                </article>)}
                {!filteredPersoFiles.length && <p>Aucun son ici.</p>}
              </div>}
            </div>
          </div>}
          <audio ref={audioRef} onEnded={() => setPlayingName(null)} hidden />
        </section>
      </div>
    </section>

    <section className="device-profile sound-profile-compact"><div><small>PROFIL DE LA MACHINE</small><h2>{profileSaved ? deviceName : 'PREMIÈRE CONNEXION'}</h2></div><label>NOM<input value={deviceName} maxLength={32} onChange={(event) => { setDeviceName(event.target.value.toUpperCase()); setProfileSaved(false); }} /></label><label>MÉMOIRE<select value={capacityMb} onChange={(event) => { setCapacityMb(Number(event.target.value) as 64 | 128); setProfileSaved(false); }}><option value={64}>64 MO</option><option value={128}>128 MO</option></select></label><label className="sample-folder">DOSSIER DU CLONE<input type="file" multiple {...({ webkitdirectory: '', directory: '' } as Record<string, string>)} onChange={(event) => chooseFolder(event.currentTarget.files)} /><span>{sampleFolderName || 'AUCUN DOSSIER'} · {localSampleCount} FICHIER(S)</span></label><button onClick={saveProfile}>ENREGISTRER</button></section>
    <section className="sound-transfer-zone"><div><small>TRANSFERT SÉCURISÉ</small><h2>PRÉPARER UN NOUVEAU SON</h2><p>Glisse un son de la BIBLIOTHÈQUE PERSO ci-dessus sur un pad ou sur un slot de la banque machine, puis clique SYNCHRONISER pour le copier dans le dossier de travail.</p></div><aside><b>AUCUNE ÉCRITURE AUTOMATIQUE</b><span>Un slot occupé ne sera jamais remplacé sans sauvegarde et validation. Aucun protocole n’écrit encore directement sur l’EP‑133.</span></aside></section>
  </main>;
}
