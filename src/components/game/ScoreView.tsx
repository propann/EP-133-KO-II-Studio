import { useRef, type PointerEvent, type RefObject, type WheelEvent } from 'react';
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
  /** Glisser-déposer à la souris pour naviguer dans la partition — en plus
   * du défilement automatique pendant la lecture, qui reprend la main dès
   * la frappe suivante. */
  const drag = useRef<{ pointerId: number; startX: number; startScrollLeft: number } | null>(null);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startScrollLeft: event.currentTarget.scrollLeft };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    event.currentTarget.scrollLeft = drag.current.startScrollLeft - (event.clientX - drag.current.startX);
  };
  const endDrag = () => { drag.current = null; };
  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    const viewport = event.currentTarget;
    if (viewport.scrollWidth <= viewport.clientWidth) return;
    event.preventDefault();
    viewport.scrollLeft += event.deltaY || event.deltaX;
  };

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
        {EP133_SCORE_TRACKS.map((track) => <strong className={`cat-${track.category}`} key={track.pad}>{track.label}</strong>)}
      </div>
      <div className="sequencer-scroll" ref={viewportRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} onWheel={onWheel}>
        <div className="measure-cards">
          {[0, 1].map((half) => <section className="measure-card" key={half}>
            {EP133_SCORE_TRACKS.map((track) => <div className={`measure-card-row cat-${track.category}`} key={track.pad}>{renderRow(track, half)}</div>)}
          </section>)}
          {transportActive && <div className="sequence-cursor" style={{ left: `calc(100% * ${playheadProgress})` }} />}
        </div>
      </div>
    </div>
  </section>;
}
