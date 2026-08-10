/**
 * Modèle canonique du Studio EP-133.
 *
 * `SequencerNote` est la seule représentation interne d'une frappe, que
 * l'origine soit un exercice pédagogique du jeu, l'éditeur USER, un import
 * MIDI ou un projet `.pak/.ppak` décodé. Les cibles pédagogiques
 * (`Exercise['targets']`) ne sont converties qu'aux deux frontières via
 * `exerciseTargetsToNotes` / `notesToExerciseTargets` — le reste du Studio
 * (séquenceur, piano-roll, Save/Load, export MIDI/JSON) ne connaît que ce
 * fichier. Voir `docs/MODELE_DONNEES_PROJET.md`.
 */
import type { Exercise } from '../engine/types';

/** Groupe de pads EP-133 : A, B, C ou D (12 pads chacun). */
export type ProjectGroup = 'A' | 'B' | 'C' | 'D';

/**
 * Une frappe unique dans un pattern du Studio.
 * `beat` est en noires (1 temps = 1.0) ; `pad` est l'index interne 0–11 dans
 * son groupe (pas la touche visuelle affichée à l'écran).
 */
export interface SequencerNote {
  id: string;
  group: ProjectGroup;
  beat: number;
  pad: number;
  /** Note MIDI explicite (mode KEYS/piano-roll) ; absente en mode ONE, où le pad seul détermine le son. */
  note?: number;
  /** 1–127. */
  velocity: number;
  /** Durée en noires. */
  duration: number;
}

/** Les quatre pistes du Studio, une par groupe de pads. */
export type ProjectPatterns = Record<ProjectGroup, SequencerNote[]>;

export const PROJECT_GROUPS: ProjectGroup[] = ['A', 'B', 'C', 'D'];
export const DEFAULT_NOTE_VELOCITY = 100;
export const DEFAULT_NOTE_DURATION = 0.25;

/** Patterns vides pour les 4 groupes — état initial d'un nouveau projet Studio. */
export function emptyProjectPatterns(): ProjectPatterns {
  return { A: [], B: [], C: [], D: [] };
}

/** Convertit les cibles d'un exercice pédagogique (jeu) vers le modèle Studio, sur un seul groupe. */
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

/** Sens inverse d'`exerciseTargetsToNotes` : ne conserve que les champs utiles au jeu (vélocité/durée Studio perdues). */
export function notesToExerciseTargets(notes: SequencerNote[]): Exercise['targets'] {
  return notes.map(({ id, beat, pad, note }) => ({ id, beat, pad, note }));
}

/**
 * Force une note (venant d'un import MIDI, d'un projet machine décodé ou
 * d'une saisie utilisateur) dans les bornes valides : vélocité 1–127 et durée
 * jamais plus courte qu'un pas de grille (1/96 de noire, résolution interne
 * de l'EP-133).
 */
export function normalizeSequencerNote(note: Partial<SequencerNote> & Pick<SequencerNote, 'id' | 'group' | 'beat' | 'pad'>): SequencerNote {
  const velocity = typeof note.velocity === 'number' && Number.isFinite(note.velocity) ? note.velocity : DEFAULT_NOTE_VELOCITY;
  const duration = typeof note.duration === 'number' && Number.isFinite(note.duration) ? note.duration : DEFAULT_NOTE_DURATION;
  return {
    ...note,
    velocity: Math.max(1, Math.min(127, Math.round(velocity))),
    duration: Math.max(1 / 96, duration),
  };
}
