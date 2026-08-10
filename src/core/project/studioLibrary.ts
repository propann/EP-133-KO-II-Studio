/**
 * Save/Load local du Studio : une bibliothèque de projets `ep.project.v1`
 * dans `localStorage`, plus la conversion vers/depuis l'état interne du
 * Studio (`StudioProjectState`). N'invente aucun format propre à Rhythm
 * Hero — enveloppe seulement le document musical partagé avec `exporters.ts`
 * / `importers.ts`. Voir `docs/VALIDATION_SAVE_LOAD_STUDIO.md`.
 */
import { EDITOR_GROUPS, type EditorPadMode } from './exporters.ts';
import { normalizeSequencerNote, type ProjectGroup, type ProjectPatterns } from './model.ts';
import { emptyPatternBank, patternsForScene, type PatternBank, type SceneDefinition } from './song.ts';

export const STUDIO_LIBRARY_KEY = 'ep133-rhythm-hero:studio-projects:v1';

/** Une entrée de la bibliothèque locale : un projet `ep.project.v1` horodaté et identifié. */
export interface StudioProjectRecord {
  id: string;
  updatedAt: string;
  document: Record<string, unknown>;
}

export interface StudioProjectState {
  title: string;
  bpm: number;
  /** Tous les patterns de tous les groupes — voir `core/project/song.ts`. */
  patternBank: PatternBank;
  scenes: SceneDefinition[];
  song: number[];
  currentScene: number | null;
  /** Vue de confort : les 4 patterns de la scène de départ (première Song Position, sinon `currentScene`, sinon 1) — pour les appelants qui n'ont pas encore besoin de la banque complète. */
  patterns: ProjectPatterns;
  padModes: Record<string, EditorPadMode>;
}

/** Relit la bibliothèque locale ; filtre silencieusement toute entrée corrompue plutôt que d'échouer entièrement. */
export function loadStudioLibrary(storage: Pick<Storage, 'getItem'>): StudioProjectRecord[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(STUDIO_LIBRARY_KEY) || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter((record): record is StudioProjectRecord => Boolean(record && typeof record === 'object' && typeof record.id === 'string' && record.document));
  } catch {
    return [];
  }
}

/** Identifiant de projet ; `crypto.randomUUID()` a un repli si indisponible (contexte non sécurisé, ex. HTTP simple sur réseau local). */
function randomProjectId() {
  const uuid = globalThis.crypto?.randomUUID?.() || `${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  return `studio-${Date.now()}-${uuid}`;
}

/** Seul point d'écriture de la bibliothèque — tous les autres exports passent par ici, jamais un `setItem` direct. */
function writeStudioLibrary(storage: Pick<Storage, 'setItem'>, library: StudioProjectRecord[]) {
  storage.setItem(STUDIO_LIBRARY_KEY, JSON.stringify(library));
  return library;
}

/** Crée ou met à jour une entrée (nouveau projet si `existingId` absent), et remonte la liste triée par date de modification. */
export function storeStudioProject(storage: Pick<Storage, 'setItem'>, library: StudioProjectRecord[], document: Record<string, unknown>, existingId?: string | null) {
  const id = existingId || randomProjectId();
  const record = { id, updatedAt: new Date().toISOString(), document };
  const next = [...library.filter((item) => item.id !== id), record].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return { id, library: writeStudioLibrary(storage, next) };
}

/** Renomme sans toucher au contenu musical ; ignore une saisie vide plutôt que d'effacer le titre. */
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

/** Copie profonde du document source sous un nouvel identifiant ; renvoie `null` si la source n'existe plus. */
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

/**
 * Convertit un document `ep.project.v1` (local ou scanné sur la machine) vers
 * l'état interne du Studio. **Peut lever une exception** si le document est
 * incompatible ou incomplet (schéma, patterns absents) — tout appelant doit
 * l'entourer d'un `try/catch` et afficher un message plutôt que de laisser
 * l'éditeur bloqué en silence après un `stopEditorTransport()` déjà exécuté.
 */
export function studioStateFromDocument(document: Record<string, unknown>): StudioProjectState {
  if (document.schema !== 'ep.project.v1' || document.product !== 'ep133') throw new Error('Projet EP-133 incompatible.');
  if (!Array.isArray(document.patterns)) throw new Error('Patterns absents du projet.');

  // Tous les patterns de tous les groupes — plus de filtre sur « le seul pattern sélectionné ».
  const patternBank = emptyPatternBank();
  document.patterns.forEach((candidate) => {
    if (!candidate || typeof candidate !== 'object') return;
    const pattern = candidate as Record<string, unknown>;
    const match = /^([A-D])(\d{2})$/.exec(String(pattern.id || ''));
    if (!match || !Array.isArray(pattern.events)) return;
    const group = match[1] as ProjectGroup;
    const number = Number(match[2]);
    patternBank[group][number] = pattern.events.flatMap((candidateEvent, index) => {
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

  // Toutes les scènes — le fallback « scene: index+1 » couvre nativement les anciens documents où le champ `scene` est absent.
  const rawScenes = Array.isArray(document.scenes) ? document.scenes : [];
  const scenes: SceneDefinition[] = rawScenes.map((candidate, index) => {
    const record = (candidate && typeof candidate === 'object' ? candidate : {}) as Record<string, unknown>;
    const sceneNumber = Number(record.scene) || index + 1;
    const rawGroupPatterns = Array.isArray(record.groupPatterns) ? record.groupPatterns.map(Number) : [0, 0, 0, 0];
    const groupPatterns = Object.fromEntries(
      EDITOR_GROUPS.map((group, groupIndex) => [group, rawGroupPatterns[groupIndex] > 0 ? rawGroupPatterns[groupIndex] : null]),
    ) as Record<ProjectGroup, number | null>;
    const rawTimeSignature = Array.isArray(record.timeSignature) ? record.timeSignature.map(Number) : [];
    const timeSignature: [number, number] = [rawTimeSignature[0] || 4, rawTimeSignature[1] || 4];
    return { scene: sceneNumber, groupPatterns, timeSignature };
  });

  const song = Array.isArray(document.song) ? document.song.map(Number).filter(Number.isFinite) : [];
  const currentScene = Number.isFinite(Number(document.currentScene)) ? Number(document.currentScene) : null;

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
  const startingScene = song[0] ?? currentScene ?? 1;
  return {
    title: String(metadata.title || 'PROJET EP-133'),
    bpm: Math.max(20, Math.min(300, Number(settings.bpm) || 120)),
    patternBank,
    scenes,
    song,
    currentScene,
    patterns: patternsForScene(patternBank, scenes, startingScene),
    padModes,
  };
}
