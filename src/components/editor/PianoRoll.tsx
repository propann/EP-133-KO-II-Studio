import { useEffect, type RefObject } from 'react';
import type { SequencerNote } from '../../core/project/model';
import { KEY_EDITOR_NOTES, midiNoteName, type EditorGroup } from '../../core/project/exporters';
import { EP133_PADS } from '../../core/project/pads';
import { horizontalWheelScroll } from './fastHorizontalWheel';

interface PianoRollProps {
  gridRef: RefObject<HTMLDivElement | null>;
  group: EditorGroup;
  selectedPad: number;
  bars: number;
  playing: boolean;
  playbackBeat: number;
  targets: SequencerNote[];
  onClose: () => void;
  onPreviewNote: (note: number) => void;
  onToggleNote: (note: number, globalStep: number) => void;
  /** Maj+molette sur une note remplie : ajuste sa vélocité (delta signé, ±8 par cran) — même mécanisme que la grille rythmique. */
  onAdjustVelocity?: (note: number, globalStep: number, delta: number) => void;
  /** Alt+molette sur une note remplie : ajuste sa durée/gate (delta signé en temps). */
  onAdjustDuration?: (note: number, globalStep: number, delta: number) => void;
}

export function PianoRoll({ gridRef, group, selectedPad, bars, playing, playbackBeat, targets, onClose, onPreviewNote, onToggleNote, onAdjustVelocity, onAdjustDuration }: PianoRollProps) {
  const STEP_WIDTH = 60;
  const STEPS_PER_BAR = 16;
  // La réserve d'édition vient après la longueur native, afin que LN.1, LN.2,
  // LN.3 et LN.4 agrandissent effectivement la partition visible.
  const canvasBars = bars + 8;

  // Même mécanisme que RhythmGrid.tsx : écouteur natif (passive:false) plutôt que React
  // onWheel, qui est délégué et enregistré comme passif par React — preventDefault() y
  // échoue en silence et le second cran d'un même geste Maj+molette finit par scroller la
  // grille au lieu d'ajuster la note (bug réel trouvé et corrigé le 12 août sur la grille
  // rythmique, appliqué ici directement plutôt que de redécouvrir le même problème).
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const handleWheel = (event: WheelEvent) => {
      if (!event.shiftKey && !event.altKey) return;
      const cell = (event.target as HTMLElement).closest('button.checked') as HTMLElement | null;
      if (!cell || !el.contains(cell) || cell.dataset.note === undefined) return;
      event.preventDefault();
      const delta = event.deltaY < 0 ? 1 : -1;
      if (event.shiftKey) onAdjustVelocity?.(Number(cell.dataset.note), Number(cell.dataset.step), delta * 8);
      else onAdjustDuration?.(Number(cell.dataset.note), Number(cell.dataset.step), delta * 0.0625);
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [gridRef, onAdjustVelocity, onAdjustDuration]);

  return <div className="key-editor"><div className="key-editor-title"><span>GROUPE {group} · PAD {EP133_PADS[selectedPad].key} · {EP133_PADS[selectedPad].name}</span><b>MODE KEYS · PIANO-ROLL</b><button onClick={onClose}>RETOUR AUX 12 PADS</button></div><div className="editor-grid key-grid" ref={gridRef} onWheelCapture={horizontalWheelScroll}><div className="key-roll" style={{ width: `${160 + canvasBars * STEPS_PER_BAR * STEP_WIDTH}px` }}>
    {playing && <i className="editor-playhead" style={{ left: `${160 + playbackBeat / 4 * STEP_WIDTH}px` }} />}
    <div className="editor-measure-line"><span className="editor-corner">CLAVIER</span><div className="editor-measure-heads" style={{ gridTemplateColumns: `repeat(${canvasBars}, 1fr)` }}>{Array.from({ length: canvasBars }, (_, measure) => <b className={`${measure >= bars ? 'outside-length' : ''} ${targets.some((note) => Math.floor(note.beat / 4) === measure) ? 'has-notes' : ''}`} key={measure}>{measure >= bars ? measure + 1 : `${measure + 1}/${bars}`}</b>)}</div></div>
    <div className="editor-step-line"><span className="editor-corner">NOTES</span><div style={{ gridTemplateColumns: `repeat(${canvasBars * 16}, 1fr)` }}>{Array.from({ length: canvasBars * 16 }, (_, step) => <b className={`${step >= bars * 16 ? 'outside-length' : ''} ${step % 16 === 0 ? 'bar-line' : step % 4 === 0 ? 'beat-line' : ''}`} key={step}>{step % 16 + 1}</b>)}</div></div>
    {KEY_EDITOR_NOTES.map((note) => { const black = [1, 3, 6, 8, 10].includes(note % 12); return <div className="key-row" key={note}><button className={black ? 'black' : 'white'} onClick={() => onPreviewNote(note)}><b>{midiNoteName(note)}</b><small>{note}</small></button><div style={{ gridTemplateColumns: `repeat(${canvasBars * 16}, 1fr)` }}>{Array.from({ length: canvasBars * 16 }, (_, globalStep) => {
      const target = targets.find((candidate) => candidate.pad === selectedPad && candidate.note === note && candidate.beat === globalStep / 4);
      const checked = Boolean(target);
      return <button
        className={`${globalStep >= bars * 16 ? 'outside-length' : ''} ${checked ? 'checked' : ''} ${globalStep % 16 === 0 ? 'bar-line' : globalStep % 4 === 0 ? 'beat-line' : ''}`}
        style={target ? { opacity: 0.4 + 0.6 * (target.velocity / 127) } : undefined}
        onClick={() => onToggleNote(note, globalStep)}
        data-note={note}
        data-step={globalStep}
        title={target ? `Vélocité ${target.velocity}/127 · Durée ${target.duration.toFixed(2)} temps · Maj+molette vélocité · Alt+molette durée` : undefined}
        key={globalStep}
      >{checked ? '●' : ''}</button>;
    })}</div></div>; })}
  </div></div></div>;
}
