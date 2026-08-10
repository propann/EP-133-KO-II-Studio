import { EDITOR_GROUPS, type EditorGroup } from '../../core/project/exporters';
import { usedBars } from '../../core/project/editor';
import type { SequencerNote } from '../../core/project/model';
import { patternNumbersForGroup, songPositionsForScene, type PatternBank, type SceneDefinition } from '../../core/project/song';

interface SongArrangerProps {
  scenes: SceneDefinition[];
  song: number[];
  patternBank: PatternBank;
  onAssignCell: (sceneNumber: number, group: EditorGroup, patternNumber: number | null) => void;
  onReorderSong: (fromIndex: number, toIndex: number) => void;
  onDuplicateSongPosition: (index: number) => void;
  onDeleteSongPosition: (index: number) => void;
  onAddSongPosition: () => void;
  onAuditionSongPosition: (index: number) => void;
}

const twoDigits = (value: number) => String(value).padStart(2, '0');
const PATTERN_DRAG_TYPE = 'application/x-ep133-pattern';
const SONG_POSITION_DRAG_TYPE = 'application/x-ep133-song-position';

/**
 * Aperçu schématique d'un pattern, dérivé des frappes existantes — PAS une
 * forme d'onde audio, aucun moteur nécessaire. Points pour un pattern
 * déclencheur (pads ONE), barres de hauteur = vélocité pour un pattern
 * mélodique (notes KEYS présentes).
 */
function PatternPreview({ notes }: { notes: SequencerNote[] }) {
  if (!notes.length) return <div className="pattern-preview empty">VIDE</div>;
  const bars = usedBars(notes);
  const melodic = notes.some((note) => note.note !== undefined);
  return <div className={`pattern-preview ${melodic ? 'melodic' : 'trigger'}`}>
    {notes.map((note) => <span key={note.id} style={{ left: `${Math.min(97, note.beat / (bars * 4) * 100)}%`, height: `${Math.max(15, Math.round(note.velocity / 127 * 100))}%` }} />)}
  </div>;
}

/**
 * Vue « Song Arranger » : storyboard horizontal, une carte par Song Position
 * dans l'ordre de `song`. Une Scène est une ressource partagée — si deux
 * positions y réfèrent, les modifier depuis n'importe laquelle change les
 * deux (fidèle au fonctionnement réel de la machine) ; `[DUP]` sert
 * précisément à en sortir pour créer une variante indépendante.
 */
export function SongArranger({ scenes, song, patternBank, onAssignCell, onReorderSong, onDuplicateSongPosition, onDeleteSongPosition, onAddSongPosition, onAuditionSongPosition }: SongArrangerProps) {
  const sceneByNumber = new Map(scenes.map((scene) => [scene.scene, scene]));

  return <section className="song-arranger" aria-label="Structure du morceau — Song Arranger">
    <div className="song-arranger-track">
      {song.map((sceneNumber, index) => {
        const scene = sceneByNumber.get(sceneNumber);
        const activeGroups = scene ? EDITOR_GROUPS.filter((group) => scene.groupPatterns[group] !== null) : [];
        const bars = Math.max(1, ...activeGroups.map((group) => usedBars(patternBank[group][scene!.groupPatterns[group] as number] || [])));
        const sharedWith = songPositionsForScene(song, sceneNumber).filter((position) => position !== index);
        return <article
          key={`${index}-${sceneNumber}`}
          className="song-position-card"
          draggable
          onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData(SONG_POSITION_DRAG_TYPE, String(index)); }}
          onDragOver={(event) => { if (event.dataTransfer.types.includes(SONG_POSITION_DRAG_TYPE)) event.preventDefault(); }}
          onDrop={(event) => {
            const raw = event.dataTransfer.getData(SONG_POSITION_DRAG_TYPE);
            if (!raw) return;
            event.preventDefault();
            onReorderSong(Number(raw), index);
          }}
        >
          <header className="song-position-head"><b>SONG POS {twoDigits(index + 1)}<small>(L.{twoDigits(index + 1)})</small></b><button className="song-position-audition" aria-label="Écouter cette Song Position" onClick={() => onAuditionSongPosition(index)}>▶</button></header>
          <div className="song-position-scene"><b>SCENE {twoDigits(sceneNumber)}<small>(S.{twoDigits(sceneNumber)})</small></b><span>{bars} MESURE{bars > 1 ? 'S' : ''}</span>{sharedWith.length > 0 && <em>partagée avec L.{sharedWith.map((position) => twoDigits(position + 1)).join(', L.')}</em>}</div>
          <div className="song-position-groups">
            {EDITOR_GROUPS.map((group) => {
              const patternNumber = scene?.groupPatterns[group] ?? null;
              const notes = patternNumber !== null ? patternBank[group][patternNumber] || [] : [];
              return <div
                key={group}
                className={`pattern-block group-${group.toLowerCase()} ${patternNumber === null ? 'muted' : ''}`}
                onDragOver={(event) => { if (event.dataTransfer.types.includes(PATTERN_DRAG_TYPE)) event.preventDefault(); }}
                onDrop={(event) => {
                  const raw = event.dataTransfer.getData(PATTERN_DRAG_TYPE);
                  if (!raw) return;
                  event.preventDefault();
                  const [draggedGroup, draggedNumber] = raw.split(':');
                  if (draggedGroup !== group) return;
                  onAssignCell(sceneNumber, group, Number(draggedNumber));
                }}
              >
                <div className="pattern-block-head">
                  <b>[{group}]</b>
                  <span>{patternNumber !== null ? `${group}${twoDigits(patternNumber)}` : 'MUTE'}</span>
                  <button className="pattern-block-mute" aria-label={`Basculer MUTE pour le groupe ${group}`} onClick={() => onAssignCell(sceneNumber, group, patternNumber === null ? (patternNumbersForGroup(patternBank, group)[0] ?? 1) : null)}>··</button>
                </div>
                {patternNumber !== null && <PatternPreview notes={notes} />}
              </div>;
            })}
          </div>
          <footer className="song-position-actions"><button onClick={() => onDuplicateSongPosition(index)}>DUP</button><button className="song-position-delete" onClick={() => onDeleteSongPosition(index)}>DELETE</button></footer>
        </article>;
      })}
      <button className="song-position-add" onClick={onAddSongPosition}>＋ NEW SONG POS</button>
    </div>

    <div className="pattern-pool" aria-label="Bibliothèque de patterns à glisser">
      <b>PATTERNS POOL</b>
      {EDITOR_GROUPS.map((group) => {
        const numbers = patternNumbersForGroup(patternBank, group);
        if (!numbers.length) return null;
        return <div className="pattern-pool-row" key={group}>
          <b>[{group}]</b>
          {numbers.map((number) => <span
            key={number}
            className={`pattern-pool-card group-${group.toLowerCase()}`}
            draggable
            onDragStart={(event) => { event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData(PATTERN_DRAG_TYPE, `${group}:${number}`); }}
          >{group}{twoDigits(number)}</span>)}
        </div>;
      })}
      {!EDITOR_GROUPS.some((group) => patternNumbersForGroup(patternBank, group).length) && <p>Aucun pattern créé — retour à EDIT PATTERN pour en écrire un premier.</p>}
    </div>
  </section>;
}
