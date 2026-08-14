import { useRef } from 'react';

interface StyleOption { id: string; label: string; }
interface UserOption { id: string; title: string; }

interface GameToolbarProps {
  difficulty: number;
  tempo: number;
  activeBpm: number;
  styleId: string;
  styles: StyleOption[];
  userExercises: UserOption[];
  phase: 'idle' | 'preview' | 'countin' | 'playing';
  sessionActive: boolean;
  midiConnected: boolean;
  onDifficultyChange: (value: number) => void;
  onTempoChange: (value: number) => void;
  onStyleChange: (value: string) => void;
  onDuplicateOfficial: () => void;
  onHome: () => void;
  onOpenEditor: () => void;
  onConnectMidi: () => void;
  onPreview: () => void;
  onPlay: () => void;
}

export function GameToolbar(props: GameToolbarProps) {
  const tempoDrag = useRef<{ y: number; value: number } | null>(null);
  const difficultyDrag = useRef<{ y: number; value: number } | null>(null);
  const locked = props.sessionActive;
  return <header className="toolbar">
    <button className="home-back compact" onClick={props.onHome}>← ACCUEIL</button>
    <strong className="brand">EP‑133 <span>RHYTHM HERO</span></strong>
    <button className="editor-button compact" disabled={locked} onClick={props.onOpenEditor}>ÉDITEUR</button>
    <div className={`difficulty-control ${locked ? 'locked' : ''}`} title="Maintenir et glisser verticalement" onPointerDown={(event) => { if (locked) return; event.currentTarget.setPointerCapture(event.pointerId); difficultyDrag.current = { y: event.clientY, value: props.difficulty }; }} onPointerMove={(event) => { if (!difficultyDrag.current || locked) return; props.onDifficultyChange(Math.max(1, Math.min(5, Math.round(difficultyDrag.current.value + (difficultyDrag.current.y - event.clientY) / 24)))); }} onPointerUp={() => { difficultyDrag.current = null; }} onPointerCancel={() => { difficultyDrag.current = null; }}><small>NIVEAU ↕</small><b>{props.difficulty}</b></div>
    <label className="mode-select">STYLE <select value={props.styleId} disabled={locked} onChange={(event) => props.onStyleChange(event.target.value)}><optgroup label="STYLES">{props.styles.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</optgroup>{props.userExercises.length > 0 && <optgroup label="USER">{props.userExercises.map((item) => <option value={`user:${item.id}`} key={item.id}>{item.title}</option>)}</optgroup>}</select></label><button className="duplicate-exercise compact" disabled={locked || props.styleId.startsWith('user:')} title="Copier l’exercice officiel dans votre bibliothèque USER" onClick={props.onDuplicateOfficial}>DUPLIQUER</button>
    <div className={`tempo-control ${locked ? 'locked' : ''}`} title="Maintenir et glisser verticalement" onPointerDown={(event) => { if (locked) return; event.currentTarget.setPointerCapture(event.pointerId); tempoDrag.current = { y: event.clientY, value: props.tempo }; }} onPointerMove={(event) => { if (!tempoDrag.current || locked) return; props.onTempoChange(Math.max(50, Math.min(200, Math.round(tempoDrag.current.value + (tempoDrag.current.y - event.clientY) / 2)))); }} onPointerUp={() => { tempoDrag.current = null; }} onPointerCancel={() => { tempoDrag.current = null; }}><small>BPM ↕</small><b>{props.activeBpm}</b></div>
    <button className={`connect compact ${props.midiConnected ? 'connected' : ''}`} onClick={props.onConnectMidi}>{props.midiConnected ? 'MIDI ✓' : 'MIDI'}</button>
    <button className={`preview compact ${props.phase === 'preview' ? 'active' : ''}`} disabled={locked && props.phase !== 'preview'} onClick={props.onPreview}>{props.phase === 'preview' ? '■ STOP' : '▶ LECTURE'}</button>
    <button onClick={props.onPlay} disabled={props.phase === 'preview'} className="start compact">{props.phase === 'playing' || props.phase === 'countin' ? '■ STOP' : '▶ JOUER'}</button>
  </header>;
}
