import { PROJECT_GROUPS, type ProjectGroup, type ProjectPatterns } from './model.ts';

export type EditorGroup = ProjectGroup;
export type EditorPatterns = ProjectPatterns;
export type EditorPadMode = 'ONE' | 'KEYS' | 'LEGATO';

export const EDITOR_GROUPS: EditorGroup[] = PROJECT_GROUPS;
export const PAD_MIDI_NOTES = [45, 46, 47, 42, 43, 44, 39, 40, 41, 36, 37, 38] as const;
export const KEY_EDITOR_NOTES = Array.from({ length: 25 }, (_, index) => 72 - index);

export const midiNoteName = (note: number) =>
  `${['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][note % 12]}${Math.floor(note / 12) - 1}`;

const variableLength = (value: number) => {
  const bytes = [value & 0x7f];
  while ((value >>= 7)) bytes.unshift((value & 0x7f) | 0x80);
  return bytes;
};

export function createMidiFile(patterns: EditorPatterns, bpm: number) {
  const ppqn = 96;
  const events: { tick: number; data: number[]; order: number }[] = [];
  EDITOR_GROUPS.forEach((group, groupIndex) => patterns[group].forEach((target) => {
    const tick = Math.round(target.beat * ppqn);
    const note = target.note ?? PAD_MIDI_NOTES[target.pad] + groupIndex * 12;
    events.push(
      { tick, data: [0x90, note, target.velocity], order: 1 },
      { tick: tick + Math.max(1, Math.round(target.duration * ppqn)), data: [0x80, note, 0], order: 0 },
    );
  }));
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const microseconds = Math.round(60000000 / bpm);
  const track = [0, 0xff, 0x51, 3, (microseconds >> 16) & 255, (microseconds >> 8) & 255, microseconds & 255];
  let previousTick = 0;
  events.forEach((event) => {
    track.push(...variableLength(event.tick - previousTick), ...event.data);
    previousTick = event.tick;
  });
  track.push(0, 0xff, 0x2f, 0);
  const word = (value: number) => [(value >> 8) & 255, value & 255];
  const long = (value: number) => [(value >> 24) & 255, (value >> 16) & 255, (value >> 8) & 255, value & 255];
  return new Uint8Array(
    [...'MThd'].map((character) => character.charCodeAt(0))
      .concat(long(6), word(0), word(1), word(ppqn), [...'MTrk'].map((character) => character.charCodeAt(0)), long(track.length), track),
  );
}

export interface ScannedPad {
  group: EditorGroup;
  pad: number;
  slot: number;
  playMode: number;
  rootNote: number;
}

interface ProjectDocumentOptions {
  title: string;
  bpm: number;
  patterns: EditorPatterns;
  pads: ScannedPad[];
  padModes: Record<string, EditorPadMode>;
}

export function createEp133ProjectDocument({ title, bpm, patterns, pads, padModes }: ProjectDocumentOptions) {
  const padMap = new Map(pads.map((pad) => [`${pad.group}:${pad.pad - 1}`, pad]));
  Object.keys(padModes).forEach((key) => {
    if (padMap.has(key)) return;
    const [group, visualPad] = key.split(':');
    if (EDITOR_GROUPS.includes(group as EditorGroup) && Number(visualPad) >= 0 && Number(visualPad) < 12) {
      padMap.set(key, { group: group as EditorGroup, pad: Number(visualPad) + 1, slot: 0, playMode: 0, rootNote: 60 });
    }
  });
  return {
    schema: 'ep.project.v1',
    product: 'ep133',
    metadata: { title: title.trim() || 'RHYTHM HERO' },
    settings: { bpm: Math.max(20, Math.min(300, bpm)) },
    pads: [...padMap.values()].map((pad) => ({
      group: pad.group,
      pad: pad.pad,
      slot: pad.slot,
      playMode: padModes[`${pad.group}:${pad.pad - 1}`] === 'KEYS' ? 1 : padModes[`${pad.group}:${pad.pad - 1}`] === 'LEGATO' ? 2 : pad.playMode,
      rootNote: pad.rootNote,
    })),
    patterns: EDITOR_GROUPS.map((group) => ({
      id: `${group}01`,
      bars: Math.max(1, patterns[group].length ? Math.floor(Math.max(...patterns[group].map((target) => target.beat)) / 4) + 1 : 1),
      events: patterns[group].map((target) => ({
        tick: Math.round(target.beat * 96),
        pad: target.pad + 1,
        note: target.note ?? 60,
        velocity: target.velocity,
        duration: Math.max(1, Math.round(target.duration * 96)),
      })),
    })),
    scenes: [{ groupPatterns: [1, 1, 1, 1], timeSignature: [4, 4] }],
    song: [1],
  };
}
