import { EDITOR_GROUPS, type EditorGroup } from '../../core/project/exporters';

interface EditorToolbarProps {
  mode: 'game' | 'complete';
  name: string;
  group: EditorGroup;
  playing: boolean;
  loop: boolean;
  exportFormat: 'midi' | 'json';
  canSave: boolean;
  midiConnected: boolean;
  scannedProject?: number;
  localProjects: Array<{ id: string; title: string }>;
  selectedLocalProject: string;
  onHome: () => void;
  onNameChange: (name: string) => void;
  onGroupChange: (group: EditorGroup) => void;
  onConnectMidi: () => void;
  onSave: () => void;
  onNew: () => void;
  onSelectedLocalProjectChange: (id: string) => void;
  onLoad: () => void;
  onPlayback: () => void;
  onLoopChange: (loop: boolean) => void;
  onExportFormatChange: (format: 'midi' | 'json') => void;
  onExport: () => void;
}

export function EditorToolbar(props: EditorToolbarProps) {
  return <>
    <header><button className="editor-home-button" onClick={props.onHome}>← ACCUEIL</button><div><small>{props.mode === 'game' ? 'ÉDITEUR JEU' : 'ÉDITEUR EP‑133 COMPLET'}</small><input value={props.name} maxLength={32} onChange={(event) => props.onNameChange(event.target.value.toUpperCase())} aria-label="Nom de l'exercice" /></div>{props.mode === 'complete' && <><div className="editor-groups" aria-label="Groupes EP-133">{EDITOR_GROUPS.map((group) => <button className={props.group === group ? 'active' : ''} onClick={() => props.onGroupChange(group)} key={group}>{group}</button>)}</div><span className={`device-scan-state ${props.scannedProject !== undefined ? 'active' : ''}`}>{props.scannedProject !== undefined ? `PROJET ${props.scannedProject} · SCAN LECTURE SEULE` : 'AUCUN SCAN'}</span><button className={`editor-midi-out ${props.midiConnected ? 'active' : ''}`} onClick={props.onConnectMidi}>{props.midiConnected ? 'MIDI OUT ✓' : 'CONNECTER EP‑133'}</button></>}<div className={`editor-vu ${props.playing ? 'active' : ''}`}><span>-20</span><span>-6</span><span>0</span><i /><b>VU</b></div></header>
    <div className="editor-commandbar">{props.mode === 'complete' && <><button onClick={props.onNew}>＋ NOUVEAU</button><label className="local-project-select">PROJET <select value={props.selectedLocalProject} onChange={(event) => props.onSelectedLocalProjectChange(event.target.value)}><option value="">— LOCAL —</option>{props.localProjects.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}</select></label><button disabled={!props.selectedLocalProject} onClick={props.onLoad}>OUVRIR</button></>}<button className="save" disabled={!props.canSave} onClick={props.onSave}>● SAVE</button><button className="transport-play" disabled={props.mode === 'complete' && !props.midiConnected} onClick={props.onPlayback}>{props.playing ? '■ STOP' : '▶ LECTURE'}</button><button className={`loop-toggle ${props.loop ? 'active' : ''}`} disabled={props.mode !== 'complete' || props.playing} onClick={() => props.onLoopChange(!props.loop)}>↻ BOUCLE {props.loop ? 'ON' : 'OFF'}</button><label className="export-select">EXPORT <select value={props.exportFormat} onChange={(event) => props.onExportFormatChange(event.target.value as 'midi' | 'json')}><option value="midi">MIDI (.mid)</option><option value="json">PROJET EP‑133 (.json)</option></select></label><button className="midi-export" onClick={props.onExport}>⇩ EXPORTER</button></div>
  </>;
}
