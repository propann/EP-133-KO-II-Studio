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
import {
  createEp133ProjectDocument,
  createMidiFile,
  EDITOR_GROUPS,
  type EditorGroup,
  type EditorPadMode,
} from './core/project/exporters';
import type { DeviceInventory, DeviceSoundIndex } from './core/project/device';
import {
  DEFAULT_NOTE_DURATION,
  DEFAULT_NOTE_VELOCITY,
  exerciseTargetsToNotes,
  notesToExerciseTargets,
  type ProjectPatterns,
  type SequencerNote,
} from './core/project/model';
import { barsAfterStepEdit, measureFromGlobalStep, usedBars } from './core/project/editor';
import {
  emptyPatternBank,
  emptyScene,
  nextFreeSceneNumber,
  patternNumbersForGroup,
  patternsForScene,
  MAX_PATTERN_NUMBER,
  type PatternBank,
  type SceneDefinition,
} from './core/project/song';
import { deleteStudioProject, duplicateStudioProject, loadStudioLibrary, renameStudioProject, storeStudioProject, studioStateFromDocument, type StudioProjectRecord, type StudioProjectState } from './core/project/studioLibrary';
import { HomePage } from './pages/HomePage';
import { SoundsPage } from './pages/SoundsPage';
import { DocumentationPage } from './pages/DocumentationPage';
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
import { chooseLocalDirectory, collectLocalFiles } from './core/storage/localFolders';
import './style.css';
import catalogue from '../exercises/catalogue-exercices-v1.json';

const styleLabel = (key: string) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').toUpperCase();
const STYLES = catalogue.exercises.map((item) => ({ id: item.key, label: `${String(item.id).padStart(2, '0')} · ${styleLabel(item.key)}`, bpm: item.bpm }));

function createBoomBapTargets(difficulty: number): Exercise['targets'] {
  const targets: Exercise['targets'] = [];
  const addSteps = (bar: number, pad: number, steps: number[]) => steps.forEach((step) => targets.push({ id: `boom-${difficulty}-${bar}-${pad}-${step}`, beat: bar * 4 + step / 4, pad }));
  const levels = [
    { kick: [0, 8], snare: [4, 12], hat: [0, 4, 8, 12], perc: [] },
    { kick: [0, 6, 8, 14], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], perc: [] },
    { kick: [0, 3, 7, 8, 11, 14], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], perc: [2, 10] },
    { kick: [0, 3, 6, 8, 11, 14], snare: [4, 7, 12, 15], hat: [0, 1, 2, 4, 6, 8, 9, 10, 12, 14], perc: [2, 5, 10, 13] },
    { kick: [0, 3, 6, 8, 11, 14, 15], snare: [4, 7, 12, 15], hat: [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 14, 15], perc: [2, 5, 10, 13] },
  ][difficulty - 1];
  for (let bar = 0; bar < 6; bar += 1) {
    addSteps(bar, 0, levels.kick);
    addSteps(bar, 2, levels.snare);
    addSteps(bar, 4, levels.hat);
    addSteps(bar, 6, levels.perc);
    if (bar === 4 && difficulty >= 2) addSteps(bar, 0, [13]);
    if (bar === 5) {
      if (difficulty >= 3) addSteps(bar, 7, [13, 14]);
      if (difficulty >= 4) addSteps(bar, 8, [12, 13, 14, 15]);
      if (difficulty === 5) addSteps(bar, 2, [10, 11, 13, 14]);
    }
  }
  return [...new Map(targets.map((target) => [`${target.beat}-${target.pad}`, target])).values()];
}

function createSixBarExercise(styleId: string, difficulty: number, tempo: number): Exercise {
  const style = STYLES.find((item) => item.id === styleId) || STYLES[0];
  if (style.id === 'boom') {
    return { id: `boom-${difficulty}`, title: `BOOM-BAP · NIVEAU ${difficulty}`, description: `Partition Boom-Bap ${difficulty}/5 · 6 mesures`, bpm: tempo, bars: 6, timeSignature: '4/4', countInBars: 1, backingTrack: null, grading: { perfectMs: 35, goodMs: 90 }, targets: createBoomBapTargets(difficulty) };
  }
  const targets: Exercise['targets'] = [];
  const add = (bar: number, beat: number, pad: number) => targets.push({ id: `${bar}-${beat}-${pad}`, beat: bar * 4 + beat, pad });
  for (let bar = 0; bar < 6; bar += 1) {
    const kick = style.id === 'house' ? [0, 1, 2, 3] : style.id === 'funk' ? [0, .75, 2, 2.75] : style.id === 'afro' ? [0, 1.75, 3] : style.id === 'garage' || style.id === 'dnb' ? [0, 2.5] : style.id === 'electro' ? [0, 1.5, 2.5] : [0, 2];
    kick.forEach((beat) => add(bar, beat, 0));
    (style.id === 'garage' || style.id === 'dnb' ? [2] : [1, 3]).forEach((beat) => add(bar, beat, 2));
    if (style.id === 'house' && difficulty >= 2) [1, 3].forEach((beat) => add(bar, beat, 1));
    const hatStep = difficulty >= 4 ? 0.25 : difficulty >= 2 ? 0.5 : 1;
    const hatOffset = style.id === 'house' || style.id === 'funk' ? .5 : 0;
    for (let beat = hatOffset; beat < 4; beat += hatStep) add(bar, beat, 4);
    if (style.id === 'rock' && difficulty >= 2) [0, 2].forEach((beat) => add(bar, beat, 5));
    if (style.id === 'afro' || style.id === 'funk' || difficulty >= 3) [0.75, 2.75].forEach((beat) => add(bar, beat, 6));
    if (style.id === 'afro' && difficulty >= 2) [1.5, 3.5].forEach((beat) => add(bar, beat, 7));
    if (difficulty >= 4 && bar >= 3) [1.5, 3.25].forEach((beat) => add(bar, beat, 7));
    if (difficulty === 5 && bar >= 4) [3, 3.25, 3.5, 3.75].forEach((beat) => add(bar, beat, 8));
    if (difficulty >= 3 && bar % 2 === 1) add(bar, 3.5, 0);
  }
  const uniqueTargets = [...new Map(targets.map((target) => [`${target.beat}-${target.pad}`, target])).values()];
  return { id: `${style.id}-${difficulty}`, title: style.label, description: `Niveau ${difficulty} · 6 mesures progressives`, bpm: tempo, bars: 6, timeSignature: '4/4', countInBars: 1, backingTrack: null, grading: { perfectMs: 35, goodMs: 90 }, targets: uniqueTargets };
}

const audio = new AudioEngine();
const machineSampleBank = new MachineSampleBank();

interface PlayerNote {
  id: number;
  beat: number;
  pad: number;
  grade: Grade;
}

const USER_EXERCISES_KEY = 'ep133-rhythm-hero:user-exercises:v1';

function loadUserExercises(): Exercise[] {
  try { return JSON.parse(localStorage.getItem(USER_EXERCISES_KEY) || '[]') as Exercise[]; }
  catch { return []; }
}

export default function App() {
  const [workspaceView, setWorkspaceView] = useState<'home' | 'game' | 'sounds' | 'docs'>('home');
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
  const [last, setLast] = useState<{ grade: Grade; deltaMs: number } | null>(null);
  const [lastMidi, setLastMidi] = useState<MidiObservation | null>(null);
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
  const [editorPatternNumbers, setEditorPatternNumbers] = useState<Record<EditorGroup, number>>({ A: 1, B: 1, C: 1, D: 1 });
  const [editorScenes, setEditorScenes] = useState<SceneDefinition[]>([]);
  const [editorSong, setEditorSong] = useState<number[]>([]);
  const [editorActiveScene, setEditorActiveScene] = useState(1);
  const [studioView, setStudioView] = useState<'pattern' | 'arrangement'>('pattern');
  const [editorPlaybackBeat, setEditorPlaybackBeat] = useState(0);
  const [editorSelectedPad, setEditorSelectedPad] = useState(0);
  const [editorPadModes, setEditorPadModes] = useState<Record<string, EditorPadMode>>({});
  const [keyEditorOpen, setKeyEditorOpen] = useState(false);
  const [deviceInventory, setDeviceInventory] = useState<DeviceInventory | null>(null);
  const [deviceSoundIndex, setDeviceSoundIndex] = useState<DeviceSoundIndex | null>(null);
  const [editorLoop, setEditorLoop] = useState(false);
  const [editorExportFormat, setEditorExportFormat] = useState<'midi' | 'json'>('midi');
  const [studioLibrary, setStudioLibrary] = useState<StudioProjectRecord[]>(() => loadStudioLibrary(localStorage));
  const [selectedStudioProject, setSelectedStudioProject] = useState('');
  const [machineProjectDocument, setMachineProjectDocument] = useState<Record<string, unknown> | null>(null);
  const [machineCloneOpen, setMachineCloneOpen] = useState(false);
  const [machineSampleCount, setMachineSampleCount] = useState(0);
  const targets = useRef(activeExercise.targets.map((target, index) => ({ ...target, id: `target-${index}` })));
  const frame = useRef<number | undefined>(undefined);
  const flashTimer = useRef<number | undefined>(undefined);
  const countTimer = useRef<number | undefined>(undefined);
  const startTimer = useRef<number | undefined>(undefined);
  const gameEndTimer = useRef<number | undefined>(undefined);
  const scoreScroll = useRef<HTMLDivElement | null>(null);
  const editorGrid = useRef<HTMLDivElement | null>(null);
  const editorPlaybackFrame = useRef<number | undefined>(undefined);
  const editorLoopTimer = useRef<number | undefined>(undefined);
  const editorEndTimer = useRef<number | undefined>(undefined);
  const gameRun = useRef(0);
  const editorRun = useRef(0);
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

  const onHit = useCallback((hit: MidiHit) => {
    // En mode EP-133, la machine produit déjà le son : ne pas le doubler côté PC.
    if (editorOpen && editorMode === 'complete') return;
    audio.playPad(hit.pad, hit.velocity);
    setFlashedPad({ pad: hit.pad, grade: 'GOOD' });
    if (flashTimer.current !== undefined) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlashedPad(null), 180);
    if (!running) return;
    setScore((currentScore) => {
      const beat = (audio.time * 1000) / (60000 / activeExercise.bpm);
      const result = scoreHit(
        activeExercise,
        hit,
        beat,
        targets.current,
        currentScore,
      );
      setLast({ grade: result.grade, deltaMs: result.deltaMs });
      setPlayerNotes((notes) => [...notes, { id: performance.now(), beat, pad: hit.pad, grade: result.grade }]);
      setFlashedPad({ pad: hit.pad, grade: result.grade });
      return result.score;
    });
  }, [activeExercise, editorMode, editorOpen, running]);

  const onMidiObservation = useCallback((message: MidiObservation) => {
    setLastMidi(message);
  }, []);

  const midi = useWebMidi(onHit, onMidiObservation);

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
  }, [clearGameTimers]);

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

  const openStudioSampleFolder = async () => {
    try {
      const directory = await chooseLocalDirectory();
      setMachineSampleCount(await machineSampleBank.load(await collectLocalFiles(directory)));
    } catch (error) {
      if ((error as { name?: string }).name !== 'AbortError') window.alert(error instanceof Error ? error.message : 'Impossible d’ouvrir le dossier local.');
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

  const openEditor = () => {
    const selected = userExercises.find((item) => `user:${item.id}` === styleId);
    setEditorName(selected?.title || 'MON GROOVE');
    const selectedNotes = selected ? exerciseTargetsToNotes(selected.targets, 'A') : [];
    setEditorTargets(selectedNotes);
    const bank = emptyPatternBank();
    bank.A[1] = selectedNotes;
    setEditorPatternBank(bank);
    setEditorPatternNumbers({ A: 1, B: 1, C: 1, D: 1 });
    setEditorScenes([{ scene: 1, groupPatterns: { A: 1, B: null, C: null, D: null }, timeSignature: [4, 4] }]);
    setEditorSong([1]);
    setEditorActiveScene(1);
    setEditorGroup('A');
    setEditorMode('game');
    setEditorBars(Math.max(2, (selected?.bars || 0) + 1));
    setEditorOpen(true);
    setStudioView('pattern');
  };

  const openCompleteEditor = () => {
    setWorkspaceView('game');
    openEditor();
    setEditorMode('complete');
  };

  /** Flush les frappes en cours vers la banque, en repartant du groupe/numéro de pattern actifs — pas seulement du groupe comme avant l'introduction des patterns multiples. */
  const currentPatternBank = (): PatternBank => ({
    ...editorPatternBank,
    [editorGroup]: { ...editorPatternBank[editorGroup], [editorPatternNumbers[editorGroup]]: editorTargets },
  });

  const patternsForActiveScene = (): ProjectPatterns => patternsForScene(currentPatternBank(), editorScenes, editorActiveScene);

  const changeEditorGroup = (nextGroup: EditorGroup) => {
    setEditorPatternBank((current) => ({ ...current, [editorGroup]: { ...current[editorGroup], [editorPatternNumbers[editorGroup]]: editorTargets } }));
    const nextNotes = editorPatternBank[nextGroup][editorPatternNumbers[nextGroup]] || [];
    setEditorTargets(nextNotes);
    setEditorGroup(nextGroup);
    setEditorBars(Math.max(1, usedBars(nextNotes) + 1));
  };

  /** Bascule vers un autre numéro de pattern (01–99) du groupe actif ; le crée vide s'il n'existe pas encore — choix d'UX du Studio, pas un fait matériel confirmé. */
  const changeEditorPattern = (nextNumber: number) => {
    const clamped = Math.max(1, Math.min(MAX_PATTERN_NUMBER, nextNumber));
    setEditorPatternBank((current) => ({ ...current, [editorGroup]: { ...current[editorGroup], [editorPatternNumbers[editorGroup]]: editorTargets } }));
    const nextNotes = editorPatternBank[editorGroup][clamped] || [];
    setEditorTargets(nextNotes);
    setEditorPatternNumbers((current) => ({ ...current, [editorGroup]: clamped }));
    setEditorBars(Math.max(1, usedBars(nextNotes) + 1));
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
    const projectDocument = createEp133ProjectDocument({ title: editorName, bpm: tempo, patternBank, scenes: editorScenes, song: editorSong, currentScene: editorActiveScene, pads: deviceInventory?.pads || [], padModes: editorPadModes });
    const blob = new Blob([JSON.stringify(projectDocument, null, 2)], { type: 'application/json' });
    const link = window.document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = `${(editorName.trim() || 'ep133-project').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ep133.json`;
    link.click(); URL.revokeObjectURL(link.href);
  };

  const exportEditor = () => editorExportFormat === 'midi' ? exportEditorMidi() : exportEditorProjectJson();

  const toggleEditorStep = (measure: number, pad: number, step: number) => {
    const beat = measure * 4 + step / 4;
    const exists = editorTargets.some((target) => target.pad === pad && target.beat === beat);
    setEditorTargets((current) => exists
      ? current.filter((target) => !(target.pad === pad && target.beat === beat))
      : [...current, { id: `editor-${measure}-${pad}-${step}`, group: editorGroup, beat, pad, velocity: DEFAULT_NOTE_VELOCITY, duration: DEFAULT_NOTE_DURATION }]);
    if (!exists && editorMode === 'complete') {
      if (midi.outputConnected) midi.sendPad(pad, EDITOR_GROUPS.indexOf(editorGroup), 110);
      else {
        const machinePad = deviceInventory?.pads.find((candidate) => candidate.group === editorGroup && candidate.pad === pad + 1);
        if (machinePad?.slot) void machineSampleBank.play(machinePad.slot, 110, performance.now(), undefined, machinePad.rootNote);
      }
    }
    setEditorBars((bars) => barsAfterStepEdit(bars, measure, exists));
  };

  const toggleKeyStep = (note: number, globalStep: number) => {
    const beat = globalStep / 4;
    const exists = editorTargets.some((target) => target.pad === editorSelectedPad && target.beat === beat && target.note === note);
    setEditorTargets((current) => exists
      ? current.filter((target) => !(target.pad === editorSelectedPad && target.beat === beat && target.note === note))
      : [...current, { id: `key-${editorGroup}-${editorSelectedPad}-${note}-${globalStep}`, group: editorGroup, beat, pad: editorSelectedPad, note, velocity: DEFAULT_NOTE_VELOCITY, duration: DEFAULT_NOTE_DURATION }]);
    if (!exists) {
      if (midi.outputConnected) midi.sendNote(note, 110);
      else {
        const machinePad = deviceInventory?.pads.find((candidate) => candidate.group === editorGroup && candidate.pad === editorSelectedPad + 1);
        if (machinePad?.slot) void machineSampleBank.play(machinePad.slot, 110, performance.now(), note, machinePad.rootNote);
      }
    }
    setEditorBars((bars) => barsAfterStepEdit(bars, measureFromGlobalStep(globalStep), exists));
  };

  const effectiveEditorBars = usedBars(editorTargets);

  const editorExercise = (): Exercise => ({ id: 'editor-preview', title: editorName.trim() || 'MON GROOVE', description: 'Exercice utilisateur', bpm: tempo, bars: effectiveEditorBars, timeSignature: '4/4', countInBars: 0, backingTrack: null, grading: { perfectMs: 35, goodMs: 90 }, targets: notesToExerciseTargets(editorTargets) });

  /** `sceneOverride` audite une scène précise (depuis l'Arrangeur) sans attendre le prochain rendu de `editorActiveScene`. */
  const toggleEditorPlayback = async (sceneOverride?: number) => {
    if (editorPlaying) {
      stopEditorTransport();
      return;
    }
    const activeScene = sceneOverride ?? editorActiveScene;
    if (sceneOverride !== undefined) setEditorActiveScene(sceneOverride);
    setEditorPlaying(true);
    const run = ++editorRun.current;
    setEditorPlaybackBeat(0);
    if (editorGrid.current) editorGrid.current.scrollLeft = 0;
    const patterns = patternsForScene(currentPatternBank(), editorScenes, activeScene);
    const allTargets = EDITOR_GROUPS.flatMap((group) => patterns[group]);
    const playbackBars = allTargets.length ? usedBars(allTargets) : effectiveEditorBars;
    const playbackStart = performance.now() + (editorMode === 'complete' ? 80 : 0);
    const followPlayback = () => {
      const rawBeat = Math.max(0, (performance.now() - playbackStart) / (60000 / tempo));
      const beat = editorLoop ? rawBeat % (playbackBars * 4) : rawBeat;
      setEditorPlaybackBeat(Math.min(playbackBars * 4, beat));
      if (editorGrid.current) {
        const playheadX = 160 + beat / 4 * 960;
        editorGrid.current.scrollLeft = Math.max(0, playheadX - editorGrid.current.clientWidth * 0.42);
      }
      if (editorLoop || rawBeat < playbackBars * 4) editorPlaybackFrame.current = requestAnimationFrame(followPlayback);
    };
    editorPlaybackFrame.current = requestAnimationFrame(followPlayback);
    if (editorMode === 'complete') {
      const startAt = playbackStart;
      const cycleMs = 60000 / tempo * playbackBars * 4;
      const scheduleCycle = (cycleStart: number) => {
        if (midi.outputConnected) midi.sendClockWindow(tempo, cycleStart, cycleMs);
        EDITOR_GROUPS.forEach((group, groupIndex) => patterns[group].forEach((target) => {
          const at = cycleStart + target.beat * 60000 / tempo;
          const duration = target.duration * 60000 / tempo;
          if (midi.outputConnected) {
            if (target.note !== undefined) midi.sendNote(target.note, target.velocity, at, duration);
            else midi.sendPad(target.pad, groupIndex, target.velocity, at, duration);
          } else {
            const pad = deviceInventory?.pads.find((candidate) => candidate.group === group && candidate.pad === target.pad + 1);
            if (pad?.slot) void machineSampleBank.play(pad.slot, target.velocity, at, target.note, pad.rootNote);
          }
        }));
      };
      if (midi.outputConnected) midi.startOutputTransport(startAt);
      scheduleCycle(startAt);
      if (editorLoop) editorLoopTimer.current = window.setInterval(() => scheduleCycle(performance.now() + 80), cycleMs);
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
    setEditorTargets([]);
    setEditorPatternBank(emptyPatternBank());
    setEditorPatternNumbers({ A: 1, B: 1, C: 1, D: 1 });
    setEditorScenes([]);
    setEditorSong([]);
    setEditorActiveScene(1);
    setEditorPadModes({});
    setEditorBars(1);
    setKeyEditorOpen(false);
    setStudioView('pattern');
    setSelectedStudioProject('');
  };

  const saveStudioProject = () => {
    const patternBank = currentPatternBank();
    setEditorPatternBank(patternBank);
    const document = createEp133ProjectDocument({ title: editorName, bpm: tempo, patternBank, scenes: editorScenes, song: editorSong, currentScene: editorActiveScene, pads: deviceInventory?.pads || [], padModes: editorPadModes });
    const stored = storeStudioProject(localStorage, studioLibrary, document, selectedStudioProject);
    setStudioLibrary(stored.library);
    setSelectedStudioProject(stored.id);
  };

  const saveStudioProjectAs = () => {
    const title = window.prompt('Nom de la nouvelle copie :', editorName);
    if (!title?.trim()) return;
    const patternBank = currentPatternBank();
    const document = createEp133ProjectDocument({ title, bpm: tempo, patternBank, scenes: editorScenes, song: editorSong, currentScene: editorActiveScene, pads: deviceInventory?.pads || [], padModes: editorPadModes });
    const stored = storeStudioProject(localStorage, studioLibrary, document);
    setEditorName(title.trim().toUpperCase());
    setEditorPatternBank(patternBank);
    setStudioLibrary(stored.library);
    setSelectedStudioProject(stored.id);
  };

  const renameSelectedStudioProject = () => {
    if (!selectedStudioProject) return;
    const title = window.prompt('Nouveau nom du projet :', editorName);
    if (!title?.trim()) return;
    setStudioLibrary(renameStudioProject(localStorage, studioLibrary, selectedStudioProject, title));
    setEditorName(title.trim().toUpperCase());
  };

  const duplicateSelectedStudioProject = () => {
    if (!selectedStudioProject) return;
    const title = window.prompt('Nom de la copie :', `${editorName} COPIE`);
    if (!title?.trim()) return;
    const stored = duplicateStudioProject(localStorage, studioLibrary, selectedStudioProject, title);
    if (!stored) return;
    setStudioLibrary(stored.library);
    setSelectedStudioProject(stored.id);
    setEditorName(title.trim().toUpperCase());
  };

  const deleteSelectedStudioProject = () => {
    if (!selectedStudioProject) return;
    const record = studioLibrary.find((project) => project.id === selectedStudioProject);
    const title = String((record?.document.metadata as { title?: string } | undefined)?.title || 'ce projet');
    if (!window.confirm(`Supprimer définitivement « ${title} » de la bibliothèque locale ?`)) return;
    setStudioLibrary(deleteStudioProject(localStorage, studioLibrary, selectedStudioProject));
    setSelectedStudioProject('');
  };

  /** Commun à un chargement local et machine : repart sur le premier pattern réellement écrit par groupe (pas forcément 01, un trou est légal) pour ne pas ouvrir une grille vide. */
  const applyLoadedStudioProject = (loaded: StudioProjectState) => {
    stopEditorTransport();
    setEditorName(loaded.title.toUpperCase());
    setTempo(loaded.bpm);
    setEditorGroup('A');
    setEditorPatternBank(loaded.patternBank);
    const startingNumbers = Object.fromEntries(
      EDITOR_GROUPS.map((group) => [group, patternNumbersForGroup(loaded.patternBank, group)[0] ?? 1]),
    ) as Record<EditorGroup, number>;
    setEditorPatternNumbers(startingNumbers);
    setEditorScenes(loaded.scenes);
    setEditorSong(loaded.song);
    setEditorActiveScene(loaded.song[0] ?? loaded.currentScene ?? 1);
    const startingNotes = loaded.patternBank.A[startingNumbers.A] || [];
    setEditorTargets(startingNotes);
    setEditorPadModes(loaded.padModes);
    setEditorBars(Math.max(1, usedBars(startingNotes) + 1));
    setStudioView('pattern');
    setKeyEditorOpen(false);
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

  const addSongPosition = () => {
    const lastSceneNumber = editorSong[editorSong.length - 1];
    const source = editorScenes.find((scene) => scene.scene === lastSceneNumber);
    const newSceneNumber = nextFreeSceneNumber(editorScenes);
    const newScene: SceneDefinition = source ? { ...source, scene: newSceneNumber, groupPatterns: { ...source.groupPatterns } } : emptyScene(newSceneNumber);
    setEditorScenes((current) => [...current, newScene]);
    setEditorSong((current) => [...current, newSceneNumber]);
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
    editorGrid.current.scrollLeft = editorGrid.current.scrollWidth;
  }, [editorBars, editorOpen]);

  if (workspaceView === 'home') return <HomePage connected={midi.connected || midi.outputConnected} project={deviceInventory?.project} scannedSoundCount={deviceInventory ? Object.keys(deviceInventory.sounds).length : 0} onOpenGame={() => setWorkspaceView('game')} onOpenStudio={openCompleteEditor} onOpenSounds={() => setWorkspaceView('sounds')} onOpenDocumentation={() => setWorkspaceView('docs')} />;

  if (workspaceView === 'sounds') return <SoundsPage inventory={deviceInventory} soundIndex={deviceSoundIndex} midiConnected={midi.outputConnected} liveMidi={lastMidi} padModes={editorPadModes} onBack={goHome} onConnectMidi={() => void connectMidi()} onPadModeChange={(group, pad, mode) => setEditorPadModes((current) => ({ ...current, [`${group}:${pad}`]: mode }))} onPadPreview={(group, pad, stagedSlot) => void previewSoundPagePad(group, pad, stagedSlot)} />;

  if (workspaceView === 'docs') return <DocumentationPage onBack={goHome} />;

  return <main className={last ? `impact impact-${last.grade.toLowerCase()}` : ''}>
    <GameToolbar difficulty={difficulty} tempo={tempo} activeBpm={activeExercise.bpm} styleId={styleId} styles={STYLES} userExercises={userExercises} phase={phase} sessionActive={sessionActive} midiConnected={midi.connected} onDifficultyChange={setDifficulty} onTempoChange={setTempo} onStyleChange={changeStyle} onHome={goHome} onOpenEditor={openEditor} onConnectMidi={() => void connectMidi()} onPreview={() => void togglePreview()} onPlay={() => void toggle()} />
    {phase === 'countin' && <div className="countdown" aria-live="assertive"><small>1 MESURE POUR SE PRÉPARER</small><b>{countdown}</b></div>}
    {editorOpen && <div className="editor-overlay"><section className="exercise-editor">
      <EditorToolbar mode={editorMode} name={editorName} group={editorGroup} playing={editorPlaying} loop={editorLoop} exportFormat={editorExportFormat} canSave={Boolean(editorName.trim() && (editorMode === 'complete' || editorTargets.length || EDITOR_GROUPS.some((group) => Object.values(editorPatternBank[group]).some((notes) => notes.length))))} midiConnected={midi.outputConnected} scannedProject={deviceInventory?.project} machineProjectAvailable={Boolean(machineProjectDocument)} machineSampleCount={machineSampleCount} localProjects={studioLibrary.map((project) => ({ id: project.id, title: String((project.document.metadata as { title?: string } | undefined)?.title || 'PROJET SANS NOM') }))} selectedLocalProject={selectedStudioProject} studioView={studioView} patternNumber={editorPatternNumbers[editorGroup]} onHome={goHome} onNameChange={setEditorName} onGroupChange={changeEditorGroup} onStudioViewChange={setStudioView} onPatternNumberChange={changeEditorPattern} onConnectMidi={() => void connectMidi()} onNew={newStudioProject} onOpenProject={openStudioProject} onLoadMachineProject={loadMachineProject} onCloneMachine={() => setMachineCloneOpen(true)} onOpenSampleFolder={() => void openStudioSampleFolder()} onSave={saveEditor} onSaveAs={saveStudioProjectAs} onRename={renameSelectedStudioProject} onDuplicate={duplicateSelectedStudioProject} onDelete={deleteSelectedStudioProject} onPlayback={() => void toggleEditorPlayback()} onLoopChange={setEditorLoop} onExportFormatChange={setEditorExportFormat} onExport={exportEditor} onExportMidi={exportEditorMidi} onExportJson={exportEditorProjectJson} />
      {editorMode === 'complete' && studioView === 'arrangement' && <SongArranger scenes={editorScenes} song={editorSong} patternBank={currentPatternBank()} onAssignCell={assignSceneGroupPattern} onReorderSong={reorderEditorSong} onDuplicateSongPosition={duplicateSongPosition} onDeleteSongPosition={deleteSongPosition} onAddSongPosition={addSongPosition} onAuditionSongPosition={auditionSongPosition} />}
      {(editorMode !== 'complete' || studioView === 'pattern') && <>
        {editorMode === 'complete' && <PadStrip group={editorGroup} selectedPad={editorSelectedPad} padModes={editorPadModes} padName={devicePadName} padSlot={(pad) => devicePadInfo(pad)?.slot} onSelect={(pad) => { setEditorSelectedPad(pad); setKeyEditorOpen((editorPadModes[`${editorGroup}:${pad}`] || 'ONE') === 'KEYS'); }} onPreview={(pad) => { const info = devicePadInfo(pad); if (midi.outputConnected) midi.sendPad(pad, EDITOR_GROUPS.indexOf(editorGroup), 110); else if (info?.slot) void machineSampleBank.play(info.slot, 110, performance.now(), undefined, info.rootNote); }} onModeChange={(pad, mode) => { setEditorPadModes((current) => ({ ...current, [`${editorGroup}:${pad}`]: mode })); setKeyEditorOpen(mode === 'KEYS'); }} onOpenKeys={() => setKeyEditorOpen(true)} />}
        {keyEditorOpen && editorMode === 'complete'
          ? <PianoRoll gridRef={editorGrid} group={editorGroup} selectedPad={editorSelectedPad} bars={editorBars} playing={editorPlaying} playbackBeat={editorPlaybackBeat} targets={editorTargets} onClose={() => setKeyEditorOpen(false)} onPreviewNote={(note) => { const info = devicePadInfo(editorSelectedPad); if (midi.outputConnected) midi.sendNote(note, 110); else if (info?.slot) void machineSampleBank.play(info.slot, 110, performance.now(), note, info.rootNote); }} onToggleNote={toggleKeyStep} />
          : <RhythmGrid gridRef={editorGrid} bars={editorBars} playing={editorPlaying} playbackBeat={editorPlaybackBeat} mode={editorMode} group={editorGroup} selectedPad={editorSelectedPad} targets={editorTargets} padModes={editorPadModes} padName={devicePadName} scannedPlayMode={(pad) => devicePadInfo(pad)?.playMode} onSelectPad={setEditorSelectedPad} onOpenKeys={() => setKeyEditorOpen(true)} onToggleStep={toggleEditorStep} />}
      </>}
      <footer><span>{editorMode === 'complete' ? `${midi.outputConnected ? `SON EP‑133 · ${midi.outputNames.join(' + ')}` : 'EP‑133 NON CONNECTÉ'} · PATTERN ${editorGroup}${String(editorPatternNumbers[editorGroup]).padStart(2, '0')} · ` : ''}GROUPE {editorGroup} · {editorTargets.length} FRAPPE(S) · {effectiveEditorBars} MESURE(S) · {tempo} BPM · AJOUT AUTOMATIQUE ACTIF</span></footer>
      {machineCloneOpen && <MachineCloneDialog inventory={deviceInventory} soundIndex={deviceSoundIndex} onClose={() => setMachineCloneOpen(false)} />}
    </section></div>}

    <ScoreView viewportRef={scoreScroll} pageStart={pageStart} songBeat={songBeat} transportActive={transportActive} playheadProgress={playheadProgress} expectedTargets={visibleTargets} playedNotes={visiblePlayerNotes} last={last} />

    <PerformancePanel transportActive={transportActive} expectedPad={expectedPad} flashedPad={flashedPad} midiVelocity={lastMidi?.velocity || 100} combo={score.combo} onPlayPad={clickPad} onEditPad={editPad} />

    {soundPad !== null && <PadSoundEditor pad={soundPad} settings={soundSettings[soundPad]} onChange={(patch) => updateSound(soundPad, patch)} onPreview={() => void audio.previewPad(soundPad)} onClose={() => setSoundPad(null)} />}
  </main>;
}
