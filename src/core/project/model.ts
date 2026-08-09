import type { Exercise } from '../engine/types';

export type ProjectGroup = 'A' | 'B' | 'C' | 'D';

export interface SequencerNote {
  id: string;
  group: ProjectGroup;
  beat: number;
  pad: number;
  note?: number;
  velocity: number;
  duration: number;
}

export type ProjectPatterns = Record<ProjectGroup, SequencerNote[]>;

export const PROJECT_GROUPS: ProjectGroup[] = ['A', 'B', 'C', 'D'];
export const DEFAULT_NOTE_VELOCITY = 100;
export const DEFAULT_NOTE_DURATION = 0.25;

export function emptyProjectPatterns(): ProjectPatterns {
  return { A: [], B: [], C: [], D: [] };
}

export function exerciseTargetsToNotes(targets: Exercise['targets'], group: ProjectGroup = 'A'): SequencerNote[] {
  return targets.map((target, index) => ({
    id: target.id || `${group}-${index}-${target.beat}`,
    group,
    beat: target.beat,
    pad: target.pad,
    note: target.note,
    velocity: DEFAULT_NOTE_VELOCITY,
    duration: DEFAULT_NOTE_DURATION,
  }));
}

export function notesToExerciseTargets(notes: SequencerNote[]): Exercise['targets'] {
  return notes.map(({ id, beat, pad, note }) => ({ id, beat, pad, note }));
}

export function normalizeSequencerNote(note: Partial<SequencerNote> & Pick<SequencerNote, 'id' | 'group' | 'beat' | 'pad'>): SequencerNote {
  const velocity = typeof note.velocity === 'number' && Number.isFinite(note.velocity) ? note.velocity : DEFAULT_NOTE_VELOCITY;
  const duration = typeof note.duration === 'number' && Number.isFinite(note.duration) ? note.duration : DEFAULT_NOTE_DURATION;
  return {
    ...note,
    velocity: Math.max(1, Math.min(127, Math.round(velocity))),
    duration: Math.max(1 / 96, duration),
  };
}
