import { unzipSync } from 'fflate';
import type { Target } from '../engine/types';
import { EDITOR_GROUPS, PAD_MIDI_NOTES, type EditorGroup, type EditorPatterns } from './exporters.ts';

export interface ImportedMidiEvent extends Target {
  group: EditorGroup;
  velocity: number;
  duration: number;
}

export interface ImportedMidiProject {
  format: number;
  ppqn: number;
  bpm: number;
  patterns: EditorPatterns;
  events: ImportedMidiEvent[];
  warnings: string[];
}

export interface Ep133ArchiveSummary {
  kind: 'pak' | 'ppak';
  meta: Record<string, unknown> | null;
  projects: string[];
  sounds: string[];
  entries: string[];
  warnings: string[];
}

const textDecoder = new TextDecoder();
const readU16 = (data: Uint8Array, offset: number) => (data[offset] << 8) | data[offset + 1];
const readU32 = (data: Uint8Array, offset: number) => ((data[offset] * 0x1000000) + (data[offset + 1] << 16) + (data[offset + 2] << 8) + data[offset + 3]) >>> 0;

const expectAscii = (data: Uint8Array, offset: number, expected: string) => {
  if (textDecoder.decode(data.subarray(offset, offset + expected.length)) !== expected) {
    throw new Error(`Fichier MIDI invalide : bloc ${expected} absent.`);
  }
};

const readVariableLength = (data: Uint8Array, start: number) => {
  let offset = start;
  let value = 0;
  for (let count = 0; count < 4; count += 1) {
    if (offset >= data.length) throw new Error('Fichier MIDI tronqué dans une durée variable.');
    const byte = data[offset++];
    value = (value << 7) | (byte & 0x7f);
    if (!(byte & 0x80)) return { value, offset };
  }
  throw new Error('Durée variable MIDI supérieure à quatre octets.');
};

const locateEp133Pad = (note: number) => {
  for (let groupIndex = 0; groupIndex < EDITOR_GROUPS.length; groupIndex += 1) {
    const pad = PAD_MIDI_NOTES.findIndex((padNote) => padNote + groupIndex * 12 === note);
    if (pad >= 0) return { group: EDITOR_GROUPS[groupIndex], pad };
  }
  return null;
};

export function readMidiFile(data: Uint8Array): ImportedMidiProject {
  if (data.length < 14) throw new Error('Fichier MIDI trop court.');
  expectAscii(data, 0, 'MThd');
  const headerLength = readU32(data, 4);
  if (headerLength < 6 || data.length < 8 + headerLength) throw new Error('En-tête MIDI invalide.');
  const format = readU16(data, 8);
  const trackCount = readU16(data, 10);
  const division = readU16(data, 12);
  if (format > 1) throw new Error(`Format MIDI ${format} non pris en charge (formats 0 et 1 attendus).`);
  if (division & 0x8000) throw new Error('Le timecode SMPTE MIDI n’est pas pris en charge.');
  if (!division) throw new Error('Résolution MIDI nulle.');

  const notes: Array<{ tick: number; note: number; velocity: number; duration: number }> = [];
  const active = new Map<string, Array<{ tick: number; velocity: number }>>();
  const tempos: Array<{ tick: number; microseconds: number }> = [];
  let offset = 8 + headerLength;

  for (let trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
    expectAscii(data, offset, 'MTrk');
    const trackLength = readU32(data, offset + 4);
    offset += 8;
    const end = offset + trackLength;
    if (end > data.length) throw new Error('Piste MIDI tronquée.');
    let tick = 0;
    let runningStatus = 0;
    while (offset < end) {
      const delta = readVariableLength(data, offset);
      tick += delta.value;
      offset = delta.offset;
      let status = data[offset];
      if (status & 0x80) {
        offset += 1;
        runningStatus = status < 0xf0 ? status : 0;
      } else {
        if (!runningStatus) throw new Error('Running status MIDI sans statut précédent.');
        status = runningStatus;
      }
      if (status === 0xff) {
        if (offset >= end) throw new Error('Meta-événement MIDI tronqué.');
        const type = data[offset++];
        const length = readVariableLength(data, offset);
        offset = length.offset;
        if (offset + length.value > end) throw new Error('Meta-événement MIDI tronqué.');
        if (type === 0x51 && length.value === 3) {
          tempos.push({ tick, microseconds: (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2] });
        }
        offset += length.value;
        continue;
      }
      if (status === 0xf0 || status === 0xf7) {
        const length = readVariableLength(data, offset);
        offset = length.offset + length.value;
        if (offset > end) throw new Error('Message SysEx MIDI tronqué.');
        continue;
      }
      const command = status & 0xf0;
      const channel = status & 0x0f;
      const dataLength = command === 0xc0 || command === 0xd0 ? 1 : 2;
      if (offset + dataLength > end) throw new Error('Événement MIDI tronqué.');
      const first = data[offset++];
      const second = dataLength === 2 ? data[offset++] : 0;
      const key = `${trackIndex}:${channel}:${first}`;
      if (command === 0x90 && second > 0) {
        const queue = active.get(key) ?? [];
        queue.push({ tick, velocity: second });
        active.set(key, queue);
      } else if (command === 0x80 || (command === 0x90 && second === 0)) {
        const queue = active.get(key);
        const started = queue?.shift();
        if (started) notes.push({ tick: started.tick, note: first, velocity: started.velocity, duration: Math.max(1, tick - started.tick) });
      }
    }
    offset = end;
  }

  const warnings: string[] = [];
  if ([...active.values()].some((queue) => queue.length)) warnings.push('Certaines notes MIDI n’ont pas de Note Off et ont été ignorées.');
  const events: ImportedMidiEvent[] = [];
  notes.sort((a, b) => a.tick - b.tick || a.note - b.note).forEach((note, index) => {
    const location = locateEp133Pad(note.note);
    if (!location) {
      warnings.push(`Note ${note.note} ignorée : elle ne correspond à aucun pad EP-133 A–D.`);
      return;
    }
    events.push({
      id: `midi-${index}-${note.tick}`,
      beat: note.tick / division,
      pad: location.pad,
      note: note.note,
      group: location.group,
      velocity: note.velocity,
      duration: note.duration / division,
    });
  });
  const patterns = Object.fromEntries(EDITOR_GROUPS.map((group) => [group, events.filter((event) => event.group === group).map(({ group: _group, velocity: _velocity, duration: _duration, ...target }) => target)])) as EditorPatterns;
  const initialTempo = tempos.sort((a, b) => a.tick - b.tick)[0]?.microseconds ?? 500000;
  return { format, ppqn: division, bpm: Math.round(60000000 / initialTempo), patterns, events, warnings: [...new Set(warnings)] };
}

export function inspectEp133Archive(data: Uint8Array, filename = 'project.ppak'): Ep133ArchiveSummary {
  let archive: Record<string, Uint8Array>;
  try {
    archive = unzipSync(data);
  } catch {
    throw new Error('Archive EP-133 illisible : un conteneur ZIP .pak/.ppak est attendu.');
  }
  const entries = Object.keys(archive).sort();
  const normalized = new Map(entries.map((entry) => [entry.replace(/^\/+/, ''), entry]));
  const warnings: string[] = [];
  let meta: Record<string, unknown> | null = null;
  const metaEntry = normalized.get('meta.json');
  if (metaEntry) {
    try {
      const value = JSON.parse(textDecoder.decode(archive[metaEntry]));
      if (value && typeof value === 'object' && !Array.isArray(value)) meta = value as Record<string, unknown>;
      else warnings.push('meta.json ne contient pas un objet JSON.');
    } catch {
      warnings.push('meta.json est présent mais illisible.');
    }
  } else warnings.push('meta.json absent : identité et version de base inconnues.');
  const projects = [...normalized.keys()].filter((entry) => /^projects\/P\d{2}\.tar$/i.test(entry)).sort();
  const sounds = [...normalized.keys()].filter((entry) => /^sounds\/[^/]+\.wav$/i.test(entry)).sort();
  if (!projects.length) warnings.push('Aucune archive de projet /projects/Pxx.tar trouvée.');
  return {
    kind: filename.toLowerCase().endsWith('.pak') && !filename.toLowerCase().endsWith('.ppak') ? 'pak' : 'ppak',
    meta,
    projects,
    sounds,
    entries,
    warnings,
  };
}

export function readEp133ProjectDocument(json: string) {
  const value: unknown = JSON.parse(json);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Projet JSON invalide.');
  const project = value as Record<string, unknown>;
  if (project.schema !== 'ep.project.v1' || project.product !== 'ep133') throw new Error('Schéma ep.project.v1 pour EP-133 attendu.');
  if (!Array.isArray(project.patterns) || !Array.isArray(project.pads)) throw new Error('Projet incomplet : pads et patterns sont obligatoires.');
  return project;
}
