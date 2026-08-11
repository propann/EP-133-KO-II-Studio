import type { RefObject } from 'react';
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
  onToggleCommittedStep?: (sectionKey: string, measure: number, pad: number, step: number) => void;
}

export function RhythmGrid(props: RhythmGridProps) {
  const committedSections = props.committedSections || [];
  const committedBars = committedSections.reduce((total, section) => total + section.bars, 0);
  const totalBars = committedBars + props.bars;
  const sectionAtMeasure = (measure: number) => {
    let start = 0;
    for (const section of committedSections) {
      if (measure < start + section.bars) return { section, start, localMeasure: measure - start };
      start += section.bars;
    }
    return null;
  };
  return <div className="editor-grid" ref={props.gridRef} onWheel={horizontalWheelScroll}><div className="editor-horizontal" style={{ width: `max(100%, ${160 + totalBars * 960}px)` }}>
    {props.playing && <i className="editor-playhead" style={{ left: `${160 + props.playbackBeat / 4 * 960}px` }} />}
    <div className="editor-measure-line"><span className="editor-corner">PISTES</span><div className="editor-measure-heads" style={{ gridTemplateColumns: `repeat(${totalBars}, 1fr)` }}>{Array.from({ length: totalBars }, (_, measure) => {
      const committed = sectionAtMeasure(measure);
      const draftMeasure = measure - committedBars;
      const sourceTargets = committed?.section.targets || props.targets;
      const localMeasure = committed ? committed.localMeasure : draftMeasure;
      const hasNotes = sourceTargets.some((note) => Math.floor(note.beat / 4) === localMeasure);
      return <b className={`${hasNotes ? 'has-notes' : ''} ${committed ? 'committed' : ''} ${committed?.localMeasure === 0 ? 'section-start' : ''} ${committed && committed.localMeasure === committed.section.bars - 1 ? 'section-end' : ''}`} key={measure}>{committed ? `${committed.section.label} · ${committed.localMeasure + 1}/${committed.section.bars}` : props.mode === 'complete' ? `${draftMeasure + 1}/${props.bars}` : `MESURE ${draftMeasure + 1}`}</b>;
    })}</div></div>
    <div className="editor-step-line"><span className="editor-corner">PAS</span><div style={{ gridTemplateColumns: `repeat(${totalBars * 16}, 1fr)` }}>{Array.from({ length: totalBars * 16 }, (_, globalStep) => <b className={`${globalStep % 16 === 0 ? 'bar-line' : globalStep % 4 === 0 ? 'beat-line' : ''} ${globalStep < committedBars * 16 ? 'committed' : ''}`} key={globalStep}>{globalStep % 16 + 1}</b>)}</div></div>
    {EP133_SCORE_TRACKS.map((track) => {
      const scannedMode = props.scannedPlayMode(track.pad) === 1 ? 'KEYS' : 'ONE';
      const melodic = props.mode === 'complete' && (props.padModes[`${props.group}:${track.pad}`] || scannedMode) === 'KEYS';
      return <div className={`editor-horizontal-row ${props.mode === 'complete' && props.selectedPad === track.pad ? 'selected-pad' : ''} ${melodic ? 'melodic-track' : ''}`} key={track.pad}><strong onClick={() => { props.onSelectPad(track.pad); if (melodic) props.onOpenKeys(); }}>{props.padName(track.pad)} · {props.group}-{EP133_PADS[track.pad].key}{props.mode === 'complete' ? ` · ${melodic ? 'KEYS ♫' : 'ONE'}` : ''}</strong><div style={{ gridTemplateColumns: `repeat(${totalBars * 16}, 1fr)` }}>{Array.from({ length: totalBars * 16 }, (_, globalStep) => {
        const measure = Math.floor(globalStep / 16); const step = globalStep % 16;
        const committed = sectionAtMeasure(measure);
        const localMeasure = committed ? committed.localMeasure : measure - committedBars;
        const beat = localMeasure * 4 + step / 4;
        const sourceTargets = committed?.section.targets || props.targets;
        const stepTargets = sourceTargets.filter((target) => target.pad === track.pad && target.beat === beat);
        const noteLabel = stepTargets.filter((target) => target.note !== undefined).map((target) => midiNoteName(target.note!)).join('/');
        return <button className={`${stepTargets.length ? 'checked' : ''} ${globalStep % 16 === 0 ? 'bar-line' : globalStep % 4 === 0 ? 'beat-line' : ''} ${committed ? 'committed' : ''} ${committed?.localMeasure === 0 && step === 0 ? 'section-start' : ''} ${committed && committed.localMeasure === committed.section.bars - 1 && step === 15 ? 'section-end' : ''}`} onClick={() => committed ? props.onToggleCommittedStep?.(committed.section.key, localMeasure, track.pad, step) : melodic ? (props.onSelectPad(track.pad), props.onOpenKeys()) : props.onToggleStep(localMeasure, track.pad, step)} aria-label={`${props.padName(track.pad)}, longueur ${measure + 1}, pas ${step + 1}`} key={globalStep}>{stepTargets.length ? noteLabel || EP133_PADS[track.pad].key : ''}</button>;
      })}</div></div>;
    })}
  </div></div>;
}
