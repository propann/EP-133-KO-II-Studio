import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { analyzeWavBuffer, type WavAnalysisReport } from '../core/audio/wavAnalysis';
import { WaveformTrim, type WaveformTrimSelection, type SoundPrepMetadata } from '../components/shared/WaveformTrim';
import { ProjectTransfer } from '../components/shared/ProjectTransfer';
import { decodeEp133ProjectTar, type Ep133PadRecord } from '../core/project/importers';
import type { EditorGroup, EditorPadMode } from '../core/project/exporters';
import type { DeviceInventory, DeviceSoundIndex } from '../core/project/device';
import { loadDeviceProfile } from '../core/project/deviceProfile';
import { EP133_PADS } from '../core/project/pads';
import { officialGroupIndexFromNote, officialInternalPadFromNote } from '../core/midi/useWebMidi';
import type { LocalDirectoryHandle } from '../core/storage/localFolders';

interface FileEntryHandle { getFile(): Promise<File>; }
type LocalEntry =
  | { kind: 'directory'; name: string; handle: LocalDirectoryHandle }
  | { kind: 'file'; name: string; handle: FileEntryHandle };
interface StagedLocalFile { fileName: string; handle: FileEntryHandle }

interface SoundsPageProps {
  inventory: DeviceInventory | null;
  soundIndex: DeviceSoundIndex | null;
  midiConnected: boolean;
  machineGroup: EditorGroup;
  onMachineGroupChange: (group: EditorGroup) => void;
  liveMidi: { note: number; velocity: number; timestamp: number } | null;
  padModes: Record<string, EditorPadMode>;
  onBack: () => void;
  onConnectMidi: () => void;
  onPadModeChange: (group: EditorGroup, pad: number, mode: EditorPadMode) => void;
  onPadPreview: (group: EditorGroup, pad: number, stagedSlot?: number) => void;
  /** Écoute d'un slot de la banque machine ; renvoie si ça a vraiment joué (pas de repli possible ici). */
  onPreviewSound: (slot: number) => Promise<boolean>;
  /** Bibliothèque perso (dossier réglé depuis la Fiche personnage — cette page ne fait que la lire). */
  localLibraryHandle: LocalDirectoryHandle | null;
  localLibraryFolderName: string;
  localLibraryNeedsReconnect: boolean;
  onReconnectLocalLibrary: () => void;
  /** Glisser-déposer de projets machine ↔ logiciel (13 août) — voir ProjectTransfer.tsx. */
  demoProjects: ReadonlyArray<{ id: string; title: string }>;
  localProjects: ReadonlyArray<{ id: string; title: string }>;
  onGetProjectDocument: (origin: 'demo' | 'local', id: string) => Promise<Record<string, unknown> | null>;
  onImportMachineProject: (document: Record<string, unknown>, suggestedTitle: string) => void;
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

/** Encode un fichier en base64 pour `/bridge/sounds/upload` — par blocs pour
 * ne jamais dépasser la pile d'appel de `String.fromCharCode` sur un gros WAV. */
async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

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

export function SoundsPage({ inventory, soundIndex, midiConnected, machineGroup, onMachineGroupChange, liveMidi, padModes, onBack, onConnectMidi, onPadModeChange, onPadPreview, onPreviewSound, localLibraryHandle, localLibraryFolderName, localLibraryNeedsReconnect, onReconnectLocalLibrary, demoProjects, localProjects, onGetProjectDocument, onImportMachineProject }: SoundsPageProps) {
  // Nom/mémoire/statut affichés en tête de page — réglés depuis la Fiche personnage
  // (plus de formulaire « PROFIL DE LA MACHINE » ici, retiré pour épurer la page).
  const existingProfile = loadDeviceProfile(localStorage);
  const [deviceName] = useState(existingProfile?.name || 'MON EP-133');
  const [capacityMb] = useState<64 | 128>(existingProfile?.capacityMb || 64);
  const [profileSaved] = useState(Boolean(existingProfile));
  const [activeGroup, setActiveGroup] = useState<EditorGroup>('A');
  const [selectedPad, setSelectedPad] = useState(1);
  /** Le cadre GROUPES & PADS et le transfert de projets partagent le même
   * emplacement (13 août, demande explicite) — replié via les flèches sur
   * les bords, plutôt qu'une nouvelle section tout en bas de la page. */
  const [padPanelCollapsed, setPadPanelCollapsed] = useState(false);
  /** Sélecteur de projet cible explicite (13 août, demande explicite : « on
   * voit où on les envoie ») — SYNCHRONISER écrit ici, plus jamais une
   * détection live silencieuse (`getActiveProjectNumber`, qui s'est révélée
   * peu fiable : délai MIDI dépassé de façon répétée en test réel). Liste
   * peuplée depuis le pont (`/bridge/projects/list`, même route que
   * ProjectTransfer) ; valeur par défaut = dernier projet scanné
   * (`inventory.project`) — « ce qu'on a scanné avant ». */
  const [machineProjects, setMachineProjects] = useState<Array<{ slot: number; present: boolean }>>([]);
  const [targetProject, setTargetProject] = useState<number | null>(null);
  /** Chaque projet a son propre jeu de 48 pads (12 × 4 groupes) — remonté
   * par l'utilisateur : changer le sélecteur de projet ne mettait pas à
   * jour l'affichage GROUPES & PADS, resté figé sur `inventory` (le
   * dernier scan complet, un seul projet). Relu en direct via
   * `/bridge/projects/read` + le décodeur déjà existant
   * (`decodeEp133ProjectTar`) à chaque changement de `targetProject`.
   * `null` tant que la lecture n'a pas abouti (ou si le pont est
   * injoignable) — le rendu retombe alors sur `inventory.pads` (voir
   * `displayPads`) ; un tableau vide `[]` une fois chargé reste distinct
   * de `null` et signifie bien « ce projet n'a aucun pad ». */
  const [targetProjectPads, setTargetProjectPads] = useState<Ep133PadRecord[] | null>(null);
  /** Distinct de `targetProjectPads === null` : vrai seulement pendant la
   * requête en vol. Sans ça, un pont injoignable (dev sans machine réelle)
   * affichait indéfiniment « LECTURE DES PADS… » — au lieu de se taire et
   * de retomber silencieusement sur `inventory.pads` comme partout ailleurs
   * dans cette page quand le pont n'est pas là. */
  const [padsLoading, setPadsLoading] = useState(false);
  /** Incrémenté après chaque écriture SYNCHRONISER réussie pour forcer une
   * relecture du projet visé (13 août, bug remonté : l'écriture réussissait
   * — message « N PAD(S) ÉCRIT(S) » affiché — mais la grille restait
   * figée sur l'état d'AVANT l'écriture, car rien ne redemandait les
   * données au pont une fois l'écriture terminée). */
  const [padsReloadToken, setPadsReloadToken] = useState(0);
  const [activeBank, setActiveBank] = useState<(typeof SOUND_BANKS)[number]['id']>('all');
  const [query, setQuery] = useState('');
  const [previewMissSlot, setPreviewMissSlot] = useState<number | null>(null);
  const [livePad, setLivePad] = useState<number | null>(null);
  const [stagedAssignments, setStagedAssignments] = useState<Record<string, number>>({});
  // Affectations venues de la bibliothèque perso plutôt que de la banque machine — pad ou slot visé.
  const [stagedLocalPads, setStagedLocalPads] = useState<Record<string, StagedLocalFile>>({});
  const [stagedImports, setStagedImports] = useState<Record<number, StagedLocalFile>>({});
  const [importFeedback, setImportFeedback] = useState<{ status: 'done' | 'error'; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  useEffect(() => { setActiveGroup(machineGroup); setSelectedPad(1); }, [machineGroup]);
  const usedMb = (soundIndex?.usedBytes || 0) / 1e6;
  const usedPercent = Math.min(100, usedMb / capacityMb * 100);

  // Bibliothèque perso : navigation en fil d'Ariane, un niveau à la fois (jamais de scan récursif —
  // certaines bibliothèques comptent des dizaines de milliers de fichiers).
  const [persoStack, setPersoStack] = useState<{ name: string; handle: LocalDirectoryHandle }[]>([]);
  const [persoEntries, setPersoEntries] = useState<LocalEntry[]>([]);
  const [persoLoading, setPersoLoading] = useState(false);
  const [persoQuery, setPersoQuery] = useState('');
  const [playingName, setPlayingName] = useState<string | null>(null);
  // Fiche audio (plan P2, préparation déterministe du WAV) : calculée à la lecture d'un fichier,
  // pas en avance sur toute la liste — certaines bibliothèques comptent des milliers de fichiers.
  // 'unsupported' = analysé mais pas un WAV PCM/float exploitable (mp3, en-tête inconnu…).
  const [audioReports, setAudioReports] = useState<Record<string, WavAnalysisReport | 'unsupported'>>({});
  // Forme d'onde/trim (Roadmap Phase 4, REGISTRE_IDEES.md A-09/A-10) : un seul
  // panneau ouvert à la fois ; la sélection reste en mémoire par nom de fichier,
  // jamais écrite sur le disque tant qu'aucun pipeline de conversion n'existe.
  const [waveformTarget, setWaveformTarget] = useState<{ name: string; file: File } | null>(null);
  const [trims, setTrims] = useState<Record<string, WaveformTrimSelection>>({});
  const [soundMetadata, setSoundMetadata] = useState<Record<string, SoundPrepMetadata>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef('');
  const draggingLocalRef = useRef<StagedLocalFile | null>(null);

  /** Source réelle des pads affichés : ceux du projet sélectionné une fois
   * relus (`targetProjectPads`, même un tableau vide = projet sans pads),
   * sinon ceux du dernier scan complet tant que la lecture n'a pas abouti
   * ou que le pont est injoignable. */
  const displayPads = targetProjectPads !== null ? targetProjectPads : (inventory?.pads || []);
  const padsByNumber = useMemo(() => new Map(
    displayPads.filter((pad) => pad.group === activeGroup).map((pad) => [pad.pad, pad]),
  ), [activeGroup, displayPads]);
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
    fetch('/bridge/projects/list', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<{ projects: Array<{ slot: number; present: boolean }> }> : Promise.reject())
      .then((value) => setMachineProjects(value.projects))
      .catch(() => setMachineProjects([]));
  }, []);

  // Valeur par défaut du sélecteur = dernier projet scanné, jamais une
  // détection live (voir commentaire sur targetProject plus haut).
  useEffect(() => { if (targetProject === null && inventory?.project) setTargetProject(inventory.project); }, [inventory?.project, targetProject]);

  /** Relit les 48 pads réels du projet sélectionné (13 août, bug remonté :
   * changer le sélecteur ne changeait pas l'affichage — chaque projet a
   * son propre jeu de pads). Même route/décodeur que ProjectTransfer pour
   * la lecture machine → logiciel. Relit systématiquement au pont plutôt
   * que de faire confiance à `inventory.pads` dès que le projet visé
   * correspond au dernier scan complet : après une écriture SYNCHRONISER
   * réussie sur CE projet, `inventory` n'a plus été rescanné et devient
   * lui-même périmé (deuxième bug remonté le même jour : message
   * « N PAD(S) ÉCRIT(S) » affiché mais grille restée figée sur l'état
   * d'avant écriture) — `padsReloadToken` force cette relecture après
   * chaque écriture, même quand `targetProject` lui-même ne change pas. */
  useEffect(() => {
    if (targetProject === null) { setTargetProjectPads(null); setPadsLoading(false); return; }
    let cancelled = false;
    setPadsLoading(true);
    fetch(`/bridge/projects/read?slot=${targetProject}`, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<{ tarBase64: string }> : Promise.reject())
      .then((body) => {
        if (cancelled) return;
        const binary = atob(body.tarBase64);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
        const archive = decodeEp133ProjectTar(bytes, `projects/P${String(targetProject).padStart(2, '0')}.tar`);
        setTargetProjectPads(archive.pads);
      })
      .catch(() => { if (!cancelled) setTargetProjectPads(null); })
      .finally(() => { if (!cancelled) setPadsLoading(false); });
    return () => { cancelled = true; };
  }, [targetProject, padsReloadToken]);

  /** Ne réagit qu'aux frappes du groupe actuellement affiché — avant, une
   * frappe sur un autre groupe faisait sauter l'onglet actif en plus de
   * surligner un pad hors champ, rendant l'affichage illisible (13 août,
   * remonté par l'utilisateur : « affichage n'importe quoi, illisible »). */
  useEffect(() => {
    if (!liveMidi || performance.now() - liveMidi.timestamp > 1000 || liveMidi.note < 36 || liveMidi.note > 83) return;
    const internalPad = officialInternalPadFromNote(liveMidi.note);
    const groupIndex = officialGroupIndexFromNote(liveMidi.note);
    if (internalPad === undefined || groupIndex === undefined) return;
    const group = GROUPS[groupIndex];
    if (group !== activeGroup) return;
    setSelectedPad(internalPad);
    setLivePad(internalPad);
    const timer = window.setTimeout(() => setLivePad(null), 220);
    return () => window.clearTimeout(timer);
  }, [liveMidi, activeGroup]);

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
  // Fiche audio calculée une seule fois par fichier — même File, pas de second accès disque
  // (createObjectURL() ne consomme pas le contenu). Partagée par l'écoute et la forme d'onde,
  // pour que le gain de normalisation suggéré s'affiche même sans avoir cliqué ▶ d'abord.
  const ensureAudioReport = async (name: string, file: File) => {
    if (name in audioReports) return;
    const bytes = await file.arrayBuffer();
    const report = analyzeWavBuffer(bytes, file.size);
    setAudioReports((current) => ({ ...current, [name]: report ?? 'unsupported' }));
  };

  const previewPerso = async (entry: LocalEntry & { kind: 'file' }) => {
    if (playingName === entry.name) { audioRef.current?.pause(); setPlayingName(null); return; }
    const file = await entry.handle.getFile();
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    if (audioRef.current) { audioRef.current.src = url; void audioRef.current.play(); }
    setPlayingName(entry.name);
    void ensureAudioReport(entry.name, file);
  };

  const toggleWaveform = async (entry: LocalEntry & { kind: 'file' }) => {
    if (waveformTarget?.name === entry.name) { setWaveformTarget(null); return; }
    const file = await entry.handle.getFile();
    setWaveformTarget({ name: entry.name, file });
    void ensureAudioReport(entry.name, file);
  };

  /** Verrouillée volontairement (13 août) : SYNCHRONISER écrit désormais
   * réellement (upload de son + réaffectation de pad, checkpoint et
   * relecture octet à octet inclus), mais une suppression est
   * irréversible — pas demandée cette session, mérite sa propre prudence
   * dédiée avant d'être débloquée à son tour. */
  const requestDelete = (slot: number) => {
    window.alert(`SUPPRESSION DU SLOT ${String(slot).padStart(3, '0')} VERROUILLÉE\n\nIrréversible : cette action reste verrouillée volontairement en attendant sa propre étude de sécurité, séparée de l’écriture (déjà réelle depuis SYNCHRONISER).`);
  };
  /** Pas de repli synthétisé possible pour un slot arbitraire (contrairement à un pad) — si rien
   * n'a vraiment joué (dossier de travail non chargé), le dire plutôt qu'un clic silencieux. */
  const previewBankSlot = async (slot: number) => {
    const played = await onPreviewSound(slot);
    if (played) { setPreviewMissSlot(null); return; }
    setPreviewMissSlot(slot);
    window.setTimeout(() => setPreviewMissSlot((current) => current === slot ? null : current), 2600);
  };
  const stageSound = (group: EditorGroup, internalPad: number, slot: number) => {
    const original = displayPads.find((pad) => pad.group === group && pad.pad === internalPad)?.slot;
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
   * SYNCHRONISER, reconstruit le 13 août (« on reprend du début et on fait
   * propre »), puis corrigé le même jour : écrit réellement sur la
   * machine, dans le **projet choisi explicitement dans le sélecteur**
   * (`targetProject`) — plus une détection live silencieuse
   * (`getActiveProjectNumber`, retirée : délai MIDI dépassé de façon
   * répétée en test réel, alors que la machine répondait instantanément
   * en direct via Python — la requête FILE du navigateur, pas la machine,
   * était en cause). L'utilisateur voit et choisit la cible, cohérent
   * avec « on voit où on les envoie ».
   * Réutilise ce qui vient d'être validé en conditions réelles cette
   * session : `/bridge/sounds/upload` (vérification octet à octet côté
   * pont) pour chaque son perso, puis un seul `/bridge/projects/write`
   * (checkpoint + compilation patch + écriture + relecture octet à octet
   * + activation) pour les pads. Séquentiel, jamais en parallèle — une
   * seule session FILE à la fois. SUPPRIMER un son reste volontairement
   * verrouillé (voir requestDelete) : irréversible, pas demandé cette
   * fois, mérite sa propre prudence dédiée.
   */
  const requestSync = async () => {
    if (!changeCount || syncing) return;
    if (!targetProject) { setImportFeedback({ status: 'error', message: 'CHOISIS D’ABORD UN PROJET CIBLE (sélecteur au-dessus de GROUPES & PADS).' }); return; }
    const activeProject = targetProject;

    const localPadEntries = Object.entries(stagedLocalPads);
    const importEntries = Object.entries(stagedImports);
    const assignmentEntries = Object.entries(stagedAssignments);
    const uploadCount = localPadEntries.length + importEntries.length;
    const overwriteCount = importEntries.filter(([slot]) => soundIndex?.sounds.some((sound) => sound.slot === Number(slot))).length;
    const summaryLines = [
      uploadCount ? `${uploadCount} SON(S) À ENVOYER${overwriteCount ? ` (dont ${overwriteCount} remplace(nt) un slot déjà occupé)` : ''}` : null,
      assignmentEntries.length ? `${assignmentEntries.length} RÉAFFECTATION(S) DE PAD` : null,
    ].filter(Boolean).join('\n');
    if (!window.confirm(`ÉCRIRE RÉELLEMENT SUR LA MACHINE — PROJET P${String(activeProject).padStart(2, '0')} ?\n\n${summaryLines}\n\nUn checkpoint est écrit automatiquement avant, restaurable manuellement si besoin.`)) return;

    setSyncing(true);
    setImportFeedback(null);
    const pads: Array<{ group: EditorGroup; pad: number; slot: number }> = [];
    const errors: string[] = [];

    for (const [key, file] of localPadEntries) {
      const [group, padIndexRaw] = key.split(':') as [EditorGroup, string];
      const padNumber = Number(padIndexRaw) + 1;
      try {
        const wavFile = await file.handle.getFile();
        const wavBase64 = await fileToBase64(wavFile);
        const response = await fetch('/bridge/sounds/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wavBase64, name: file.fileName.replace(AUDIO_PATTERN, '').slice(0, 20) }) });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || `Échec (${response.status}).`);
        pads.push({ group, pad: padNumber, slot: body.slot });
      } catch (error) {
        errors.push(`${group}${padNumber} (${file.fileName}) : ${error instanceof Error ? error.message : 'échec.'}`);
      }
    }

    for (const [slotRaw, file] of importEntries) {
      const slot = Number(slotRaw);
      try {
        const wavFile = await file.handle.getFile();
        const wavBase64 = await fileToBase64(wavFile);
        const response = await fetch('/bridge/sounds/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slot, wavBase64, name: file.fileName.replace(AUDIO_PATTERN, '').slice(0, 20) }) });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || `Échec (${response.status}).`);
      } catch (error) {
        errors.push(`SLOT ${String(slot).padStart(3, '0')} (${file.fileName}) : ${error instanceof Error ? error.message : 'échec.'}`);
      }
    }

    for (const [key, slot] of assignmentEntries) {
      const [group, padIndexRaw] = key.split(':') as [EditorGroup, string];
      pads.push({ group, pad: Number(padIndexRaw) + 1, slot });
    }

    if (!pads.length) {
      setSyncing(false);
      setImportFeedback(errors.length ? { status: 'error', message: errors.join(' · ') } : { status: 'done', message: 'AUCUNE RÉAFFECTATION DE PAD À ÉCRIRE.' });
      return;
    }

    try {
      const response = await fetch('/bridge/projects/write', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slot: activeProject, document: { schema: 'ep.project.v1', product: 'ep133', pads } }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `Échec (${response.status}).`);
      setImportFeedback({ status: errors.length ? 'error' : 'done', message: `${pads.length} PAD(S) ÉCRIT(S) SUR P${String(activeProject).padStart(2, '0')} · CHECKPOINT ${body.checkpoint}${errors.length ? ` · ÉCHECS : ${errors.join(' · ')}` : ''}` });
      if (!errors.length) { setStagedAssignments({}); setStagedLocalPads({}); setStagedImports({}); }
      // Force la relecture du projet visé — sinon la grille reste figée sur
      // l'état d'avant écriture malgré le message de succès (voir commentaire
      // sur `padsReloadToken`).
      setPadsReloadToken((token) => token + 1);
    } catch (error) {
      setImportFeedback({ status: 'error', message: `ÉCRITURE DU PROJET ÉCHOUÉE : ${error instanceof Error ? error.message : 'erreur inconnue.'}${errors.length ? ` · SONS EN ÉCHEC : ${errors.join(' · ')}` : ''}` });
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
        {!padPanelCollapsed ? <section className="sound-pad-panel">
          <button className="panel-collapse-arrow left" onClick={() => setPadPanelCollapsed(true)} title="Replier · afficher le transfert de projets" aria-label="Replier les groupes et pads">‹</button>
          <button className="panel-collapse-arrow right" onClick={() => setPadPanelCollapsed(true)} title="Replier · afficher le transfert de projets" aria-label="Replier les groupes et pads">›</button>
          <header>
            <div><small>PROJET CIBLE · SYNCHRONISER</small><h2>GROUPES & PADS</h2></div>
            <label className="sound-target-project" title="Projet cible pour SYNCHRONISER — pas une détection en direct, un choix explicite (défaut : dernier projet scanné)">
              <select value={targetProject ?? ''} onChange={(event) => setTargetProject(Number(event.target.value))}>
                {!machineProjects.length && targetProject && <option value={targetProject}>P{String(targetProject).padStart(2, '0')}</option>}
                {machineProjects.map((entry) => <option key={entry.slot} value={entry.slot}>P{String(entry.slot).padStart(2, '0')}{entry.present ? '' : ' · VIDE'}</option>)}
              </select>
              {targetProject !== null && (padsLoading || targetProjectPads !== null)
                ? <small className="sound-target-project-status">{padsLoading ? 'LECTURE DES PADS…' : `${targetProjectPads!.length} PAD(S) LU(S)`}</small>
                : null}
            </label>
            <button className={`sound-keys-toggle ${selectedMode === 'KEYS' ? 'active' : ''}`} onClick={() => onPadModeChange(activeGroup, selectedPad - 1, selectedMode === 'KEYS' ? 'ONE' : 'KEYS')}><b>KEYS</b><small>{activeGroup} · {EP133_PADS[selectedPad - 1].key}</small></button>
          </header>
          <div className="sound-pad-machine"><nav className="sound-group-tabs" aria-label="Groupes EP-133">{GROUPS.map((group) => <button key={group} className={activeGroup === group ? 'active' : ''} aria-pressed={activeGroup === group} onClick={() => { setActiveGroup(group); setSelectedPad(1); onMachineGroupChange(group); }}><b>{group}</b><small>{displayPads.filter((pad) => pad.group === group).length}/12</small></button>)}</nav>
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
        </section> : <div className="sound-pad-panel-collapsed">
          <button className="panel-collapse-arrow left" onClick={() => setPadPanelCollapsed(false)} title="Déplier · afficher les groupes et pads" aria-label="Déplier les groupes et pads">›</button>
          <ProjectTransfer demoProjects={demoProjects} localProjects={localProjects} onGetProjectDocument={onGetProjectDocument} onImportMachineProject={onImportMachineProject} />
          <button className="panel-collapse-arrow right" onClick={() => setPadPanelCollapsed(false)} title="Déplier · afficher les groupes et pads" aria-label="Déplier les groupes et pads">‹</button>
        </div>}

        <section className="sound-bank-panel">
          <header><div><small>MÉMOIRE GLOBALE</small><h2>BANQUES DE SONS</h2></div><span>{filteredSounds.length} AFFICHÉS</span></header>
          <div className="sound-bank-browser">
            <div className="sound-bank-folders">{SOUND_BANKS.map((bank) => { const count = bank.id === 'all' ? soundIndex?.soundCount || 0 : soundIndex?.sounds.filter((sound) => sound.slot >= bank.from && sound.slot <= bank.to).length || 0; const capacity = bank.id === 'all' ? 999 : 100; const fill = Math.min(100, Math.round(count / capacity * 100)); return <button key={bank.id} className={`${activeBank === bank.id ? 'active' : ''} bank-${bank.id}`} aria-pressed={activeBank === bank.id} title={`${bank.label} · ${bank.range} · ${count}/${capacity}`} onClick={() => setActiveBank(bank.id)}><b>{bank.label}</b><span>{fill}%</span><i><span style={{ width: `${fill}%` }} /></i></button>; })}</div>
            <div className="sound-bank-results"><label>RECHERCHER<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="SLOT OU NOM" /></label><div>{filteredSounds.map((sound) => { const bank = bankForSlot(sound.slot); const changed = changedSlots.has(sound.slot); const proposedImport = stagedImports[sound.slot]; return <article key={sound.slot} draggable
              onDragStart={(event) => { event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('application/x-ep133-slot', String(sound.slot)); event.dataTransfer.setData('text/plain', String(sound.slot)); }}
              onDragOver={(event) => { if (draggingLocalRef.current) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } }}
              onDrop={(event) => { const draggedLocal = draggingLocalRef.current; if (!draggedLocal) return; event.preventDefault(); setStagedImports((current) => ({ ...current, [sound.slot]: draggedLocal })); }}
              className={`with-preview bank-${bank.id} ${changed || proposedImport ? 'changed' : ''}`}>
              <button className="local-preview-btn" onClick={(event) => { event.stopPropagation(); void previewBankSlot(sound.slot); }} aria-label="Écouter">▶</button>
              <b>{String(sound.slot).padStart(3, '0')}</b>
              <div><strong>{namesBySlot.get(sound.slot) || sound.fileName.replace(/\.pcm$/i, '')}</strong><small>{previewMissSlot === sound.slot ? 'AUCUN AUDIO LOCAL — charge le dossier de travail depuis la FICHE PERSONNAGE' : proposedImport ? `SON PERSO PROPOSÉ · ${proposedImport.fileName}` : `${bank.label} · ${(sound.bytes / 1000).toFixed(1)} KO · GLISSER SUR UN PAD OU ICI`}</small></div>
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
                {filteredPersoFiles.map((entry) => <Fragment key={entry.name}>
                  <article draggable
                    onDragStart={(event) => { draggingLocalRef.current = { fileName: entry.name, handle: entry.handle }; event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('text/plain', entry.name); }}
                    onDragEnd={() => { draggingLocalRef.current = null; }}>
                    <button className="local-preview-btn" onClick={() => void previewPerso(entry)} aria-label={playingName === entry.name ? 'Pause' : 'Écouter'}>{playingName === entry.name ? '⏸' : '▶'}</button>
                    <div>
                      <strong>{entry.name}</strong>
                      {!(entry.name in audioReports) && <small>GLISSER SUR UN PAD OU UN SLOT MACHINE</small>}
                      {audioReports[entry.name] === 'unsupported' && <small>FORMAT NON WAV · PAS DE FICHE AUDIO</small>}
                      {audioReports[entry.name] && audioReports[entry.name] !== 'unsupported' && (() => { const report = audioReports[entry.name] as WavAnalysisReport; return <small className={`local-audio-report ${report.clipped ? 'clipped' : ''}`}>{(report.weightBytes / 1024).toFixed(0)} KO · {report.durationSeconds.toFixed(2)} S · {report.sampleRate} HZ · {report.bitDepth} BITS{report.clipped ? ` · ÉCRÊTAGE (${report.clippedSampleCount})` : ''}</small>; })()}
                      {trims[entry.name] && <small className="waveform-trim-summary">TRIM {trims[entry.name].startSeconds.toFixed(2)}S → {trims[entry.name].endSeconds.toFixed(2)}S</small>}
                    </div>
                    <button className={`waveform-toggle-btn ${waveformTarget?.name === entry.name ? 'active' : ''}`} onClick={() => void toggleWaveform(entry)} aria-label="Forme d'onde et trim" aria-pressed={waveformTarget?.name === entry.name}>〰</button>
                    <button className="local-assign-btn" onClick={() => stageLocalOnPad(activeGroup, selectedPad, { fileName: entry.name, handle: entry.handle })}>→ {activeGroup}{selectedPad}</button>
                  </article>
                  {waveformTarget?.name === entry.name && <WaveformTrim file={waveformTarget.file} initialTrim={trims[entry.name]} report={audioReports[entry.name]} machineMemory={soundIndex ? { usedBytes: soundIndex.usedBytes, capacityMb } : null} metadata={soundMetadata[entry.name]} onMetadataChange={(next) => setSoundMetadata((current) => ({ ...current, [entry.name]: next }))} onTrimChange={(selection) => setTrims((current) => ({ ...current, [entry.name]: selection }))} />}
                </Fragment>)}
                {!filteredPersoFiles.length && <p>Aucun son ici.</p>}
              </div>}
            </div>
          </div>}
          <audio ref={audioRef} onEnded={() => setPlayingName(null)} hidden />
        </section>
      </div>
    </section>
  </main>;
}
