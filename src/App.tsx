import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useWebMidi,
  type MidiHit,
  type MidiObservation,
} from './core/midi/useWebMidi';
import { AudioEngine, type PadSoundSettings } from './core/audio/AudioEngine';
import { emptyScore, scoreHit } from './core/engine/scoring';
import type { Exercise, Grade, Score } from './core/engine/types';
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

const PADS = [
  { key: '7', name: 'KICK' }, { key: '8', name: 'CLAP' }, { key: '9', name: 'SNARE' },
  { key: '4', name: 'OPEN HAT' }, { key: '5', name: 'CLOSED HAT' }, { key: '6', name: 'RIDE' },
  { key: '1', name: 'PERC 1' }, { key: '2', name: 'PERC 2' }, { key: '3', name: 'PERC 3' },
  { key: '·', name: 'SHAKER' }, { key: '0', name: 'BASS' }, { key: 'ENTER', name: 'FX' },
];
const audio = new AudioEngine();
const SCORE_TRACKS = PADS.map((pad, index) => ({ pad: index, label: `${pad.name} · A-${pad.key}` }));

interface PlayerNote {
  id: number;
  beat: number;
  pad: number;
  grade: Grade;
}

interface DeviceInventory {
  readOnly: boolean;
  scannedAt: string;
  project: number;
  projectName?: string;
  pads: Array<{ group: EditorGroup; pad: number; slot: number; playMode: number; rootNote: number }>;
  sounds: Record<string, { name: string; playMode?: string; rootNote?: number; bpm?: number }>;
}

const USER_EXERCISES_KEY = 'ep133-rhythm-hero:user-exercises:v1';
type EditorGroup = 'A' | 'B' | 'C' | 'D';
const EDITOR_GROUPS: EditorGroup[] = ['A', 'B', 'C', 'D'];
const PAD_MIDI_NOTES = [45, 46, 47, 42, 43, 44, 39, 40, 41, 36, 37, 38];
const KEY_EDITOR_NOTES = Array.from({ length: 25 }, (_, index) => 72 - index);
const midiNoteName = (note: number) => `${['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][note % 12]}${Math.floor(note / 12) - 1}`;

const variableLength = (value: number) => {
  const bytes = [value & 0x7f];
  while ((value >>= 7)) bytes.unshift((value & 0x7f) | 0x80);
  return bytes;
};

function createMidiFile(patterns: Record<EditorGroup, Exercise['targets']>, bpm: number) {
  const ppqn = 96;
  const events: { tick: number; data: number[]; order: number }[] = [];
  EDITOR_GROUPS.forEach((group, groupIndex) => patterns[group].forEach((target) => {
    const tick = Math.round(target.beat * ppqn);
    const note = target.note ?? PAD_MIDI_NOTES[target.pad] + groupIndex * 12;
    events.push({ tick, data: [0x90, note, 100], order: 1 }, { tick: tick + 24, data: [0x80, note, 0], order: 0 });
  }));
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const microseconds = Math.round(60000000 / bpm);
  const track = [0, 0xff, 0x51, 3, (microseconds >> 16) & 255, (microseconds >> 8) & 255, microseconds & 255];
  let previousTick = 0;
  events.forEach((event) => { track.push(...variableLength(event.tick - previousTick), ...event.data); previousTick = event.tick; });
  track.push(0, 0xff, 0x2f, 0);
  const word = (value: number) => [(value >> 8) & 255, value & 255];
  const long = (value: number) => [(value >> 24) & 255, (value >> 16) & 255, (value >> 8) & 255, value & 255];
  return new Uint8Array([...'MThd'].map((c) => c.charCodeAt(0)).concat(long(6), word(0), word(1), word(ppqn), [...'MTrk'].map((c) => c.charCodeAt(0)), long(track.length), track));
}

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
  const [editorTargets, setEditorTargets] = useState<Exercise['targets']>([]);
  const [editorPlaying, setEditorPlaying] = useState(false);
  const [editorMode, setEditorMode] = useState<'game' | 'complete'>('game');
  const [editorGroup, setEditorGroup] = useState<EditorGroup>('A');
  const [editorGroupTargets, setEditorGroupTargets] = useState<Record<EditorGroup, Exercise['targets']>>({ A: [], B: [], C: [], D: [] });
  const [editorPlaybackBeat, setEditorPlaybackBeat] = useState(0);
  const [editorSelectedPad, setEditorSelectedPad] = useState(0);
  const [editorPadModes, setEditorPadModes] = useState<Record<string, 'ONE' | 'KEYS'>>({});
  const [keyEditorOpen, setKeyEditorOpen] = useState(false);
  const [deviceInventory, setDeviceInventory] = useState<DeviceInventory | null>(null);
  const [editorLoop, setEditorLoop] = useState(false);
  const [editorExportFormat, setEditorExportFormat] = useState<'midi' | 'json'>('midi');
  const targets = useRef(activeExercise.targets.map((target, index) => ({ ...target, id: `target-${index}` })));
  const frame = useRef<number | undefined>(undefined);
  const flashTimer = useRef<number | undefined>(undefined);
  const countTimer = useRef<number | undefined>(undefined);
  const startTimer = useRef<number | undefined>(undefined);
  const endTimer = useRef<number | undefined>(undefined);
  const scoreScroll = useRef<HTMLDivElement | null>(null);
  const editorGrid = useRef<HTMLDivElement | null>(null);
  const editorPlaybackFrame = useRef<number | undefined>(undefined);
  const editorLoopTimer = useRef<number | undefined>(undefined);
  const tempoDrag = useRef<{ y: number; tempo: number } | null>(null);
  const difficultyDrag = useRef<{ y: number; difficulty: number } | null>(null);
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
    return () => { if (frame.current !== undefined) cancelAnimationFrame(frame.current); };
  }, [transportActive]);

  const toggle = async () => {
    if (sessionActive) {
      audio.stop();
      setPhase('idle');
      if (countTimer.current !== undefined) window.clearInterval(countTimer.current);
      if (startTimer.current !== undefined) window.clearTimeout(startTimer.current);
      if (endTimer.current !== undefined) window.clearTimeout(endTimer.current);
      return;
    }
    targets.current = activeExercise.targets.map((target, index) => ({ ...target, id: `target-${index}` }));
    setScore(emptyScore());
    setLast(null);
    setPlayerNotes([]);
    setSongTime(0);
    setCountdown(4);
    setPhase('countin');
    await audio.start(activeExercise, 1);
    const beatMs = 60000 / activeExercise.bpm;
    let remaining = 4;
    countTimer.current = window.setInterval(() => {
      remaining -= 1;
      setCountdown(Math.max(1, remaining));
      if (remaining <= 1 && countTimer.current !== undefined) window.clearInterval(countTimer.current);
    }, beatMs);
    startTimer.current = window.setTimeout(() => setPhase('playing'), beatMs * 4);
    endTimer.current = window.setTimeout(() => {
      audio.stop();
      setPhase('idle');
    }, beatMs * (4 + activeExercise.bars * 4));
  };

  const togglePreview = async () => {
    if (phase === 'preview') {
      audio.stop();
      setPhase('idle');
      if (endTimer.current !== undefined) window.clearTimeout(endTimer.current);
      return;
    }
    if (sessionActive) return;
    targets.current = activeExercise.targets.map((target, index) => ({ ...target, id: `target-${index}` }));
    setSongTime(0);
    setPhase('preview');
    await audio.start(activeExercise, 0);
    endTimer.current = window.setTimeout(() => {
      audio.stop();
      setPhase('idle');
    }, 60000 / activeExercise.bpm * activeExercise.bars * 4);
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
    setEditorTargets(selected?.targets.map((target) => ({ ...target })) || []);
    setEditorGroupTargets({ A: selected?.targets.map((target) => ({ ...target })) || [], B: [], C: [], D: [] });
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
    const projectDocument = {
      schema: 'ep.project.v1', product: 'ep133',
      metadata: { title: editorName.trim() || 'RHYTHM HERO' },
      pads: deviceInventory?.pads.map((pad) => ({ group: pad.group, pad: pad.pad, slot: pad.slot, playMode: editorPadModes[`${pad.group}:${pad.pad - 1}`] === 'KEYS' ? 1 : pad.playMode, rootNote: pad.rootNote })) || [],
      patterns: EDITOR_GROUPS.map((group) => ({ id: `${group}01`, bars: Math.max(1, patterns[group].length ? Math.floor(Math.max(...patterns[group].map((target) => target.beat)) / 4) + 1 : 1), events: patterns[group].map((target) => ({ tick: Math.round(target.beat * 96), pad: target.pad + 1, note: target.note ?? 60, velocity: 100, duration: 18 })) })),
      scenes: [{ groupPatterns: [1, 1, 1, 1], timeSignature: [4, 4] }], song: [1],
    };
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
      : [...current, { id: `editor-${measure}-${pad}-${step}`, beat, pad }]);
    if (!exists && editorMode === 'complete') midi.sendPad(pad, EDITOR_GROUPS.indexOf(editorGroup), 110);
    if (!exists && measure === editorBars - 1) setEditorBars((bars) => bars + 1);
  };

  const toggleKeyStep = (note: number, globalStep: number) => {
    const beat = globalStep / 4;
    const exists = editorTargets.some((target) => target.pad === editorSelectedPad && target.beat === beat && target.note === note);
    setEditorTargets((current) => exists
      ? current.filter((target) => !(target.pad === editorSelectedPad && target.beat === beat && target.note === note))
      : [...current, { id: `key-${editorGroup}-${editorSelectedPad}-${note}-${globalStep}`, beat, pad: editorSelectedPad, note }]);
    if (!exists) midi.sendNote(note, 110);
    if (!exists && Math.floor(globalStep / 16) === editorBars - 1) setEditorBars((bars) => bars + 1);
  };

  const effectiveEditorBars = Math.max(1, editorTargets.length ? Math.floor(Math.max(...editorTargets.map((target) => target.beat)) / 4) + 1 : 1);

  const editorExercise = (): Exercise => ({ id: 'editor-preview', title: editorName.trim() || 'MON GROOVE', description: 'Exercice utilisateur', bpm: tempo, bars: effectiveEditorBars, timeSignature: '4/4', countInBars: 0, backingTrack: null, grading: { perfectMs: 35, goodMs: 90 }, targets: editorTargets });

  const toggleEditorPlayback = async () => {
    if (editorPlaying) {
      audio.stop(); midi.stopOutput(); setEditorPlaying(false); setEditorPlaybackBeat(0);
      if (editorPlaybackFrame.current !== undefined) cancelAnimationFrame(editorPlaybackFrame.current);
      if (editorLoopTimer.current !== undefined) window.clearInterval(editorLoopTimer.current);
      if (endTimer.current !== undefined) window.clearTimeout(endTimer.current);
      return;
    }
    setEditorPlaying(true);
    setEditorPlaybackBeat(0);
    if (editorGrid.current) editorGrid.current.scrollLeft = 0;
    const patterns = { ...editorGroupTargets, [editorGroup]: editorTargets };
    const allTargets = EDITOR_GROUPS.flatMap((group) => patterns[group]);
    const playbackBars = Math.max(1, allTargets.length ? Math.floor(Math.max(...allTargets.map((target) => target.beat)) / 4) + 1 : effectiveEditorBars);
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
          const duration = 60000 / tempo / 4 * 0.75;
          if (target.note !== undefined) midi.sendNote(target.note, 100, at, duration);
          else midi.sendPad(target.pad, groupIndex, 100, at, duration);
        }));
      };
      midi.startOutputTransport(startAt);
      scheduleCycle(startAt);
      if (editorLoop) editorLoopTimer.current = window.setInterval(() => scheduleCycle(performance.now() + 80), cycleMs);
    } else {
      // Dans l'éditeur jeu, la lecture sert à écouter le groove sans clic métronomique.
      await audio.start(editorExercise(), 0, false);
    }
    if (!editorLoop) endTimer.current = window.setTimeout(() => {
      audio.stop(); midi.stopOutput(); setEditorPlaying(false); setEditorPlaybackBeat(playbackBars * 4);
      if (editorPlaybackFrame.current !== undefined) cancelAnimationFrame(editorPlaybackFrame.current);
    }, 60000 / tempo * playbackBars * 4 + (editorMode === 'complete' ? 80 : 0));
  };

  const saveEditorExercise = () => {
    const saved = { ...editorExercise(), id: `user-${Date.now()}` };
    const next = [...userExercises, saved];
    localStorage.setItem(USER_EXERCISES_KEY, JSON.stringify(next));
    setUserExercises(next);
    setStyleId(`user:${saved.id}`);
    setEditorOpen(false);
    audio.stop();
    setEditorPlaying(false);
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

  useEffect(() => () => {
    if (editorPlaybackFrame.current !== undefined) cancelAnimationFrame(editorPlaybackFrame.current);
  }, []);

  if (workspaceView === 'home') return <main className="home-screen">
    <header className="home-brand"><span>EP‑133</span><b>RHYTHM HERO</b><small>JEU · CRÉATION · MACHINE</small></header>
    <section className="home-intro"><p>Apprends le rythme, construis tes propres partitions et transforme ton EP‑133 en véritable instrument de création.</p><div className="home-machine-status"><i className={midi.connected || midi.outputConnected ? 'online' : ''} /><span>{midi.connected || midi.outputConnected ? 'EP‑133 CONNECTÉ' : 'EP‑133 PRÊT À CONNECTER'}</span>{deviceInventory && <small>PROJET {deviceInventory.project} · {Object.keys(deviceInventory.sounds).length} SONS SCANNÉS</small>}</div></section>
    <section className="home-tools">
      <article className="home-card game-card" role="button" tabIndex={0} onClick={() => setWorkspaceView('game')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setWorkspaceView('game'); }}><span className="home-number">01</span><small>APPRENDRE</small><h2>RHYTHM HERO</h2><p>Exercices progressifs, partitions animées, score et entraînement avec les pads de l’EP‑133.</p></article>
      <article className="home-card studio-card" role="button" tabIndex={0} onClick={openCompleteEditor} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') openCompleteEditor(); }}><span className="home-number">02</span><small>CRÉER</small><h2>STUDIO EP‑133</h2><p>Quatre groupes, séquenceur, piano-roll KEYS, boucle, horloge MIDI et exports compatibles.</p></article>
      <article className="home-card sounds-card" role="button" tabIndex={0} onClick={() => setWorkspaceView('sounds')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setWorkspaceView('sounds'); }}><span className="home-number">03</span><small>GÉRER</small><h2>SONS & TRANSFERT</h2><p>Inspecte la bibliothèque réelle, prépare les samples et maîtrise précisément les emplacements de la machine.</p></article>
    </section>
    <footer className="home-footer"><span>EP‑133 RHYTHM HERO</span><a href="https://teenage.engineering/guides/ep-133" target="_blank" rel="noreferrer">GUIDE OFFICIEL EP‑133 ↗</a><span>LOCAL · SANS COMPTE</span></footer>
  </main>;

  if (workspaceView === 'sounds') return <main className="sound-library-page">
    <header className="module-header"><button onClick={() => setWorkspaceView('home')}>← ACCUEIL</button><div><small>MODULE 03</small><h1>SONS & TRANSFERT EP‑133</h1></div><span className={deviceInventory ? 'ready' : ''}>{deviceInventory ? `PROJET ${deviceInventory.project} · LECTURE SEULE` : 'AUCUN SCAN'}</span></header>
    <section className="sound-library-summary"><div><b>{deviceInventory ? Object.keys(deviceInventory.sounds).length : 0}</b><small>SONS UTILISÉS</small></div><div><b>{deviceInventory?.pads.length || 0}</b><small>PADS AFFECTÉS</small></div><div><b>A–D</b><small>GROUPES</small></div><button onClick={() => void connectMidi()}>{midi.outputConnected ? 'MIDI CONNECTÉ ✓' : 'CONNECTER EP‑133'}</button></section>
    <section className="sound-transfer-zone"><div><small>TRANSFERT SÉCURISÉ</small><h2>PRÉPARER UN NOUVEAU SON</h2><p>Le transfert écrira dans la mémoire globale de la machine. La prochaine étape ajoutera la conversion 46 875 Hz, la pré-écoute, le choix d’un emplacement libre et une confirmation explicite avant toute écriture.</p><button disabled>＋ IMPORTER WAV — BIENTÔT</button></div><aside><b>AUCUNE ÉCRITURE AUTOMATIQUE</b><span>Un emplacement occupé ne sera jamais remplacé sans validation.</span></aside></section>
    <section className="sound-inventory"><header><h2>INVENTAIRE DU PROJET</h2><span>NOMS ET PARAMÈTRES LUS SUR LA MACHINE</span></header><div>{deviceInventory?.pads.map((pad) => { const sound = deviceInventory.sounds[String(pad.slot)]; return <article key={`${pad.group}-${pad.pad}`}><b>{pad.group}{pad.pad.toString().padStart(2, '0')}</b><div><strong>{sound?.name || `SON ${pad.slot}`}</strong><small>SLOT {pad.slot} · {pad.playMode === 1 ? 'KEYS' : pad.playMode === 2 ? 'LEGATO' : 'ONE'} · ROOT {midiNoteName(pad.rootNote)}</small></div></article>; }) || <p>Aucun inventaire disponible.</p>}</div></section>
  </main>;

  return <main className={last ? `impact impact-${last.grade.toLowerCase()}` : ''}>
    <header className="toolbar">
      <button className="home-back compact" onClick={() => setWorkspaceView('home')}>← ACCUEIL</button>
      <strong className="brand">EP‑133 <span>RHYTHM HERO</span></strong>
      <button className="editor-button compact" disabled={sessionActive} onClick={openEditor}>ÉDITEUR</button>
      <div className={`difficulty-control ${sessionActive ? 'locked' : ''}`} title="Maintenir et glisser verticalement" onPointerDown={(event) => { if (sessionActive) return; event.currentTarget.setPointerCapture(event.pointerId); difficultyDrag.current = { y: event.clientY, difficulty }; }} onPointerMove={(event) => { if (!difficultyDrag.current || sessionActive) return; setDifficulty(Math.max(1, Math.min(5, Math.round(difficultyDrag.current.difficulty + (difficultyDrag.current.y - event.clientY) / 24)))); }} onPointerUp={() => { difficultyDrag.current = null; }} onPointerCancel={() => { difficultyDrag.current = null; }}><small>NIVEAU ↕</small><b>{difficulty}</b></div>
      <label className="mode-select">STYLE <select value={styleId} disabled={sessionActive} onChange={(event) => changeStyle(event.target.value)}><optgroup label="STYLES">{STYLES.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</optgroup>{userExercises.length > 0 && <optgroup label="USER">{userExercises.map((item) => <option value={`user:${item.id}`} key={item.id}>{item.title}</option>)}</optgroup>}</select></label>
      <div className={`tempo-control ${sessionActive ? 'locked' : ''}`} title="Maintenir et glisser verticalement" onPointerDown={(event) => { if (sessionActive) return; event.currentTarget.setPointerCapture(event.pointerId); tempoDrag.current = { y: event.clientY, tempo }; }} onPointerMove={(event) => { if (!tempoDrag.current || sessionActive) return; setTempo(Math.max(50, Math.min(200, Math.round(tempoDrag.current.tempo + (tempoDrag.current.y - event.clientY) / 2)))); }} onPointerUp={() => { tempoDrag.current = null; }} onPointerCancel={() => { tempoDrag.current = null; }}><small>BPM ↕</small><b>{activeExercise.bpm}</b></div>
      <button className={`connect compact ${midi.connected ? 'connected' : ''}`} onClick={() => void connectMidi()}>{midi.connected ? 'MIDI ✓' : 'MIDI'}</button>
      <button className={`preview compact ${phase === 'preview' ? 'active' : ''}`} disabled={sessionActive && phase !== 'preview'} onClick={() => void togglePreview()}>{phase === 'preview' ? '■ STOP' : '▶ LECTURE'}</button>
      <button onClick={toggle} disabled={phase === 'preview'} className="start compact">{phase === 'playing' || phase === 'countin' ? '■ STOP' : '▶ JOUER'}</button>
    </header>
    {phase === 'countin' && <div className="countdown" aria-live="assertive"><small>1 MESURE POUR SE PRÉPARER</small><b>{countdown}</b></div>}
    {editorOpen && <div className="editor-overlay"><section className="exercise-editor">
      <header><button className="editor-home-button" onClick={() => { audio.stop(); midi.stopOutput(); setEditorPlaying(false); setEditorPlaybackBeat(0); setEditorOpen(false); setWorkspaceView('home'); }}>← ACCUEIL</button><div><small>{editorMode === 'game' ? 'ÉDITEUR JEU' : 'ÉDITEUR EP‑133 COMPLET'}</small><input value={editorName} maxLength={32} onChange={(event) => setEditorName(event.target.value.toUpperCase())} aria-label="Nom de l'exercice" /></div>{editorMode === 'complete' && <><div className="editor-groups" aria-label="Groupes EP-133">{EDITOR_GROUPS.map((group) => <button className={editorGroup === group ? 'active' : ''} onClick={() => changeEditorGroup(group)} key={group}>{group}</button>)}</div><span className={`device-scan-state ${deviceInventory ? 'active' : ''}`}>{deviceInventory ? `PROJET ${deviceInventory.project} · SCAN LECTURE SEULE` : 'AUCUN SCAN'}</span><button className={`editor-midi-out ${midi.outputConnected ? 'active' : ''}`} onClick={() => void connectMidi()}>{midi.outputConnected ? 'MIDI OUT ✓' : 'CONNECTER EP‑133'}</button></>}<div className={`editor-vu ${editorPlaying ? 'active' : ''}`}><span>-20</span><span>-6</span><span>0</span><i /><b>VU</b></div></header>
      <div className="editor-commandbar"><button className="save" disabled={!editorName.trim() || (!editorTargets.length && !Object.values(editorGroupTargets).some((groupTargets) => groupTargets.length))} onClick={saveEditorExercise}>● SAVE</button><button className="transport-play" disabled={editorMode === 'complete' && !midi.outputConnected} onClick={() => void toggleEditorPlayback()}>{editorPlaying ? '■ STOP' : '▶ LECTURE'}</button><button className={`loop-toggle ${editorLoop ? 'active' : ''}`} disabled={editorMode !== 'complete' || editorPlaying} onClick={() => setEditorLoop((loop) => !loop)}>↻ BOUCLE {editorLoop ? 'ON' : 'OFF'}</button><label>EXPORT <select value={editorExportFormat} onChange={(event) => setEditorExportFormat(event.target.value as 'midi' | 'json')}><option value="midi">MIDI (.mid)</option><option value="json">PROJET EP‑133 (.json)</option></select></label><button className="midi-export" onClick={exportEditor}>⇩ EXPORTER</button></div>
      {editorMode === 'complete' && <div className="editor-pad-strip"><strong>PAD {editorGroup}</strong><div className="editor-pad-buttons">{PADS.map((pad, index) => <button className={`${editorSelectedPad === index ? 'active' : ''} ${(editorPadModes[`${editorGroup}:${index}`] || 'ONE') === 'KEYS' ? 'melodic' : ''}`} title={`${devicePadName(index)} · SLOT ${devicePadInfo(index)?.slot || 'VIDE'}`} onClick={() => { setEditorSelectedPad(index); setKeyEditorOpen((editorPadModes[`${editorGroup}:${index}`] || 'ONE') === 'KEYS'); midi.sendPad(index, EDITOR_GROUPS.indexOf(editorGroup), 110); }} onAuxClick={(event) => { if (event.button !== 1) return; event.preventDefault(); setEditorSelectedPad(index); setEditorPadModes((current) => ({ ...current, [`${editorGroup}:${index}`]: 'KEYS' })); setKeyEditorOpen(true); }} key={pad.key}><b>{pad.key}</b><small>{devicePadName(index)}</small></button>)}</div><div className="editor-pad-mode"><small>MODE DU PAD {PADS[editorSelectedPad].key} · {devicePadName(editorSelectedPad)}</small>{(['ONE', 'KEYS'] as const).map((mode) => <button className={(editorPadModes[`${editorGroup}:${editorSelectedPad}`] || 'ONE') === mode ? 'active' : ''} onClick={() => { setEditorPadModes((current) => ({ ...current, [`${editorGroup}:${editorSelectedPad}`]: mode })); setKeyEditorOpen(mode === 'KEYS'); }} key={mode}>{mode}</button>)}</div></div>}
      {keyEditorOpen && editorMode === 'complete' ? <div className="key-editor"><div className="key-editor-title"><span>GROUPE {editorGroup} · PAD {PADS[editorSelectedPad].key} · {PADS[editorSelectedPad].name}</span><b>MODE KEYS · PIANO-ROLL</b><button onClick={() => setKeyEditorOpen(false)}>RETOUR AUX 12 PADS</button></div><div className="editor-grid key-grid" ref={editorGrid}><div className="key-roll" style={{ width: `${160 + editorBars * 960}px` }}>
        {editorPlaying && <i className="editor-playhead" style={{ left: `${160 + editorPlaybackBeat / 4 * 960}px` }} />}
        <div className="editor-measure-line"><span className="editor-corner">CLAVIER</span><div className="editor-measure-heads" style={{ gridTemplateColumns: `repeat(${editorBars}, 1fr)` }}>{Array.from({ length: editorBars }, (_, measure) => <b key={measure}>MESURE {measure + 1}</b>)}</div></div>
        <div className="editor-step-line"><span className="editor-corner">NOTES</span><div style={{ gridTemplateColumns: `repeat(${editorBars * 16}, 1fr)` }}>{Array.from({ length: editorBars * 16 }, (_, step) => <b className={`measure-tone-${Math.floor(step / 16) % 2}`} key={step}>{step % 16 + 1}</b>)}</div></div>
        {KEY_EDITOR_NOTES.map((note) => { const black = [1, 3, 6, 8, 10].includes(note % 12); return <div className="key-row" key={note}><button className={black ? 'black' : 'white'} onClick={() => midi.sendNote(note, 110)}><b>{midiNoteName(note)}</b><small>{note}</small></button><div style={{ gridTemplateColumns: `repeat(${editorBars * 16}, 1fr)` }}>{Array.from({ length: editorBars * 16 }, (_, globalStep) => { const checked = editorTargets.some((target) => target.pad === editorSelectedPad && target.note === note && target.beat === globalStep / 4); return <button className={checked ? 'checked' : ''} onClick={() => toggleKeyStep(note, globalStep)} key={globalStep}>{checked ? '●' : ''}</button>; })}</div></div>; })}
      </div></div></div> : <div className="editor-grid" ref={editorGrid}><div className="editor-horizontal" style={{ width: `${160 + editorBars * 960}px` }}>
        {editorPlaying && <i className="editor-playhead" style={{ left: `${160 + editorPlaybackBeat / 4 * 960}px` }} />}
        <div className="editor-measure-line"><span className="editor-corner">PISTES</span><div className="editor-measure-heads" style={{ gridTemplateColumns: `repeat(${editorBars}, 1fr)` }}>{Array.from({ length: editorBars }, (_, measure) => <b className={measure === editorBars - 1 ? 'reserve' : ''} key={measure}>MESURE {measure + 1}{measure === editorBars - 1 ? ' · SUITE' : ''}</b>)}</div></div>
        <div className="editor-step-line"><span className="editor-corner">PAS</span><div style={{ gridTemplateColumns: `repeat(${editorBars * 16}, 1fr)` }}>{Array.from({ length: editorBars * 16 }, (_, globalStep) => <b className={`measure-tone-${Math.floor(globalStep / 16) % 2}`} key={globalStep}>{globalStep % 16 + 1}</b>)}</div></div>
        {SCORE_TRACKS.map((track) => { const scannedMode = devicePadInfo(track.pad)?.playMode === 1 ? 'KEYS' : 'ONE'; const melodic = editorMode === 'complete' && (editorPadModes[`${editorGroup}:${track.pad}`] || scannedMode) === 'KEYS'; return <div className={`editor-horizontal-row ${editorMode === 'complete' && editorSelectedPad === track.pad ? 'selected-pad' : ''} ${melodic ? 'melodic-track' : ''}`} key={track.pad}><strong onClick={() => { setEditorSelectedPad(track.pad); if (melodic) setKeyEditorOpen(true); }}>{devicePadName(track.pad)} · {editorGroup}-{PADS[track.pad].key}{editorMode === 'complete' ? ` · ${melodic ? 'KEYS ♫' : 'ONE'}` : ''}</strong><div style={{ gridTemplateColumns: `repeat(${editorBars * 16}, 1fr)` }}>{Array.from({ length: editorBars * 16 }, (_, globalStep) => { const measure = Math.floor(globalStep / 16); const step = globalStep % 16; const beat = measure * 4 + step / 4; const stepTargets = editorTargets.filter((target) => target.pad === track.pad && target.beat === beat); const checked = stepTargets.length > 0; const noteLabel = stepTargets.filter((target) => target.note !== undefined).map((target) => midiNoteName(target.note!)).join('/'); return <button className={`${checked ? 'checked' : ''} ${measure === editorBars - 1 ? 'reserve' : ''}`} onClick={() => melodic ? (setEditorSelectedPad(track.pad), setKeyEditorOpen(true)) : toggleEditorStep(measure, track.pad, step)} aria-label={`${devicePadName(track.pad)}, mesure ${measure + 1}, pas ${step + 1}`} key={globalStep}>{checked ? noteLabel || PADS[track.pad].key : ''}</button>; })}</div></div>; })}
      </div></div>}
      <footer><span>{editorMode === 'complete' ? `${midi.outputConnected ? `SON EP‑133 · ${midi.outputNames.join(' + ')}` : 'EP‑133 NON CONNECTÉ'} · ` : ''}GROUPE {editorGroup} · {editorTargets.length} FRAPPE(S) · {effectiveEditorBars} MESURE(S) · {tempo} BPM · AJOUT AUTOMATIQUE ACTIF</span></footer>
    </section></div>}

    <section className="score-view" aria-label="Partition sur deux mesures">
      <div className="score-heading"><span>MESURES {Math.floor(pageStart / 4) + 1}–{Math.floor(pageStart / 4) + 2}</span><span>32 PAS · 12 PISTES</span></div>
      <div className="sequencer-scroll" ref={scoreScroll}>
        <div className="sequencer">
          <section className="sequence-block combined">
            <h2>PARTITION MODÈLE + JOUEUR</h2>
            <div className="measure-titles"><span /><b>MESURE {Math.floor(pageStart / 4) + 1}</b><b>MESURE {Math.floor(pageStart / 4) + 2}</b></div>
            <div className="step-numbers"><span />{Array.from({ length: 32 }, (_, step) => <i key={step}>{step % 16 + 1}</i>)}</div>
            {SCORE_TRACKS.map((track) => <div className="sequence-track" key={track.pad}>
              <strong>{track.label}</strong>
              {Array.from({ length: 32 }, (_, step) => {
                const expected = visibleTargets.find((target) => target.pad === track.pad && Math.round((target.beat - pageStart) * 4) === step);
                const played = visiblePlayerNotes.filter((note) => note.pad === track.pad && Math.max(0, Math.min(31, Math.floor((note.beat - pageStart) * 4))) === step);
                const activeStep = transportActive && Math.floor((songBeat - pageStart) * 4) === step;
                const grade = played.at(-1)?.grade.toLowerCase();
                return <i key={step} className={`sequence-step ${expected ? 'filled' : ''} ${played.length ? 'played' : ''} ${grade || ''} ${activeStep ? 'current' : ''}`}>{expected ? PADS[track.pad].key : ''}{played.length > 0 && <b className="player-mark" />}</i>;
              })}
            </div>)}
            {transportActive && <div className="sequence-cursor" style={{ left: `calc(132px + (100% - 132px) * ${playheadProgress})` }} />}
          </section>
        </div>
      </div>
      <div className="score-legend"><span><i className="legend-model" /> modèle</span><span><i className="legend-perfect" /> PERFECT</span><span><i className="legend-good" /> GOOD</span><span><i className="legend-miss" /> MISS</span>{last && <strong className={last.grade.toLowerCase()}>{last.grade} {Number.isFinite(last.deltaMs) ? `${last.deltaMs > 0 ? '+' : ''}${last.deltaMs.toFixed(0)} ms` : ''}</strong>}</div>
    </section>

    <section className="performance-panel">
      <aside className="side-display analog-display model-vu"><small>SON DU JEU</small><div className="analog-vu"><div className="vu-scale"><span>-20</span><span>-6</span><span>0</span><span>+3</span></div><i className="vu-needle" style={{ transform: `rotate(${expectedPad !== undefined ? 48 : -42}deg)` }} /><b>VU</b></div><span>PARTITION · ORANGE</span></aside>
      <section className="pads">{PADS.map((pad, index) => {
      const expected = transportActive && expectedPad === index;
      const played = flashedPad?.pad === index;
      return <button key={pad.key} onClick={(event) => { if (event.detail === 1) clickPad(index); }} onDoubleClick={() => editPad(index)} className={`${expected ? 'expected-pad ' : ''}${played && flashedPad ? `played-pad ${flashedPad.grade.toLowerCase()}` : ''}`}>
        <b>{pad.key}</b>{pad.name}
        <em>MAPPING MIDI AUTOMATIQUE</em>
      </button>;
      })}</section>
      <aside className="side-display analog-display player-vu"><small>SON DU JOUEUR</small><div className="analog-vu"><div className="vu-scale"><span>-20</span><span>-6</span><span>0</span><span>+3</span></div><i className="vu-needle" style={{ transform: `rotate(${flashedPad ? Math.min(52, -30 + (lastMidi?.velocity || 100) * .65) : -42}deg)` }} /><b>VU</b></div><span>FRAPPES · AMBRE</span><b className="mini-combo">COMBO {score.combo}</b></aside>
    </section>
    {soundPad !== null && <section className="sound-editor">
      <div><small>RÉGLAGE DU PAD</small><strong>{PADS[soundPad].key} · {PADS[soundPad].name}</strong></div>
      <label>SON DU JEU <input type="range" min="0" max="140" value={soundSettings[soundPad].modelVolume} onChange={(event) => updateSound(soundPad, { modelVolume: Number(event.target.value) })} /><output>{soundSettings[soundPad].modelVolume}%</output></label>
      <label>SON DU JOUEUR <input type="range" min="0" max="140" value={soundSettings[soundPad].playerVolume} onChange={(event) => updateSound(soundPad, { playerVolume: Number(event.target.value) })} /><output>{soundSettings[soundPad].playerVolume}%</output></label>
      <label>HAUTEUR <input type="range" min="-12" max="12" value={soundSettings[soundPad].tune} onChange={(event) => updateSound(soundPad, { tune: Number(event.target.value) })} /><output>{soundSettings[soundPad].tune > 0 ? '+' : ''}{soundSettings[soundPad].tune}</output></label>
      <button onClick={() => void audio.previewPad(soundPad)}>ÉCOUTER</button><button onClick={() => setSoundPad(null)}>FERMER</button>
    </section>}
  </main>;
}
