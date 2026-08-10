import { EDITOR_GROUPS, type EditorPadMode } from './exporters.ts';
import { emptyProjectPatterns, normalizeSequencerNote, type ProjectPatterns } from './model.ts';

export const STUDIO_LIBRARY_KEY = 'ep133-rhythm-hero:studio-projects:v1';

export interface StudioProjectRecord {
  id: string;
  updatedAt: string;
  document: Record<string, unknown>;
}

export interface StudioProjectState {
  title: string;
  bpm: number;
  patterns: ProjectPatterns;
  padModes: Record<string, EditorPadMode>;
}

export function loadStudioLibrary(storage: Pick<Storage, 'getItem'>): StudioProjectRecord[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(STUDIO_LIBRARY_KEY) || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((record): record is StudioProjectRecord => Boolean(record && typeof record === 'object' && typeof record.id === 'string' && record.document));
  } catch {
    return [];
  }
}

function randomProjectId() {
  const uuid = globalThis.crypto?.randomUUID?.() || `${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  return `studio-${Date.now()}-${uuid}`;
}

function writeStudioLibrary(storage: Pick<Storage, 'setItem'>, library: StudioProjectRecord[]) {
  storage.setItem(STUDIO_LIBRARY_KEY, JSON.stringify(library));
  return library;
}

export function storeStudioProject(storage: Pick<Storage, 'setItem'>, library: StudioProjectRecord[], document: Record<string, unknown>, existingId?: string | null) {
  const id = existingId || randomProjectId();
  const record = { id, updatedAt: new Date().toISOString(), document };
  const next = [...library.filter((item) => item.id !== id), record].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return { id, library: writeStudioLibrary(storage, next) };
}

export function renameStudioProject(storage: Pick<Storage, 'setItem'>, library: StudioProjectRecord[], id: string, title: string) {
  const cleanTitle = title.trim();
  if (!cleanTitle) return library;
  const next = library.map((record) => record.id !== id ? record : {
    ...record,
    updatedAt: new Date().toISOString(),
    document: { ...record.document, metadata: { ...((record.document.metadata as Record<string, unknown> | undefined) || {}), title: cleanTitle } },
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return writeStudioLibrary(storage, next);
}

export function duplicateStudioProject(storage: Pick<Storage, 'setItem'>, library: StudioProjectRecord[], id: string, title: string) {
  const source = library.find((record) => record.id === id);
  if (!source) return null;
  const document = structuredClone(source.document);
  document.metadata = { ...((document.metadata as Record<string, unknown> | undefined) || {}), title: title.trim() || 'COPIE DU PROJET' };
  return storeStudioProject(storage, library, document);
}

export function deleteStudioProject(storage: Pick<Storage, 'setItem'>, library: StudioProjectRecord[], id: string) {
  return writeStudioLibrary(storage, library.filter((record) => record.id !== id));
}

export function studioStateFromDocument(document: Record<string, unknown>): StudioProjectState {
  if (document.schema !== 'ep.project.v1' || document.product !== 'ep133') throw new Error('Projet EP-133 incompatible.');
  const patterns = emptyProjectPatterns();
  if (!Array.isArray(document.patterns)) throw new Error('Patterns absents du projet.');
  const scenes = Array.isArray(document.scenes) ? document.scenes : [];
  const song = Array.isArray(document.song) ? document.song : [];
  const firstSceneNumber = Number(song[0]) || Number(document.currentScene) || 1;
  const firstScene = scenes.find((candidate) => candidate && typeof candidate === 'object' && Number((candidate as Record<string, unknown>).scene || scenes.indexOf(candidate) + 1) === firstSceneNumber) as Record<string, unknown> | undefined;
  const selectedPatterns = Array.isArray(firstScene?.groupPatterns) ? firstScene.groupPatterns.map(Number) : [1, 1, 1, 1];
  document.patterns.forEach((candidate) => {
    if (!candidate || typeof candidate !== 'object') return;
    const pattern = candidate as Record<string, unknown>;
    const match = /^([A-D])\d{2}$/.exec(String(pattern.id || ''));
    if (!match || !Array.isArray(pattern.events)) return;
    const group = match[1] as keyof ProjectPatterns;
    const groupIndex = EDITOR_GROUPS.indexOf(group);
    if (Number(String(pattern.id).slice(1)) !== (selectedPatterns[groupIndex] || 1)) return;
    patterns[group] = pattern.events.flatMap((candidateEvent, index) => {
      if (!candidateEvent || typeof candidateEvent !== 'object') return [];
      const event = candidateEvent as Record<string, unknown>;
      const tick = Number(event.tick); const pad = Number(event.pad) - 1;
      if (!Number.isFinite(tick) || !Number.isInteger(pad) || pad < 0 || pad > 11) return [];
      return [normalizeSequencerNote({
        id: `${group}-${pattern.id}-${index}-${tick}`,
        group,
        beat: tick / 96,
        pad,
        note: Number.isFinite(Number(event.note)) ? Number(event.note) : undefined,
        velocity: Number(event.velocity),
        duration: Number(event.duration) / 96,
      })];
    });
  });
  const padModes: Record<string, EditorPadMode> = {};
  if (Array.isArray(document.pads)) document.pads.forEach((candidate) => {
    if (!candidate || typeof candidate !== 'object') return;
    const pad = candidate as Record<string, unknown>;
    const group = String(pad.group); const number = Number(pad.pad); const playMode = Number(pad.playMode);
    if (!EDITOR_GROUPS.includes(group as keyof ProjectPatterns) || number < 1 || number > 12) return;
    padModes[`${group}:${number - 1}`] = playMode === 1 ? 'KEYS' : playMode === 2 ? 'LEGATO' : 'ONE';
  });
  const metadata = document.metadata && typeof document.metadata === 'object' ? document.metadata as Record<string, unknown> : {};
  const settings = document.settings && typeof document.settings === 'object' ? document.settings as Record<string, unknown> : {};
  return { title: String(metadata.title || 'PROJET EP-133'), bpm: Math.max(20, Math.min(300, Number(settings.bpm) || 120)), patterns, padModes };
}
