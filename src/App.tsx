import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useWebMidi,
  type MidiHit,
  type MidiObservation,
} from './core/midi/useWebMidi';
import { AudioEngine, type PadSoundSettings } from './core/audio/AudioEngine';
import { MachineSampleBank } from './core/audio/MachineSampleBank';
import { emptyScore, scoreHit } from './core/engine/scoring';
import type { Exercise, Grade, Score } from './core/engine/types';
import { createSixBarExercise, DEDICATED_STYLE_IDS, STYLES } from './core/engine/patterns';
import { appendPracticeLogEntry, buildPracticePlan, loadPracticeLog, type PracticeLogEntry } from './core/engine/practicePlan';
import {
  createEp133ProjectDocument,
  createMidiFile,
  EDITOR_GROUPS,
  type EditorGroup,
  type EditorPadMode,
} from './core/project/exporters';
import { ep133ArchiveProjectToDocument, inspectEp133Archive, readMidiFile } from './core/project/importers';
import { findMissingDependencies, type DeviceInventory, type DeviceSoundIndex, type MissingDependency } from './core/project/device';
import {
  DEFAULT_NOTE_DURATION,
  DEFAULT_NOTE_VELOCITY,
  exerciseTargetsToNotes,
  notesToExerciseTargets,
  type ProjectPatterns,
  type SequencerNote,
} from './core/project/model';
import { barsAfterStepEdit, measureFromGlobalStep, nudgeSelectedNotes, stepKeyFromBeat, usedBars } from './core/project/editor';
import {
  emptyPatternBank,
  emptyScene,
  nextFreeSceneNumber,
  patternNumbersForGroup,
  patternsForScene,
  MAX_SCENE_NUMBER,
  MAX_PATTERN_NUMBER,
  type PatternBank,
  type SceneDefinition,
} from './core/project/song';
import { archiveStudioProject, deleteStudioProject, duplicateStudioProject, loadStudioLibrary, renameStudioProject, storeStudioProject, studioStateFromDocument, summarizeStudioProject, type StudioProjectRecord, type StudioProjectState } from './core/project/studioLibrary';
import { HomePage } from './pages/HomePage';
import { SoundsPage } from './pages/SoundsPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { MachineTestPage } from './pages/MachineTestPage';
import { groupForMappedObservation, loadControlAssignments } from './core/midi/controlMapping';
import { PlayerProfilePage } from './pages/PlayerProfilePage';
import { addSessionToProfile, emptyMachine, emptyPlayerStats, loadPlayerProfile, normalizePlayerProfile, savePlayerProfile, type PlayerMachine, type PlayerProfile } from './core/project/playerProfile';
import { ScoreView } from './components/game/ScoreView';
import { PerformancePanel } from './components/game/PerformancePanel';
import { PadSoundEditor } from './components/game/PadSoundEditor';
import { GameToolbar } from './components/game/GameToolbar';
import { PianoRoll } from './components/editor/PianoRoll';
import { RhythmGrid } from './components/editor/RhythmGrid';
import { PadStrip } from './components/editor/PadStrip';
import { EditorToolbar } from './components/editor/EditorToolbar';
import { SongArranger } from './components/editor/SongArranger';
import { MachineCloneDialog } from './components/editor/MachineCloneDialog';
import { chooseLocalDirectory, collectLocalFiles, listStudioProjectFileIds, readPlayerProfileFile, removeStudioProjectFile, writeCloneManifest, writePlayerProfile, writeStudioProjectFile, type LocalDirectoryHandle } from './core/storage/localFolders';
import { LOCAL_LIBRARY_FOLDER_KEY, SAMPLE_FOLDER_KEY, hasStoredPermission, loadDirectoryHandle, requestStoredPermission, saveDirectoryHandle } from './core/storage/directoryHandleStore';
import { createDeviceClone, saveDeviceProfile } from './core/project/deviceProfile';
import './style.css';
import { useLanguageStore } from './core/store/languageStore';

const STUDIO_DEMOS = [
  { id: 'groove', title: 'DEMO GROOVE', file: 'demo-groove.json' },
  { id: 'lofi', title: 'DEMO LOFI', file: 'demo-lofi.json' },
  { id: 'electro', title: 'DEMO ELECTRO', file: 'demo-electro.json' },
  { id: 'trap', title: 'DEMO TRAP', file: 'demo-trap.json' },
  { id: 'break', title: 'DEMO BREAK', file: 'demo-break.json' },
] as const;

const audio = new AudioEngine();
const machineSampleBank = new MachineSampleBank();

interface PlayerNote {
  id: number;
  beat: number;
  pad: number;
  grade: Grade;
  /** Écart signé en ms — alimente le rapport par pad (report.ts), pas seulement l'écart agrégé de Score. */
  deltaMs: number;
  /** « Pad confondu » (12 août) : sur un MISS, pad qui avait une cible non jouée au même instant — voir scoring.ts. */
  confusedPad?: number | null;
}

const USER_EXERCISES_KEY = 'ep133-rhythm-hero:user-exercises:v1';

function loadUserExercises(): Exercise[] {
  try { return JSON.parse(localStorage.getItem(USER_EXERCISES_KEY) || '[]') as Exercise[]; }
  catch { return []; }
}

export default function App() {
  const language = useLanguageStore((state) => state.language);
  const changeLanguage = useLanguageStore((state) => state.setLanguage);
  const [workspaceView, setWorkspaceView] = useState<'home' | 'game' | 'sounds' | 'docs' | 'machine-test' | 'profile'>('home');
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(() => loadPlayerProfile(localStorage));
  const [practiceLog, setPracticeLog] = useState<PracticeLogEntry[]>(() => loadPracticeLog(localStorage));
  const [styleId, setStyleId] = useState('boom');
  const [difficulty, setDifficulty] = useState(1);
  const [tempo, setTempo] = useState<number>(STYLES[0].bpm);
  const [userExercises, setUserExercises] = useState<Exercise[]>(loadUserExercises);
  const activeExercise = useMemo(() => {
    if (styleId.startsWith('user:')) return userExercises.find((item) => `user:${item.id}` === styleId) || createSixBarExercise('boom', difficulty, tempo);
    return createSixBarExercise(styleId, difficulty, tempo);
  }, [difficulty, styleId, tempo, userExercises]);
  const [phase, setPhase] = useState<'idle' | 'preview' | 'countin' | 'playing'>('idle');
  const [countdown, setCountdown] = useState(4);
  const [songTime, setSongTime] = useState(0);
  const [score, setScore] = useState<Score>(emptyScore());
  /** Toujours à jour, y compris dans les callbacks créés avant la dernière frappe — évite de lire un score périmé au STOP. */
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const [last, setLast] = useState<{ grade: Grade; deltaMs: number } | null>(null);
  const [lastMidi, setLastMidi] = useState<MidiObservation | null>(null);
  const [midiObservations, setMidiObservations] = useState<MidiObservation[]>([]);
  const [machineGroup, setMachineGroup] = useState<EditorGroup>('A');
  const [editorMidiHit, setEditorMidiHit] = useState<{ pad: number; group: EditorGroup } | null>(null);
  const [midiRequestedEditorGroup, setMidiRequestedEditorGroup] = useState<EditorGroup | null>(null);
  const [playerNotes, setPlayerNotes] = useState<PlayerNote[]>([]);
  const [flashedPad, setFlashedPad] = useState<{ pad: number; grade: Grade } | null>(null);
  const [soundPad, setSoundPad] = useState<number | null>(null);
  const [soundSettings, setSoundSettings] = useState<PadSoundSettings[]>(() => Array.from({ length: 12 }, () => ({ modelVolume: 65, playerVolume: 100, tune: 0 })));
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorName, setEditorName] = useState('MON GROOVE');
  const [editorBars, setEditorBars] = useState(1);
  const [editorTargets, setEditorTargets] = useState<SequencerNote[]>([]);
  const [editorPlaying, setEditorPlaying] = useState(false);
  const [editorMode, setEditorMode] = useState<'game' | 'complete'>('game');
  const [editorGroup, setEditorGroup] = useState<EditorGroup>('A');
  const [editorPatternBank, setEditorPatternBank] = useState<PatternBank>(emptyPatternBank);
  const [editorPatternLengths, setEditorPatternLengths] = useState<Record<string, number>>({ 'A:1':1, 'B:1':1, 'C:1':1, 'D:1':1 });
  const [editorPatternNumbers, setEditorPatternNumbers] = useState<Record<EditorGroup, number>>({ A: 1, B: 1, C: 1, D: 1 });
  const [editorScenes, setEditorScenes] = useState<SceneDefinition[]>([]);
  const [editorSong, setEditorSong] = useState<number[]>([]);
  const [editorActiveScene, setEditorActiveScene] = useState(1);
  const [studioView, setStudioView] = useState<'pattern' | 'arrangement'>('pattern');
  const [editorPlaybackBeat, setEditorPlaybackBeat] = useState(0);
  const [editorSelectedPad, setEditorSelectedPad] = useState(0);
  /** Sélection multiple de pas (Ctrl/Cmd+clic), clés `mesure:pad:pas` — pattern en cours d'édition seulement, jamais les sections commitées. */
  const [editorSelectedSteps, setEditorSelectedSteps] = useState<Set<string>>(new Set());
  const [editorPadModes, setEditorPadModes] = useState<Record<string, EditorPadMode>>({});
  const [keyEditorOpen, setKeyEditorOpen] = useState(false);
  const [deviceInventory, setDeviceInventory] = useState<DeviceInventory | null>(null);
  const [deviceSoundIndex, setDeviceSoundIndex] = useState<DeviceSoundIndex | null>(null);
  /** Dépendances manquantes du dernier projet ouvert (plan P1, REGISTRE_IDEES.md Q-13) — vide si aucune machine scannée, jamais un blocage. */
  const [missingDependencies, setMissingDependencies] = useState<MissingDependency[]>([]);
  const [editorLoop, setEditorLoop] = useState(false);
  const [editorExportFormat, setEditorExportFormat] = useState<'midi' | 'json'>('midi');
  const [studioLibrary, setStudioLibrary] = useState<StudioProjectRecord[]>(() => loadStudioLibrary(localStorage));
  const [selectedStudioProject, setSelectedStudioProject] = useState('');
  const [machineProjectDocument, setMachineProjectDocument] = useState<Record<string, unknown> | null>(null);
  const [machineCloneOpen, setMachineCloneOpen] = useState(false);
  const [machineSampleCount, setMachineSampleCount] = useState(0);
  const [sampleFolderName, setSampleFolderName] = useState('');
  const [sampleFolderNeedsReconnect, setSampleFolderNeedsReconnect] = useState(false);
  const sampleDirectoryHandleRef = useRef<LocalDirectoryHandle | null>(null);
  const [lastScanSave, setLastScanSave] = useState<{ machineId: string; path: string; at: string } | null>(null);
  const [scanSaveError, setScanSaveError] = useState<{ machineId: string; message: string } | null>(null);
  const [scanSaveMachineId, setScanSaveMachineId] = useState('');
  // Fiche personnage écrite dans le dossier de travail (profile.json,
  // racine — pas clone/<machine>/, un profil peut déclarer plusieurs
  // machines) : même dossier que SCAN/CLONE, secours si localStorage est
  // vidé. Écriture silencieuse à chaque changement quand la permission
  // écriture est déjà acquise ; ces deux états ne suivent que l'action
  // explicite (bouton SAUVEGARDER/RESTAURER de la Fiche personnage).
  const [profileFileSave, setProfileFileSave] = useState<{ path: string; at: string } | null>(null);
  const [profileFileError, setProfileFileError] = useState<string | null>(null);
  // Bibliothèque de sons personnelle (distincte du dossier de travail machine ci-dessus) —
  // les réglages de dossier se font depuis la Fiche personnage, la navigation/écoute depuis
  // SONS & TRANSFERT (SoundsPage), qui a donc besoin du handle lui-même, pas seulement du nom.
  const [localLibraryHandle, setLocalLibraryHandle] = useState<LocalDirectoryHandle | null>(null);
  const [localLibraryFolderName, setLocalLibraryFolderName] = useState('');
  const [localLibraryNeedsReconnect, setLocalLibraryNeedsReconnect] = useState(false);
  const targets = useRef(activeExercise.targets.map((target, index) => ({ ...target, id: `target-${index}` })));
  const frame = useRef<number | undefined>(undefined);
  const flashTimer = useRef<number | undefined>(undefined);
  const editorMidiFlashTimer = useRef<number | undefined>(undefined);
  const countTimer = useRef<number | undefined>(undefined);
  const startTimer = useRef<number | undefined>(undefined);
  const gameEndTimer = useRef<number | undefined>(undefined);
  const scoreScroll = useRef<HTMLDivElement | null>(null);
  const editorGrid = useRef<HTMLDivElement | null>(null);
  const editorScrollToEnd = useRef(false);
  const editorPlaybackFrame = useRef<number | undefined>(undefined);
  const editorLoopTimer = useRef<number | undefined>(undefined);
  const editorEndTimer = useRef<number | undefined>(undefined);
  const gameRun = useRef(0);
  const editorRun = useRef(0);
  /** Historique Annuler/Rétablir — un pattern (groupe:numéro) à la fois, pas encore les
   * scènes/Song : c'est le geste le plus fréquent et le plus risqué à la souris (E-25 du
   * registre des idées). Rafales d'édition coalescées par un court silence (voir l'effet
   * plus bas) plutôt qu'une entrée par frappe de pas. */
  const editorHistory = useRef<Record<string, { past: SequencerNote[][]; future: SequencerNote[][] }>>({});
  /** Référence exacte (pas un booléen) du prochain `editorTargets` à traiter comme un
   * chargement plutôt qu'une édition — comparaison par identité, idempotente si l'effet
   * ci-dessous est invoqué deux fois pour la même valeur (StrictMode en développement
   * double les effets au montage ; un simple booléen consommé une fois s'y faisait piéger). */
  const editorHistorySkipTarget = useRef<SequencerNote[] | null>(null);
  // Initialisée à la référence de départ d'editorTargets (pas un nouveau `[]`, qui ne lui
  // serait pas identique) pour que le tout premier rendu ne compte pas comme une édition.
  const editorHistoryBaseline = useRef<SequencerNote[]>(editorTargets);
  const editorHistoryTimer = useRef<number | undefined>(undefined);
  const [editorHistoryVersion, setEditorHistoryVersion] = useState(0);
  const running = phase === 'playing';
  const sessionActive = phase !== 'idle';
  const transportActive = phase === 'playing' || phase === 'preview';

  useEffect(() => {
    fetch('/ep133-device.json', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<DeviceInventory> : Promise.reject())
      .then(setDeviceInventory)
      .catch(() => setDeviceInventory(null));
    fetch('/ep133-project-1.json', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<Record<string, unknown>> : Promise.reject())
      .then(setMachineProjectDocument)
      .catch(() => setMachineProjectDocument(null));
    fetch('/ep133-sound-index.json', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<DeviceSoundIndex> : Promise.reject())
      .then(setDeviceSoundIndex)
      .catch(() => setDeviceSoundIndex(null));
  }, []);

  /** Restauration silencieuse du dossier de travail mémorisé — queryPermission seul (jamais requestPermission ici : il faut un vrai clic, voir reconnectSampleFolder). */
  useEffect(() => {
    void (async () => {
      const handle = await loadDirectoryHandle(SAMPLE_FOLDER_KEY);
      if (!handle) return;
      sampleDirectoryHandleRef.current = handle;
      setSampleFolderName(handle.name);
      if (await hasStoredPermission(handle, 'read')) {
        try { setMachineSampleCount(await machineSampleBank.load(await collectLocalFiles(handle))); }
        catch { setSampleFolderNeedsReconnect(true); }
      } else {
        setSampleFolderNeedsReconnect(true);
      }
    })();
  }, []);

  /** Même principe que ci-dessus, pour la bibliothèque de sons personnelle — dossier distinct, jamais confondu avec le dossier de travail machine. */
  useEffect(() => {
    void (async () => {
      const handle = await loadDirectoryHandle(LOCAL_LIBRARY_FOLDER_KEY);
      if (!handle) return;
      setLocalLibraryHandle(handle);
      setLocalLibraryFolderName(handle.name);
      setLocalLibraryNeedsReconnect(!(await hasStoredPermission(handle, 'read')));
    })();
  }, []);

  const onHit = useCallback((hit: MidiHit) => {
    // En mode EP-133, la machine produit déjà le son : ne pas le doubler côté PC.
    if (editorOpen && editorMode === 'complete') {
      const receivedGroup = EDITOR_GROUPS[hit.groupIndex ?? 0];
      setMachineGroup(receivedGroup);
      setEditorMidiHit({ pad: hit.pad, group: receivedGroup });
      setMidiRequestedEditorGroup(receivedGroup);
      if (editorMidiFlashTimer.current !== undefined) window.clearTimeout(editorMidiFlashTimer.current);
      editorMidiFlashTimer.current = window.setTimeout(() => setEditorMidiHit(null), 180);
      return;
    }
    audio.playPad(hit.pad, hit.velocity);
    setFlashedPad({ pad: hit.pad, grade: 'GOOD' });
    if (flashTimer.current !== undefined) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlashedPad(null), 180);
    if (!running) return;
    // Score calculé une seule fois à partir de scoreRef (toujours à jour, y compris entre deux
    // frappes du même tick — mis à jour manuellement ci-dessous, pas seulement au rendu suivant),
    // puis tous les setState posés côte à côte, plus aucun appel imbriqué dans l'updater
    // fonctionnel d'un autre. L'ancienne version appelait setPlayerNotes/setFlashedPad DANS
    // l'updater de setScore — piégé par le double appel StrictMode en développement (React
    // rejoue exprès un updater fonctionnel pour détecter ce genre d'impureté) : le score final
    // restait juste (seul le second appel est retenu), mais playerNotes doublait à chaque
    // frappe, faussant silencieusement le rapport par pad. Trouvé en vérifiant ce rapport avec
    // un vrai scénario Playwright, pas par relecture de code.
    const beat = (audio.time * 1000) / (60000 / activeExercise.bpm);
    const result = scoreHit(activeExercise, hit, beat, targets.current, scoreRef.current);
    scoreRef.current = result.score;
    setScore(result.score);
    setLast({ grade: result.grade, deltaMs: result.deltaMs });
    setPlayerNotes((notes) => [...notes, { id: performance.now(), beat, pad: hit.pad, grade: result.grade, deltaMs: result.deltaMs, confusedPad: result.confusedPad }]);
    setFlashedPad({ pad: hit.pad, grade: result.grade });
  }, [activeExercise, editorMode, editorOpen, running]);

  const onMidiObservation = useCallback((message: MidiObservation) => {
    setLastMidi(message);
    setMidiObservations((current) => [message, ...current].slice(0, 100));
    try {
      const match = groupForMappedObservation(message, loadControlAssignments(localStorage));
      if (match) setMachineGroup(match);
    } catch {
      // Une cartographie locale corrompue ne doit jamais bloquer la réception MIDI.
    }
  }, []);

  const midi = useWebMidi(onHit, onMidiObservation);
  // Statut « machine connectée » unique pour toutes les pages — avant, chaque
  // page piochait midi.connected (entrée) ou midi.outputConnected (sortie)
  // séparément, ce qui pouvait afficher connecté ici et pas là (remonté par
  // l'utilisateur, 13 août). Les guards fonctionnels qui ont vraiment besoin
  // de la sortie précisément (envoi de sons/patterns) continuent d'utiliser
  // midi.outputConnected directement, inchangés.
  const midiReady = midi.connected || midi.outputConnected;

  const clearGameTimers = useCallback(() => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    if (countTimer.current !== undefined) window.clearInterval(countTimer.current);
    if (startTimer.current !== undefined) window.clearTimeout(startTimer.current);
    if (gameEndTimer.current !== undefined) window.clearTimeout(gameEndTimer.current);
    frame.current = undefined;
    countTimer.current = undefined;
    startTimer.current = undefined;
    gameEndTimer.current = undefined;
  }, []);

  const clearEditorTimers = useCallback(() => {
    if (editorPlaybackFrame.current !== undefined) cancelAnimationFrame(editorPlaybackFrame.current);
    if (editorLoopTimer.current !== undefined) window.clearInterval(editorLoopTimer.current);
    if (editorEndTimer.current !== undefined) window.clearTimeout(editorEndTimer.current);
    editorPlaybackFrame.current = undefined;
    editorLoopTimer.current = undefined;
    editorEndTimer.current = undefined;
  }, []);

  const stopGameTransport = useCallback(() => {
    gameRun.current += 1;
    clearGameTimers();
    audio.stop();
    machineSampleBank.stopAll();
    setPhase('idle');
    // Cumule le bilan de la session qui vient de s'arrêter dans la fiche
    // personnage. Sans effet si rien n'a été joué (score vide) — couvre
    // aussi bien un STOP manuel qu'une fin de session normale.
    setPlayerProfile((profile) => {
      const next = addSessionToProfile(profile, scoreRef.current);
      if (next !== profile) { savePlayerProfile(localStorage, next); void mirrorProfileToFolder(next); }
      return next;
    });
    // Journal daté pour le parcours 7/30 jours — seulement les styles de la
    // rotation dédiée (voir practicePlan.ts), pas les styles procéduraux ni
    // les exercices USER, qui ne font pas partie du parcours affiché.
    const finalScore = scoreRef.current;
    if (DEDICATED_STYLE_IDS.includes(styleId) && finalScore.perfect + finalScore.good + finalScore.miss > 0) {
      setPracticeLog((log) => appendPracticeLogEntry(localStorage, log, {
        date: new Date().toISOString().slice(0, 10),
        styleId,
        difficulty,
        perfect: finalScore.perfect,
        good: finalScore.good,
        miss: finalScore.miss,
      }));
    }
  }, [clearGameTimers, styleId, difficulty]);

  const stopEditorTransport = useCallback((resetPlayhead = true) => {
    editorRun.current += 1;
    clearEditorTimers();
    audio.stop();
    midi.stopOutput();
    setEditorPlaying(false);
    if (resetPlayhead) setEditorPlaybackBeat(0);
  }, [clearEditorTimers, midi.stopOutput]);

  const goHome = useCallback(() => {
    stopGameTransport();
    stopEditorTransport();
    setEditorOpen(false);
    setWorkspaceView('home');
  }, [stopEditorTransport, stopGameTransport]);

  const connectMidi = async () => {
    await audio.unlock();
    await midi.connect();
  };

  /** Choix explicite : le handle est sauvegardé dans IndexedDB (voir directoryHandleStore.ts) pour ne plus jamais rouvrir ce sélecteur tant que la permission tient. */
  const openStudioSampleFolder = async () => {
    try {
      const directory = await chooseLocalDirectory();
      sampleDirectoryHandleRef.current = directory;
      setSampleFolderName(directory.name);
      setSampleFolderNeedsReconnect(false);
      setMachineSampleCount(await machineSampleBank.load(await collectLocalFiles(directory)));
      await saveDirectoryHandle(SAMPLE_FOLDER_KEY, directory);
    } catch (error) {
      if ((error as { name?: string }).name !== 'AbortError') window.alert(error instanceof Error ? error.message : 'Impossible d’ouvrir le dossier local.');
    }
  };

  /** Redemande la permission sur le dossier déjà mémorisé — geste utilisateur requis, le navigateur ne la garde jamais indéfiniment tout seul. */
  const reconnectSampleFolder = async () => {
    const handle = sampleDirectoryHandleRef.current;
    if (!handle) return;
    const granted = await requestStoredPermission(handle, 'read');
    if (!granted) { window.alert('Autorisation refusée pour ce dossier. Choisis-le à nouveau si besoin.'); return; }
    try {
      setMachineSampleCount(await machineSampleBank.load(await collectLocalFiles(handle)));
      setSampleFolderNeedsReconnect(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Impossible de relire ce dossier.');
    }
  };

  /** Réglage explicite — fait uniquement depuis la Fiche personnage, jamais depuis SONS & TRANSFERT (qui ne fait que lire ce dossier une fois connecté). */
  const openLocalLibraryFolder = async () => {
    try {
      const directory = await chooseLocalDirectory('read');
      setLocalLibraryHandle(directory);
      setLocalLibraryFolderName(directory.name);
      setLocalLibraryNeedsReconnect(false);
      try { await saveDirectoryHandle(LOCAL_LIBRARY_FOLDER_KEY, directory); } catch { /* pas grave : juste pas mémorisé pour la prochaine visite */ }
    } catch (error) {
      if ((error as { name?: string }).name !== 'AbortError') window.alert(error instanceof Error ? error.message : 'Impossible d’ouvrir le dossier local.');
    }
  };

  const reconnectLocalLibraryFolder = async () => {
    if (!localLibraryHandle) return;
    const granted = await requestStoredPermission(localLibraryHandle, 'read');
    if (!granted) { window.alert('Autorisation refusée pour ce dossier. Choisis-le à nouveau si besoin.'); return; }
    setLocalLibraryNeedsReconnect(false);
  };

  /**
   * SCAN = état des lieux rapide (nombre de projets/sons, mémoire, chemin)
   * écrit sur le disque — jamais les PCM eux-mêmes, ça reste le travail du
   * CLONE (pont local, 20-30 min). Réutilise exactement les fonctions déjà
   * écrites pour `MachineCloneDialog` (`saveDeviceProfile`,
   * `createDeviceClone`, `writeCloneManifest`) au lieu d'en refaire une :
   * c'est la même écriture de manifeste que le clone fait déjà en secours
   * quand le pont local n'est pas lancé, juste déclenchée d'un clic depuis
   * la fiche personnage. Écrit dans le dossier de travail déjà mémorisé —
   * lisible par n'importe quel autre outil, ce n'est jamais un stockage
   * propriétaire du navigateur.
   */
  const scanAndSaveMachine = async (machine: PlayerMachine) => {
    // Toujours un retour visible, y compris pendant l'opération et en cas
    // d'annulation — un « AbortError » silencieux ressemble exactement à
    // « le bouton ne fait rien » vu de l'utilisateur, donc plus question de
    // l'avaler sans un mot.
    setScanSaveError(null);
    setScanSaveMachineId(machine.id);
    try {
      let directory = sampleDirectoryHandleRef.current;
      if (directory) {
        if (!(await requestStoredPermission(directory, 'readwrite'))) { setScanSaveError({ machineId: machine.id, message: 'Autorisation d’écriture refusée pour le dossier de travail.' }); return; }
      } else {
        directory = await chooseLocalDirectory('readwrite');
        sampleDirectoryHandleRef.current = directory;
        setSampleFolderName(directory.name);
        setSampleFolderNeedsReconnect(false);
        await saveDirectoryHandle(SAMPLE_FOLDER_KEY, directory);
      }
      // Lecture en direct si le SysEx est actif ; sinon repli sur le dernier
      // instantané connu (deviceSoundIndex/deviceInventory), comme avant ce
      // correctif. Trouvé le 13 août : SCAN republiait jusqu'ici
      // public/ep133-sound-index.json (figé au 9 août) sans jamais
      // interroger la machine — un vrai son uploadé pendant cette session
      // n'apparaissait donc jamais dans le compte.
      let soundCount = deviceSoundIndex?.soundCount || 0;
      let usedBytes = deviceSoundIndex?.usedBytes || 0;
      let scannedProject = deviceInventory?.project || null;
      if (midi.sysexEnabled && midi.outputConnected) {
        try {
          const liveSounds = await midi.listMachineSounds();
          soundCount = liveSounds.length;
          usedBytes = liveSounds.reduce((total, sound) => total + sound.bytes, 0);
          setDeviceSoundIndex({ readOnly: true, scannedAt: new Date().toISOString(), soundCount, usedBytes, sounds: liveSounds.map((sound) => ({ slot: sound.slot, bytes: sound.bytes, flags: sound.flags, fileName: sound.fileName })) });
        } catch (error) {
          console.warn('SCAN : lecture en direct des sons impossible, repli sur le dernier instantané connu.', error);
        }
        try {
          scannedProject = await midi.getActiveProjectNumber();
        } catch (error) {
          console.warn('SCAN : lecture en direct du projet actif impossible, repli sur le dernier instantané connu.', error);
        }
      }
      const deviceProfile = saveDeviceProfile(localStorage, { name: machine.name, capacityMb: machine.memory === '128' ? 128 : 64, sampleFolderName: directory.name, localSampleCount: machineSampleCount });
      const manifest = createDeviceClone(localStorage, deviceProfile, soundCount, usedBytes, scannedProject, 'scan');
      const path = await writeCloneManifest(directory, machine.name, manifest);
      setLastScanSave({ machineId: machine.id, path, at: new Date().toISOString() });
    } catch (error) {
      const name = (error as { name?: string }).name;
      const message = name === 'AbortError' ? 'Sélection de dossier annulée — rien n’a été sauvegardé.' : error instanceof Error ? error.message : 'La sauvegarde de l’état des lieux a échoué.';
      setScanSaveError({ machineId: machine.id, message });
    } finally {
      setScanSaveMachineId('');
    }
  };

  /** Miroir silencieux, best-effort : n'écrit que si la permission écriture
   * est déjà acquise pour ce dossier (jamais de prompt hors d'un geste
   * explicite) — sinon la fiche reste seulement en localStorage, comme
   * avant ce chantier. Aucune erreur remontée à l'utilisateur ici, c'est le
   * bouton SAUVEGARDER (saveProfileToFolder) qui donne un vrai retour. */
  const mirrorProfileToFolder = async (next: PlayerProfile) => {
    const directory = sampleDirectoryHandleRef.current;
    if (!directory || !(await hasStoredPermission(directory, 'readwrite'))) return;
    try { await writePlayerProfile(directory, next); } catch { /* miroir best-effort, la fiche reste en localStorage */ }
  };

  /** Même principe que mirrorProfileToFolder, appliqué à toute la
   * bibliothèque Studio : réconciliation complète à chaque appel — écrit un
   * fichier par projet (actif ou archivé, un archivage n'efface rien),
   * supprime tout fichier de studio/ dont l'id n'est plus dans la
   * bibliothèque (projet renommé/dupliqué/supprimé). Best-effort et
   * silencieux, comme le miroir de la fiche personnage : n'écrit que si la
   * permission écriture est déjà acquise pour ce dossier. */
  const mirrorStudioLibraryToFolder = async (library: StudioProjectRecord[]) => {
    const directory = sampleDirectoryHandleRef.current;
    if (!directory || !(await hasStoredPermission(directory, 'readwrite'))) return;
    try {
      const currentIds = new Set(library.map((record) => record.id));
      const existingIds = await listStudioProjectFileIds(directory);
      await Promise.all(library.map((record) => writeStudioProjectFile(directory, record.id, record.document)));
      await Promise.all(existingIds.filter((id) => !currentIds.has(id)).map((id) => removeStudioProjectFile(directory, id)));
    } catch { /* miroir best-effort, la bibliothèque reste en localStorage */ }
  };

  /** Seul point d'appel à setStudioLibrary — garantit que le miroir disque
   * (ci-dessus) reste synchronisé avec chaque enregistrement/renommage/
   * duplication/suppression/archivage/import, sans avoir à y penser à
   * chaque appelant. */
  const updateStudioLibrary = (next: StudioProjectRecord[]) => {
    setStudioLibrary(next);
    void mirrorStudioLibraryToFolder(next);
  };

  /** Écrit `profile.json` à la racine du dossier de travail — même dossier
   * que SCAN/CLONE (`sampleDirectoryHandleRef`), ouvert en écriture si
   * besoin. Geste explicite (bouton), donc peut réclamer la permission. */
  const saveProfileToFolder = async () => {
    setProfileFileError(null);
    try {
      let directory = sampleDirectoryHandleRef.current;
      if (directory) {
        if (!(await requestStoredPermission(directory, 'readwrite'))) { setProfileFileError('Autorisation d’écriture refusée pour le dossier de travail.'); return; }
      } else {
        directory = await chooseLocalDirectory('readwrite');
        sampleDirectoryHandleRef.current = directory;
        setSampleFolderName(directory.name);
        setSampleFolderNeedsReconnect(false);
        await saveDirectoryHandle(SAMPLE_FOLDER_KEY, directory);
      }
      const path = await writePlayerProfile(directory, playerProfile);
      setProfileFileSave({ path, at: new Date().toISOString() });
    } catch (error) {
      const name = (error as { name?: string }).name;
      setProfileFileError(name === 'AbortError' ? 'Sélection de dossier annulée — rien n’a été sauvegardé.' : error instanceof Error ? error.message : 'La sauvegarde de la fiche a échoué.');
    }
  };

  /** Relit `profile.json` depuis le dossier de travail et remplace la fiche
   * affichée après confirmation explicite — sert de restauration si
   * localStorage a été vidé (nouveau navigateur, nettoyage du site). */
  const restoreProfileFromFolder = async () => {
    setProfileFileError(null);
    try {
      let directory = sampleDirectoryHandleRef.current;
      if (directory) {
        if (!(await requestStoredPermission(directory, 'read'))) { setProfileFileError('Autorisation de lecture refusée pour le dossier de travail.'); return; }
      } else {
        directory = await chooseLocalDirectory('read');
        sampleDirectoryHandleRef.current = directory;
        setSampleFolderName(directory.name);
        setSampleFolderNeedsReconnect(false);
        await saveDirectoryHandle(SAMPLE_FOLDER_KEY, directory);
      }
      const raw = await readPlayerProfileFile(directory);
      if (!raw) { setProfileFileError(`Aucun profile.json trouvé dans ${directory.name}.`); return; }
      if (!window.confirm('Remplacer la fiche actuelle (pseudo, machines, statistiques) par celle du dossier de travail ?')) return;
      const restored = normalizePlayerProfile(raw);
      setPlayerProfile(restored);
      savePlayerProfile(localStorage, restored);
      setProfileFileSave({ path: `${directory.name}/profile.json`, at: new Date().toISOString() });
    } catch (error) {
      const name = (error as { name?: string }).name;
      setProfileFileError(name === 'AbortError' ? 'Sélection de dossier annulée.' : error instanceof Error ? error.message : 'La lecture de la fiche a échoué.');
    }
  };

  useEffect(() => {
    if (sessionActive) return;
    targets.current = activeExercise.targets.map((target, index) => ({ ...target, id: `target-${index}` }));
    setSongTime(0);
    setPlayerNotes([]);
    setScore(emptyScore());
    setLast(null);
  }, [activeExercise, sessionActive]);

  useEffect(() => {
    if (!transportActive) return;
    const tick = () => {
      setSongTime(audio.time);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
      frame.current = undefined;
    };
  }, [transportActive]);

  useEffect(() => () => {
    clearGameTimers();
    clearEditorTimers();
    midi.stopOutput();
    audio.dispose();
  }, [clearEditorTimers, clearGameTimers, midi.stopOutput]);

  const toggle = async () => {
    if (sessionActive) {
      stopGameTransport();
      return;
    }
    targets.current = activeExercise.targets.map((target, index) => ({ ...target, id: `target-${index}` }));
    setScore(emptyScore());
    setLast(null);
    setPlayerNotes([]);
    setSongTime(0);
    setCountdown(4);
    setPhase('countin');
    const run = ++gameRun.current;
    await audio.start(activeExercise, 1);
    if (run !== gameRun.current) return;
    const beatMs = 60000 / activeExercise.bpm;
    let remaining = 4;
    countTimer.current = window.setInterval(() => {
      remaining -= 1;
      setCountdown(Math.max(1, remaining));
      if (remaining <= 1 && countTimer.current !== undefined) {
        window.clearInterval(countTimer.current);
        countTimer.current = undefined;
      }
    }, beatMs);
    startTimer.current = window.setTimeout(() => setPhase('playing'), beatMs * 4);
    gameEndTimer.current = window.setTimeout(stopGameTransport, beatMs * (4 + activeExercise.bars * 4));
  };

  const togglePreview = async () => {
    if (phase === 'preview') {
      stopGameTransport();
      return;
    }
    if (sessionActive) return;
    targets.current = activeExercise.targets.map((target, index) => ({ ...target, id: `target-${index}` }));
    setSongTime(0);
    setPhase('preview');
    const run = ++gameRun.current;
    await audio.start(activeExercise, 0);
    if (run !== gameRun.current) return;
    gameEndTimer.current = window.setTimeout(stopGameTransport, 60000 / activeExercise.bpm * activeExercise.bars * 4);
  };

  const updateSound = (pad: number, patch: Partial<PadSoundSettings>) => {
    setSoundSettings((all) => {
      const next = all.map((settings, index) => index === pad ? { ...settings, ...patch } : settings);
      audio.setPadSettings(pad, next[pad]);
      return next;
    });
  };

  const clickPad = (pad: number) => {
    if (running) onHit({ pad, velocity: 100, timestamp: performance.now() });
    else void audio.previewPad(pad);
  };

  const editPad = (pad: number) => {
    setSoundPad(pad);
  };

  const changeStyle = (nextStyle: string) => {
    setStyleId(nextStyle);
    const userExercise = userExercises.find((item) => `user:${item.id}` === nextStyle);
    setTempo(userExercise?.bpm || STYLES.find((item) => item.id === nextStyle)?.bpm || 100);
  };

  const practicePlans = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    return {
      sevenDay: buildPracticePlan(practiceLog, DEDICATED_STYLE_IDS, 7, todayIso),
      thirtyDay: buildPracticePlan(practiceLog, DEDICATED_STYLE_IDS, 30, todayIso),
    };
  }, [practiceLog]);

  /** Depuis la fiche personnage : charge le style/niveau recommandé du jour dans le jeu et y bascule directement. */
  const startPracticeDay = (dayStyleId: string, dayDifficulty: number) => {
    changeStyle(dayStyleId);
    setDifficulty(dayDifficulty);
    setWorkspaceView('game');
  };

  const openEditor = () => {
    const selected = userExercises.find((item) => `user:${item.id}` === styleId);
    setEditorName(selected?.title || 'MON GROOVE');
    const selectedNotes = selected ? exerciseTargetsToNotes(selected.targets, 'A') : [];
    editorHistorySkipTarget.current = selectedNotes;
    setEditorTargets(selectedNotes);
    const bank = emptyPatternBank();
    bank.A[1] = selectedNotes;
    setEditorPatternBank(bank);
    setEditorPatternLengths({ 'A:1':Math.max(1, selected?.bars || 1), 'B:1':1, 'C:1':1, 'D:1':1 });
    setEditorPatternNumbers({ A: 1, B: 1, C: 1, D: 1 });
    setEditorScenes([{ scene: 1, groupPatterns: { A: 1, B: null, C: null, D: null }, timeSignature: [4, 4] }]);
    setEditorSong([1]);
    setEditorActiveScene(1);
    setEditorGroup('A');
    setEditorMode('game');
    setEditorBars(Math.max(1, selected?.bars || 1));
    setEditorOpen(true);
    setStudioView('pattern');
  };

  const openCompleteEditor = () => {
    setWorkspaceView('game');
    openEditor();
    setEditorMode('complete');
    // Dans le Studio, le pattern initial reste un brouillon carré jusqu'au
    // premier COMMIT ; aucune scène fantôme n'est ajoutée au Song.
    setEditorScenes([]);
    setEditorSong([]);
  };

  const editorPatternKey = `${editorGroup}:${editorPatternNumbers[editorGroup]}`;

  /** Enregistre une entrée d'historique ~500ms après la dernière frappe — regroupe une
   * rafale d'édition en un seul geste Annuler plutôt qu'un clic = un pas = une entrée.
   * Deux gardes par identité de référence, pas par booléen consommé une fois (piégé par
   * le double appel d'effet de StrictMode en développement, qui rejouerait un « skip »
   * déjà consommé comme une édition) :
   * - si `editorTargets` est déjà la référence connue (`editorHistoryBaseline`), rien de
   *   nouveau ne s'est produit depuis le dernier passage, on ignore ;
   * - si `editorTargets` est la référence explicitement annoncée par un chargement
   *   (changeEditorGroup, changeEditorPattern, editorUndo/Redo, nouveau/ouvrir projet…),
   *   on l'adopte comme référence connue sans l'enregistrer comme une édition. */
  useEffect(() => {
    if (editorTargets === editorHistoryBaseline.current) return;
    if (editorTargets === editorHistorySkipTarget.current) {
      editorHistoryBaseline.current = editorTargets;
      // Un chargement (changement de groupe/pattern, Annuler/Rétablir, nouveau/ouvrir
      // projet…) remplace le contenu affiché : une sélection multiple d'un autre contexte
      // n'a plus de sens ici. Un nudge, à l'inverse, ne passe jamais par ce chemin — la
      // sélection doit y survivre pour enchaîner plusieurs déplacements.
      setEditorSelectedSteps((current) => current.size ? new Set() : current);
      return;
    }
    if (editorHistoryTimer.current !== undefined) window.clearTimeout(editorHistoryTimer.current);
    const key = editorPatternKey;
    const previous = editorHistoryBaseline.current;
    editorHistoryTimer.current = window.setTimeout(() => {
      const bucket = editorHistory.current[key] || { past: [], future: [] };
      editorHistory.current[key] = { past: [...bucket.past, previous].slice(-50), future: [] };
      editorHistoryBaseline.current = editorTargets;
      setEditorHistoryVersion((version) => version + 1);
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorTargets]);

  const editorUndo = () => {
    const key = editorPatternKey;
    const bucket = editorHistory.current[key];
    if (!bucket || !bucket.past.length) return;
    if (editorHistoryTimer.current !== undefined) { window.clearTimeout(editorHistoryTimer.current); editorHistoryTimer.current = undefined; }
    const previous = bucket.past[bucket.past.length - 1];
    editorHistory.current[key] = { past: bucket.past.slice(0, -1), future: [editorTargets, ...bucket.future].slice(0, 50) };
    editorHistorySkipTarget.current = previous;
    setEditorTargets(previous);
    setEditorPatternBank((current) => ({ ...current, [editorGroup]: { ...current[editorGroup], [editorPatternNumbers[editorGroup]]: previous } }));
    setEditorHistoryVersion((version) => version + 1);
  };
  const editorRedo = () => {
    const key = editorPatternKey;
    const bucket = editorHistory.current[key];
    if (!bucket || !bucket.future.length) return;
    if (editorHistoryTimer.current !== undefined) { window.clearTimeout(editorHistoryTimer.current); editorHistoryTimer.current = undefined; }
    const [next, ...restFuture] = bucket.future;
    editorHistory.current[key] = { past: [...bucket.past, editorTargets].slice(-50), future: restFuture };
    editorHistorySkipTarget.current = next;
    setEditorTargets(next);
    setEditorPatternBank((current) => ({ ...current, [editorGroup]: { ...current[editorGroup], [editorPatternNumbers[editorGroup]]: next } }));
    setEditorHistoryVersion((version) => version + 1);
  };
  const editorCanUndo = Boolean(editorHistory.current[editorPatternKey]?.past.length);
  const editorCanRedo = Boolean(editorHistory.current[editorPatternKey]?.future.length);
  void editorHistoryVersion; // force le recalcul de editorCanUndo/editorCanRedo à chaque changement d'historique

  /** Raccourcis clavier — seulement quand l'éditeur complet a la grille de pattern à l'écran
   * et que le focus n'est pas dans un champ texte (nom du projet, recherche…). Écouteur
   * attaché une seule fois (pas à chaque rendu) ; l'état frais est lu via une ref mise à
   * jour à chaque rendu, pour éviter à la fois la fermeture périmée et le réabonnement
   * répété d'un composant qui se re-rend très souvent (transport, jeu). */
  /** Flèches gauche/droite : déplace toute la sélection d'un pas (E-18) — pur no-op si rien n'est sélectionné ou si ça sortirait de la grille. Déclarée ici (avant `editorHotkeyState` juste en dessous) plutôt qu'avec `toggleSelectEditorStep`/`adjustEditorDuration` plus bas dans le fichier : le ref du raccourci clavier l'utilise dès l'assignation synchrone à chaque rendu, pas seulement dans une fermeture différée — la référencer avant sa déclaration lexicale romprait le typecheck (TDZ). */
  const nudgeEditorSelection = (deltaSteps: number) => {
    const result = nudgeSelectedNotes(editorTargets, editorSelectedSteps, deltaSteps);
    if (!result) return;
    setEditorTargets(result.notes);
    setEditorSelectedSteps(result.selectedKeys);
  };

  const editorHotkeyState = useRef({ editorOpen, editorMode, studioView, editorUndo, editorRedo, editorSelectedSteps, nudgeEditorSelection });
  editorHotkeyState.current = { editorOpen, editorMode, studioView, editorUndo, editorRedo, editorSelectedSteps, nudgeEditorSelection };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const state = editorHotkeyState.current;
      if (!state.editorOpen || state.editorMode !== 'complete' || state.studioView !== 'pattern') return;
      const target = event.target as HTMLElement | null;
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) state.editorRedo(); else state.editorUndo();
        return;
      }
      // Flèches gauche/droite : déplace la sélection multiple d'un pas (E-18) — seulement si
      // quelque chose est sélectionné, pour ne jamais voler le défilement/la navigation par
      // défaut du clavier quand la grille n'a rien de particulier à faire de cette touche.
      if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && state.editorSelectedSteps.size) {
        event.preventDefault();
        state.nudgeEditorSelection(event.key === 'ArrowLeft' ? -1 : 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  /** Flush les frappes en cours vers la banque, en repartant du groupe/numéro de pattern actifs — pas seulement du groupe comme avant l'introduction des patterns multiples. */
  const currentPatternBank = (): PatternBank => ({
    ...editorPatternBank,
    [editorGroup]: { ...editorPatternBank[editorGroup], [editorPatternNumbers[editorGroup]]: editorTargets },
  });

  const patternsForActiveScene = (): ProjectPatterns => patternsForScene(currentPatternBank(), editorScenes, editorActiveScene);

  const changeEditorGroup = (nextGroup: EditorGroup) => {
    setMachineGroup(nextGroup);
    editorScrollToEnd.current = false;
    setEditorPatternBank((current) => ({ ...current, [editorGroup]: { ...current[editorGroup], [editorPatternNumbers[editorGroup]]: editorTargets } }));
    const nextNotes = editorPatternBank[nextGroup][editorPatternNumbers[nextGroup]] || [];
    editorHistorySkipTarget.current = nextNotes; // charge le pattern du nouveau groupe, ce n'est pas une édition
    setEditorTargets(nextNotes);
    setEditorGroup(nextGroup);
    setEditorBars(editorPatternLengths[`${nextGroup}:${editorPatternNumbers[nextGroup]}`] || usedBars(nextNotes));
  };

  useEffect(() => {
    if (editorOpen && editorMode === 'complete' && machineGroup !== editorGroup) changeEditorGroup(machineGroup);
  }, [editorOpen, editorMode, machineGroup, editorGroup]);

  /** Les boutons A–D du Studio changent aussi le groupe actif de la machine,
   * lorsque l’EP-133 est connecté. Sans MIDI, ils restent une sélection locale. */
  const changeEditorGroupAndMachine = async (nextGroup: EditorGroup) => {
    changeEditorGroup(nextGroup);
    await selectMachineGroupFromComputer(nextGroup);
  };

  const selectMachineGroupFromComputer = async (nextGroup: EditorGroup) => {
    setMachineGroup(nextGroup);
    if (!midi.sysexEnabled || !midi.outputConnected) return;
    try {
      await midi.selectMachineGroup(EDITOR_GROUPS.indexOf(nextGroup));
    } catch (error) {
      window.alert(`Groupe ${nextGroup} non sélectionné sur l’EP-133 : ${error instanceof Error ? error.message : 'erreur MIDI'}`);
    }
  };

  // Une note jouée sur la machine porte aussi son groupe (A=36–47,
  // B=48–59, C=60–71, D=72–83). Elle sélectionne donc la même banque dans
  // le Studio. Ce chemin est du MIDI standard et a été validé sur l'EP-133 ;
  // il ne tente pas d'imiter les boutons de groupe via un SysEx propriétaire.
  useEffect(() => {
    if (!midiRequestedEditorGroup) return;
    if (midiRequestedEditorGroup !== editorGroup) changeEditorGroup(midiRequestedEditorGroup);
    setMidiRequestedEditorGroup(null);
  }, [editorGroup, midiRequestedEditorGroup]);

  /** Bascule vers un autre numéro de pattern (01–99) du groupe actif ; le crée vide s'il n'existe pas encore — choix d'UX du Studio, pas un fait matériel confirmé. */
  const changeEditorPattern = (nextNumber: number) => {
    editorScrollToEnd.current = false;
    const clamped = Math.max(1, Math.min(MAX_PATTERN_NUMBER, nextNumber));
    setEditorPatternBank((current) => ({ ...current, [editorGroup]: { ...current[editorGroup], [editorPatternNumbers[editorGroup]]: editorTargets } }));
    const nextNotes = editorPatternBank[editorGroup][clamped] || [];
    editorHistorySkipTarget.current = nextNotes; // charge un autre numéro de pattern, ce n'est pas une édition
    setEditorTargets(nextNotes);
    setEditorPatternNumbers((current) => ({ ...current, [editorGroup]: clamped }));
    setEditorBars(editorPatternLengths[`${editorGroup}:${clamped}`] || usedBars(nextNotes));
  };

  /** Pont explicite ARRANGEMENT → EDIT PATTERN : conserve le pattern en cours puis ouvre la cellule exacte de la scène choisie. */
  const editArrangedPattern = (sceneNumber: number, group: EditorGroup, patternNumber: number) => {
    editorScrollToEnd.current = false;
    const bank = currentPatternBank();
    const nextNotes = bank[group][patternNumber] || [];
    setEditorPatternBank(bank);
    setEditorActiveScene(sceneNumber);
    setEditorGroup(group);
    setEditorPatternNumbers((current) => ({ ...current, [group]: patternNumber }));
    editorHistorySkipTarget.current = nextNotes;
    setEditorTargets(nextNotes);
    setEditorBars(editorPatternLengths[`${group}:${patternNumber}`] || usedBars(nextNotes));
    setEditorSelectedPad(nextNotes[0]?.pad ?? 0);
    setKeyEditorOpen(false);
    setStudioView('pattern');
  };

  const exportEditorMidi = () => {
    const patterns = patternsForActiveScene();
    const blob = new Blob([createMidiFile(patterns, tempo)], { type: 'audio/midi' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(editorName.trim() || 'ep133-pattern').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.mid`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportEditorProjectJson = () => {
    const patternBank = currentPatternBank();
    const projectDocument = createEp133ProjectDocument({ title: editorName, bpm: tempo, patternBank, scenes: editorScenes, song: editorSong, currentScene: editorActiveScene, pads: deviceInventory?.pads || [], padModes: editorPadModes, patternLengths:editorPatternLengths });
    const blob = new Blob([JSON.stringify(projectDocument, null, 2)], { type: 'application/json' });
    const link = window.document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = `${(editorName.trim() || 'ep133-project').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ep133.json`;
    link.click(); URL.revokeObjectURL(link.href);
  };

  const exportEditor = () => editorExportFormat === 'midi' ? exportEditorMidi() : exportEditorProjectJson();

  /** Routage unique des préécoutes Studio : machine, puis clone PCM, puis synthèse interne. */
  const previewEditorPad = async (group: EditorGroup, pad: number, note?: number) => {
    if (midi.outputConnected) {
      if (note !== undefined) midi.sendNote(note, 110);
      else midi.sendPad(pad, EDITOR_GROUPS.indexOf(group), 110);
      return;
    }
    const machinePad = deviceInventory?.pads.find((candidate) => candidate.group === group && candidate.pad === pad + 1);
    if (machinePad?.slot && await machineSampleBank.play(machinePad.slot, 110, performance.now(), note, machinePad.rootNote)) return;
    await audio.previewPad(pad);
  };

  const toggleEditorStep = (measure: number, pad: number, step: number) => {
    const beat = measure * 4 + step / 4;
    const exists = editorTargets.some((target) => target.pad === pad && target.beat === beat);
    setEditorTargets((current) => exists
      ? current.filter((target) => !(target.pad === pad && target.beat === beat))
      : [...current, { id: `editor-${measure}-${pad}-${step}`, group: editorGroup, beat, pad, velocity: DEFAULT_NOTE_VELOCITY, duration: DEFAULT_NOTE_DURATION }]);
    if (!exists && editorMode === 'complete') {
      void previewEditorPad(editorGroup, pad);
      if (measure >= editorBars) {
        const nextLength = Math.min(99, measure + 1);
        setEditorBars(nextLength);
        setEditorPatternLengths((current) => ({ ...current, [`${editorGroup}:${editorPatternNumbers[editorGroup]}`]:nextLength }));
      }
    }
    if (editorMode !== 'complete') setEditorBars((bars) => barsAfterStepEdit(bars, measure, exists));
  };

  /** Maj+molette sur un pas rempli : vélocité 1–127, comme sur la machine (touche + pression). */
  const clampVelocity = (velocity: number) => Math.max(1, Math.min(127, velocity));

  const adjustEditorVelocity = (measure: number, pad: number, step: number, delta: number) => {
    const beat = measure * 4 + step / 4;
    setEditorTargets((current) => current.map((target) => target.pad === pad && target.beat === beat
      ? { ...target, velocity: clampVelocity(target.velocity + delta) }
      : target));
  };

  /** Gate/durée d'un pas (Alt+molette) — 1/16 de temps mini (un geste perceptible), une mesure entière maxi, pas de limite plus fine imposée par le modèle lui-même. */
  const clampDuration = (duration: number) => Math.max(0.0625, Math.min(4, duration));

  const adjustEditorDuration = (measure: number, pad: number, step: number, delta: number) => {
    const beat = measure * 4 + step / 4;
    setEditorTargets((current) => current.map((target) => target.pad === pad && target.beat === beat
      ? { ...target, duration: clampDuration(target.duration + delta) }
      : target));
  };

  /** Ctrl/Cmd+clic sur un pas rempli : bascule sa sélection multiple (REGISTRE_IDEES.md E-15), sans toucher à la note elle-même. */
  const toggleSelectEditorStep = (measure: number, pad: number, step: number) => {
    const key = `${measure}:${pad}:${step}`;
    setEditorSelectedSteps((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const adjustCommittedEditorVelocity = (sectionKey: string, measure: number, pad: number, step: number, delta: number) => {
    const section = editorCommittedSections.find((candidate) => candidate.key === sectionKey);
    if (!section || section.patternNumber === null || section.patternNumber === undefined) return;
    const beat = measure * 4 + step / 4;
    const bank = currentPatternBank();
    const notes = bank[editorGroup][section.patternNumber] || [];
    const nextNotes = notes.map((target) => target.pad === pad && target.beat === beat
      ? { ...target, velocity: clampVelocity(target.velocity + delta) }
      : target);
    setEditorPatternBank({ ...bank, [editorGroup]: { ...bank[editorGroup], [section.patternNumber]: nextNotes } });
    if (editorPatternNumbers[editorGroup] === section.patternNumber) setEditorTargets(nextNotes);
  };

  /** Même mécanisme que adjustEditorVelocity, pour une note du piano-roll KEYS (identifiée par pad+note+beat plutôt que pad+beat). */
  const adjustKeyVelocity = (note: number, globalStep: number, delta: number) => {
    const beat = globalStep / 4;
    setEditorTargets((current) => current.map((target) => target.pad === editorSelectedPad && target.beat === beat && target.note === note
      ? { ...target, velocity: clampVelocity(target.velocity + delta) }
      : target));
  };

  const toggleKeyStep = (note: number, globalStep: number) => {
    const beat = globalStep / 4;
    const exists = editorTargets.some((target) => target.pad === editorSelectedPad && target.beat === beat && target.note === note);
    setEditorTargets((current) => exists
      ? current.filter((target) => !(target.pad === editorSelectedPad && target.beat === beat && target.note === note))
      : [...current, { id: `key-${editorGroup}-${editorSelectedPad}-${note}-${globalStep}`, group: editorGroup, beat, pad: editorSelectedPad, note, velocity: DEFAULT_NOTE_VELOCITY, duration: DEFAULT_NOTE_DURATION }]);
    if (!exists) {
      void previewEditorPad(editorGroup, editorSelectedPad, note);
      const nextLength = Math.min(99, measureFromGlobalStep(globalStep) + 1);
      if (editorMode === 'complete' && nextLength > editorBars) {
        setEditorBars(nextLength);
        setEditorPatternLengths((current) => ({ ...current, [`${editorGroup}:${editorPatternNumbers[editorGroup]}`]:nextLength }));
      }
    }
    const editedMeasure = measureFromGlobalStep(globalStep);
    if (editorMode !== 'complete') setEditorBars((bars) => barsAfterStepEdit(bars, editedMeasure, exists));
  };

  const changePatternLength = (nextLength: number) => {
    const length = Math.max(1, Math.min(99, Math.floor(nextLength)));
    setEditorPatternLengths((current) => ({ ...current, [`${editorGroup}:${editorPatternNumbers[editorGroup]}`]:length }));
    setEditorBars(length);
  };

  const copyPatternBlock = (measure: number) => {
    const destination = Math.min(98, measure + 1);
    const sourceNotes = editorTargets.filter((note) => Math.floor(note.beat / 4) === measure);
    if (!sourceNotes.length) return;
    const destinationHasNotes = editorTargets.some((note) => Math.floor(note.beat / 4) === destination);
    if (destinationHasNotes && !window.confirm(`Le bloc ${destination + 1} contient déjà des notes. Le remplacer par une copie du bloc ${measure + 1} ?`)) return;
    const copied = sourceNotes.map((note, index) => ({ ...note, id:`${note.id}-copy-${destination}-${index}-${Date.now()}`, beat:note.beat + (destination - measure) * 4 }));
    setEditorTargets((current) => [...current.filter((note) => Math.floor(note.beat / 4) !== destination), ...copied]);
    const nextLength = Math.max(editorBars, destination + 1);
    setEditorBars(nextLength);
    setEditorPatternLengths((current) => ({ ...current, [`${editorGroup}:${editorPatternNumbers[editorGroup]}`]:nextLength }));
  };

  const deletePatternBlock = (measure: number) => {
    if (!window.confirm(`Supprimer toutes les notes du bloc ${measure + 1} ?`)) return;
    setEditorTargets((current) => current.filter((note) => Math.floor(note.beat / 4) !== measure));
  };

  const effectiveEditorBars = editorMode === 'complete' ? editorBars : usedBars(editorTargets);
  const editorCommittedSections = (() => {
    if (editorMode !== 'complete') return [];
    const bank = currentPatternBank();
    return editorSong.flatMap((sceneNumber, position) => {
      const scene = editorScenes.find((candidate) => candidate.scene === sceneNumber);
      const patternNumber = scene?.groupPatterns[editorGroup];
      const notes = patternNumber === null || patternNumber === undefined ? [] : bank[editorGroup][patternNumber] || [];
      // Comme sur le K.O.II, la durée d'une Song Position est celle du plus
      // long pattern de la scène, tous groupes A–D confondus.
      const sceneBars = Math.max(1, ...EDITOR_GROUPS.map((group) => {
        const groupPatternNumber = scene?.groupPatterns[group];
        return groupPatternNumber === null || groupPatternNumber === undefined ? 0 : editorPatternLengths[`${group}:${groupPatternNumber}`] || usedBars(bank[group][groupPatternNumber] || []);
      }));
      return [{
        key: `${position}-${sceneNumber}-${editorGroup}-${patternNumber ?? 'mute'}`,
        sceneNumber,
        patternNumber,
        label: `L.${String(position + 1).padStart(2, '0')} · S.${String(sceneNumber).padStart(2, '0')} · ${patternNumber === null || patternNumber === undefined ? `${editorGroup}--` : `${editorGroup}${String(patternNumber).padStart(2, '0')}`}`,
        bars: sceneBars,
        targets: notes,
      }];
    });
  })();

  /** Édition directe d'un pattern déjà commité : les coins arrondis signalent la scène, ils ne verrouillent jamais les notes. */
  const toggleCommittedEditorStep = (sectionKey: string, measure: number, pad: number, step: number) => {
    const section = editorCommittedSections.find((candidate) => candidate.key === sectionKey);
    if (!section || section.patternNumber === null || section.patternNumber === undefined) return;
    const beat = measure * 4 + step / 4;
    const bank = currentPatternBank();
    const notes = bank[editorGroup][section.patternNumber] || [];
    const exists = notes.some((target) => target.pad === pad && target.beat === beat);
    const nextNotes = exists
      ? notes.filter((target) => !(target.pad === pad && target.beat === beat))
      : [...notes, { id: `scene-${section.sceneNumber}-${editorGroup}-${section.patternNumber}-${measure}-${pad}-${step}`, group: editorGroup, beat, pad, velocity: DEFAULT_NOTE_VELOCITY, duration: DEFAULT_NOTE_DURATION }];
    setEditorPatternBank({ ...bank, [editorGroup]: { ...bank[editorGroup], [section.patternNumber]: nextNotes } });
    if (editorPatternNumbers[editorGroup] === section.patternNumber) setEditorTargets(nextNotes);
    if (!exists) void previewEditorPad(editorGroup, pad);
  };

  const editorExercise = (): Exercise => ({ id: 'editor-preview', title: editorName.trim() || 'MON GROOVE', description: 'Exercice utilisateur', bpm: tempo, bars: effectiveEditorBars, timeSignature: '4/4', countInBars: 0, backingTrack: null, grading: { perfectMs: 35, goodMs: 90 }, targets: notesToExerciseTargets(editorTargets) });

  /** `sceneOverride` audite une scène précise (depuis l'Arrangeur) sans attendre le prochain rendu de `editorActiveScene`. */
  const toggleEditorPlayback = async (sceneOverride?: number) => {
    if (editorPlaying) {
      stopEditorTransport();
      return;
    }
    await audio.unlock();
    const activeScene = sceneOverride ?? editorActiveScene;
    if (sceneOverride !== undefined) setEditorActiveScene(sceneOverride);
    setEditorPlaying(true);
    const run = ++editorRun.current;
    setEditorPlaybackBeat(0);
    if (editorGrid.current) editorGrid.current.scrollLeft = 0;
    const playbackBank = currentPatternBank();
    const sceneNumbers = editorMode === 'complete' && sceneOverride === undefined && editorSong.length ? editorSong : [activeScene];
    let beatOffset = 0;
    const scheduledTargets: Array<{ group: EditorGroup; target: SequencerNote }> = [];
    // Une position par scène jouée, à son décalage de départ — sert à faire suivre
    // SONG POSITION/SCÈNE au fil de la lecture (voir followPlayback), pas seulement
    // à programmer l'audio. Le pattern affiché dans la grille n'en dépend pas
    // (editorTargets reste lié à editorGroup/patternNumbers), donc rien n'est
    // perturbé si l'utilisateur édite pendant que le morceau joue.
    const songSegments: Array<{ scene: number; startBeat: number }> = [];
    sceneNumbers.forEach((sceneNumber) => {
      songSegments.push({ scene: sceneNumber, startBeat: beatOffset });
      const sceneExists = editorScenes.some((scene) => scene.scene === sceneNumber);
      const scenePatterns = sceneExists
        ? patternsForScene(playbackBank, editorScenes, sceneNumber)
        : Object.fromEntries(EDITOR_GROUPS.map((group) => [group, playbackBank[group][editorPatternNumbers[group]] || []])) as ProjectPatterns;
      const scene = editorScenes.find((candidate) => candidate.scene === sceneNumber);
      const sceneBars = Math.max(1, ...EDITOR_GROUPS.map((group) => {
        const number = scene ? scene.groupPatterns[group] : editorPatternNumbers[group];
        return number ? editorPatternLengths[`${group}:${number}`] || usedBars(scenePatterns[group]) : 0;
      }));
      EDITOR_GROUPS.forEach((group) => scenePatterns[group].forEach((target) => {
        scheduledTargets.push({ group, target: { ...target, beat: target.beat + beatOffset } });
      }));
      beatOffset += sceneBars * 4;
    });
    const allTargets = scheduledTargets.map(({ target }) => target);
    const playbackBars = Math.max(1, beatOffset / 4);
    const playbackStart = performance.now() + (editorMode === 'complete' ? 80 : 0);
    // Comparaison à une variable locale plutôt qu'à l'état React `editorActiveScene`,
    // qui resterait figé à sa valeur de départ dans cette fermeture (rAF planifié
    // une seule fois, pas à chaque rendu) — piège classique de fermeture périmée.
    let lastReportedScene = activeScene;
    const followPlayback = () => {
      const rawBeat = Math.max(0, (performance.now() - playbackStart) / (60000 / tempo));
      const beat = editorLoop ? rawBeat % (playbackBars * 4) : rawBeat;
      setEditorPlaybackBeat(Math.min(playbackBars * 4, beat));
      if (songSegments.length > 1) {
        const segment = [...songSegments].reverse().find((candidate) => beat >= candidate.startBeat) || songSegments[0];
        if (segment.scene !== lastReportedScene) {
          lastReportedScene = segment.scene;
          setEditorActiveScene(segment.scene);
        }
      }
      if (editorGrid.current) {
        const playheadX = 160 + beat / 4 * 960;
        editorGrid.current.scrollLeft = Math.max(0, playheadX - editorGrid.current.clientWidth * 0.42);
      }
      if (editorLoop || rawBeat < playbackBars * 4) editorPlaybackFrame.current = requestAnimationFrame(followPlayback);
    };
    editorPlaybackFrame.current = requestAnimationFrame(followPlayback);
    if (editorMode === 'complete') {
      if (!midi.outputConnected && !machineSampleCount) {
        const internalExercise: Exercise = {
          ...editorExercise(),
          id: 'studio-internal-preview',
          bars: playbackBars,
          targets: notesToExerciseTargets(allTargets),
        };
        await audio.start(internalExercise, 0, false, editorLoop);
        if (run !== editorRun.current) return;
      }
      const startAt = playbackStart;
      const cycleMs = 60000 / tempo * playbackBars * 4;
      const scheduleCycle = (cycleStart: number) => {
        scheduledTargets.forEach(({ group, target }) => {
          const groupIndex = EDITOR_GROUPS.indexOf(group);
          const at = cycleStart + target.beat * 60000 / tempo;
          const duration = target.duration * 60000 / tempo;
          if (midi.outputConnected) {
            if (target.note !== undefined) midi.sendNote(target.note, target.velocity, at, duration);
            else midi.sendPad(target.pad, groupIndex, target.velocity, at, duration);
          } else {
            const pad = deviceInventory?.pads.find((candidate) => candidate.group === group && candidate.pad === target.pad + 1);
            const scheduleInternalFallback = () => window.setTimeout(() => audio.playPad(target.pad, target.velocity), Math.max(0, at - performance.now()));
            if (pad?.slot) void machineSampleBank.play(pad.slot, target.velocity, at, target.note, pad.rootNote).then((played) => { if (!played) scheduleInternalFallback(); });
            else scheduleInternalFallback();
          }
        });
      };
      if (midi.outputConnected || machineSampleCount) {
        scheduleCycle(startAt);
        if (editorLoop) editorLoopTimer.current = window.setInterval(() => scheduleCycle(performance.now() + 80), cycleMs);
      }
    } else {
      // Dans l'éditeur jeu, la lecture sert à écouter le groove sans clic métronomique.
      await audio.start(editorExercise(), 0, false);
      if (run !== editorRun.current) return;
    }
    if (!editorLoop) editorEndTimer.current = window.setTimeout(() => {
      stopEditorTransport(false);
      setEditorPlaybackBeat(playbackBars * 4);
    }, 60000 / tempo * playbackBars * 4 + (editorMode === 'complete' ? 80 : 0));
  };

  const saveEditorExercise = () => {
    const saved = { ...editorExercise(), id: `user-${Date.now()}` };
    const next = [...userExercises, saved];
    localStorage.setItem(USER_EXERCISES_KEY, JSON.stringify(next));
    setUserExercises(next);
    setStyleId(`user:${saved.id}`);
    setEditorOpen(false);
    stopEditorTransport();
  };

  /**
   * Conversion Projet → Exercice — P1 (12 août, voir docs/ROADMAP.md et
   * docs/REGISTRE_IDEES.md). Convertit le pattern actif du Studio (groupe et
   * numéro sélectionnés) en exercice Rhythm Hero USER, immédiatement
   * sélectionnable dans le sélecteur STYLE › EXERCICES USER du jeu — même
   * mécanisme que saveEditorExercise (le même format ep.project.v1/
   * SequencerNote alimente déjà les deux), pas un nouveau convertisseur :
   * editorExercise() ne dépend d'aucune notion de mode, juste d'editorTargets/
   * tempo/effectiveEditorBars déjà à jour. Reste dans le Studio après l'envoi
   * — contrairement à SAVE côté jeu, rien ne doit se fermer ici.
   */
  const sendPatternToRhythmHero = () => {
    if (!editorTargets.length) { window.alert('Ce pattern est vide — ajoute des frappes avant de l’envoyer vers Rhythm Hero.'); return; }
    const label = `${editorName.trim() || 'MON GROOVE'} · ${editorGroup}${String(editorPatternNumbers[editorGroup]).padStart(2, '0')}`;
    const saved: Exercise = { ...editorExercise(), id: `user-${Date.now()}`, title: label, description: `Envoyé depuis le Studio · pattern ${editorGroup}${String(editorPatternNumbers[editorGroup]).padStart(2, '0')}` };
    const next = [...userExercises, saved];
    localStorage.setItem(USER_EXERCISES_KEY, JSON.stringify(next));
    setUserExercises(next);
    window.alert(`« ${label} » envoyé vers Rhythm Hero — sélectionne-le dans STYLE › EXERCICES USER pour t’entraîner dessus.`);
  };

  const confirmStudioReplacement = () => {
    const bank = currentPatternBank();
    const containsNotes = EDITOR_GROUPS.some((group) => Object.values(bank[group]).some((notes) => notes.length > 0));
    return !containsNotes || window.confirm('Remplacer le projet affiché ? Enregistrez-le d’abord si vous voulez conserver ses modifications.');
  };

  const newStudioProject = () => {
    if (!confirmStudioReplacement()) return;
    stopEditorTransport();
    setEditorName('NOUVEAU PROJET');
    setEditorGroup('A');
    editorHistory.current = {};
    const emptyTargets: SequencerNote[] = [];
    editorHistorySkipTarget.current = emptyTargets;
    setEditorTargets(emptyTargets);
    setEditorPatternBank(emptyPatternBank());
    setEditorPatternLengths({ 'A:1':1, 'B:1':1, 'C:1':1, 'D:1':1 });
    setEditorPatternNumbers({ A: 1, B: 1, C: 1, D: 1 });
    setEditorScenes([]);
    setEditorSong([]);
    setEditorActiveScene(1);
    setEditorPadModes({});
    setEditorBars(1);
    setKeyEditorOpen(false);
    setStudioView('pattern');
    setSelectedStudioProject('');
    setMissingDependencies([]);
  };

  const saveStudioProject = () => {
    const patternBank = currentPatternBank();
    setEditorPatternBank(patternBank);
    const document = createEp133ProjectDocument({ title: editorName, bpm: tempo, patternBank, scenes: editorScenes, song: editorSong, currentScene: editorActiveScene, pads: deviceInventory?.pads || [], padModes: editorPadModes, patternLengths:editorPatternLengths });
    const stored = storeStudioProject(localStorage, studioLibrary, document, selectedStudioProject);
    updateStudioLibrary(stored.library);
    setSelectedStudioProject(stored.id);
  };

  const saveStudioProjectAs = () => {
    const title = window.prompt('Nom de la nouvelle copie :', editorName);
    if (!title?.trim()) return;
    const patternBank = currentPatternBank();
    const document = createEp133ProjectDocument({ title, bpm: tempo, patternBank, scenes: editorScenes, song: editorSong, currentScene: editorActiveScene, pads: deviceInventory?.pads || [], padModes: editorPadModes, patternLengths:editorPatternLengths });
    const stored = storeStudioProject(localStorage, studioLibrary, document);
    setEditorName(title.trim().toUpperCase());
    setEditorPatternBank(patternBank);
    updateStudioLibrary(stored.library);
    setSelectedStudioProject(stored.id);
  };

  const renameSelectedStudioProject = () => {
    if (!selectedStudioProject) return;
    const title = window.prompt('Nouveau nom du projet :', editorName);
    if (!title?.trim()) return;
    updateStudioLibrary(renameStudioProject(localStorage, studioLibrary, selectedStudioProject, title));
    setEditorName(title.trim().toUpperCase());
  };

  const duplicateSelectedStudioProject = () => {
    if (!selectedStudioProject) return;
    const title = window.prompt('Nom de la copie :', `${editorName} COPIE`);
    if (!title?.trim()) return;
    const stored = duplicateStudioProject(localStorage, studioLibrary, selectedStudioProject, title);
    if (!stored) return;
    updateStudioLibrary(stored.library);
    setSelectedStudioProject(stored.id);
    setEditorName(title.trim().toUpperCase());
  };

  const deleteSelectedStudioProject = () => {
    if (!selectedStudioProject) return;
    const record = studioLibrary.find((project) => project.id === selectedStudioProject);
    const title = String((record?.document.metadata as { title?: string } | undefined)?.title || 'ce projet');
    if (!window.confirm(`Supprimer définitivement « ${title} » de la bibliothèque locale ?`)) return;
    updateStudioLibrary(deleteStudioProject(localStorage, studioLibrary, selectedStudioProject));
    setSelectedStudioProject('');
  };

  const archiveSelectedStudioProject = () => {
    if (!selectedStudioProject) return;
    updateStudioLibrary(archiveStudioProject(localStorage, studioLibrary, selectedStudioProject));
    setSelectedStudioProject('');
  };

  /** Commun à tous les chargements : ouvre exactement les patterns référencés par la première Song Position, afin que EDIT PATTERN et ARRANGEMENT montrent la même scène. */
  const applyLoadedStudioProject = (loaded: StudioProjectState) => {
    stopEditorTransport();
    editorScrollToEnd.current = false;
    setEditorName(loaded.title.toUpperCase());
    setTempo(loaded.bpm);
    setEditorPatternBank(loaded.patternBank);
    setEditorPatternLengths(loaded.patternLengths);
    const startingSceneNumber = loaded.song[0] ?? loaded.currentScene ?? loaded.scenes[0]?.scene ?? 1;
    const startingScene = loaded.scenes.find((scene) => scene.scene === startingSceneNumber);
    const startingNumbers = Object.fromEntries(
      EDITOR_GROUPS.map((group) => [group, startingScene?.groupPatterns[group] ?? patternNumbersForGroup(loaded.patternBank, group)[0] ?? 1]),
    ) as Record<EditorGroup, number>;
    const startingGroup = EDITOR_GROUPS.find((group) => startingScene?.groupPatterns[group] !== null && loaded.patternBank[group][startingNumbers[group]]?.length) ?? 'A';
    setEditorPatternNumbers(startingNumbers);
    setEditorScenes(loaded.scenes);
    setEditorSong(loaded.song);
    setEditorActiveScene(startingSceneNumber);
    setEditorGroup(startingGroup);
    const startingNotes = loaded.patternBank[startingGroup][startingNumbers[startingGroup]] || [];
    editorHistory.current = {};
    editorHistorySkipTarget.current = startingNotes;
    setEditorTargets(startingNotes);
    setEditorPadModes(loaded.padModes);
    setEditorBars(loaded.patternLengths[`${startingGroup}:${startingNumbers[startingGroup]}`] || usedBars(startingNotes));
    // Un document complet peut contenir plusieurs Song Positions, scènes et
    // patterns. L'ouvrir sur ARRANGEMENT montre le fichier entier ; l'utilisateur
    // choisit ensuite « A01 · ÉDITER » pour entrer dans un pattern précis.
    setStudioView('arrangement');
    setKeyEditorOpen(false);
    setMissingDependencies(findMissingDependencies(loaded.pads, deviceSoundIndex));
  };

  /** Ouvre directement le projet cliqué dans le menu FICHIER — un seul clic, pas de sélection préalable dans un menu séparé qui pouvait laisser croire qu'OUVRIR ne faisait rien. */
  const openStudioProject = (id: string) => {
    const record = studioLibrary.find((project) => project.id === id);
    if (!record || !confirmStudioReplacement()) return;
    let loaded: StudioProjectState;
    try {
      loaded = studioStateFromDocument(record.document);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Ce projet local est illisible.');
      return;
    }
    applyLoadedStudioProject(loaded);
    setSelectedStudioProject(id);
  };

  /** Charge une composition d'exemple versionnée avec l'application. Elle reste indépendante de la bibliothèque locale jusqu'à un Enregistrer sous. */
  const openStudioDemo = async (id: string) => {
    const demo = STUDIO_DEMOS.find((candidate) => candidate.id === id);
    if (!demo || !confirmStudioReplacement()) return;
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}demos/${demo.file}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Impossible de charger la démonstration (${response.status}).`);
      const document = await response.json() as Record<string, unknown>;
      applyLoadedStudioProject(studioStateFromDocument(document));
      setSelectedStudioProject('');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Cette démonstration est illisible.');
    }
  };

  /**
   * Importe un ou plusieurs fichiers `.json` (le format produit par
   * « Exporter en projet EP-133 ») directement dans la bibliothèque locale,
   * sans passer par la console du navigateur. Ajoute chaque projet valide à
   * la liste OUVRIR sans en charger un automatiquement — un fichier
   * illisible ou d'un autre format n'interrompt pas les suivants.
   */
  const importStudioProjectFiles = async (files: FileList) => {
    let library = studioLibrary;
    let imported = 0;
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const isMidi = /\.(?:mid|midi)$/i.test(file.name);
        const isArchive = /\.(?:pak|ppak)$/i.test(file.name);
        const documents: Record<string, unknown>[] = [];
        if (isMidi) {
          const imported = readMidiFile(new Uint8Array(await file.arrayBuffer()));
          const patternBank = emptyPatternBank();
          const patternLengths: Record<string, number> = {};
          for (const group of EDITOR_GROUPS) {
            const notes = imported.patterns[group] || [];
            patternBank[group][1] = notes;
            patternLengths[`${group}:1`] = usedBars(notes);
          }
          documents.push(createEp133ProjectDocument({
            title: file.name.replace(/\.(?:mid|midi)$/i, ''),
            bpm: imported.bpm,
            patternBank,
            scenes: [{ scene: 1, groupPatterns: { A: 1, B: 1, C: 1, D: 1 }, timeSignature: [4, 4] }],
            song: [1],
            currentScene: 1,
            pads: deviceInventory?.pads || [],
            padModes: {},
            patternLengths,
          }));
          if (imported.warnings.length) errors.push(`${file.name} : ${imported.warnings.join(' ')}`);
        } else if (isArchive) {
          const summary = inspectEp133Archive(new Uint8Array(await file.arrayBuffer()), file.name);
          if (!summary.decodedProjects.length) throw new Error('Aucun projet décodable dans cette archive.');
          summary.decodedProjects.forEach((project) => {
            const projectName = project.path.match(/P\d{2}/i)?.[0]?.toUpperCase() || 'PROJET';
            documents.push(ep133ArchiveProjectToDocument(project, `${file.name.replace(/\.(?:pak|ppak)$/i, '')} · ${projectName}`));
            if (project.warnings.length) errors.push(`${file.name} · ${projectName} : ${project.warnings.join(' ')}`);
          });
        } else {
          documents.push(JSON.parse(await file.text()) as Record<string, unknown>);
        }
        documents.forEach((document) => {
          studioStateFromDocument(document); // valide le format ; lève si incompatible
          library = storeStudioProject(localStorage, library, document).library;
          imported += 1;
        });
      } catch (error) {
        errors.push(`${file.name} : ${error instanceof Error ? error.message : 'fichier illisible'}`);
      }
    }
    updateStudioLibrary(library);
    if (errors.length) window.alert(`${imported} projet(s) importé(s).\n${errors.length} échec(s) :\n${errors.join('\n')}`);
  };

  const loadMachineProject = () => {
    if (!machineProjectDocument || !confirmStudioReplacement()) return;
    let loaded: StudioProjectState;
    try {
      loaded = studioStateFromDocument(machineProjectDocument);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Le projet scanné sur la machine est illisible.');
      return;
    }
    applyLoadedStudioProject(loaded);
    setSelectedStudioProject('');
  };

  const saveEditor = () => editorMode === 'complete' ? saveStudioProject() : saveEditorExercise();

  const songBeat = songTime * activeExercise.bpm / 60;
  const totalBeats = activeExercise.bars * 4;
  const pageStart = Math.min(Math.floor(songBeat / 8) * 8, Math.max(0, totalBeats - 8));
  const playheadProgress = Math.max(0, Math.min(1, (songBeat - pageStart) / 8));
  const visibleTargets = targets.current.filter((target) => target.beat >= pageStart && target.beat < pageStart + 8);
  const visiblePlayerNotes = playerNotes.filter((note) => note.beat >= pageStart && note.beat < pageStart + 8);
  const expectedPad = visibleTargets.find((target) => Math.abs(target.beat - songBeat) < 0.16)?.pad;
  const devicePadInfo = (pad: number) => deviceInventory?.pads.find((item) => item.group === editorGroup && item.pad === pad + 1);
  const devicePadName = (pad: number) => {
    const info = devicePadInfo(pad);
    return info ? deviceInventory?.sounds[String(info.slot)]?.name || `SON ${info.slot}` : 'VIDE';
  };
  const previewSoundPagePad = async (group: EditorGroup, pad: number, stagedSlot?: number) => {
    const info = deviceInventory?.pads.find((candidate) => candidate.group === group && candidate.pad === pad + 1);
    if (stagedSlot !== undefined) {
      if (await machineSampleBank.play(stagedSlot, 110, performance.now(), undefined, deviceInventory?.sounds[String(stagedSlot)]?.rootNote || 60)) return;
      await audio.previewPad(pad);
      return;
    }
    if (midi.outputConnected) {
      midi.sendPad(pad, EDITOR_GROUPS.indexOf(group), 110);
      return;
    }
    if (info?.slot && await machineSampleBank.play(info.slot, 110, performance.now(), undefined, info.rootNote)) return;
    await audio.previewPad(pad);
  };

  /**
   * Écoute directe d'un slot de la banque machine (numéro arbitraire 001-999, pas
   * forcément assigné à un pad) — contrairement à `previewSoundPagePad`, aucun
   * repli synthétisé n'a de sens ici (pas de catégorie de pad à retomber dessus) :
   * renvoie honnêtement si ça a vraiment joué, pour que la page affiche un message
   * plutôt qu'un clic silencieux quand le dossier de travail n'est pas chargé.
   */
  const previewBankSound = async (slot: number) => {
    await audio.unlock();
    return machineSampleBank.play(slot, 110, performance.now(), undefined, deviceInventory?.sounds[String(slot)]?.rootNote || 60);
  };

  // Vue Song Arranger — la Scène reste une ressource partagée (comme sur la machine réelle) :
  // modifier un bloc dans une Song Position modifie toutes celles qui pointent vers la même scène.
  const assignSceneGroupPattern = (sceneNumber: number, group: EditorGroup, patternNumber: number | null) => {
    setEditorScenes((current) => current.map((scene) => scene.scene === sceneNumber
      ? { ...scene, groupPatterns: { ...scene.groupPatterns, [group]: patternNumber } }
      : scene));
  };

  const reorderEditorSong = (fromIndex: number, toIndex: number) => {
    setEditorSong((current) => {
      if (fromIndex < 0 || fromIndex >= current.length || toIndex < 0 || toIndex >= current.length || fromIndex === toIndex) return current;
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  /** Crée une scène indépendante (copie de la source) pour sortir d'un partage — c'est le mécanisme prévu pour varier une Song Position sans affecter les autres. */
  const duplicateSongPosition = (index: number) => {
    const sourceSceneNumber = editorSong[index];
    if (sourceSceneNumber === undefined) return;
    const source = editorScenes.find((scene) => scene.scene === sourceSceneNumber);
    const newSceneNumber = nextFreeSceneNumber(editorScenes);
    const newScene: SceneDefinition = source ? { ...source, scene: newSceneNumber, groupPatterns: { ...source.groupPatterns } } : emptyScene(newSceneNumber);
    setEditorScenes((current) => [...current, newScene]);
    setEditorSong((current) => { const next = [...current]; next.splice(index + 1, 0, newSceneNumber); return next; });
  };

  const deleteSongPosition = (index: number) => {
    if (!window.confirm('Retirer cette Song Position de la structure du morceau ?')) return;
    setEditorSong((current) => current.filter((_, position) => position !== index));
  };

  /** Reproduit COMMIT du K.O.II : fige la scène courante puis la duplique, patterns A–D compris, pour créer la variation suivante. */
  const commitPatternsToScene = () => {
    const bank = currentPatternBank();
    const currentGroupPatterns = Object.fromEntries(EDITOR_GROUPS.map((group) => {
      const patternNumber = editorPatternNumbers[group];
      return [group, Object.prototype.hasOwnProperty.call(bank[group], patternNumber) ? patternNumber : null];
    })) as SceneDefinition['groupPatterns'];
    if (EDITOR_GROUPS.every((group) => {
      const patternNumber = currentGroupPatterns[group];
      return patternNumber === null || !(bank[group][patternNumber]?.length);
    })) {
      window.alert('Écris au moins un pattern avant de créer une scène.');
      return;
    }

    const committedSceneNumber = editorActiveScene;
    const sceneExists = editorScenes.some((scene) => scene.scene === committedSceneNumber);
    const scenesWithCommit = sceneExists
      ? editorScenes.map((scene) => scene.scene === committedSceneNumber ? { ...scene, groupPatterns: currentGroupPatterns } : scene)
      : [...editorScenes, { scene: committedSceneNumber, groupPatterns: currentGroupPatterns, timeSignature: [4, 4] as [number, number] }];
    if (scenesWithCommit.length >= MAX_SCENE_NUMBER) {
      window.alert('La limite de 99 scènes est atteinte.');
      return;
    }

    const nextSceneNumber = nextFreeSceneNumber(scenesWithCommit);
    let nextBank = bank;
    const nextPatternLengths = { ...editorPatternLengths };
    const nextPatternNumbers = { ...editorPatternNumbers };
    const duplicatedGroupPatterns = { A: null, B: null, C: null, D: null } as SceneDefinition['groupPatterns'];
    for (const group of EDITOR_GROUPS) {
      const sourceNumber = currentGroupPatterns[group];
      if (sourceNumber === null) continue;
      const occupied = new Set(Object.keys(nextBank[group]).map(Number));
      const targetNumber = [...Array(MAX_PATTERN_NUMBER)]
        .map((_, index) => (sourceNumber + index) % MAX_PATTERN_NUMBER + 1)
        .find((number) => !occupied.has(number));
      if (targetNumber === undefined) {
        window.alert(`Le groupe ${group} contient déjà 99 patterns.`);
        return;
      }
      const copiedNotes = (nextBank[group][sourceNumber] || []).map((note, index) => ({ ...note, id: `${note.id}-commit-${nextSceneNumber}-${group}-${index}` }));
      nextBank = { ...nextBank, [group]: { ...nextBank[group], [targetNumber]: copiedNotes } };
      nextPatternLengths[`${group}:${targetNumber}`] = editorPatternLengths[`${group}:${sourceNumber}`] || usedBars(copiedNotes);
      nextPatternNumbers[group] = targetNumber;
      duplicatedGroupPatterns[group] = targetNumber;
    }
    const duplicatedScene: SceneDefinition = { scene: nextSceneNumber, groupPatterns: duplicatedGroupPatterns, timeSignature: [4, 4] };
    setEditorPatternBank(nextBank);
    setEditorPatternLengths(nextPatternLengths);
    setEditorScenes([...scenesWithCommit, duplicatedScene]);
    setEditorSong((current) => current[current.length - 1] === committedSceneNumber ? current : [...current, committedSceneNumber]);
    setEditorActiveScene(nextSceneNumber);
    setEditorPatternNumbers(nextPatternNumbers);
    const nextTargets = nextBank[editorGroup][nextPatternNumbers[editorGroup]] || [];
    editorHistorySkipTarget.current = nextTargets;
    setEditorTargets(nextTargets);
    setEditorBars(nextPatternLengths[`${editorGroup}:${nextPatternNumbers[editorGroup]}`] || usedBars(nextTargets));
    editorScrollToEnd.current = true;
  };

  const auditionSongPosition = (index: number) => {
    const sceneNumber = editorSong[index];
    if (sceneNumber === undefined) return;
    void toggleEditorPlayback(sceneNumber);
  };

  useEffect(() => {
    if (!transportActive || !scoreScroll.current) return;
    const viewport = scoreScroll.current;
    const progress = Math.max(0, Math.min(1, (songBeat - pageStart) / 8));
    viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) * progress);
  }, [pageStart, songBeat, transportActive]);

  useEffect(() => {
    if (!editorOpen || !editorGrid.current) return;
    // Aller à droite uniquement après une écriture réelle dans la mesure de réserve.
    // Chargement, changement de scène/groupe/pattern et retour depuis ARRANGEMENT
    // repartent toujours au début afin que les frappes ne « clignotent » pas avant
    // de sortir du champ visible.
    editorGrid.current.scrollLeft = editorScrollToEnd.current ? editorGrid.current.scrollWidth : 0;
    editorScrollToEnd.current = false;
  }, [editorGroup, editorOpen, editorPatternNumbers, studioView]);

  if (workspaceView === 'home') return <HomePage connected={midiReady} project={deviceInventory?.project} scannedSoundCount={deviceInventory ? Object.keys(deviceInventory.sounds).length : 0} language={language} onLanguageChange={changeLanguage} onOpenGame={() => setWorkspaceView('game')} onOpenStudio={openCompleteEditor} onOpenSounds={() => setWorkspaceView('sounds')} onOpenDocumentation={() => setWorkspaceView('docs')} onOpenMachineTest={() => setWorkspaceView('machine-test')} onOpenProfile={() => setWorkspaceView('profile')} />;

  if (workspaceView === 'machine-test') return <MachineTestPage connected={midiReady} sysexEnabled={midi.sysexEnabled} inputNames={midi.inputNames} observations={midiObservations} machineGroup={machineGroup} onBack={goHome} onConnect={() => void midi.connectMonitor()} onSendLearned={midi.sendLearnedMessage} onSelectMachineGroup={async (groupIndex) => { const fid = await midi.selectMachineGroup(groupIndex); setMachineGroup(EDITOR_GROUPS[groupIndex]); return fid; }} />;

  if (workspaceView === 'sounds') return <SoundsPage inventory={deviceInventory} soundIndex={deviceSoundIndex} midiConnected={midiReady} machineGroup={machineGroup} onMachineGroupChange={(group) => void selectMachineGroupFromComputer(group)} liveMidi={lastMidi?.note !== undefined && lastMidi.velocity !== undefined ? { note: lastMidi.note, velocity: lastMidi.velocity, timestamp: lastMidi.timestamp } : null} padModes={editorPadModes} onBack={goHome} onConnectMidi={() => void connectMidi()} onPadModeChange={(group, pad, mode) => setEditorPadModes((current) => ({ ...current, [`${group}:${pad}`]: mode }))} onPadPreview={(group, pad, stagedSlot) => void previewSoundPagePad(group, pad, stagedSlot)} onPreviewSound={(slot) => previewBankSound(slot)} localLibraryHandle={localLibraryHandle} localLibraryFolderName={localLibraryFolderName} localLibraryNeedsReconnect={localLibraryNeedsReconnect} onReconnectLocalLibrary={() => void reconnectLocalLibraryFolder()} />;

  if (workspaceView === 'docs') return <DocumentationPage onBack={goHome} />;

  if (workspaceView === 'profile') {
    const updateProfile = (updater: (profile: PlayerProfile) => PlayerProfile) => setPlayerProfile((profile) => { const next = updater(profile); savePlayerProfile(localStorage, next); void mirrorProfileToFolder(next); return next; });
    return <>
      <PlayerProfilePage
        profile={playerProfile}
        machineConnected={midiReady}
        midiStatus={midi.status}
        midiInputNames={midi.inputNames}
        midiOutputNames={midi.outputNames}
        machineSampleCount={machineSampleCount}
        deviceInventory={deviceInventory}
        deviceSoundIndex={deviceSoundIndex}
        onBack={goHome}
        onChange={(patch) => updateProfile((profile) => ({ ...profile, ...patch }))}
        onChangeMachine={(id, patch) => updateProfile((profile) => ({ ...profile, machines: profile.machines.map((machine) => machine.id === id ? { ...machine, ...patch } : machine) }))}
        onAddMachine={() => updateProfile((profile) => ({ ...profile, machines: [...profile.machines, emptyMachine()] }))}
        onRemoveMachine={(id) => updateProfile((profile) => ({ ...profile, machines: profile.machines.filter((machine) => machine.id !== id) }))}
        onConnectMidi={() => void connectMidi()}
        onCloneMachine={() => setMachineCloneOpen(true)}
        onScanMachine={(id) => { const machine = playerProfile.machines.find((candidate) => candidate.id === id); if (machine) void scanAndSaveMachine(machine); }}
        onViewScanReport={() => setWorkspaceView('sounds')}
        lastScanSave={lastScanSave}
        scanSaveError={scanSaveError}
        scanSaveMachineId={scanSaveMachineId}
        sampleFolderName={sampleFolderName}
        sampleFolderNeedsReconnect={sampleFolderNeedsReconnect}
        onOpenSampleFolder={() => void openStudioSampleFolder()}
        onReconnectSampleFolder={() => void reconnectSampleFolder()}
        localLibraryFolderName={localLibraryFolderName}
        localLibraryNeedsReconnect={localLibraryNeedsReconnect}
        onOpenLocalLibraryFolder={() => void openLocalLibraryFolder()}
        onReconnectLocalLibraryFolder={() => void reconnectLocalLibraryFolder()}
        onResetStats={() => updateProfile((profile) => ({ ...profile, stats: emptyPlayerStats() }))}
        profileFileSave={profileFileSave}
        profileFileError={profileFileError}
        onSaveProfileToFolder={() => void saveProfileToFolder()}
        onRestoreProfileFromFolder={() => void restoreProfileFromFolder()}
        practicePlans={practicePlans}
        styles={STYLES}
        onStartPracticeDay={startPracticeDay}
      />
      {machineCloneOpen && <MachineCloneDialog inventory={deviceInventory} soundIndex={deviceSoundIndex} onClose={() => setMachineCloneOpen(false)} />}
    </>;
  }

  return <main className={last ? `impact impact-${last.grade.toLowerCase()}` : ''}>
    <GameToolbar difficulty={difficulty} tempo={tempo} activeBpm={activeExercise.bpm} styleId={styleId} styles={STYLES} userExercises={userExercises} phase={phase} sessionActive={sessionActive} midiConnected={midiReady} onDifficultyChange={setDifficulty} onTempoChange={setTempo} onStyleChange={changeStyle} onHome={goHome} onOpenEditor={openEditor} onConnectMidi={() => void connectMidi()} onPreview={() => void togglePreview()} onPlay={() => void toggle()} />
    {phase === 'countin' && <div className="countdown" aria-live="assertive"><small>1 MESURE POUR SE PRÉPARER</small><b>{countdown}</b></div>}
    {editorOpen && <div className="editor-overlay"><section className="exercise-editor">
      <EditorToolbar mode={editorMode} name={editorName} group={editorGroup} playing={editorPlaying} loop={editorLoop} exportFormat={editorExportFormat} canSave={Boolean(editorName.trim() && (editorMode === 'complete' || editorTargets.length || EDITOR_GROUPS.some((group) => Object.values(editorPatternBank[group]).some((notes) => notes.length))))} midiConnected={midiReady} scannedProject={deviceInventory?.project} machineProjectAvailable={Boolean(machineProjectDocument)} machineSampleCount={machineSampleCount} demoProjects={STUDIO_DEMOS} localProjects={studioLibrary.map(summarizeStudioProject)} selectedLocalProject={selectedStudioProject} studioView={studioView} patternNumber={editorPatternNumbers[editorGroup]} patternLength={editorBars} groupPatternLengths={Object.fromEntries(EDITOR_GROUPS.map((group) => { const number = editorPatternNumbers[group]; const notes = group === editorGroup ? editorTargets : editorPatternBank[group][number] || []; return [group, editorPatternLengths[`${group}:${number}`] || usedBars(notes)]; })) as Record<EditorGroup, number>} activeSongPosition={Math.max(1, editorSong.findIndex((scene) => scene === editorActiveScene) + 1)} activeScene={editorActiveScene} onHome={goHome} onNameChange={setEditorName} onGroupChange={changeEditorGroupAndMachine} onStudioViewChange={setStudioView} onPatternLengthChange={changePatternLength} onCommitScene={commitPatternsToScene} canUndo={editorCanUndo} canRedo={editorCanRedo} onUndo={editorUndo} onRedo={editorRedo} onConnectMidi={() => void connectMidi()} onNew={newStudioProject} onOpenProject={openStudioProject} onOpenDemo={(id) => void openStudioDemo(id)} onImportFiles={(files) => void importStudioProjectFiles(files)} onLoadMachineProject={loadMachineProject} onCloneMachine={() => setMachineCloneOpen(true)} onOpenSampleFolder={() => void openStudioSampleFolder()} onSave={saveEditor} onSaveAs={saveStudioProjectAs} onRename={renameSelectedStudioProject} onDuplicate={duplicateSelectedStudioProject} onArchive={archiveSelectedStudioProject} onDelete={deleteSelectedStudioProject} onPlayback={() => void toggleEditorPlayback()} onLoopChange={setEditorLoop} onExportFormatChange={setEditorExportFormat} onExport={exportEditor} onExportMidi={exportEditorMidi} onExportJson={exportEditorProjectJson} onSendToRhythmHero={sendPatternToRhythmHero} />
      {missingDependencies.length > 0 && <p className="studio-missing-dependencies">
        ⚠ {missingDependencies.length} PAD{missingDependencies.length > 1 ? 'S' : ''} SANS SON DANS LA BANQUE ACTUELLE ·{' '}
        {missingDependencies.map((dep) => `${dep.group}${dep.pad} (slot ${dep.slot})`).join(', ')}
        <button onClick={() => setMissingDependencies([])} aria-label="Masquer l'avertissement">✕</button>
      </p>}
      {editorMode === 'complete' && studioView === 'arrangement' && <SongArranger scenes={editorScenes} song={editorSong} patternBank={currentPatternBank()} onAssignCell={assignSceneGroupPattern} onReorderSong={reorderEditorSong} onDuplicateSongPosition={duplicateSongPosition} onDeleteSongPosition={deleteSongPosition} onAuditionSongPosition={auditionSongPosition} onEditPattern={editArrangedPattern} />}
      {(editorMode !== 'complete' || studioView === 'pattern') && <>
        {editorMode === 'complete' && <PadStrip group={editorGroup} selectedPad={editorSelectedPad} livePad={editorMidiHit?.pad} liveGroup={editorMidiHit?.group} padModes={editorPadModes} padName={devicePadName} padSlot={(pad) => devicePadInfo(pad)?.slot} onSelect={(pad) => { setEditorSelectedPad(pad); setKeyEditorOpen((editorPadModes[`${editorGroup}:${pad}`] || 'ONE') === 'KEYS'); }} onPreview={(pad) => void previewEditorPad(editorGroup, pad)} onModeChange={(pad, mode) => { setEditorPadModes((current) => ({ ...current, [`${editorGroup}:${pad}`]: mode })); setKeyEditorOpen(mode === 'KEYS'); }} onOpenKeys={() => setKeyEditorOpen(true)} />}
        {keyEditorOpen && editorMode === 'complete'
          ? <PianoRoll gridRef={editorGrid} group={editorGroup} selectedPad={editorSelectedPad} bars={editorBars} playing={editorPlaying} playbackBeat={editorPlaybackBeat} targets={editorTargets} onClose={() => setKeyEditorOpen(false)} onPreviewNote={(note) => void previewEditorPad(editorGroup, editorSelectedPad, note)} onToggleNote={toggleKeyStep} onAdjustVelocity={adjustKeyVelocity} />
          : <RhythmGrid gridRef={editorGrid} bars={editorBars} playing={editorPlaying} playbackBeat={editorPlaybackBeat} mode={editorMode} group={editorGroup} selectedPad={editorSelectedPad} targets={editorTargets} committedSections={editorCommittedSections} padModes={editorPadModes} padName={devicePadName} scannedPlayMode={(pad) => devicePadInfo(pad)?.playMode} onSelectPad={setEditorSelectedPad} onOpenKeys={() => setKeyEditorOpen(true)} onToggleStep={toggleEditorStep} patternLength={editorBars} onPatternLengthChange={changePatternLength} onCopyBlock={copyPatternBlock} onDeleteBlock={deletePatternBlock} onToggleCommittedStep={toggleCommittedEditorStep} onAdjustVelocity={adjustEditorVelocity} onAdjustCommittedVelocity={adjustCommittedEditorVelocity} onAdjustDuration={adjustEditorDuration} onToggleSelectStep={toggleSelectEditorStep} selectedSteps={editorSelectedSteps} />}
      </>}
      <footer><span>{editorMode === 'complete' ? `${midi.outputConnected ? `SON EP‑133 · ${midi.outputNames.join(' + ')}` : 'EP‑133 NON CONNECTÉ'} · PATTERN ${editorGroup}${String(editorPatternNumbers[editorGroup]).padStart(2, '0')} · LN.${effectiveEditorBars} · ` : ''}GROUPE {editorGroup} · {editorTargets.length} FRAPPE(S) · {tempo} BPM{editorMode === 'game' ? ' · AJOUT AUTOMATIQUE ACTIF' : ''}</span></footer>
      {machineCloneOpen && <MachineCloneDialog inventory={deviceInventory} soundIndex={deviceSoundIndex} onClose={() => setMachineCloneOpen(false)} />}
    </section></div>}

    {/* Partition en haut sur toute la largeur ; en dessous, pads à gauche
        et analyse à droite. */}
    <div className="game-layout">
      <ScoreView viewportRef={scoreScroll} pageStart={pageStart} songBeat={songBeat} transportActive={transportActive} playheadProgress={playheadProgress} expectedTargets={visibleTargets} playedNotes={visiblePlayerNotes} />
      <PerformancePanel transportActive={transportActive} expectedPad={expectedPad} flashedPad={flashedPad} score={score} playerNotes={playerNotes} onPlayPad={clickPad} onEditPad={editPad} />
    </div>

    {soundPad !== null && <PadSoundEditor pad={soundPad} settings={soundSettings[soundPad]} onChange={(patch) => updateSound(soundPad, patch)} onPreview={() => void audio.previewPad(soundPad)} onClose={() => setSoundPad(null)} />}
  </main>;
}
