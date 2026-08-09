import type { RefObject } from 'react';
import type { SequencerNote } from '../../core/project/model';
import { midiNoteName, type EditorGroup, type EditorPadMode } from '../../core/project/exporters';
import { EP133_PADS, EP133_SCORE_TRACKS } from '../../core/project/pads';

interface RhythmGridProps {
  gridRef: RefObject<HTMLDivElement | null>;
  bars: number;
  playing: boolean;
  playbackBeat: number;
  mode: 'game' | 'complete';
  group: EditorGroup;
  selectedPad: number;
  targets: SequencerNote[];
  padModes: Record<string, EditorPadMode>;
  padName: (pad: number) => string;
  scannedPlayMode: (pad: number) => number | undefined;
  onSelectPad: (pad: number) => void;
  onOpenKeys: () => void;
  onToggleStep: (measure: number, pad: number, step: number) => void;
}

export function RhythmGrid(props: RhythmGridProps) {
  return <div className="editor-grid" ref={props.gridRef}><div className="editor-horizontal" style={{ width: `${160 + props.bars * 960}px` }}>
    {props.playing && <i className="editor-playhead" style={{ left: `${160 + props.playbackBeat / 4 * 960}px` }} />}
    <div className="editor-measure-line"><span className="editor-corner">PISTES</span><div className="editor-measure-heads" style={{ gridTemplateColumns: `repeat(${props.bars}, 1fr)` }}>{Array.from({ length: props.bars }, (_, measure) => <b className={measure === props.bars - 1 ? 'reserve' : ''} key={measure}>MESURE {measure + 1}{measure === props.bars - 1 ? ' · SUITE' : ''}</b>)}</div></div>
    <div className="editor-step-line"><span className="editor-corner">PAS</span><div style={{ gridTemplateColumns: `repeat(${props.bars * 16}, 1fr)` }}>{Array.from({ length: props.bars * 16 }, (_, globalStep) => <b className={`measure-tone-${Math.floor(globalStep / 16) % 2}`} key={globalStep}>{globalStep % 16 + 1}</b>)}</div></div>
    {EP133_SCORE_TRACKS.map((track) => {
      const scannedMode = props.scannedPlayMode(track.pad) === 1 ? 'KEYS' : 'ONE';
      const melodic = props.mode === 'complete' && (props.padModes[`${props.group}:${track.pad}`] || scannedMode) === 'KEYS';
      return <div className={`editor-horizontal-row ${props.mode === 'complete' && props.selectedPad === track.pad ? 'selected-pad' : ''} ${melodic ? 'melodic-track' : ''}`} key={track.pad}><strong onClick={() => { props.onSelectPad(track.pad); if (melodic) props.onOpenKeys(); }}>{props.padName(track.pad)} · {props.group}-{EP133_PADS[track.pad].key}{props.mode === 'complete' ? ` · ${melodic ? 'KEYS ♫' : 'ONE'}` : ''}</strong><div style={{ gridTemplateColumns: `repeat(${props.bars * 16}, 1fr)` }}>{Array.from({ length: props.bars * 16 }, (_, globalStep) => {
        const measure = Math.floor(globalStep / 16); const step = globalStep % 16; const beat = measure * 4 + step / 4;
        const stepTargets = props.targets.filter((target) => target.pad === track.pad && target.beat === beat);
        const noteLabel = stepTargets.filter((target) => target.note !== undefined).map((target) => midiNoteName(target.note!)).join('/');
        return <button className={`${stepTargets.length ? 'checked' : ''} ${measure === props.bars - 1 ? 'reserve' : ''}`} onClick={() => melodic ? (props.onSelectPad(track.pad), props.onOpenKeys()) : props.onToggleStep(measure, track.pad, step)} aria-label={`${props.padName(track.pad)}, mesure ${measure + 1}, pas ${step + 1}`} key={globalStep}>{stepTargets.length ? noteLabel || EP133_PADS[track.pad].key : ''}</button>;
      })}</div></div>;
    })}
  </div></div>;
}
