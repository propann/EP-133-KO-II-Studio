import type { Grade } from '../../core/engine/types';
import { EP133_PADS } from '../../core/project/pads';

interface PerformancePanelProps {
  transportActive: boolean;
  expectedPad?: number;
  flashedPad: { pad: number; grade: Grade } | null;
  combo: number;
  onPlayPad: (pad: number) => void;
  onEditPad: (pad: number) => void;
}

/** Plus de VU-mètres décoratifs — retirés le 11/08, trop d'info à côté du
 * pavé de pads. Seul le combo reste visible, en repère compact. */
export function PerformancePanel({ transportActive, expectedPad, flashedPad, combo, onPlayPad, onEditPad }: PerformancePanelProps) {
  return <section className="performance-panel">
    {combo > 0 && <span className="combo-badge">COMBO {combo}</span>}
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
  </section>;
}
