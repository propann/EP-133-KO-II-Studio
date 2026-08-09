import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useWebMidi,
  type MidiHit,
  type MidiObservation,
} from './core/midi/useWebMidi';
import { AudioEngine, type PadSoundSettings } from './core/audio/AudioEngine';
import { emptyScore, scoreHit } from './core/engine/scoring';
import type { Exercise, Grade, Score } from './core/engine/types';
import {
  createEp133ProjectDocument,
  createMidiFile,
  EDITOR_GROUPS,
  type EditorGroup,
  type EditorPadMode,
} from './core/project/exporters';
import type { DeviceInventory } from './core/project/device';
import {
  DEFAULT_NOTE_DURATION,
  DEFAULT_NOTE_VELOCITY,
  emptyProjectPatterns,
  exerciseTargetsToNotes,
  notesToExerciseTargets,
  type ProjectPatterns,
  type SequencerNote,
} from './core/project/model';
import { barsAfterStepEdit, measureFromGlobalStep, usedBars } from './core/project/editor';
import { HomePage } from './pages/HomePage';
import { SoundsPage } from './pages/SoundsPage';
import { ScoreView } from './components/game/ScoreView';
import { PerformancePanel } from './components/game/PerformancePanel';
import { PadSoundEditor } from './components/game/PadSoundEditor';
import { GameToolbar } from './components/game/GameToolbar';
import { PianoRoll } from './components/editor/PianoRoll';
import { RhythmGrid } from './components/editor/RhythmGrid';
import { PadStrip } from './components/editor/PadStrip';
import { EditorToolbar } from './components/editor/EditorToolbar';
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
  const [workspaceView, setWorkspaceView] = useState<'home' | 'game' | 'sounds'>('home');
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
  const [editorGroupTargets, setEditorGroupTargets] = useState<ProjectPatterns>(emptyProjectPatterns);
  const [editorPlaybackBeat, setEditorPlaybackBeat] = useState(0);
  const [editorSelectedPad, setEditorSelectedPad] = useState(0);
  const [editorPadModes, setEditorPadModes] = useState<Record<string, EditorPadMode>>({});
  const [keyEditorOpen, setKeyEditorOpen] = useState(false);
  const [deviceInventory, setDeviceInventory] = useState<DeviceInventory | null>(null);
  const [editorLoop, setEditorLoop] = useState(false);
  const [editorExportFormat, setEditorExportFormat] = useState<'midi' | 'json'>('midi');
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
    setEditorGroupTargets({ ...emptyProjectPatterns(), A: selectedNotes });
    setEditorGroup('A');
    setEditorMode('game');
    setEditorBars(Math.max(2, (selected?.bars || 0) + 1));
    setEditorOpen(true);
  };

  const openCompleteEditor = () => {
    setWorkspaceView('game');
    openEditor();
    setEditorMode('complete');
  };

  const changeEditorGroup = (nextGroup: EditorGroup) => {
    setEditorGroupTargets((current) => ({ ...current, [editorGroup]: editorTargets }));
    setEditorTargets(editorGroupTargets[nextGroup]);
    setEditorGroup(nextGroup);
  };

  const exportEditorMidi = () => {
    const patterns = { ...editorGroupTargets, [editorGroup]: editorTargets };
    const blob = new Blob([createMidiFile(patterns, tempo)], { type: 'audio/midi' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(editorName.trim() || 'ep133-pattern').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.mid`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportEditorProjectJson = () => {
    const patterns = { ...editorGroupTargets, [editorGroup]: editorTargets };
    const projectDocument = createEp133ProjectDocument({ title: editorName, patterns, pads: deviceInventory?.pads || [], padModes: editorPadModes });
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
    if (!exists && editorMode === 'complete') midi.sendPad(pad, EDITOR_GROUPS.indexOf(editorGroup), 110);
    setEditorBars((bars) => barsAfterStepEdit(bars, measure, exists));
  };

  const toggleKeyStep = (note: number, globalStep: number) => {
    const beat = globalStep / 4;
    const exists = editorTargets.some((target) => target.pad === editorSelectedPad && target.beat === beat && target.note === note);
    setEditorTargets((current) => exists
      ? current.filter((target) => !(target.pad === editorSelectedPad && target.beat === beat && target.note === note))
      : [...current, { id: `key-${editorGroup}-${editorSelectedPad}-${note}-${globalStep}`, group: editorGroup, beat, pad: editorSelectedPad, note, velocity: DEFAULT_NOTE_VELOCITY, duration: DEFAULT_NOTE_DURATION }]);
    if (!exists) midi.sendNote(note, 110);
    setEditorBars((bars) => barsAfterStepEdit(bars, measureFromGlobalStep(globalStep), exists));
  };

  const effectiveEditorBars = usedBars(editorTargets);

  const editorExercise = (): Exercise => ({ id: 'editor-preview', title: editorName.trim() || 'MON GROOVE', description: 'Exercice utilisateur', bpm: tempo, bars: effectiveEditorBars, timeSignature: '4/4', countInBars: 0, backingTrack: null, grading: { perfectMs: 35, goodMs: 90 }, targets: notesToExerciseTargets(editorTargets) });

  const toggleEditorPlayback = async () => {
    if (editorPlaying) {
      stopEditorTransport();
      return;
    }
    setEditorPlaying(true);
    const run = ++editorRun.current;
    setEditorPlaybackBeat(0);
    if (editorGrid.current) editorGrid.current.scrollLeft = 0;
    const patterns = { ...editorGroupTargets, [editorGroup]: editorTargets };
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
        midi.sendClockWindow(tempo, cycleStart, cycleMs);
        EDITOR_GROUPS.forEach((group, groupIndex) => patterns[group].forEach((target) => {
          const at = cycleStart + target.beat * 60000 / tempo;
          const duration = target.duration * 60000 / tempo;
          if (target.note !== undefined) midi.sendNote(target.note, target.velocity, at, duration);
          else midi.sendPad(target.pad, groupIndex, target.velocity, at, duration);
        }));
      };
      midi.startOutputTransport(startAt);
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

  if (workspaceView === 'home') return <HomePage connected={midi.connected || midi.outputConnected} project={deviceInventory?.project} scannedSoundCount={deviceInventory ? Object.keys(deviceInventory.sounds).length : 0} onOpenGame={() => setWorkspaceView('game')} onOpenStudio={openCompleteEditor} onOpenSounds={() => setWorkspaceView('sounds')} />;

  if (workspaceView === 'sounds') return <SoundsPage inventory={deviceInventory} midiConnected={midi.outputConnected} onBack={goHome} onConnectMidi={() => void connectMidi()} />;

  return <main className={last ? `impact impact-${last.grade.toLowerCase()}` : ''}>
    <GameToolbar difficulty={difficulty} tempo={tempo} activeBpm={activeExercise.bpm} styleId={styleId} styles={STYLES} userExercises={userExercises} phase={phase} sessionActive={sessionActive} midiConnected={midi.connected} onDifficultyChange={setDifficulty} onTempoChange={setTempo} onStyleChange={changeStyle} onHome={goHome} onOpenEditor={openEditor} onConnectMidi={() => void connectMidi()} onPreview={() => void togglePreview()} onPlay={() => void toggle()} />
    {phase === 'countin' && <div className="countdown" aria-live="assertive"><small>1 MESURE POUR SE PRÉPARER</small><b>{countdown}</b></div>}
    {editorOpen && <div className="editor-overlay"><section className="exercise-editor">
      <EditorToolbar mode={editorMode} name={editorName} group={editorGroup} playing={editorPlaying} loop={editorLoop} exportFormat={editorExportFormat} canSave={Boolean(editorName.trim() && (editorTargets.length || Object.values(editorGroupTargets).some((groupTargets) => groupTargets.length)))} midiConnected={midi.outputConnected} scannedProject={deviceInventory?.project} onHome={goHome} onNameChange={setEditorName} onGroupChange={changeEditorGroup} onConnectMidi={() => void connectMidi()} onSave={saveEditorExercise} onPlayback={() => void toggleEditorPlayback()} onLoopChange={setEditorLoop} onExportFormatChange={setEditorExportFormat} onExport={exportEditor} />
      {editorMode === 'complete' && <PadStrip group={editorGroup} selectedPad={editorSelectedPad} padModes={editorPadModes} padName={devicePadName} padSlot={(pad) => devicePadInfo(pad)?.slot} onSelect={(pad) => { setEditorSelectedPad(pad); setKeyEditorOpen((editorPadModes[`${editorGroup}:${pad}`] || 'ONE') === 'KEYS'); }} onPreview={(pad) => midi.sendPad(pad, EDITOR_GROUPS.indexOf(editorGroup), 110)} onModeChange={(pad, mode) => { setEditorPadModes((current) => ({ ...current, [`${editorGroup}:${pad}`]: mode })); setKeyEditorOpen(mode === 'KEYS'); }} onOpenKeys={() => setKeyEditorOpen(true)} />}
      {keyEditorOpen && editorMode === 'complete'
        ? <PianoRoll gridRef={editorGrid} group={editorGroup} selectedPad={editorSelectedPad} bars={editorBars} playing={editorPlaying} playbackBeat={editorPlaybackBeat} targets={editorTargets} onClose={() => setKeyEditorOpen(false)} onPreviewNote={(note) => midi.sendNote(note, 110)} onToggleNote={toggleKeyStep} />
        : <RhythmGrid gridRef={editorGrid} bars={editorBars} playing={editorPlaying} playbackBeat={editorPlaybackBeat} mode={editorMode} group={editorGroup} selectedPad={editorSelectedPad} targets={editorTargets} padModes={editorPadModes} padName={devicePadName} scannedPlayMode={(pad) => devicePadInfo(pad)?.playMode} onSelectPad={setEditorSelectedPad} onOpenKeys={() => setKeyEditorOpen(true)} onToggleStep={toggleEditorStep} />}
      <footer><span>{editorMode === 'complete' ? `${midi.outputConnected ? `SON EP‑133 · ${midi.outputNames.join(' + ')}` : 'EP‑133 NON CONNECTÉ'} · ` : ''}GROUPE {editorGroup} · {editorTargets.length} FRAPPE(S) · {effectiveEditorBars} MESURE(S) · {tempo} BPM · AJOUT AUTOMATIQUE ACTIF</span></footer>
    </section></div>}

    <ScoreView viewportRef={scoreScroll} pageStart={pageStart} songBeat={songBeat} transportActive={transportActive} playheadProgress={playheadProgress} expectedTargets={visibleTargets} playedNotes={visiblePlayerNotes} last={last} />

    <PerformancePanel transportActive={transportActive} expectedPad={expectedPad} flashedPad={flashedPad} midiVelocity={lastMidi?.velocity || 100} combo={score.combo} onPlayPad={clickPad} onEditPad={editPad} />

    {soundPad !== null && <PadSoundEditor pad={soundPad} settings={soundSettings[soundPad]} onChange={(patch) => updateSound(soundPad, patch)} onPreview={() => void audio.previewPad(soundPad)} onClose={() => setSoundPad(null)} />}
  </main>;
}
