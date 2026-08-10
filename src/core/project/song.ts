/**
 * Hiérarchie de composition réelle de l'EP-133 (manuel OS 2.0, section 6) :
 * un groupe possède jusqu'à 99 patterns, une scène choisit un pattern par
 * groupe (ou MUTE), et une liste Song enchaîne des scènes dans l'ordre du
 * morceau. `model.ts` reste la seule représentation d'une frappe
 * (`SequencerNote`) ; ce fichier ajoute la couche au-dessus sans y toucher.
 * Voir `docs/STRUCTURE_SONG_MODE.md` et `docs/MODELE_DONNEES_PROJET.md`.
 */
import { PROJECT_GROUPS, emptyProjectPatterns, type ProjectGroup, type ProjectPatterns, type SequencerNote } from './model.ts';

export const MAX_PATTERN_NUMBER = 99;
export const MAX_SCENE_NUMBER = 99;

/**
 * Toutes les frappes de tous les groupes, indexées par numéro de pattern
 * 1–99. La présence d'une clé signale l'existence du pattern (même sans
 * frappe) — distinct de « contient des notes ».
 */
export type PatternBank = Record<ProjectGroup, Record<number, SequencerNote[]>>;

/**
 * Une scène : le pattern actif par groupe (ou `null` = MUTE, encodé `0` côté
 * machine réelle) et sa signature rythmique.
 */
export interface SceneDefinition {
  scene: number; // 1–99
  groupPatterns: Record<ProjectGroup, number | null>;
  timeSignature: [number, number];
}

/** Banque vide — état initial d'un nouveau projet Studio. */
export function emptyPatternBank(): PatternBank {
  return { A: {}, B: {}, C: {}, D: {} };
}

/**
 * Réplique exactement la règle de `decodeEp133ProjectTar`
 * (`importers.ts:370-372`) : une scène est « utilisée » si au moins un
 * groupe a un pattern non nul. Une scène entièrement MUTE n'est jamais
 * exportée, comme le ferait la machine elle-même.
 */
export function sceneIsUsed(scene: SceneDefinition): boolean {
  return PROJECT_GROUPS.some((group) => scene.groupPatterns[group] !== null && scene.groupPatterns[group] !== undefined);
}

/**
 * Traduit banque + scène vers `ProjectPatterns` (les 4 groupes à plat) — la
 * seule fonction-pont vers RhythmGrid/PianoRoll/PadStrip/`createMidiFile`,
 * qui continuent de ne connaître qu'« un pattern par groupe » sans savoir
 * qu'il vient d'une scène précise. Un groupe MUTE ou un pattern absent de la
 * banque donne un pattern vide, jamais une exception.
 */
export function patternsForScene(bank: PatternBank, scenes: SceneDefinition[], sceneNumber: number): ProjectPatterns {
  const scene = scenes.find((candidate) => candidate.scene === sceneNumber);
  const patterns = emptyProjectPatterns();
  if (!scene) return patterns;
  PROJECT_GROUPS.forEach((group) => {
    const patternNumber = scene.groupPatterns[group];
    if (patternNumber === null || patternNumber === undefined) return;
    patterns[group] = bank[group][patternNumber] || [];
  });
  return patterns;
}

/** Numéros de pattern existants pour un groupe, triés — alimente le sélecteur de pattern et le pool de l'Arrangeur. */
export function patternNumbersForGroup(bank: PatternBank, group: ProjectGroup): number[] {
  return Object.keys(bank[group]).map(Number).sort((a, b) => a - b);
}

/** Combien de Song Positions (dans `song`) référencent cette scène — sert à signaler un partage dans l'Arrangeur. */
export function songPositionsForScene(song: number[], sceneNumber: number): number[] {
  return song.reduce<number[]>((positions, scene, index) => (scene === sceneNumber ? [...positions, index] : positions), []);
}

/** Premier numéro de scène libre (1–99) — utilisé par [DUP] et [+ NEW SONG POS] pour créer une scène indépendante. */
export function nextFreeSceneNumber(scenes: SceneDefinition[]): number {
  const used = new Set(scenes.map((scene) => scene.scene));
  for (let candidate = 1; candidate <= MAX_SCENE_NUMBER; candidate += 1) if (!used.has(candidate)) return candidate;
  return MAX_SCENE_NUMBER;
}

/** Première scène « vide » (tout MUTE) avec la signature 4/4 — état de départ d'une Song Position neuve sans source à copier. */
export function emptyScene(sceneNumber: number): SceneDefinition {
  return { scene: sceneNumber, groupPatterns: { A: null, B: null, C: null, D: null }, timeSignature: [4, 4] };
}
