import { strToU8, zipSync } from 'fflate';
import { EDITOR_GROUPS, type EditorGroup } from './exporters.ts';

/** Représentation volontairement souple de `ep.project.v1` pour l'export archive. */
export interface Ep133ProjectDocumentLike {
  metadata?: { title?: string };
  settings?: { bpm?: number };
  pads?: Array<{ group?: EditorGroup; pad?: number; slot?: number; playMode?: number; rootNote?: number }>;
  patterns?: Array<{ id?: string; bars?: number; events?: Array<{ tick?: number; pad?: number; note?: number; velocity?: number; duration?: number }> }>;
  scenes?: Array<{ scene?: number; groupPatterns?: number[]; timeSignature?: [number, number] }>;
  song?: number[];
  currentScene?: number | null;
}

const encoder = new TextEncoder();
const writeAscii = (target: Uint8Array, offset: number, value: string, length: number) => {
  target.set(encoder.encode(value).subarray(0, length), offset);
};
const writeOctal = (target: Uint8Array, offset: number, length: number, value: number) => {
  const text = Math.max(0, Math.floor(value)).toString(8).padStart(length - 1, '0').slice(-(length - 1));
  writeAscii(target, offset, `${text}\0`, length);
};
const writeLeU16 = (target: Uint8Array, offset: number, value: number) => {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >> 8) & 0xff;
};
const writeLeU32 = (target: Uint8Array, offset: number, value: number) => {
  const safe = Math.max(0, Math.floor(value)) >>> 0;
  target[offset] = safe & 0xff;
  target[offset + 1] = (safe >> 8) & 0xff;
  target[offset + 2] = (safe >> 16) & 0xff;
  target[offset + 3] = (safe >> 24) & 0xff;
};

function tarMember(name: string, payload: Uint8Array) {
  const header = new Uint8Array(512);
  writeAscii(header, 0, name, 100);
  writeAscii(header, 100, '0000644\0', 8);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, payload.length);
  writeOctal(header, 136, 12, 0);
  header.fill(32, 148, 156);
  header[156] = 48;
  writeAscii(header, 257, 'ustar\0', 6);
  writeAscii(header, 263, '00', 2);
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  writeAscii(header, 148, `${checksum.toString(8).padStart(6, '0')}\0 `, 8);
  const padding = new Uint8Array((512 - (payload.length % 512)) % 512);
  return [header, payload, padding];
}

function buildPadRecord(pad: { slot?: number; playMode?: number; rootNote?: number }) {
  const raw = new Uint8Array(26);
  writeLeU16(raw, 1, Math.max(0, Math.min(65535, pad.slot ?? 0)));
  raw[3] = 0;
  writeLeU32(raw, 4, 0);
  writeLeU32(raw, 8, 0);
  new DataView(raw.buffer).setFloat32(12, 120, true);
  raw[16] = 127;
  raw[17] = 0;
  raw[18] = 0;
  raw[19] = 0;
  raw[20] = 127;
  raw[21] = 0;
  raw[22] = 0;
  raw[23] = Math.max(0, Math.min(2, pad.playMode ?? 0));
  raw[24] = Math.max(0, Math.min(127, pad.rootNote ?? 60));
  return raw;
}

function buildPatternRecord(pattern: NonNullable<Ep133ProjectDocumentLike['patterns']>[number]) {
  const events = (pattern.events ?? []).slice(0, 255);
  const raw = new Uint8Array(4 + events.length * 8);
  raw[1] = Math.max(1, Math.min(99, pattern.bars ?? 1));
  raw[2] = events.length;
  events.forEach((event, index) => {
    const offset = 4 + index * 8;
    writeLeU16(raw, offset, Math.max(0, Math.min(65535, event.tick ?? 0)));
    raw[offset + 2] = Math.max(0, Math.min(88, ((event.pad ?? 1) - 1) * 8));
    raw[offset + 3] = Math.max(0, Math.min(127, event.note ?? 60));
    raw[offset + 4] = Math.max(0, Math.min(127, event.velocity ?? 100));
    writeLeU16(raw, offset + 5, Math.max(1, Math.min(65535, event.duration ?? 24)));
  });
  return raw;
}

function buildScenesRecord(document: Ep133ProjectDocumentLike) {
  const raw = new Uint8Array(712);
  for (let index = 0; index < 99; index += 1) {
    raw[7 + index * 6 + 4] = 4;
    raw[7 + index * 6 + 5] = 4;
  }
  (document.scenes ?? []).forEach((scene) => {
    const number = Math.max(1, Math.min(99, scene.scene ?? 1));
    const offset = 7 + (number - 1) * 6;
    const groups = scene.groupPatterns ?? [0, 0, 0, 0];
    raw.set(groups.slice(0, 4).map((value) => Math.max(0, Math.min(99, value ?? 0))), offset);
    raw[offset + 4] = Math.max(1, Math.min(255, scene.timeSignature?.[0] ?? 4));
    raw[offset + 5] = Math.max(1, Math.min(255, scene.timeSignature?.[1] ?? 4));
  });
  const trailer = 7 + 99 * 6;
  raw[trailer + 3] = Math.max(0, Math.min(99, document.currentScene ?? 0));
  const song = (document.song ?? []).slice(0, 99).map((scene) => Math.max(0, Math.min(99, scene)));
  raw[trailer + 11] = song.length;
  raw.set(song, trailer + 12);
  return raw;
}

/**
 * Produit un conteneur `.ppak` autonome lisible par l'inspecteur du Studio.
 * Il s'agit d'un export hors ligne expérimental : aucun octet n'est envoyé à
 * la machine et la compatibilité firmware doit encore être confirmée sur un
 * appareil avec un projet complet.
 */
export function buildEp133Ppak(document: Ep133ProjectDocumentLike, sounds: Record<string, Uint8Array> = {}) {
  const pads = new Map<string, { slot?: number; playMode?: number; rootNote?: number }>();
  (document.pads ?? []).forEach((pad) => pads.set(`${pad.group}:${pad.pad}`, pad));
  const members: Array<[string, Uint8Array]> = [];
  EDITOR_GROUPS.forEach((group) => Array.from({ length: 12 }, (_, index) => {
    const pad = pads.get(`${group}:${index + 1}`) ?? {};
    members.push([`pads/${group.toLowerCase()}/p${String(index + 1).padStart(2, '0')}`, buildPadRecord(pad)]);
  }));
  (document.patterns ?? []).forEach((pattern) => {
    const match = /^([ABCD])(\d{1,2})$/i.exec(pattern.id ?? '');
    if (!match) return;
    members.push([`patterns/${match[1].toLowerCase()}${String(Number(match[2])).padStart(2, '0')}`, buildPatternRecord(pattern)]);
  });
  const settings = new Uint8Array(224);
  new DataView(settings.buffer).setFloat32(4, Math.max(20, Math.min(300, document.settings?.bpm ?? 120)), true);
  members.push(['scenes', buildScenesRecord(document)], ['settings', settings]);
  const tarParts = members.flatMap(([name, payload]) => tarMember(name, payload));
  tarParts.push(new Uint8Array(1024));
  const tar = new Uint8Array(tarParts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  tarParts.forEach((part) => { tar.set(part, offset); offset += part.length; });
  const title = document.metadata?.title?.trim() || 'EP-133 KO II STUDIO';
  const entries: Record<string, Uint8Array> = {
    'meta.json': strToU8(JSON.stringify({ product: 'ep133', device_version: '2.5', title, format: 'ppak' })),
    'projects/P01.tar': tar,
    ...sounds,
  };
  return zipSync(entries, { level: 6 });
}
