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
}

/**
 * Rien que la partition. Deux cartes de mesure arrondies (pas de bandeau
 * « MESURE 1/2 » — la carte matérialise déjà la coupure) dans une zone qui
 * défile seule ; la colonne des noms de piste est un bloc à part, hors du
 * conteneur qui défile, pour rester visible en toute circonstance — plus
 * un simple `position: sticky` partagé avec la grille qui bouge pendant la
 * lecture. Demandé le 11/08.
 */
export function ScoreView({ viewportRef, pageStart, songBeat, transportActive, playheadProgress, expectedTargets, playedNotes }: ScoreViewProps) {
  const renderRow = (track: (typeof EP133_SCORE_TRACKS)[number], half: number) => Array.from({ length: 16 }, (_, localStep) => {
    const step = half * 16 + localStep;
    const expected = expectedTargets.find((target) => target.pad === track.pad && Math.round((target.beat - pageStart) * 4) === step);
    const played = playedNotes.filter((note) => note.pad === track.pad && Math.max(0, Math.min(31, Math.floor((note.beat - pageStart) * 4))) === step);
    const activeStep = transportActive && Math.floor((songBeat - pageStart) * 4) === step;
    const grade = played.at(-1)?.grade.toLowerCase();
    return <i key={step} className={`sequence-step ${expected ? 'filled' : ''} ${played.length ? 'played' : ''} ${grade || ''} ${activeStep ? 'current' : ''}`}>{expected ? EP133_PADS[track.pad].key : ''}{played.length > 0 && <b className="player-mark" />}</i>;
  });

  return <section className="score-view" aria-label="Partition sur deux mesures">
    <div className="score-body">
      <div className="track-labels">
        <span className="track-labels-spacer" />
        {EP133_SCORE_TRACKS.map((track) => <strong className={`cat-${track.category}`} key={track.pad}>{track.label}</strong>)}
      </div>
      <div className="sequencer-scroll" ref={viewportRef}>
        <div className="measure-cards">
          {[0, 1].map((half) => <section className="measure-card" key={half}>
            <div className="step-numbers">{Array.from({ length: 16 }, (_, step) => <i key={step}>{step + 1}</i>)}</div>
            {EP133_SCORE_TRACKS.map((track) => <div className="measure-card-row" key={track.pad}>{renderRow(track, half)}</div>)}
          </section>)}
          {transportActive && <div className="sequence-cursor" style={{ left: `calc(100% * ${playheadProgress})` }} />}
        </div>
      </div>
    </div>
  </section>;
}
