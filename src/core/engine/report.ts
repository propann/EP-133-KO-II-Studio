/**
 * Rapport de progression par pad — P1 du plan issu du croisement des deux
 * audits externes et de l'analyse GPT indépendante (12 août, voir
 * docs/ROADMAP.md et docs/REGISTRE_IDEES.md Q-07) : « le différenciant le
 * plus fort face à un coach générique comme Melodics, parce qu'il connaît
 * les vraies frappes du joueur, pas un simple catalogue ».
 *
 * Fonctions pures, sans dépendance à React — testées directement par
 * `tools/check-engine.mjs`, pas seulement par lecture de code.
 */
import type { Grade } from './types';

export interface PlayerNoteRecord {
  pad: number;
  grade: Grade;
  /** Écart signé en millisecondes : négatif = frappe en avance, positif = en retard. Absent (Infinity/NaN) pour un MISS sans cible appariée. */
  deltaMs: number;
}

export interface PadReportEntry {
  pad: number;
  hits: number;
  perfect: number;
  good: number;
  miss: number;
  /** Moyenne signée des écarts des frappes jugées (PERFECT/GOOD) ; `null` si aucune frappe jugeable. */
  averageDeltaMs: number | null;
}

/**
 * Regroupe les frappes d'une session par pad, triées du pad le plus fautif
 * au moins fautif (le rapport doit d'abord montrer où travailler, pas
 * flatter les pads déjà maîtrisés). Un pad jamais joué n'apparaît pas —
 * mieux qu'une ligne à zéro partout.
 */
export function buildPadReport(notes: PlayerNoteRecord[]): PadReportEntry[] {
  const byPad = new Map<number, PlayerNoteRecord[]>();
  notes.forEach((note) => {
    const list = byPad.get(note.pad) || [];
    list.push(note);
    byPad.set(note.pad, list);
  });
  return [...byPad.entries()]
    .map(([pad, list]) => {
      const perfect = list.filter((note) => note.grade === 'PERFECT').length;
      const good = list.filter((note) => note.grade === 'GOOD').length;
      const miss = list.filter((note) => note.grade === 'MISS').length;
      const judged = list.filter((note) => note.grade !== 'MISS' && Number.isFinite(note.deltaMs));
      const averageDeltaMs = judged.length ? judged.reduce((sum, note) => sum + note.deltaMs, 0) / judged.length : null;
      return { pad, hits: list.length, perfect, good, miss, averageDeltaMs };
    })
    .sort((a, b) => b.miss - a.miss || b.hits - a.hits || a.pad - b.pad);
}

export type TempoDirection = 'reduire' | 'augmenter' | 'garder';
export interface TempoAdvice { direction: TempoDirection; percent: number; reason: string }

/**
 * Conseil de tempo minimal, volontairement grossier plutôt que faussement
 * précis : beaucoup de MISS → ralentir pour stabiliser le geste ; très
 * propre → proposer d'accélérer d'un cran. Rien entre les deux ne mérite un
 * conseil, le silence est plus honnête qu'un pourcentage inventé.
 */
export function adviseTempo(score: { perfect: number; good: number; miss: number }): TempoAdvice {
  const total = score.perfect + score.good + score.miss;
  if (total === 0) return { direction: 'garder', percent: 0, reason: 'Pas encore assez de frappes pour un conseil.' };
  const missRate = score.miss / total;
  const perfectRate = score.perfect / total;
  if (missRate > 0.25) return { direction: 'reduire', percent: 15, reason: `${Math.round(missRate * 100)}% de frappes manquées — ralentis pour stabiliser le geste.` };
  if (missRate < 0.05 && perfectRate > 0.7) return { direction: 'augmenter', percent: 10, reason: `${Math.round(perfectRate * 100)}% de PERFECT — prêt pour un cran plus rapide.` };
  return { direction: 'garder', percent: 0, reason: 'Tempo actuel adapté à ce niveau.' };
}
