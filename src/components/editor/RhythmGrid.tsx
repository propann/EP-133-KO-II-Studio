import { useEffect, type RefObject } from 'react';
import type { SequencerNote } from '../../core/project/model';
import { midiNoteName, type EditorGroup, type EditorPadMode } from '../../core/project/exporters';
import { EP133_PADS, EP133_SCORE_TRACKS } from '../../core/project/pads';
import { horizontalWheelScroll } from './fastHorizontalWheel';

interface RhythmGridProps {
  gridRef: RefObject<HTMLDivElement | null>;
  bars: number;
  playing: boolean;
  playbackBeat: number;
  mode: 'game' | 'complete';
  group: EditorGroup;
  selectedPad: number;
  targets: SequencerNote[];
  committedSections?: Array<{ key: string; label: string; bars: number; targets: SequencerNote[] }>;
  padModes: Record<string, EditorPadMode>;
  padName: (pad: number) => string;
  scannedPlayMode: (pad: number) => number | undefined;
  onSelectPad: (pad: number) => void;
  onOpenKeys: () => void;
  onToggleStep: (measure: number, pad: number, step: number) => void;
  patternLength?: number;
  onPatternLengthChange?: (length: number) => void;
  onCopyBlock?: (measure: number) => void;
  onDeleteBlock?: (measure: number) => void;
  onToggleCommittedStep?: (sectionKey: string, measure: number, pad: number, step: number) => void;
  /** Maj+molette sur un pas rempli : ajuste sa vélocité (delta signé, ±8 par cran). */
  onAdjustVelocity?: (measure: number, pad: number, step: number, delta: number) => void;
  onAdjustCommittedVelocity?: (sectionKey: string, measure: number, pad: number, step: number, delta: number) => void;
}

export function RhythmGrid(props: RhythmGridProps) {
  const STEP_WIDTH = 60;
  const STEPS_PER_BAR = 16;
  const committedSections = props.committedSections || [];
  const committedBars = committedSections.reduce((total, section) => total + section.bars, 0);
  const totalBars = committedBars + props.bars;
  // Le KO-II allonge le pattern réel, puis l'éditeur garde une réserve blanche
  // après celui-ci. Une réserve globale de 8 mesures masquait LN.1 → LN.4.
  const canvasBars = props.mode === 'complete' ? totalBars + 8 : totalBars;
  const sectionAtMeasure = (measure: number) => {
    let start = 0;
    for (const section of committedSections) {
      if (measure < start + section.bars) return { section, start, localMeasure: measure - start };
      start += section.bars;
    }
    return null;
  };
  // Maj+molette sur un pas rempli ajuste sa vélocité. On écoute en natif
  // (passive:false) plutôt qu'en React onWheel : React enregistre son
  // écouteur délégué comme passif, donc preventDefault() y échoue en
  // silence et le second cran de molette d'un même geste finit par scroller
  // la grille sous le curseur au lieu d'ajuster la note visée.
  useEffect(() => {
    const el = props.gridRef.current;
    if (!el) return;
    const handleWheel = (event: WheelEvent) => {
      if (!event.shiftKey) return;
      const cell = (event.target as HTMLElement).closest('button.checked') as HTMLElement | null;
      if (!cell || !el.contains(cell)) return;
      event.preventDefault();
      const delta = event.deltaY < 0 ? 8 : -8;
      const measure = Number(cell.dataset.measure);
      const pad = Number(cell.dataset.pad);
      const step = Number(cell.dataset.step);
      const sectionKey = cell.dataset.sectionKey;
      if (sectionKey) props.onAdjustCommittedVelocity?.(sectionKey, measure, pad, step, delta);
      else props.onAdjustVelocity?.(measure, pad, step, delta);
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [props.gridRef, props.onAdjustVelocity, props.onAdjustCommittedVelocity]);
  return <div className="editor-grid" ref={props.gridRef} onWheelCapture={horizontalWheelScroll}><div className="editor-horizontal" style={{ width: `${160 + canvasBars * STEPS_PER_BAR * STEP_WIDTH}px` }}>
    {props.playing && <i className="editor-playhead" style={{ left: `${160 + props.playbackBeat / 4 * STEP_WIDTH}px` }} />}
    <div className="editor-measure-line"><span className="editor-corner">PISTES</span><div className="editor-measure-heads" style={{ gridTemplateColumns: `repeat(${canvasBars}, 1fr)` }}>{Array.from({ length: canvasBars }, (_, measure) => {
      const committed = sectionAtMeasure(measure);
      const draftMeasure = measure - committedBars;
      const sourceTargets = committed?.section.targets || props.targets;
      const localMeasure = committed ? committed.localMeasure : draftMeasure;
      const hasNotes = sourceTargets.some((note) => Math.floor(note.beat / 4) === localMeasure);
      const outsideLength = !committed && draftMeasure >= props.bars;
      return <b className={`${hasNotes ? 'has-notes' : ''} ${outsideLength ? 'outside-length' : ''} ${committed ? 'committed' : ''} ${committed?.localMeasure === 0 ? 'section-start' : ''} ${committed && committed.localMeasure === committed.section.bars - 1 ? 'section-end' : ''}`} key={measure}><span>{committed ? `${committed.section.label} · ${committed.localMeasure + 1}/${committed.section.bars}` : props.mode === 'complete' ? outsideLength ? `${draftMeasure + 1}` : `${draftMeasure + 1}/${props.bars}` : `MESURE ${draftMeasure + 1}`}</span>{hasNotes && !committed && props.mode === 'complete' && <details className="pattern-block-menu" onClick={(event) => event.stopPropagation()}><summary aria-label={`Actions du bloc ${draftMeasure + 1}`}>•••</summary><div><span className="pattern-length-menu"><button disabled={props.patternLength === undefined || props.patternLength <= 1} onClick={() => props.patternLength !== undefined && props.onPatternLengthChange?.(props.patternLength - 1)}>−</button><b>LN.{props.patternLength}</b><button disabled={props.patternLength === undefined || props.patternLength >= 99} onClick={() => props.patternLength !== undefined && props.onPatternLengthChange?.(props.patternLength + 1)}>＋</button></span><button onClick={() => props.onCopyBlock?.(draftMeasure)}>COPIER</button><button className="danger" onClick={() => props.onDeleteBlock?.(draftMeasure)}>SUPPRIMER</button></div></details>}</b>;
    })}</div></div>
    <div className="editor-step-line"><span className="editor-corner">PAS</span><div style={{ gridTemplateColumns: `repeat(${canvasBars * 16}, 1fr)` }}>{Array.from({ length: canvasBars * 16 }, (_, globalStep) => <b className={`${globalStep >= totalBars * 16 ? 'outside-length' : ''} ${globalStep % 16 === 0 ? 'bar-line' : globalStep % 4 === 0 ? 'beat-line' : ''} ${globalStep < committedBars * 16 ? 'committed' : ''}`} key={globalStep}>{globalStep % 16 + 1}</b>)}</div></div>
    {EP133_SCORE_TRACKS.map((track) => {
      const scannedMode = props.scannedPlayMode(track.pad) === 1 ? 'KEYS' : 'ONE';
      const melodic = props.mode === 'complete' && (props.padModes[`${props.group}:${track.pad}`] || scannedMode) === 'KEYS';
      return <div className={`editor-horizontal-row ${props.mode === 'complete' && props.selectedPad === track.pad ? 'selected-pad' : ''} ${melodic ? 'melodic-track' : ''}`} key={track.pad}><strong onClick={() => { props.onSelectPad(track.pad); if (melodic) props.onOpenKeys(); }}>{props.padName(track.pad)} · {props.group}-{EP133_PADS[track.pad].key}{props.mode === 'complete' ? ` · ${melodic ? 'KEYS ♫' : 'ONE'}` : ''}</strong><div style={{ gridTemplateColumns: `repeat(${canvasBars * 16}, 1fr)` }}>{Array.from({ length: canvasBars * 16 }, (_, globalStep) => {
        const measure = Math.floor(globalStep / 16); const step = globalStep % 16;
        const committed = sectionAtMeasure(measure);
        const localMeasure = committed ? committed.localMeasure : measure - committedBars;
        const beat = localMeasure * 4 + step / 4;
        const sourceTargets = committed?.section.targets || props.targets;
        const stepTargets = sourceTargets.filter((target) => target.pad === track.pad && target.beat === beat);
        const noteLabel = stepTargets.filter((target) => target.note !== undefined).map((target) => midiNoteName(target.note!)).join('/');
        const avgVelocity = stepTargets.length ? Math.round(stepTargets.reduce((total, target) => total + target.velocity, 0) / stepTargets.length) : undefined;
        return <button
          className={`${!committed && localMeasure >= props.bars ? 'outside-length' : ''} ${stepTargets.length ? 'checked' : ''} ${globalStep % 16 === 0 ? 'bar-line' : globalStep % 4 === 0 ? 'beat-line' : ''} ${committed ? 'committed' : ''} ${committed?.localMeasure === 0 && step === 0 ? 'section-start' : ''} ${committed && committed.localMeasure === committed.section.bars - 1 && step === 15 ? 'section-end' : ''}`}
          style={avgVelocity !== undefined ? { opacity: 0.4 + 0.6 * (avgVelocity / 127) } : undefined}
          onClick={() => committed ? props.onToggleCommittedStep?.(committed.section.key, localMeasure, track.pad, step) : melodic ? (props.onSelectPad(track.pad), props.onOpenKeys()) : props.onToggleStep(localMeasure, track.pad, step)}
          aria-label={`${props.padName(track.pad)}, longueur ${measure + 1}, pas ${step + 1}`}
          title={avgVelocity !== undefined ? `Vélocité ${avgVelocity}/127 · Maj+molette pour ajuster` : undefined}
          data-measure={localMeasure}
          data-pad={track.pad}
          data-step={step}
          data-section-key={committed ? committed.section.key : undefined}
          key={globalStep}
        >{stepTargets.length ? noteLabel || EP133_PADS[track.pad].key : ''}</button>;
      })}</div></div>;
    })}
  </div></div>;
}
