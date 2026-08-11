import type { Grade, Score } from '../../core/engine/types';
import { EP133_PADS } from '../../core/project/pads';

interface PerformancePanelProps {
  transportActive: boolean;
  expectedPad?: number;
  flashedPad: { pad: number; grade: Grade } | null;
  score: Score;
  onPlayPad: (pad: number) => void;
  onEditPad: (pad: number) => void;
}

/**
 * Pads réduits et décalés sur le côté (11/08), avec un vrai cadre de
 * retour de performance à côté — plus de VU-mètres décoratifs ni de badge
 * combo isolé, l'analyse de la session (PERFECT/GOOD/MISS, combo, meilleur
 * combo, écart moyen) vit ici, dans un seul bloc lisible.
 */
export function PerformancePanel({ transportActive, expectedPad, flashedPad, score, onPlayPad, onEditPad }: PerformancePanelProps) {
  const averageMs = score.hits > 0 ? score.totalDeltaMs / score.hits : null;
  return <section className="performance-panel">
    <section className="pads">{EP133_PADS.map((pad, index) => {
      const expected = transportActive && expectedPad === index;
      const played = flashedPad?.pad === index;
      return <div className={`pad-cell cat-${pad.category}`} key={pad.key}>
        <button onClick={(event) => { if (event.detail === 1) onPlayPad(index); }} onDoubleClick={() => onEditPad(index)} className={`${expected ? 'expected-pad ' : ''}${played && flashedPad ? `played-pad ${flashedPad.grade.toLowerCase()}` : ''}`}>
          <b>{pad.key}</b>{pad.name}
        </button>
        {/* Légende sous la touche, comme les repères LPF/ATK/VEL imprimés sous
            les touches réelles de l'EP-133 — jamais dans la touche elle-même. */}
        <em className="pad-caption"><i className="pad-dot" />MAPPING MIDI AUTO</em>
      </div>;
    })}</section>
    <aside className="performance-results">
      <b>ANALYSE</b>
      <div className="performance-grid">
        <div className="performance-stat perfect"><span>PERFECT</span><b>{score.perfect}</b></div>
        <div className="performance-stat good"><span>GOOD</span><b>{score.good}</b></div>
        <div className="performance-stat miss"><span>MISS</span><b>{score.miss}</b></div>
        <div className="performance-stat"><span>COMBO</span><b>{score.combo}</b></div>
        <div className="performance-stat"><span>MEILLEUR</span><b>{score.maxCombo}</b></div>
        <div className="performance-stat"><span>ÉCART</span><b>{averageMs === null ? '—' : `${averageMs > 0 ? '+' : ''}${averageMs.toFixed(0)}ms`}</b></div>
      </div>
    </aside>
  </section>;
}
