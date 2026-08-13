import { unzipSync } from 'fflate';
import { EDITOR_GROUPS, PAD_MIDI_NOTES, type EditorGroup, type EditorPatterns } from './exporters.ts';
import type { SequencerNote } from './model.ts';

export interface ImportedMidiEvent extends SequencerNote {}

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
  decodedProjects: Ep133ProjectArchive[];
  warnings: string[];
}

export interface Ep133PadRecord {
  group: EditorGroup;
  pad: number;
  size: 26 | 27;
  slot: number;
  midiChannel: number;
  trimStart: number;
  trimLength: number;
  sampleBpm: number;
  amplitude: number;
  pitch: number;
  pitchFraction: number | null;
  pan: number;
  attack: number;
  release: number;
  timeMode: number;
  muteGroup: number;
  playMode: number;
  rootNote: number;
  raw: Uint8Array;
}

export interface Ep133NoteRecord {
  kind: 'note';
  tick: number;
  pad: number;
  note: number;
  velocity: number;
  duration: number;
  flag: number;
  raw: Uint8Array;
}

export interface Ep133AutomationRecord {
  kind: 'automation';
  tick: number;
  parameter: number;
  value: number;
  recordType: number;
  flag: number;
  raw: Uint8Array;
}

export interface Ep133PatternRecord {
  group: EditorGroup;
  pattern: number;
  bars: number;
  reserved: number;
  notes: Ep133NoteRecord[];
  automation: Ep133AutomationRecord[];
  raw: Uint8Array;
}

export interface Ep133SceneRecord {
  scene: number;
  groupPatterns: [number, number, number, number];
  timeSignature: [number, number];
}

export interface Ep133ProjectArchive {
  path: string;
  pads: Ep133PadRecord[];
  patterns: Ep133PatternRecord[];
  scenes: Ep133SceneRecord[];
  song: number[];
  currentScene: number | null;
  bpm: number | null;
  members: Record<string, Uint8Array>;
  warnings: string[];
}

const textDecoder = new TextDecoder();
const readU16 = (data: Uint8Array, offset: number) => (data[offset] << 8) | data[offset + 1];
const readU32 = (data: Uint8Array, offset: number) => ((data[offset] * 0x1000000) + (data[offset + 1] << 16) + (data[offset + 2] << 8) + data[offset + 3]) >>> 0;
const readLeU16 = (data: Uint8Array, offset: number) => data[offset] | (data[offset + 1] << 8);
const readLeU32 = (data: Uint8Array, offset: number) => (data[offset] + data[offset + 1] * 0x100 + data[offset + 2] * 0x10000 + data[offset + 3] * 0x1000000) >>> 0;
const readLeF32 = (data: Uint8Array, offset: number) => new DataView(data.buffer, data.byteOffset + offset, 4).getFloat32(0, true);
const signedByte = (value: number) => value > 127 ? value - 256 : value;

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
  const patterns = Object.fromEntries(EDITOR_GROUPS.map((group) => [group, events.filter((event) => event.group === group)])) as EditorPatterns;
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
  const decodedProjects = projects.map((path) => decodeEp133ProjectTar(archive[normalized.get(path)!], path));
  return {
    kind: filename.toLowerCase().endsWith('.pak') && !filename.toLowerCase().endsWith('.ppak') ? 'pak' : 'ppak',
    meta,
    projects,
    sounds,
    entries,
    decodedProjects,
    warnings,
  };
}

function readTarMembers(data: Uint8Array) {
  const members: Record<string, Uint8Array> = {};
  const warnings: string[] = [];
  let offset = 0;
  while (offset + 512 <= data.length) {
    const header = data.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const name = textDecoder.decode(header.subarray(0, 100)).replace(/\0.*$/, '');
    const sizeText = textDecoder.decode(header.subarray(124, 136)).replace(/\0.*$/, '').trim();
    if (!name || !/^[0-7]*$/.test(sizeText)) {
      warnings.push(`En-tête TAR invalide à l’octet ${offset}.`);
      break;
    }
    const size = sizeText ? Number.parseInt(sizeText, 8) : 0;
    const payloadStart = offset + 512;
    const payloadEnd = payloadStart + size;
    if (!Number.isSafeInteger(size) || payloadEnd > data.length) {
      warnings.push(`Membre TAR ${name} tronqué.`);
      break;
    }
    const checksumText = textDecoder.decode(header.subarray(148, 156)).replace(/\0.*$/, '').trim();
    if (/^[0-7]+$/.test(checksumText)) {
      const expected = Number.parseInt(checksumText, 8);
      const actual = header.reduce((sum, byte, index) => sum + (index >= 148 && index < 156 ? 32 : byte), 0);
      if (expected !== actual) warnings.push(`Somme de contrôle TAR incorrecte pour ${name}.`);
    }
    if (members[name]) warnings.push(`Membre TAR dupliqué : ${name}.`);
    members[name] = data.slice(payloadStart, payloadEnd);
    offset = payloadStart + Math.ceil(size / 512) * 512;
  }
  return { members, warnings };
}

function decodePad(raw: Uint8Array, group: EditorGroup, pad: number, warnings: string[]): Ep133PadRecord | null {
  if (raw.length !== 26 && raw.length !== 27) {
    warnings.push(`Pad ${group}-${pad} ignoré : ${raw.length} octets au lieu de 26 ou 27.`);
    return null;
  }
  if (raw[0] !== 0) warnings.push(`Pad ${group}-${pad} : octet de validité non nul (${raw[0]}).`);
  return {
    group, pad, size: raw.length, slot: readLeU16(raw, 1), midiChannel: raw[3],
    trimStart: readLeU32(raw, 4), trimLength: readLeU32(raw, 8), sampleBpm: readLeF32(raw, 12),
    amplitude: raw[16], pitch: signedByte(raw[17]), pitchFraction: raw.length === 27 ? raw[26] : null,
    pan: signedByte(raw[18]), attack: raw[19], release: raw[20], timeMode: raw[21],
    muteGroup: raw[22], playMode: raw[23], rootNote: raw[24], raw,
  };
}

function decodePattern(raw: Uint8Array, group: EditorGroup, pattern: number, warnings: string[]): Ep133PatternRecord | null {
  if (raw.length < 4) {
    warnings.push(`Pattern ${group}${String(pattern).padStart(2, '0')} trop court.`);
    return null;
  }
  if (raw[0] !== 0) warnings.push(`Pattern ${group}${String(pattern).padStart(2, '0')} : octet de sécurité non nul.`);
  const count = raw[2];
  if (raw.length !== 4 + count * 8) warnings.push(`Pattern ${group}${String(pattern).padStart(2, '0')} : taille ${raw.length}, ${4 + count * 8} attendus selon le compteur.`);
  const notes: Ep133NoteRecord[] = [];
  const automation: Ep133AutomationRecord[] = [];
  const available = Math.min(count, Math.floor((raw.length - 4) / 8));
  for (let index = 0; index < available; index += 1) {
    const record = raw.slice(4 + index * 8, 12 + index * 8);
    const tick = readLeU16(record, 0);
    if (record[2] === 1 || record[2] === 5) {
      const value = readLeU16(record, 5);
      if (record[3] > 11) warnings.push(`Automation ${group}${String(pattern).padStart(2, '0')} : paramètre ${record[3]} inconnu.`);
      if (value > 32767) warnings.push(`Automation ${group}${String(pattern).padStart(2, '0')} : valeur ${value} hors plage sûre.`);
      automation.push({ kind: 'automation', tick, recordType: record[2], parameter: record[3], value, flag: record[7], raw: record });
    } else if (record[2] % 8 === 0 && record[2] <= 88) {
      notes.push({ kind: 'note', tick, pad: record[2] / 8 + 1, note: record[3], velocity: record[4], duration: readLeU16(record, 5), flag: record[7], raw: record });
    } else warnings.push(`Pattern ${group}${String(pattern).padStart(2, '0')} : type d’événement 0x${record[2].toString(16).padStart(2, '0')} conservé mais non décodé.`);
  }
  return { group, pattern, bars: raw[1], reserved: raw[3], notes, automation, raw };
}

export function decodeEp133ProjectTar(data: Uint8Array, path = 'projects/P01.tar'): Ep133ProjectArchive {
  const tar = readTarMembers(data);
  const warnings = [...tar.warnings];
  const pads: Ep133PadRecord[] = [];
  const patterns: Ep133PatternRecord[] = [];
  Object.entries(tar.members).forEach(([name, raw]) => {
    const padMatch = /^pads\/([a-d])\/p(\d{2})$/i.exec(name);
    if (padMatch) {
      const decoded = decodePad(raw, padMatch[1].toUpperCase() as EditorGroup, Number(padMatch[2]), warnings);
      if (decoded) pads.push(decoded);
      return;
    }
    const patternMatch = /^patterns\/([a-d])(\d{2})$/i.exec(name);
    if (patternMatch) {
      const decoded = decodePattern(raw, patternMatch[1].toUpperCase() as EditorGroup, Number(patternMatch[2]), warnings);
      if (decoded) patterns.push(decoded);
    }
  });
  pads.sort((a, b) => EDITOR_GROUPS.indexOf(a.group) - EDITOR_GROUPS.indexOf(b.group) || a.pad - b.pad);
  patterns.sort((a, b) => EDITOR_GROUPS.indexOf(a.group) - EDITOR_GROUPS.indexOf(b.group) || a.pattern - b.pattern);

  const scenes: Ep133SceneRecord[] = [];
  let song: number[] = [];
  let currentScene: number | null = null;
  const sceneRaw = tar.members.scenes;
  if (sceneRaw) {
    if (sceneRaw.length !== 712) warnings.push(`Membre scenes de ${sceneRaw.length} octets au lieu de 712.`);
    if (sceneRaw.length >= 601) {
      for (let index = 0; index < 99 && 7 + index * 6 + 6 <= sceneRaw.length; index += 1) {
        const chunk = sceneRaw.subarray(7 + index * 6, 13 + index * 6);
        if (chunk.subarray(0, 4).some((value) => value !== 0)) {
          scenes.push({ scene: index + 1, groupPatterns: [chunk[0], chunk[1], chunk[2], chunk[3]], timeSignature: [chunk[4], chunk[5]] });
        } else if ((chunk[4] !== 4 || chunk[5] !== 4) && chunk.some((value) => value !== 0)) warnings.push(`Scène inutilisée ${index + 1} avec signature inattendue.`);
      }
      const trailer = 7 + 99 * 6;
      currentScene = sceneRaw.length > trailer + 3 ? sceneRaw[trailer + 3] : null;
      const songLength = sceneRaw.length > trailer + 11 ? sceneRaw[trailer + 11] : 0;
      song = [...sceneRaw.subarray(trailer + 12, Math.min(sceneRaw.length, trailer + 12 + songLength))];
      if (song.length !== songLength) warnings.push('Liste song tronquée dans le membre scenes.');
    }
  }
  const settings = tar.members.settings;
  let bpm: number | null = null;
  if (settings) {
    if (settings.length >= 8) {
      const candidate = readLeF32(settings, 4);
      if (Number.isFinite(candidate) && candidate > 0) bpm = candidate;
      else warnings.push('Tempo du membre settings invalide.');
    } else warnings.push('Membre settings trop court pour lire le tempo.');
  }
  return { path, pads, patterns, scenes, song, currentScene, bpm, members: tar.members, warnings };
}

/** Convertit un projet machine décodé en document éditable intermédiaire.
 * L'archive originale reste intacte et aucune écriture machine n'est déclenchée. */
export function ep133ArchiveProjectToDocument(project: Ep133ProjectArchive, title: string) {
  return {
    schema: 'ep.project.v1', product: 'ep133', metadata: { title },
    settings: { bpm: Math.round(project.bpm || 120) },
    pads: project.pads.map((pad) => ({ group: pad.group, pad: pad.pad, slot: pad.slot, playMode: pad.playMode, rootNote: pad.rootNote })),
    patterns: project.patterns.map((pattern) => ({
      id: `${pattern.group}${String(pattern.pattern).padStart(2, '0')}`, bars: pattern.bars,
      events: pattern.notes.map((note) => ({ tick: note.tick, pad: note.pad, note: note.note, velocity: note.velocity, duration: note.duration })),
    })),
    scenes: project.scenes.map((scene) => ({ scene: scene.scene, groupPatterns: scene.groupPatterns, timeSignature: scene.timeSignature })),
    song: project.song, currentScene: project.currentScene,
  } satisfies Record<string, unknown>;
}

export function readEp133ProjectDocument(json: string) {
  const value: unknown = JSON.parse(json);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Projet JSON invalide.');
  const project = value as Record<string, unknown>;
  if (project.schema !== 'ep.project.v1' || project.product !== 'ep133') throw new Error('Schéma ep.project.v1 pour EP-133 attendu.');
  if (!Array.isArray(project.patterns) || !Array.isArray(project.pads)) throw new Error('Projet incomplet : pads et patterns sont obligatoires.');
  return project;
}
