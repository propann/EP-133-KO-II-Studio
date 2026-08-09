import type { RefObject } from 'react';
import type { Exercise, Grade } from '../../core/engine/types';
import { EP133_PADS, EP133_SCORE_TRACKS } from '../../core/project/pads';

interface PlayedNote {
  beat: number;
  pad: number;
  grade: Grade;
}

interface ScoreViewProps {
  viewportRef: RefObject<HTMLDivElement | null>;
  pageStart: number;
  songBeat: number;
  transportActive: boolean;
  playheadProgress: number;
  expectedTargets: Exercise['targets'];
  playedNotes: PlayedNote[];
  last: { grade: Grade; deltaMs: number } | null;
}

export function ScoreView({ viewportRef, pageStart, songBeat, transportActive, playheadProgress, expectedTargets, playedNotes, last }: ScoreViewProps) {
  return <section className="score-view" aria-label="Partition sur deux mesures">
    <div className="score-heading"><span>MESURES {Math.floor(pageStart / 4) + 1}–{Math.floor(pageStart / 4) + 2}</span><span>32 PAS · 12 PISTES</span></div>
    <div className="sequencer-scroll" ref={viewportRef}>
      <div className="sequencer">
        <section className="sequence-block combined">
          <h2>PARTITION MODÈLE + JOUEUR</h2>
          <div className="measure-titles"><span /><b>MESURE {Math.floor(pageStart / 4) + 1}</b><b>MESURE {Math.floor(pageStart / 4) + 2}</b></div>
          <div className="step-numbers"><span />{Array.from({ length: 32 }, (_, step) => <i key={step}>{step % 16 + 1}</i>)}</div>
          {EP133_SCORE_TRACKS.map((track) => <div className="sequence-track" key={track.pad}>
            <strong>{track.label}</strong>
            {Array.from({ length: 32 }, (_, step) => {
              const expected = expectedTargets.find((target) => target.pad === track.pad && Math.round((target.beat - pageStart) * 4) === step);
              const played = playedNotes.filter((note) => note.pad === track.pad && Math.max(0, Math.min(31, Math.floor((note.beat - pageStart) * 4))) === step);
              const activeStep = transportActive && Math.floor((songBeat - pageStart) * 4) === step;
              const grade = played.at(-1)?.grade.toLowerCase();
              return <i key={step} className={`sequence-step ${expected ? 'filled' : ''} ${played.length ? 'played' : ''} ${grade || ''} ${activeStep ? 'current' : ''}`}>{expected ? EP133_PADS[track.pad].key : ''}{played.length > 0 && <b className="player-mark" />}</i>;
            })}
          </div>)}
          {transportActive && <div className="sequence-cursor" style={{ left: `calc(132px + (100% - 132px) * ${playheadProgress})` }} />}
        </section>
      </div>
    </div>
    <div className="score-legend"><span><i className="legend-model" /> modèle</span><span><i className="legend-perfect" /> PERFECT</span><span><i className="legend-good" /> GOOD</span><span><i className="legend-miss" /> MISS</span>{last && <strong className={last.grade.toLowerCase()}>{last.grade} {Number.isFinite(last.deltaMs) ? `${last.deltaMs > 0 ? '+' : ''}${last.deltaMs.toFixed(0)} ms` : ''}</strong>}</div>
  </section>;
}
