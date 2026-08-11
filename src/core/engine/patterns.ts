/**
 * Génération des partitions du jeu Rhythm Hero, par style et par niveau de
 * difficulté (1 à 5), sur des exercices de 6 mesures.
 *
 * Sorti d'`App.tsx` pour réduire la zone de collision avec le travail en
 * cours sur le Studio (voir `docs/AI_HANDOFF.md`) : ce fichier ne touche que
 * la logique du jeu, `App.tsx` se contente désormais d'appeler
 * `createSixBarExercise`.
 *
 * Boom-Bap (`createBoomBapTargets`) reste la référence déjà validée : 5
 * niveaux écrits à la main, une variation en mesure 5 et un fill en mesure 6.
 * House, Rock, Reggae et Minimal suivent maintenant le même principe et
 * remplacent la génération procédurale générique qui restait pour ces
 * quatre styles — ce sont les quatre styles de niveau 1 du catalogue
 * (`exercises/catalogue-exercices-v1.json`), les patterns de référence
 * viennent de `handbook/EP133_ATLAS_FINGER_DRUMMING.md` quand une fiche
 * existe. Les 34 autres styles gardent `createGenericExercise` en attendant
 * leur tour.
 *
 * Légende des pads utilisés (voir `src/core/project/pads.ts`) :
 * 0 KICK · 1 CLAP · 2 SNARE · 3 OPEN HAT · 4 CLOSED HAT · 5 RIDE ·
 * 6 PERC 1 · 7 PERC 2 · 8 PERC 3 · 9 SHAKER · 10 BASS · 11 FX
 */
import type { Exercise } from './types';
import catalogue from '../../../exercises/catalogue-exercices-v1.json';

export interface StyleOption {
  id: string;
  label: string;
  bpm: number;
}

const styleLabel = (key: string) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').toUpperCase();

export const STYLES: StyleOption[] = catalogue.exercises.map((item) => ({
  id: item.key,
  label: `${String(item.id).padStart(2, '0')} · ${styleLabel(item.key)}`,
  bpm: item.bpm,
}));

/** Référence déjà validée (voir `docs/ETAT_DU_PROJET.md`) : ne pas modifier les niveaux sans repasser par une validation explicite. */
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

/**
 * House 4/4 — le kick reste une horloge à tous les niveaux ; le groove vient
 * des charleys et de la perc, jamais du kick lui-même (handbook § House/Disco,
 * 124 BPM). Le niveau 3 reprend exactement le motif de référence de l'atlas.
 */
function createHouseTargets(difficulty: number): Exercise['targets'] {
  const targets: Exercise['targets'] = [];
  const addSteps = (bar: number, pad: number, steps: number[]) => steps.forEach((step) => targets.push({ id: `house-${difficulty}-${bar}-${pad}-${step}`, beat: bar * 4 + step / 4, pad }));
  const levels = [
    { kick: [0, 4, 8, 12], clap: [4, 12], hat: [], open: [], perc: [] },
    { kick: [0, 4, 8, 12], clap: [4, 12], hat: [2, 6, 10, 14], open: [], perc: [] },
    { kick: [0, 4, 8, 12], clap: [4, 12], hat: [2, 6, 10, 14], open: [], perc: [1, 9] },
    { kick: [0, 4, 8, 12], clap: [4, 12], hat: [2, 6, 10, 14], open: [6, 14], perc: [1, 9] },
    { kick: [0, 4, 7, 8, 12], clap: [4, 12], hat: [2, 6, 10, 14], open: [6, 14], perc: [1, 9, 11] },
  ][difficulty - 1];
  for (let bar = 0; bar < 6; bar += 1) {
    addSteps(bar, 0, levels.kick);
    addSteps(bar, 1, levels.clap);
    addSteps(bar, 4, levels.hat);
    addSteps(bar, 3, levels.open);
    addSteps(bar, 6, levels.perc);
    if (bar === 4 && difficulty >= 2) addSteps(bar, 1, [15]);
    if (bar === 5) {
      if (difficulty >= 3) addSteps(bar, 3, [13, 14, 15]);
      if (difficulty >= 4) addSteps(bar, 7, [12, 13, 14, 15]);
      if (difficulty === 5) addSteps(bar, 1, [10, 11, 13, 14]);
    }
  }
  return [...new Map(targets.map((target) => [`${target.beat}-${target.pad}`, target])).values()];
}

/**
 * Rock droit — alternance kick/snare franche dès le niveau 1 (« alternance
 * simple », catalogue #3) ; le charley se densifie ensuite, la ride et la
 * poussée du kick n'arrivent qu'à partir du niveau 4. Pas de fiche dédiée
 * dans l'atlas : gabarit 4/4 standard.
 */
function createRockTargets(difficulty: number): Exercise['targets'] {
  const targets: Exercise['targets'] = [];
  const addSteps = (bar: number, pad: number, steps: number[]) => steps.forEach((step) => targets.push({ id: `rock-${difficulty}-${bar}-${pad}-${step}`, beat: bar * 4 + step / 4, pad }));
  const hatByLevel = [
    [0, 4, 8, 12],
    [0, 4, 8, 12],
    [0, 2, 4, 6, 8, 10, 12, 14],
    [0, 2, 4, 6, 8, 10, 12, 14],
    Array.from({ length: 16 }, (_, step) => step),
  ];
  const levels = [
    { kick: [0, 8], snare: [4, 12], ride: [] },
    { kick: [0, 8], snare: [4, 12], ride: [] },
    { kick: [0, 8], snare: [4, 12], ride: [] },
    { kick: [0, 8, 10], snare: [4, 12], ride: [0, 8] },
    { kick: [0, 8, 10], snare: [4, 7, 12, 15], ride: [0, 8] },
  ][difficulty - 1];
  for (let bar = 0; bar < 6; bar += 1) {
    addSteps(bar, 0, levels.kick);
    addSteps(bar, 2, levels.snare);
    addSteps(bar, 4, hatByLevel[difficulty - 1]);
    addSteps(bar, 5, levels.ride);
    if (bar === 4 && difficulty >= 2) addSteps(bar, 2, [14]);
    if (bar === 5) {
      if (difficulty >= 3) addSteps(bar, 7, [12, 14]);
      if (difficulty >= 4) addSteps(bar, 0, [13, 14]);
      if (difficulty === 5) addSteps(bar, 8, [15]);
    }
  }
  return [...new Map(targets.map((target) => [`${target.beat}-${target.pad}`, target])).values()];
}

/**
 * Reggae one drop → rockers — le niveau 1 est le one drop littéral : kick et
 * snare ensemble sur le seul temps 3, rien d'autre (« contretemps »,
 * catalogue #4). Le niveau 3 introduit le riddim complet de l'atlas
 * (§ Reggae/Dancehall, 92 BPM) ; la basse dub n'arrive qu'au niveau 4.
 */
function createReggaeTargets(difficulty: number): Exercise['targets'] {
  const targets: Exercise['targets'] = [];
  const addSteps = (bar: number, pad: number, steps: number[]) => steps.forEach((step) => targets.push({ id: `reggae-${difficulty}-${bar}-${pad}-${step}`, beat: bar * 4 + step / 4, pad }));
  const levels = [
    { kick: [8], snare: [8], hat: [], perc: [], bass: [] },
    { kick: [8], snare: [8], hat: [2, 6, 10, 14], perc: [], bass: [] },
    { kick: [0, 10], snare: [4, 12], hat: [2, 6, 10, 14], perc: [3, 4, 11, 12], bass: [] },
    { kick: [0, 10], snare: [4, 12], hat: [2, 6, 10, 14], perc: [3, 4, 11, 12], bass: [6, 14] },
    { kick: [0, 10], snare: [4, 12], hat: [2, 6, 10, 14], perc: [3, 4, 9, 11, 12], bass: [6, 14] },
  ][difficulty - 1];
  for (let bar = 0; bar < 6; bar += 1) {
    addSteps(bar, 0, levels.kick);
    addSteps(bar, 2, levels.snare);
    addSteps(bar, 4, levels.hat);
    addSteps(bar, 6, levels.perc);
    addSteps(bar, 10, levels.bass);
    if (bar === 4 && difficulty >= 2) addSteps(bar, 6, [15]);
    if (bar === 5) {
      if (difficulty >= 3) addSteps(bar, 7, [12, 14]);
      if (difficulty >= 4) addSteps(bar, 11, [8]);
      if (difficulty === 5) addSteps(bar, 10, [8, 10, 12, 14]);
    }
  }
  return [...new Map(targets.map((target) => [`${target.beat}-${target.pad}`, target])).values()];
}

/**
 * Minimal pulse — la compétence enseignée est le silence, pas la vitesse
 * (« laisser des silences », catalogue #5). Particularité volontaire : à
 * partir du niveau 2, la mesure 6 retire des frappes au lieu d'en ajouter —
 * au niveau 5, le kick tient seul la dernière mesure. Le vide est la
 * difficulté, pas une frappe de plus à mémoriser.
 */
function createMinimalTargets(difficulty: number): Exercise['targets'] {
  const targets: Exercise['targets'] = [];
  const addSteps = (bar: number, pad: number, steps: number[]) => steps.forEach((step) => targets.push({ id: `minimal-${difficulty}-${bar}-${pad}-${step}`, beat: bar * 4 + step / 4, pad }));
  const levels = [
    { kick: [0, 8], hat: [], perc: [] },
    { kick: [0, 8], hat: [10], perc: [] },
    { kick: [0, 4, 8, 12], hat: [6, 14], perc: [] },
    { kick: [0, 4, 8, 12], hat: [2, 6, 10, 14], perc: [11] },
    { kick: [0, 4, 8, 12], hat: [2, 6, 10, 14], perc: [3, 11] },
  ][difficulty - 1];
  for (let bar = 0; bar < 6; bar += 1) {
    const theDrop = bar === 5 && difficulty >= 2;
    addSteps(bar, 0, levels.kick);
    if (!theDrop) addSteps(bar, 4, levels.hat);
    if (!theDrop || difficulty < 5) addSteps(bar, 6, levels.perc);
  }
  return [...new Map(targets.map((target) => [`${target.beat}-${target.pad}`, target])).values()];
}

const DEDICATED_STYLES: Record<string, { title: string; targets: (difficulty: number) => Exercise['targets'] }> = {
  boom: { title: 'BOOM-BAP', targets: createBoomBapTargets },
  house: { title: 'HOUSE 4/4', targets: createHouseTargets },
  rock: { title: 'ROCK DROIT', targets: createRockTargets },
  reggae: { title: 'REGGAE ONE DROP', targets: createReggaeTargets },
  minimal: { title: 'MINIMAL PULSE', targets: createMinimalTargets },
};

/** Génération procédurale provisoire pour les styles qui n'ont pas encore leurs 5 niveaux écrits à la main (voir docs/ETAT_DU_PROJET.md). */
function createGenericExercise(style: StyleOption, difficulty: number, tempo: number): Exercise {
  const targets: Exercise['targets'] = [];
  const add = (bar: number, beat: number, pad: number) => targets.push({ id: `${bar}-${beat}-${pad}`, beat: bar * 4 + beat, pad });
  for (let bar = 0; bar < 6; bar += 1) {
    const kick = style.id === 'funk' ? [0, .75, 2, 2.75] : style.id === 'afro' ? [0, 1.75, 3] : style.id === 'garage' || style.id === 'dnb' ? [0, 2.5] : style.id === 'electro' ? [0, 1.5, 2.5] : [0, 2];
    kick.forEach((beat) => add(bar, beat, 0));
    (style.id === 'garage' || style.id === 'dnb' ? [2] : [1, 3]).forEach((beat) => add(bar, beat, 2));
    const hatStep = difficulty >= 4 ? 0.25 : difficulty >= 2 ? 0.5 : 1;
    const hatOffset = style.id === 'funk' ? .5 : 0;
    for (let beat = hatOffset; beat < 4; beat += hatStep) add(bar, beat, 4);
    if (style.id === 'afro' || style.id === 'funk' || difficulty >= 3) [0.75, 2.75].forEach((beat) => add(bar, beat, 6));
    if (style.id === 'afro' && difficulty >= 2) [1.5, 3.5].forEach((beat) => add(bar, beat, 7));
    if (difficulty >= 4 && bar >= 3) [1.5, 3.25].forEach((beat) => add(bar, beat, 7));
    if (difficulty === 5 && bar >= 4) [3, 3.25, 3.5, 3.75].forEach((beat) => add(bar, beat, 8));
    if (difficulty >= 3 && bar % 2 === 1) add(bar, 3.5, 0);
  }
  const uniqueTargets = [...new Map(targets.map((target) => [`${target.beat}-${target.pad}`, target])).values()];
  return { id: `${style.id}-${difficulty}`, title: style.label, description: `Niveau ${difficulty} · 6 mesures progressives`, bpm: tempo, bars: 6, timeSignature: '4/4', countInBars: 1, backingTrack: null, grading: { perfectMs: 35, goodMs: 90 }, targets: uniqueTargets };
}

export function createSixBarExercise(styleId: string, difficulty: number, tempo: number): Exercise {
  const style = STYLES.find((item) => item.id === styleId) || STYLES[0];
  const dedicated = DEDICATED_STYLES[style.id];
  if (dedicated) {
    return {
      id: `${style.id}-${difficulty}`,
      title: `${dedicated.title} · NIVEAU ${difficulty}`,
      description: `Partition ${dedicated.title} ${difficulty}/5 · 6 mesures`,
      bpm: tempo,
      bars: 6,
      timeSignature: '4/4',
      countInBars: 1,
      backingTrack: null,
      grading: { perfectMs: 35, goodMs: 90 },
      targets: dedicated.targets(difficulty),
    };
  }
  return createGenericExercise(style, difficulty, tempo);
}
