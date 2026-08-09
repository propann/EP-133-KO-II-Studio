import type { Exercise, Grade, PadHit, Score, Target } from './types';
export const emptyScore = (): Score => ({
  perfect: 0,
  good: 0,
  miss: 0,
  combo: 0,
  maxCombo: 0,
  totalDeltaMs: 0,
  hits: 0,
});
export const classifyHit = (deltaMs: number, perfectMs: number, goodMs: number): Grade => Math.abs(deltaMs) <= perfectMs ? 'PERFECT' : Math.abs(deltaMs) <= goodMs ? 'GOOD' : 'MISS';
export function scoreHit(exercise: Exercise, hit: PadHit, songTime: number, targets: Target[], score: Score) {
  const candidates = targets.filter(t => !t.hit && t.pad === hit.pad).sort((a,b) => Math.abs(a.beat - songTime) - Math.abs(b.beat - songTime));
  const nearest = candidates[0];
  const deltaMs = nearest ? (songTime - nearest.beat) * 60000 / exercise.bpm : Infinity;
  const grade = classifyHit(deltaMs, exercise.grading.perfectMs, exercise.grading.goodMs);
  if (nearest && grade !== 'MISS') nearest.hit = true;
  const next = { ...score };
  next[grade.toLowerCase() as 'perfect'|'good'|'miss'] += 1;
  next.combo = grade === 'MISS' ? 0 : next.combo + 1;
  next.maxCombo = Math.max(next.maxCombo, next.combo);
  if (grade !== 'MISS') {
    next.totalDeltaMs += Math.abs(deltaMs);
    next.hits += 1;
  }
  return { grade, deltaMs, target: nearest, score: next };
}
