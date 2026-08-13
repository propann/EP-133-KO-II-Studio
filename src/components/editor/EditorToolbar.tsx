import { useRef, useState, type CSSProperties } from 'react';
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
  machineProjectAvailable: boolean;
  machineSampleCount: number;
  demoProjects: ReadonlyArray<{ id: string; title: string }>;
  /** Bibliothèque locale résumée (titre, BPM, nombre de patterns non vides, date) — voir `summarizeStudioProject`. Déjà triée par date de modification décroissante. */
  localProjects: Array<{ id: string; title: string; bpm: number; patternCount: number; updatedAt: string; archived: boolean }>;
  selectedLocalProject: string;
  /** Vue Studio active — PATTERNS (édition multi-mesures) ou SONG (scènes et Song Positions). */
  studioView: 'pattern' | 'arrangement';
  patternNumber: number;
  patternLength: number;
  groupPatternLengths: Record<EditorGroup, number>;
  activeSongPosition: number;
  activeScene: number;
  onHome: () => void;
  onNameChange: (name: string) => void;
  onGroupChange: (group: EditorGroup) => void;
  onStudioViewChange: (view: 'pattern' | 'arrangement') => void;
  onPatternLengthChange: (length: number) => void;
  /** Crée une nouvelle scène avec les patterns A–D actuellement sélectionnés. */
  onCommitScene: () => void;
  /** Historique Annuler/Rétablir du pattern actif (groupe:numéro) — pas encore les scènes/Song. */
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onConnectMidi: () => void;
  onSave: () => void;
  onNew: () => void;
  /** Ouvre directement le projet cliqué — pas de sélection préalable dans un menu déroulant séparé. */
  onOpenProject: (id: string) => void;
  /** Charge un projet de démonstration livré avec l'application, sans l'ajouter aux sauvegardes personnelles. */
  onOpenDemo: (id: string) => void;
  /** Importe des projets JSON EP-133 ou des fichiers MIDI standard dans la bibliothèque locale. */
  onImportFiles: (files: FileList) => void;
  onSaveAs: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onLoadMachineProject: () => void;
  onCloneMachine: () => void;
  onOpenSampleFolder: () => void;
  onPlayback: () => void;
  onLoopChange: (loop: boolean) => void;
  onExportFormatChange: (format: 'midi' | 'json') => void;
  onExport: () => void;
  onExportMidi: () => void;
  onExportJson: () => void;
  /** Convertit le pattern actif (groupe/numéro sélectionnés) en exercice Rhythm Hero USER — P1, voir docs/ROADMAP.md. */
  onSendToRhythmHero: () => void;
}

export function EditorToolbar(props: EditorToolbarProps) {
  const fileMenuRef = useRef<HTMLDetailsElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [openProjectWindow, setOpenProjectWindow] = useState(false);
  const [machineProjectsWindow, setMachineProjectsWindow] = useState(false);
  const [projectQuery, setProjectQuery] = useState('');
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const closeFileMenu = () => { if (fileMenuRef.current) fileMenuRef.current.open = false; };
  const filteredProjects = props.localProjects.filter((project) => !project.archived && project.title.toLocaleLowerCase().includes(projectQuery.trim().toLocaleLowerCase()));
  const formatProjectDate = (iso: string) => { const date = new Date(iso); return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }); };
  return <>
    <header><button className="editor-home-button" onClick={props.onHome}>← ACCUEIL</button><div><small>{props.mode === 'game' ? 'ÉDITEUR JEU' : 'ÉDITEUR EP‑133 COMPLET'}</small><input value={props.name} maxLength={32} onChange={(event) => props.onNameChange(event.target.value.toUpperCase())} aria-label="Nom de l'exercice" /></div>{props.mode === 'complete' && <><div className="editor-groups" aria-label="Groupes EP-133">{EDITOR_GROUPS.map((group) => <button className={props.group === group ? 'active' : ''} onClick={() => props.onGroupChange(group)} key={group}><b>{group}</b><small>LN.{props.groupPatternLengths[group]}</small></button>)}</div><div className="studio-view-switch" aria-label="Vue du Studio"><button className={props.studioView === 'pattern' ? 'active' : ''} onClick={() => props.onStudioViewChange('pattern')}>PATTERNS</button><button className={props.studioView === 'arrangement' ? 'active' : ''} onClick={() => props.onStudioViewChange('arrangement')}>SONG</button></div><button className={`editor-midi-out ${props.midiConnected ? 'active' : ''}`} onClick={props.onConnectMidi}>{props.midiConnected ? 'MIDI OUT ✓' : 'CONNECTER EP‑133'}</button></>}<div className="editor-vu" aria-label="VU stéréo gauche droite" onMouseMove={(event) => { const box = event.currentTarget.getBoundingClientRect(); setGaze({ x: Math.max(-1, Math.min(1, (event.clientX - (box.left + box.width / 2)) / (box.width / 2))), y: Math.max(-1, Math.min(1, (event.clientY - (box.top + box.height / 2)) / (box.height / 2))) }); }} onMouseLeave={() => setGaze({ x: 0, y: 0 })} style={{ '--gaze-x': gaze.x, '--gaze-y': gaze.y } as CSSProperties}>{['L', 'R'].map((channel) => <span className={`editor-channel-vu ${props.playing ? 'active' : ''}`} key={channel}><i /><b>{channel}</b></span>)}</div></header>
    <div className="editor-commandbar">
      {props.mode === 'complete' ? <>
        {fileMenuOpen && <div className="file-menu-backdrop" onClick={closeFileMenu} />}
        <details className="file-menu" ref={fileMenuRef} onToggle={() => setFileMenuOpen(fileMenuRef.current?.open ?? false)}>
          <summary>FICHIER</summary>
          <div className="file-menu-panel">
            <div className="file-menu-panel-head"><b>FICHIER</b><button className="file-menu-close" aria-label="Fermer le menu" onClick={closeFileMenu}>✕</button></div>
            <button className="file-row" onClick={() => { props.onNew(); closeFileMenu(); }}>Nouveau</button>
            <button className="file-row" onClick={() => { closeFileMenu(); setProjectQuery(''); setOpenProjectWindow(true); }}>Ouvrir…</button>
            <button className="file-row" onClick={() => importInputRef.current?.click()}>Importer JSON, MIDI ou archive…</button>
            <input ref={importInputRef} type="file" accept=".json,.mid,.midi,.pak,.ppak,application/json,audio/midi,audio/x-midi,application/zip" multiple hidden onChange={(event) => { if (event.target.files?.length) props.onImportFiles(event.target.files); event.target.value = ''; closeFileMenu(); }} />
            <hr className="file-menu-divider" />
            <button className="file-row" disabled={!props.canSave} onClick={props.onSave}>Enregistrer</button>
            <button className="file-row" disabled={!props.canSave} onClick={props.onSaveAs}>Enregistrer sous…</button>
            <hr className="file-menu-divider" />
            <button className="file-row" disabled={!props.selectedLocalProject} onClick={props.onRename}>Renommer</button>
            <button className="file-row" disabled={!props.selectedLocalProject} onClick={props.onDuplicate}>Dupliquer</button>
            <button className="file-row" disabled={!props.selectedLocalProject} onClick={props.onArchive}>Archiver</button>
            <button className="file-row danger" disabled={!props.selectedLocalProject} onClick={props.onDelete}>Supprimer</button>
            <hr className="file-menu-divider" />
            <button className="file-row" onClick={() => { props.onExportMidi(); closeFileMenu(); }}>Exporter en MIDI (.mid)</button>
            <button className="file-row" onClick={() => { props.onExportJson(); closeFileMenu(); }}>Exporter en projet EP‑133 (.json)</button>
            {props.mode === 'complete' && <><hr className="file-menu-divider" /><button className="file-row" onClick={() => { props.onSendToRhythmHero(); closeFileMenu(); }}>Envoyer le pattern vers Rhythm Hero</button></>}
          </div>
        </details>
        <button className="machine-project-load" onClick={() => setMachineProjectsWindow(true)} title="Parcourir les 9 projets de la machine">↓ PROJETS MACHINE · 9</button>
        <button className="clone-machine" onClick={props.onCloneMachine} title="Cloner la machine (miroir hors ligne)">▣ CLONER</button>
        <button className="studio-sample-folder" onClick={props.onOpenSampleFolder} title="Ouvrir la banque de samples locale">▤ SAMPLES{props.machineSampleCount ? ` · ${props.machineSampleCount}` : ''}</button>
        {props.studioView === 'pattern' && <><button className="studio-commit-scene" onClick={props.onCommitScene}>COMMIT · CRÉER SCÈNE</button><button className="studio-undo" disabled={!props.canUndo} title="Annuler (Ctrl/Cmd+Z)" onClick={props.onUndo}>↶ ANNULER</button><button className="studio-redo" disabled={!props.canRedo} title="Rétablir (Ctrl/Cmd+Shift+Z)" onClick={props.onRedo}>↷ RÉTABLIR</button><span className="studio-pattern-context">SONG POSITION L.{String(props.activeSongPosition).padStart(2, '0')} · SCÈNE S.{String(props.activeScene).padStart(2, '0')} · PATTERN {props.group}{String(props.patternNumber).padStart(2, '0')}</span></>}
      </> : <><button className="save" disabled={!props.canSave} onClick={props.onSave}>● SAVE</button><label className="export-select">EXPORT <select value={props.exportFormat} onChange={(event) => props.onExportFormatChange(event.target.value as 'midi' | 'json')}><option value="midi">MIDI (.mid)</option><option value="json">PROJET EP‑133 (.json)</option></select></label><button className="midi-export" onClick={props.onExport}>⇩ EXPORTER</button></>}
      <button className="transport-play" onClick={props.onPlayback}>{props.playing ? '■ STOP' : '▶ LECTURE'}</button><button className={`loop-toggle ${props.loop ? 'active' : ''}`} disabled={props.mode !== 'complete' || props.playing} onClick={() => props.onLoopChange(!props.loop)}>↻ BOUCLE {props.loop ? 'ON' : 'OFF'}</button>{props.mode === 'complete' && props.studioView === 'pattern' && <div className="pattern-length-control" aria-label="Longueur du pattern"><button disabled={props.patternLength <= 1} title={props.patternLength <= 1 ? 'Longueur minimale : LN.1' : 'Réduire la longueur du pattern'} onClick={() => props.onPatternLengthChange(props.patternLength - 1)}>−</button><b>LN.{props.patternLength}</b><button disabled={props.patternLength >= 99} title={props.patternLength >= 99 ? 'Longueur maximale : LN.99' : 'Augmenter la longueur du pattern'} onClick={() => props.onPatternLengthChange(props.patternLength + 1)}>＋</button></div>}
    </div>
    {openProjectWindow && <div className="project-open-overlay" role="dialog" aria-modal="true" aria-labelledby="project-open-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpenProjectWindow(false); }}>
      <section className="project-open-dialog">
        <header><div><small>STUDIO EP-133</small><h2 id="project-open-title">OUVRIR UN PROJET</h2></div><button aria-label="Fermer" onClick={() => setOpenProjectWindow(false)}>✕</button></header>
        <div className="project-open-content">
          <section><h3>PROJETS DE DÉMONSTRATION</h3><p>Compositions fournies pour tester les patterns, les scènes et l’arrangement.</p><div className="project-open-list">{props.demoProjects.map((project) => <button key={project.id} onClick={() => { props.onOpenDemo(project.id); setOpenProjectWindow(false); }}><span>▶</span><b>{project.title}</b><small>PROJET D’EXEMPLE</small></button>)}</div></section>
          <section><h3>MES PROJETS</h3><p>Projets enregistrés dans la bibliothèque locale de ce navigateur.</p>
            {props.localProjects.length > 1 && <input className="project-search" type="search" value={projectQuery} onChange={(event) => setProjectQuery(event.target.value)} placeholder="Rechercher par titre…" aria-label="Rechercher un projet personnel" />}
            <div className="project-open-list">{filteredProjects.length ? filteredProjects.map((project) => <button key={project.id} className={project.id === props.selectedLocalProject ? 'active' : ''} onClick={() => { props.onOpenProject(project.id); setOpenProjectWindow(false); }}><span>▤</span><b>{project.title}</b><small>{project.id === props.selectedLocalProject ? 'PROJET ACTUEL · ' : ''}{project.bpm} BPM · {project.patternCount} pattern{project.patternCount > 1 ? 's' : ''} · {formatProjectDate(project.updatedAt)}</small></button>) : <div className="project-open-empty">{props.localProjects.length ? 'Aucun projet ne correspond à cette recherche.' : 'Aucun projet personnel enregistré.'}</div>}</div>
          </section>
          <section className="project-open-machine"><h3>PROJET MACHINE</h3><p>Instantané du projet EP-133 scanné en lecture seule.</p><div className="project-open-list"><button disabled={!props.machineProjectAvailable} onClick={() => { props.onLoadMachineProject(); setOpenProjectWindow(false); }}><span>↓</span><b>{props.machineProjectAvailable ? `PROJET ${props.scannedProject ?? 'EP-133'}` : 'AUCUN PROJET SCANNÉ'}</b><small>{props.machineProjectAvailable ? 'CHARGER SANS ÉCRIRE SUR LA MACHINE' : 'CONNECTEZ ET SCANNEZ LA MACHINE'}</small></button></div></section>
        </div>
        <footer><button onClick={() => setOpenProjectWindow(false)}>ANNULER</button></footer>
      </section>
    </div>}
    {machineProjectsWindow && <div className="project-open-overlay" role="dialog" aria-modal="true" aria-labelledby="machine-projects-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setMachineProjectsWindow(false); }}><section className="machine-projects-dialog"><header><div><small>EP‑133 K.O.II</small><h2 id="machine-projects-title">PROJETS MACHINE</h2></div><button aria-label="Fermer" onClick={() => setMachineProjectsWindow(false)}>✕</button></header><p className="machine-projects-intro">Les neuf emplacements du projet EP‑133. Un projet scanné avec musique affiche sa mini-partition.</p><div className="machine-projects-grid">{Array.from({ length: 9 }, (_, index) => { const number = index + 1; const available = number === (props.scannedProject ?? 1) && props.machineProjectAvailable; return <button className={`machine-project-card ${available ? 'available' : ''}`} disabled={!available} onClick={() => { props.onLoadMachineProject(); setMachineProjectsWindow(false); }} key={number}><b>PROJET {number}</b>{available ? <><small>SCAN LECTURE SEULE · MUSIQUE</small><span className="machine-mini-partition">{Array.from({ length: 16 }, (_, step) => <i className={step % 3 === 0 || step === 7 || step === 12 ? 'on' : ''} key={step} />)}</span><em>CHARGER</em></> : <small>NON SCANNÉ</small>}</button>; })}</div></section></div>}
  </>;
}
