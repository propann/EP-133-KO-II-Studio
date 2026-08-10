/**
 * Sérialisation du Studio vers les formats de référence : `.mid` standard et
 * `ep.project.v1.json` (source technique intermédiaire vers `.pak/.ppak`).
 * Aucun format de composition propriétaire Rhythm Hero — voir
 * `docs/DECISION_FORMATS_PROJET.md`. Les lecteurs/inspecteurs symétriques
 * vivent dans `importers.ts`. Contrôlé par `npm run test:exports`.
 */
import { PROJECT_GROUPS, type ProjectGroup, type ProjectPatterns, type SequencerNote } from './model.ts';
import { sceneIsUsed, type PatternBank, type SceneDefinition } from './song.ts';

export type EditorGroup = ProjectGroup;
export type EditorPatterns = ProjectPatterns;
export type EditorPadMode = 'ONE' | 'KEYS' | 'LEGATO';

export const EDITOR_GROUPS: EditorGroup[] = PROJECT_GROUPS;
/**
 * Note MIDI de base par pad interne (index 0–11, ordre visuel
 * `7 8 9 / 4 5 6 / 1 2 3 / · 0 ENTER`) pour le groupe A ; ajouter
 * `groupIndex * 12` pour B/C/D. Mapping validé sur la machine réelle — voir
 * `docs/CONNEXION_ET_CALIBRATION_MIDI.md`. Seule source de vérité : ne pas
 * en recopier une seconde version ailleurs (import ce tableau).
 */
export const PAD_MIDI_NOTES = [45, 46, 47, 42, 43, 44, 39, 40, 41, 36, 37, 38] as const;
export const KEY_EDITOR_NOTES = Array.from({ length: 25 }, (_, index) => 72 - index);

export const midiNoteName = (note: number) =>
  `${['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][note % 12]}${Math.floor(note / 12) - 1}`;

const variableLength = (value: number) => {
  const bytes = [value & 0x7f];
  while ((value >>= 7)) bytes.unshift((value & 0x7f) | 0x80);
  return bytes;
};

/** Encode les 4 patterns du Studio en un fichier Standard MIDI Format 0, résolution 96 PPQN (celle des patterns internes de l'EP-133). */
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
  /** Tous les patterns de tous les groupes, pas seulement ceux en cours d'édition — voir `core/project/song.ts`. */
  patternBank: PatternBank;
  scenes: SceneDefinition[];
  song: number[];
  currentScene: number | null;
  pads: ScannedPad[];
  padModes: Record<string, EditorPadMode>;
}

/** Sérialise un pattern (frappes d'un seul groupe/numéro) vers le format `ep.project.v1`, en dérivant sa longueur en mesures. */
function serializePattern(id: string, notes: SequencerNote[]) {
  return {
    id,
    bars: Math.max(1, notes.length ? Math.floor(Math.max(...notes.map((target) => target.beat)) / 4) + 1 : 1),
    events: notes.map((target) => ({
      tick: Math.round(target.beat * 96),
      pad: target.pad + 1,
      note: target.note ?? 60,
      velocity: target.velocity,
      duration: Math.max(1, Math.round(target.duration * 96)),
    })),
  };
}

/**
 * Construit un document `ep.project.v1` à partir de l'état du Studio — la
 * source technique intermédiaire avant compilation `.ppak`. Écrit TOUS les
 * patterns de la banque (pas un seul par groupe), toutes les scènes
 * réellement utilisées (`sceneIsUsed`, une scène entièrement MUTE n'est
 * jamais émise, comme sur la machine réelle) et la liste Song complète.
 * Fusionne les pads scannés sur la machine (`pads`) avec les changements de
 * mode ONE/KEYS/LEGATO faits localement (`padModes`), sans perdre les pads
 * non touchés.
 */
export function createEp133ProjectDocument({ title, bpm, patternBank, scenes, song, currentScene, pads, padModes }: ProjectDocumentOptions) {
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
    patterns: EDITOR_GROUPS.flatMap((group) => Object.entries(patternBank[group])
      .map(([number, notes]) => serializePattern(`${group}${String(number).padStart(2, '0')}`, notes))),
    scenes: scenes.filter(sceneIsUsed).map((scene) => ({
      scene: scene.scene,
      groupPatterns: EDITOR_GROUPS.map((group) => scene.groupPatterns[group] ?? 0),
      timeSignature: scene.timeSignature,
    })),
    song,
    currentScene,
  };
}
