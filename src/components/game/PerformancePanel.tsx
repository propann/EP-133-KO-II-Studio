import type { Grade, Score } from '../../core/engine/types';
import { adviseTempo, buildPadReport, type PlayerNoteRecord } from '../../core/engine/report';
import { EP133_PADS } from '../../core/project/pads';

interface PerformancePanelProps {
  transportActive: boolean;
  expectedPad?: number;
  flashedPad: { pad: number; grade: Grade } | null;
  score: Score;
  playerNotes: PlayerNoteRecord[];
  onPlayPad: (pad: number) => void;
  onEditPad: (pad: number) => void;
}

const formatDelta = (ms: number | null) => {
  if (ms === null) return '—';
  const rounded = Math.round(ms);
  if (Math.abs(rounded) < 3) return 'PILE';
  return `${rounded > 0 ? '+' : ''}${rounded}ms ${rounded > 0 ? 'RETARD' : 'AVANCE'}`;
};

/**
 * Pads réduits et décalés sur le côté (11/08), avec un vrai cadre de
 * retour de performance à côté — plus de VU-mètres décoratifs ni de badge
 * combo isolé, l'analyse de la session (PERFECT/GOOD/MISS, combo, meilleur
 * combo, écart moyen) vit ici, dans un seul bloc lisible.
 *
 * Rapport par pad ajouté le 12 août (P1, voir docs/ROADMAP.md et
 * docs/REGISTRE_IDEES.md Q-07) : montre où travailler en premier — les
 * pads les plus fautifs en tête — plutôt qu'un seul écart moyen global qui
 * peut masquer un pad très en retard compensé par un autre très en avance.
 */
export function PerformancePanel({ transportActive, expectedPad, flashedPad, score, playerNotes, onPlayPad, onEditPad }: PerformancePanelProps) {
  const averageMs = score.hits > 0 ? score.totalDeltaMs / score.hits : null;
  const padReport = buildPadReport(playerNotes);
  const tempoAdvice = adviseTempo(score);
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
      {padReport.length > 0 && <>
        <b className="performance-report-title">PAR PAD · À TRAVAILLER EN PREMIER</b>
        <ul className="performance-pad-report">
          {padReport.map((entry) => {
            const visual = EP133_PADS[entry.pad];
            const confusedVisual = entry.confusedWithPad !== null ? EP133_PADS[entry.confusedWithPad] : null;
            return <li className={`cat-${visual.category}`} key={entry.pad}>
              <span className="performance-pad-name"><i className="pad-dot" />{visual.name}</span>
              <span className="performance-pad-counts">{entry.perfect}P · {entry.good}G · {entry.miss}M</span>
              <span className="performance-pad-delta">{formatDelta(entry.averageDeltaMs)}</span>
              {confusedVisual && <span className="performance-pad-confusion">↷ SOUVENT CONFONDU AVEC {confusedVisual.name} ({entry.confusedCount}×)</span>}
            </li>;
          })}
        </ul>
        {tempoAdvice.direction !== 'garder' && <p className={`performance-tempo-advice ${tempoAdvice.direction}`}>
          {tempoAdvice.direction === 'reduire' ? `↓ RALENTIR DE ${tempoAdvice.percent}%` : `↑ ACCÉLÉRER DE ${tempoAdvice.percent}%`}
          <small>{tempoAdvice.reason}</small>
        </p>}
      </>}
    </aside>
  </section>;
}
