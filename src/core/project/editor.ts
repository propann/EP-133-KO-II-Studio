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

/** Sélectionne les notes existantes dans un rectangle de la grille. Les
 * bornes sont inclusives et l'ordre du point de départ/arrivée est libre. */
export function selectNotesInGridRectangle(notes: SequencerNote[], startMeasure: number, startPad: number, startStep: number, endMeasure: number, endPad: number, endStep: number): Set<string> {
  const startGlobalStep = startMeasure * STEPS_PER_BAR + startStep;
  const endGlobalStep = endMeasure * STEPS_PER_BAR + endStep;
  const firstGlobalStep = Math.min(startGlobalStep, endGlobalStep);
  const lastGlobalStep = Math.max(startGlobalStep, endGlobalStep);
  const firstPad = Math.min(startPad, endPad);
  const lastPad = Math.max(startPad, endPad);
  return new Set(notes.filter((note) => {
    const measure = Math.floor(note.beat / 4);
    const step = Math.round((note.beat - measure * 4) * 4);
    const globalStep = measure * STEPS_PER_BAR + step;
    return globalStep >= firstGlobalStep && globalStep <= lastGlobalStep && note.pad >= firstPad && note.pad <= lastPad;
  }).map((note) => stepKeyFromBeat(note.beat, note.pad)));
}

/** Déplace une note ou un groupe sélectionné dans la grille, horizontalement
 * et verticalement. Le geste est atomique : si une note sortirait des 12 pads
 * ou avant le début du pattern, rien ne bouge. */
export function moveSelectedNotes(notes: SequencerNote[], selectedKeys: Set<string>, deltaSteps: number, deltaPads: number): { notes: SequencerNote[]; selectedKeys: Set<string> } | null {
  if (!selectedKeys.size || (!deltaSteps && !deltaPads)) return null;
  const selected = notes.filter((note) => selectedKeys.has(stepKeyFromBeat(note.beat, note.pad)));
  if (!selected.length) return null;
  const deltaBeat = deltaSteps / 4;
  if (selected.some((note) => note.beat + deltaBeat < 0 || note.pad + deltaPads < 0 || note.pad + deltaPads > 11)) return null;
  const moved = selected.map((note) => ({ ...note, beat: note.beat + deltaBeat, pad: note.pad + deltaPads }));
  const still = notes.filter((note) => !selectedKeys.has(stepKeyFromBeat(note.beat, note.pad)));
  const byPosition = new Map([...still, ...moved].map((note) => [`${note.pad}-${note.beat}-${note.note ?? 'pad'}`, note]));
  return { notes: [...byPosition.values()], selectedKeys: new Set(moved.map((note) => stepKeyFromBeat(note.beat, note.pad))) };
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

/** Transpose les notes KEYS sélectionnées sans modifier les notes ONE. Tout le
 * geste est refusé si une note sortirait de la plage MIDI 0–127. */
export function transposeSelectedNotes(notes: SequencerNote[], selectedKeys: Set<string>, semitones: number): SequencerNote[] | null {
  if (!selectedKeys.size || !semitones) return null;
  const selected = notes.filter((note) => selectedKeys.has(stepKeyFromBeat(note.beat, note.pad)) && note.note !== undefined);
  if (!selected.length || selected.some((note) => note.note! + semitones < 0 || note.note! + semitones > 127)) return null;
  return notes.map((note) => selectedKeys.has(stepKeyFromBeat(note.beat, note.pad)) && note.note !== undefined
    ? { ...note, note: note.note + semitones }
    : note);
}

/** Duplique le bloc de notes sélectionnées juste à sa suite. La sélection est
 * définie par pas+pad, donc elle couvre aussi toutes les hauteurs KEYS d'un
 * même pas. */
export function duplicateSelectedNotes(notes: SequencerNote[], selectedKeys: Set<string>): { notes: SequencerNote[]; selectedKeys: Set<string> } | null {
  const selected = notes.filter((note) => selectedKeys.has(stepKeyFromBeat(note.beat, note.pad)));
  if (!selected.length) return null;
  const firstBeat = Math.min(...selected.map((note) => note.beat));
  const lastBeat = Math.max(...selected.map((note) => note.beat));
  const offset = Math.max(0.25, lastBeat - firstBeat + 0.25);
  const copies = selected.map((note, index) => ({ ...note, id: `${note.id}-copy-${index}-${Date.now()}`, beat: note.beat + offset }));
  const nextSelectedKeys = new Set(copies.map((note) => stepKeyFromBeat(note.beat, note.pad)));
  const byIdentity = new Map(notes.map((note) => [`${note.pad}-${note.beat}-${note.note ?? 'pad'}`, note]));
  copies.forEach((note) => byIdentity.set(`${note.pad}-${note.beat}-${note.note ?? 'pad'}`, note));
  return { notes: [...byIdentity.values()], selectedKeys: nextSelectedKeys };
}

/** Quantifie les notes sélectionnées sur la grille de 1/16. Les notes non
 * sélectionnées restent intactes ; en cas de collision, la note sélectionnée
 * remplace la note immobile à la même position. */
export function quantizeSelectedNotes(notes: SequencerNote[], selectedKeys: Set<string>): { notes: SequencerNote[]; selectedKeys: Set<string> } | null {
  const selected = notes.filter((note) => selectedKeys.has(stepKeyFromBeat(note.beat, note.pad)));
  if (!selected.length) return null;
  const nextSelectedKeys = new Set<string>();
  const still = notes.filter((note) => !selectedKeys.has(stepKeyFromBeat(note.beat, note.pad)));
  const quantized = selected.map((note) => {
    const beat = Math.max(0, Math.round(note.beat * 4) / 4);
    nextSelectedKeys.add(stepKeyFromBeat(beat, note.pad));
    return { ...note, beat };
  });
  const byIdentity = new Map([...still, ...quantized].map((note) => [`${note.pad}-${note.beat}-${note.note ?? 'pad'}`, note]));
  return { notes: [...byIdentity.values()], selectedKeys: nextSelectedKeys };
}
