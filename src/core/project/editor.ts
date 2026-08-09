import type { SequencerNote } from './model.ts';

export const STEPS_PER_BAR = 16;

export function measureFromGlobalStep(globalStep: number) {
  return Math.floor(Math.max(0, globalStep) / STEPS_PER_BAR);
}

export function barsAfterStepEdit(currentBars: number, measure: number, noteAlreadyExists: boolean) {
  const safeBars = Math.max(1, Math.floor(currentBars));
  if (noteAlreadyExists || measure < safeBars - 1) return safeBars;
  return Math.max(safeBars + 1, measure + 2);
}

export function usedBars(notes: Pick<SequencerNote, 'beat'>[]) {
  if (!notes.length) return 1;
  return Math.max(1, Math.floor(Math.max(...notes.map((note) => note.beat)) / 4) + 1);
}
