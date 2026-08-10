import { useRef, useState } from 'react';
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
  /** Ouvre directement le projet cliqué — pas de sélection préalable dans un menu déroulant séparé. */
  onOpenProject: (id: string) => void;
  /** Importe un ou plusieurs fichiers .json (format « Exporter en projet EP-133 ») dans la bibliothèque locale, sans console. */
  onImportFiles: (files: FileList) => void;
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
  onExportMidi: () => void;
  onExportJson: () => void;
}

export function EditorToolbar(props: EditorToolbarProps) {
  const fileMenuRef = useRef<HTMLDetailsElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const closeFileMenu = () => { if (fileMenuRef.current) fileMenuRef.current.open = false; };
  return <>
    <header><button className="editor-home-button" onClick={props.onHome}>← ACCUEIL</button><div><small>{props.mode === 'game' ? 'ÉDITEUR JEU' : 'ÉDITEUR EP‑133 COMPLET'}</small><input value={props.name} maxLength={32} onChange={(event) => props.onNameChange(event.target.value.toUpperCase())} aria-label="Nom de l'exercice" /></div>{props.mode === 'complete' && <><div className="editor-groups" aria-label="Groupes EP-133">{EDITOR_GROUPS.map((group) => <button className={props.group === group ? 'active' : ''} onClick={() => props.onGroupChange(group)} key={group}>{group}</button>)}</div><div className="studio-view-switch" aria-label="Vue du Studio"><button className={props.studioView === 'pattern' ? 'active' : ''} onClick={() => props.onStudioViewChange('pattern')}>EDIT PATTERN</button><button className={props.studioView === 'arrangement' ? 'active' : ''} onClick={() => props.onStudioViewChange('arrangement')}>ARRANGEMENT</button></div>{props.studioView === 'pattern' && <PatternSelector group={props.group} number={props.patternNumber} onChange={props.onPatternNumberChange} />}<span className={`device-scan-state ${props.scannedProject !== undefined ? 'active' : ''}`}>{props.scannedProject !== undefined ? `PROJET ${props.scannedProject} · SCAN LECTURE SEULE` : 'AUCUN SCAN'}</span><button className={`editor-midi-out ${props.midiConnected ? 'active' : ''}`} onClick={props.onConnectMidi}>{props.midiConnected ? 'MIDI OUT ✓' : 'CONNECTER EP‑133'}</button></>}<div className={`editor-vu ${props.playing ? 'active' : ''}`}><span>-20</span><span>-6</span><span>0</span><i /><b>VU</b></div></header>
    <div className="editor-commandbar">
      {props.mode === 'complete' ? <>
        {fileMenuOpen && <div className="file-menu-backdrop" onClick={closeFileMenu} />}
        <details className="file-menu" ref={fileMenuRef} onToggle={() => setFileMenuOpen(fileMenuRef.current?.open ?? false)}>
          <summary>FICHIER</summary>
          <div className="file-menu-panel">
            <div className="file-menu-panel-head"><b>FICHIER</b><button className="file-menu-close" aria-label="Fermer le menu" onClick={closeFileMenu}>✕</button></div>
            <button className="file-row" onClick={() => { props.onNew(); closeFileMenu(); }}>Nouveau</button>
            <div className="file-row file-row-label">Ouvrir</div>
            <div className="file-menu-open-list">
              {props.localProjects.length
                ? props.localProjects.map((project) => <button key={project.id} className={`file-row nested ${project.id === props.selectedLocalProject ? 'active' : ''}`} onClick={() => { props.onOpenProject(project.id); closeFileMenu(); }}>{project.title}</button>)
                : <p className="file-row nested muted">Aucun projet enregistré.</p>}
            </div>
            <button className="file-row" onClick={() => importInputRef.current?.click()}>Importer un fichier…</button>
            <input ref={importInputRef} type="file" accept=".json" multiple hidden onChange={(event) => { if (event.target.files?.length) props.onImportFiles(event.target.files); event.target.value = ''; closeFileMenu(); }} />
            <hr className="file-menu-divider" />
            <button className="file-row" disabled={!props.canSave} onClick={props.onSave}>Enregistrer</button>
            <button className="file-row" disabled={!props.canSave} onClick={props.onSaveAs}>Enregistrer sous…</button>
            <hr className="file-menu-divider" />
            <button className="file-row" disabled={!props.selectedLocalProject} onClick={props.onRename}>Renommer</button>
            <button className="file-row" disabled={!props.selectedLocalProject} onClick={props.onDuplicate}>Dupliquer</button>
            <button className="file-row danger" disabled={!props.selectedLocalProject} onClick={props.onDelete}>Supprimer</button>
            <hr className="file-menu-divider" />
            <button className="file-row" onClick={() => { props.onExportMidi(); closeFileMenu(); }}>Exporter en MIDI (.mid)</button>
            <button className="file-row" onClick={() => { props.onExportJson(); closeFileMenu(); }}>Exporter en projet EP‑133 (.json)</button>
          </div>
        </details>
        <button className="machine-project-load" disabled={!props.machineProjectAvailable} onClick={props.onLoadMachineProject} title={props.machineProjectAvailable ? 'Charger le projet scanné sur la machine' : 'Aucun projet scanné'}>↓ PROJET MACHINE</button>
        <button className="clone-machine" onClick={props.onCloneMachine} title="Cloner la machine (miroir hors ligne)">▣ CLONER</button>
        <button className="studio-sample-folder" onClick={props.onOpenSampleFolder} title="Ouvrir la banque de samples locale">▤ SAMPLES{props.machineSampleCount ? ` · ${props.machineSampleCount}` : ''}</button>
      </> : <><button className="save" disabled={!props.canSave} onClick={props.onSave}>● SAVE</button><label className="export-select">EXPORT <select value={props.exportFormat} onChange={(event) => props.onExportFormatChange(event.target.value as 'midi' | 'json')}><option value="midi">MIDI (.mid)</option><option value="json">PROJET EP‑133 (.json)</option></select></label><button className="midi-export" onClick={props.onExport}>⇩ EXPORTER</button></>}
      <button className="transport-play" disabled={props.mode === 'complete' && !props.midiConnected && !props.machineSampleCount} onClick={props.onPlayback}>{props.playing ? '■ STOP' : '▶ LECTURE'}</button><button className={`loop-toggle ${props.loop ? 'active' : ''}`} disabled={props.mode !== 'complete' || props.playing} onClick={() => props.onLoopChange(!props.loop)}>↻ BOUCLE {props.loop ? 'ON' : 'OFF'}</button>
    </div>
  </>;
}
