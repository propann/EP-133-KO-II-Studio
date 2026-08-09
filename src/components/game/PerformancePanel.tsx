import type { Grade } from '../../core/engine/types';
import { EP133_PADS } from '../../core/project/pads';

interface PerformancePanelProps {
  transportActive: boolean;
  expectedPad?: number;
  flashedPad: { pad: number; grade: Grade } | null;
  midiVelocity: number;
  combo: number;
  onPlayPad: (pad: number) => void;
  onEditPad: (pad: number) => void;
}

export function PerformancePanel({ transportActive, expectedPad, flashedPad, midiVelocity, combo, onPlayPad, onEditPad }: PerformancePanelProps) {
  return <section className="performance-panel">
    <aside className="side-display analog-display model-vu"><small>SON DU JEU</small><div className="analog-vu"><div className="vu-scale"><span>-20</span><span>-6</span><span>0</span><span>+3</span></div><i className="vu-needle" style={{ transform: `rotate(${expectedPad !== undefined ? 48 : -42}deg)` }} /><b>VU</b></div><span>PARTITION · ORANGE</span></aside>
    <section className="pads">{EP133_PADS.map((pad, index) => {
      const expected = transportActive && expectedPad === index;
      const played = flashedPad?.pad === index;
      return <button key={pad.key} onClick={(event) => { if (event.detail === 1) onPlayPad(index); }} onDoubleClick={() => onEditPad(index)} className={`${expected ? 'expected-pad ' : ''}${played && flashedPad ? `played-pad ${flashedPad.grade.toLowerCase()}` : ''}`}>
        <b>{pad.key}</b>{pad.name}
        <em>MAPPING MIDI AUTOMATIQUE</em>
      </button>;
    })}</section>
    <aside className="side-display analog-display player-vu"><small>SON DU JOUEUR</small><div className="analog-vu"><div className="vu-scale"><span>-20</span><span>-6</span><span>0</span><span>+3</span></div><i className="vu-needle" style={{ transform: `rotate(${flashedPad ? Math.min(52, -30 + midiVelocity * .65) : -42}deg)` }} /><b>VU</b></div><span>FRAPPES · AMBRE</span><b className="mini-combo">COMBO {combo}</b></aside>
  </section>;
}
