/**
 * Règles d'extension de grille de l'éditeur USER et du Studio : combien de
 * mesures afficher, et quand en ajouter une automatiquement. Aucune limite de
 * longueur maximale n'est imposée — voir `docs/VALIDATION_SCORE_ET_EXTENSION.md`.
 * Contrôlé par `npm run test:engine`.
 */
import type { SequencerNote } from './model.ts';

export const STEPS_PER_BAR = 16;

/** Numéro de mesure (0-indexé) contenant un pas de grille global donné. */
export function measureFromGlobalStep(globalStep: number) {
  return Math.floor(Math.max(0, globalStep) / STEPS_PER_BAR);
}

/**
 * Nombre de mesures à afficher après avoir écrit ou effacé une note à
 * `measure`. Écrire dans la dernière mesure de réserve (vide) en fait
 * apparaître une nouvelle automatiquement ; effacer une note n'en retire
 * jamais — la longueur ne raccourcit que par action explicite.
 */
export function barsAfterStepEdit(currentBars: number, measure: number, noteAlreadyExists: boolean) {
  const safeBars = Math.max(1, Math.floor(currentBars));
  if (noteAlreadyExists || measure < safeBars - 1) return safeBars;
  return Math.max(safeBars + 1, measure + 2);
}

/** Nombre de mesures réellement écrites (au moins 1), déduit de la note la plus tardive. */
export function usedBars(notes: Pick<SequencerNote, 'beat'>[]) {
  if (!notes.length) return 1;
  return Math.max(1, Math.floor(Math.max(...notes.map((note) => note.beat)) / 4) + 1);
}
