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

/** Clé stable d'un pas de grille à partir de son battement et de son pad — même format `mesure:pad:pas` que RhythmGrid.tsx. */
export function stepKeyFromBeat(beat: number, pad: number): string {
  const measure = Math.floor(beat / 4);
  const step = Math.round((beat - measure * 4) * 4);
  return `${measure}:${pad}:${step}`;
}

/**
 * Multi-sélection + nudge (plan P1/P2, REGISTRE_IDEES.md E-15/E-18) :
 * déplace toutes les notes sélectionnées de `deltaSteps` pas (1 pas = 1/4 de
 * temps), en préservant leurs positions relatives. Renvoie `null` — rien
 * n'est modifié — si la sélection est vide ou si le déplacement ferait
 * sortir une note sélectionnée de la grille (mesure < 0) : tout ou rien,
 * plutôt que de désynchroniser la sélection en clampant certaines notes et
 * pas d'autres. Une note déplacée remplace toute note immobile déjà
 * présente à sa position d'arrivée (même pad, même battement) — jamais
 * deux notes superposées au même endroit.
 */
export function nudgeSelectedNotes(notes: SequencerNote[], selectedKeys: Set<string>, deltaSteps: number): { notes: SequencerNote[]; selectedKeys: Set<string> } | null {
  if (!selectedKeys.size || !deltaSteps) return null;
  const deltaBeat = deltaSteps / 4;
  const wouldGoNegative = notes.some((note) => selectedKeys.has(stepKeyFromBeat(note.beat, note.pad)) && note.beat + deltaBeat < 0);
  if (wouldGoNegative) return null;
  const nextSelectedKeys = new Set<string>();
  const still: SequencerNote[] = [];
  const moved: SequencerNote[] = [];
  notes.forEach((note) => {
    if (!selectedKeys.has(stepKeyFromBeat(note.beat, note.pad))) { still.push(note); return; }
    const beat = note.beat + deltaBeat;
    nextSelectedKeys.add(stepKeyFromBeat(beat, note.pad));
    moved.push({ ...note, beat });
  });
  // Dédoublonne par pad+battement : les notes déplacées sont insérées en dernier dans la Map,
  // donc elles gagnent toujours sur une note immobile qui occupait déjà cette case, quel que
  // soit l'ordre d'origine du tableau — pas seulement quand elles apparaissent après par hasard.
  const byPosition = new Map([...still, ...moved].map((note) => [`${note.pad}-${note.beat}`, note]));
  return { notes: [...byPosition.values()], selectedKeys: nextSelectedKeys };
}
