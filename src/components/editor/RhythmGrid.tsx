import { useEffect, useRef, useState, type RefObject } from 'react';
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
  /** Alt+molette sur un pas rempli : ajuste sa durée/gate (delta signé en temps, ±1/16 par cran). Pattern en cours d'édition seulement — pas encore sur les sections commitées. */
  onAdjustDuration?: (measure: number, pad: number, step: number, delta: number) => void;
  /** Ctrl/Cmd+clic sur un pas rempli : bascule sa sélection multiple, plutôt que de le supprimer. */
  onToggleSelectStep?: (measure: number, pad: number, step: number) => void;
  onSelectRectangle?: (startMeasure: number, startPad: number, startStep: number, endMeasure: number, endPad: number, endStep: number) => void;
  onMoveSelection?: (startMeasure: number, startPad: number, startStep: number, endMeasure: number, endPad: number, endStep: number, selectedKeys: Set<string>) => Set<string> | void;
  selectedSteps?: Set<string>;
}

export function RhythmGrid(props: RhythmGridProps) {
  const STEP_WIDTH = 60;
  const STEPS_PER_BAR = 16;
  const committedSections = props.committedSections || [];
  const committedBars = committedSections.reduce((total, section) => total + section.bars, 0);
  const totalBars = committedBars + props.bars;
  const rectangleDrag = useRef<{ mode: 'rectangle' | 'move'; startMeasure: number; startPad: number; startStep: number; anchorMeasure: number; anchorPad: number; anchorStep: number; endMeasure: number; endPad: number; endStep: number; moved: boolean; selectedKeys?: Set<string> } | null>(null);
  const suppressNextClick = useRef(false);
  const [dragPreview, setDragPreview] = useState<{ startMeasure: number; startPad: number; startStep: number; endMeasure: number; endPad: number; endStep: number } | null>(null);
  useEffect(() => {
    const updateFromMouse = (event: MouseEvent) => {
      if (!rectangleDrag.current) return;
      const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest('button[data-step]') as HTMLElement | null;
      const grid = props.gridRef.current;
      if (cell && grid?.contains(cell)) updateDragCell(cell);
    };
    const finishRectangle = () => {
      const drag = rectangleDrag.current;
      if (!drag) return;
      rectangleDrag.current = null;
      setDragPreview(null);
      if (drag.moved) {
        suppressNextClick.current = true;
        if (drag.mode === 'rectangle') props.onSelectRectangle?.(drag.startMeasure, drag.startPad, drag.startStep, drag.endMeasure, drag.endPad, drag.endStep);
      }
    };
    window.addEventListener('mousemove', updateFromMouse);
    window.addEventListener('mouseup', finishRectangle);
    return () => { window.removeEventListener('mousemove', updateFromMouse); window.removeEventListener('mouseup', finishRectangle); };
  }, [props.onSelectRectangle, props.onMoveSelection]);
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
  // Maj+molette ajuste la vélocité, Alt+molette ajuste la durée/gate (pattern en cours
  // d'édition seulement). On écoute en natif (passive:false) plutôt qu'en React onWheel :
  // React enregistre son écouteur délégué comme passif, donc preventDefault() y échoue en
  // silence et le second cran de molette d'un même geste finit par scroller la grille sous
  // le curseur au lieu d'ajuster la note visée (bug réel trouvé et corrigé le 12 août).
  useEffect(() => {
    const el = props.gridRef.current;
    if (!el) return;
    const handleWheel = (event: WheelEvent) => {
      if (!event.shiftKey && !event.altKey) return;
      const cell = (event.target as HTMLElement).closest('button.checked') as HTMLElement | null;
      if (!cell || !el.contains(cell)) return;
      event.preventDefault();
      const measure = Number(cell.dataset.measure);
      const pad = Number(cell.dataset.pad);
      const step = Number(cell.dataset.step);
      const sectionKey = cell.dataset.sectionKey;
      if (event.shiftKey) {
        const delta = event.deltaY < 0 ? 8 : -8;
        if (sectionKey) props.onAdjustCommittedVelocity?.(sectionKey, measure, pad, step, delta);
        else props.onAdjustVelocity?.(measure, pad, step, delta);
      } else if (!sectionKey) {
        // Le gate ne couvre pas encore les sections commitées — la vélocité si, par symétrie
        // avec onAdjustCommittedVelocity, mais le gate reste hors scope pour cette V1.
        const delta = event.deltaY < 0 ? 0.0625 : -0.0625;
        props.onAdjustDuration?.(measure, pad, step, delta);
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [props.gridRef, props.onAdjustVelocity, props.onAdjustCommittedVelocity, props.onAdjustDuration]);
  const updateDragCell = (cell: HTMLElement | null) => {
    const drag = rectangleDrag.current;
    if (!drag || !cell || cell.dataset.measure === undefined || cell.dataset.pad === undefined || cell.dataset.step === undefined) return;
    const measure = Number(cell.dataset.measure); const pad = Number(cell.dataset.pad); const step = Number(cell.dataset.step);
    if (drag.endMeasure === measure && drag.endPad === pad && drag.endStep === step) return;
    drag.moved = true;
    if (drag.mode === 'move') {
      const movedKeys = props.onMoveSelection?.(drag.anchorMeasure, drag.anchorPad, drag.anchorStep, measure, pad, step, drag.selectedKeys || new Set());
      if (movedKeys) drag.selectedKeys = movedKeys;
      drag.startMeasure = measure;
      drag.startPad = pad;
      drag.startStep = step;
      drag.anchorMeasure = measure;
      drag.anchorPad = pad;
      drag.anchorStep = step;
    }
    drag.endMeasure = measure; drag.endPad = pad; drag.endStep = step;
    if (drag.mode === 'rectangle') setDragPreview({ startMeasure: drag.startMeasure, startPad: drag.startPad, startStep: drag.startStep, endMeasure: measure, endPad: pad, endStep: step });
  };
  const isInDragPreview = (measure: number, pad: number, step: number) => {
    if (!dragPreview) return false;
    const firstGlobalStep = Math.min(dragPreview.startMeasure * STEPS_PER_BAR + dragPreview.startStep, dragPreview.endMeasure * STEPS_PER_BAR + dragPreview.endStep);
    const lastGlobalStep = Math.max(dragPreview.startMeasure * STEPS_PER_BAR + dragPreview.startStep, dragPreview.endMeasure * STEPS_PER_BAR + dragPreview.endStep);
    return measure * STEPS_PER_BAR + step >= firstGlobalStep && measure * STEPS_PER_BAR + step <= lastGlobalStep && pad >= Math.min(dragPreview.startPad, dragPreview.endPad) && pad <= Math.max(dragPreview.startPad, dragPreview.endPad);
  };
  return <div className="editor-grid" ref={props.gridRef} onWheelCapture={horizontalWheelScroll} onMouseMove={(event) => updateDragCell((event.target as HTMLElement).closest('button[data-step]'))}><div className="editor-horizontal" style={{ width: `${160 + canvasBars * STEPS_PER_BAR * STEP_WIDTH}px` }}>
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
        const avgDuration = stepTargets.length ? stepTargets.reduce((total, target) => total + target.duration, 0) / stepTargets.length : undefined;
        const selectionKey = `${localMeasure}:${track.pad}:${step}`;
        const selected = !committed && Boolean(props.selectedSteps?.has(selectionKey));
        const titleParts: string[] = [];
        if (avgVelocity !== undefined) titleParts.push(`Vélocité ${avgVelocity}/127 · Maj+molette pour ajuster`);
        if (!committed && avgDuration !== undefined) titleParts.push(`Durée ${avgDuration.toFixed(2)} temps · Alt+molette pour ajuster`);
        return <button
          className={`${!committed && localMeasure >= props.bars ? 'outside-length' : ''} ${stepTargets.length ? 'checked' : ''} ${selected ? 'selected' : ''} ${!committed && isInDragPreview(localMeasure, track.pad, step) ? 'drag-selecting' : ''} ${globalStep % 16 === 0 ? 'bar-line' : globalStep % 4 === 0 ? 'beat-line' : ''} ${committed ? 'committed' : ''} ${committed?.localMeasure === 0 && step === 0 ? 'section-start' : ''} ${committed && committed.localMeasure === committed.section.bars - 1 && step === 15 ? 'section-end' : ''}`}
          style={avgVelocity !== undefined ? { opacity: 0.4 + 0.6 * (avgVelocity / 127), borderBottomWidth: avgDuration !== undefined ? `${Math.min(8, 2 + avgDuration * 2)}px` : undefined } : undefined}
          onClick={(event) => {
            if (suppressNextClick.current) { suppressNextClick.current = false; return; }
            if (!committed && stepTargets.length && (event.ctrlKey || event.metaKey)) { props.onToggleSelectStep?.(localMeasure, track.pad, step); return; }
            if (committed) props.onToggleCommittedStep?.(committed.section.key, localMeasure, track.pad, step);
            else if (melodic) { props.onSelectPad(track.pad); props.onOpenKeys(); }
            else props.onToggleStep(localMeasure, track.pad, step);
          }}
          aria-label={`${props.padName(track.pad)}, longueur ${measure + 1}, pas ${step + 1}`}
          title={titleParts.length ? titleParts.join(' · ') : undefined}
          data-measure={localMeasure}
          data-pad={track.pad}
          data-step={step}
          data-section-key={committed ? committed.section.key : undefined}
          onMouseDown={(event) => {
            if (event.button !== 0 || committed || !event.ctrlKey) return;
            const key = selectionKey;
            const selectedKeys = props.selectedSteps?.has(key) ? new Set(props.selectedSteps) : new Set([key]);
            const selectedTargets = props.targets.filter((target) => selectedKeys.has(`${Math.floor(target.beat / 4)}:${target.pad}:${Math.round((target.beat - Math.floor(target.beat / 4) * 4) * 4)}`));
            const anchorTarget = selectedTargets.reduce<{ measure: number; pad: number; step: number } | null>((anchor, target) => {
              const measure = Math.floor(target.beat / 4); const targetStep = Math.round((target.beat - measure * 4) * 4);
              if (!anchor || measure * 16 + targetStep < anchor.measure * 16 + anchor.step || (measure * 16 + targetStep === anchor.measure * 16 + anchor.step && target.pad < anchor.pad)) return { measure, pad: target.pad, step: targetStep };
              return anchor;
            }, null) || { measure: localMeasure, pad: track.pad, step };
            rectangleDrag.current = { mode: stepTargets.length ? 'move' : 'rectangle', startMeasure: localMeasure, startPad: track.pad, startStep: step, anchorMeasure: anchorTarget.measure, anchorPad: anchorTarget.pad, anchorStep: anchorTarget.step, endMeasure: localMeasure, endPad: track.pad, endStep: step, moved: false, selectedKeys };
            if (!stepTargets.length) setDragPreview({ startMeasure: localMeasure, startPad: track.pad, startStep: step, endMeasure: localMeasure, endPad: track.pad, endStep: step });
            event.preventDefault();
          }}
          key={globalStep}
        >{stepTargets.length ? noteLabel || EP133_PADS[track.pad].key : ''}</button>;
      })}</div></div>;
    })}
  </div></div>;
}
