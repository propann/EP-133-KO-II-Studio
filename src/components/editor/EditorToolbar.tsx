import { EDITOR_GROUPS, type EditorGroup } from '../../core/project/exporters';
import { PatternSelector } from './PatternSelector';

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
  machineProjectAvailable: boolean;
  machineSampleCount: number;
  localProjects: Array<{ id: string; title: string }>;
  selectedLocalProject: string;
  /** Vue Studio active — [ EDIT PATTERN ] ou [ ARRANGEMENT ]. */
  studioView: 'pattern' | 'arrangement';
  patternNumber: number;
  onHome: () => void;
  onNameChange: (name: string) => void;
  onGroupChange: (group: EditorGroup) => void;
  onStudioViewChange: (view: 'pattern' | 'arrangement') => void;
  onPatternNumberChange: (number: number) => void;
  onConnectMidi: () => void;
  onSave: () => void;
  onNew: () => void;
  onSelectedLocalProjectChange: (id: string) => void;
  onLoad: () => void;
  onSaveAs: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onLoadMachineProject: () => void;
  onCloneMachine: () => void;
  onOpenSampleFolder: () => void;
  onPlayback: () => void;
  onLoopChange: (loop: boolean) => void;
  onExportFormatChange: (format: 'midi' | 'json') => void;
  onExport: () => void;
}

export function EditorToolbar(props: EditorToolbarProps) {
  return <>
    <header><button className="editor-home-button" onClick={props.onHome}>← ACCUEIL</button><div><small>{props.mode === 'game' ? 'ÉDITEUR JEU' : 'ÉDITEUR EP‑133 COMPLET'}</small><input value={props.name} maxLength={32} onChange={(event) => props.onNameChange(event.target.value.toUpperCase())} aria-label="Nom de l'exercice" /></div>{props.mode === 'complete' && <><div className="editor-groups" aria-label="Groupes EP-133">{EDITOR_GROUPS.map((group) => <button className={props.group === group ? 'active' : ''} onClick={() => props.onGroupChange(group)} key={group}>{group}</button>)}</div><div className="studio-view-switch" aria-label="Vue du Studio"><button className={props.studioView === 'pattern' ? 'active' : ''} onClick={() => props.onStudioViewChange('pattern')}>EDIT PATTERN</button><button className={props.studioView === 'arrangement' ? 'active' : ''} onClick={() => props.onStudioViewChange('arrangement')}>ARRANGEMENT</button></div>{props.studioView === 'pattern' && <PatternSelector group={props.group} number={props.patternNumber} onChange={props.onPatternNumberChange} />}<span className={`device-scan-state ${props.scannedProject !== undefined ? 'active' : ''}`}>{props.scannedProject !== undefined ? `PROJET ${props.scannedProject} · SCAN LECTURE SEULE` : 'AUCUN SCAN'}</span><button className={`editor-midi-out ${props.midiConnected ? 'active' : ''}`} onClick={props.onConnectMidi}>{props.midiConnected ? 'MIDI OUT ✓' : 'CONNECTER EP‑133'}</button></>}<div className={`editor-vu ${props.playing ? 'active' : ''}`}><span>-20</span><span>-6</span><span>0</span><i /><b>VU</b></div></header>
    <div className="editor-commandbar">
      {props.mode === 'complete' ? <details className="file-menu">
        <summary>FICHIER</summary>
        <div className="file-menu-panel">
          <label>PROJET LOCAL<select value={props.selectedLocalProject} onChange={(event) => props.onSelectedLocalProjectChange(event.target.value)}><option value="">— CHOISIR —</option>{props.localProjects.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}</select></label>
          <div className="file-menu-grid">
            <button onClick={props.onNew}>＋ NOUVEAU</button><button disabled={!props.selectedLocalProject} onClick={props.onLoad}>OUVRIR</button>
            <button className="machine-project-load" disabled={!props.machineProjectAvailable} onClick={props.onLoadMachineProject}>↓ PROJET 1 MACHINE</button><span className="machine-project-state">{props.machineProjectAvailable ? 'SCAN LECTURE SEULE PRÊT' : 'AUCUN PROJET SCANNÉ'}</span>
            <button className="clone-machine" onClick={props.onCloneMachine}>▣ CLONER LA MACHINE</button><span className="machine-project-state">MIROIR + FUTURE TIME MACHINE</span>
            <button className="studio-sample-folder" onClick={props.onOpenSampleFolder}>▤ OUVRIR BANQUE LOCALE</button><span className={`machine-project-state ${props.machineSampleCount ? 'ready' : ''}`}>{props.machineSampleCount ? `${props.machineSampleCount} SAMPLES HDD · AUCUN UPLOAD` : 'AUCUN DOSSIER LOCAL OUVERT'}</span>
            <button className="save" disabled={!props.canSave} onClick={props.onSave}>● ENREGISTRER</button><button disabled={!props.canSave} onClick={props.onSaveAs}>ENREGISTRER SOUS</button>
            <button disabled={!props.selectedLocalProject} onClick={props.onRename}>RENOMMER</button><button disabled={!props.selectedLocalProject} onClick={props.onDuplicate}>DUPLIQUER</button>
            <button className="file-delete" disabled={!props.selectedLocalProject} onClick={props.onDelete}>SUPPRIMER</button>
          </div>
          <div className="file-export"><label>FORMAT<select value={props.exportFormat} onChange={(event) => props.onExportFormatChange(event.target.value as 'midi' | 'json')}><option value="midi">MIDI (.mid)</option><option value="json">PROJET EP‑133 (.json)</option></select></label><button className="midi-export" onClick={props.onExport}>⇩ EXPORTER</button></div>
        </div>
      </details> : <><button className="save" disabled={!props.canSave} onClick={props.onSave}>● SAVE</button><label className="export-select">EXPORT <select value={props.exportFormat} onChange={(event) => props.onExportFormatChange(event.target.value as 'midi' | 'json')}><option value="midi">MIDI (.mid)</option><option value="json">PROJET EP‑133 (.json)</option></select></label><button className="midi-export" onClick={props.onExport}>⇩ EXPORTER</button></>}
      <button className="transport-play" disabled={props.mode === 'complete' && !props.midiConnected && !props.machineSampleCount} onClick={props.onPlayback}>{props.playing ? '■ STOP' : '▶ LECTURE'}</button><button className={`loop-toggle ${props.loop ? 'active' : ''}`} disabled={props.mode !== 'complete' || props.playing} onClick={() => props.onLoopChange(!props.loop)}>↻ BOUCLE {props.loop ? 'ON' : 'OFF'}</button>
    </div>
  </>;
}
