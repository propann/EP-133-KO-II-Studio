import { useEffect, useMemo, useRef, useState } from 'react';
import type { MidiObservation } from '../core/midi/useWebMidi';
import { MIDI_CONTROL_MAP_STORAGE_KEY, midiObservationSignature, loadControlAssignments, type ControlAssignment } from '../core/midi/controlMapping';

interface MachineTestPageProps {
  connected: boolean;
  sysexEnabled: boolean;
  inputNames: string[];
  observations: MidiObservation[];
  onBack: () => void;
  onConnect: () => void;
  onSendLearned: (data: number[]) => boolean;
  onSelectMachineGroup: (groupIndex: number) => Promise<number>;
}

function loadAssignments(): Record<string, ControlAssignment> { return loadControlAssignments(localStorage); }

function controlId(section: string, label: string) {
  return `${section}:${label}`;
}

export function MachineTestPage({ connected, sysexEnabled, inputNames, observations, onBack, onConnect, onSendLearned, onSelectMachineGroup }: MachineTestPageProps) {
  const [selectedControl, setSelectedControl] = useState<string | null>(null);
  const [configureMode, setConfigureMode] = useState(false);
  const [sendNotice, setSendNotice] = useState('');
  const [assignments, setAssignments] = useState<Record<string, ControlAssignment>>(loadAssignments);
  const lastCapturedTimestamp = useRef<number | null>(null);
  const newest = observations[0];
  const newestSignature = newest ? midiObservationSignature(newest) : '';

  useEffect(() => {
    void fetch('/__midi-capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'session-start', userAgent: navigator.userAgent }),
    });
  }, []);

  useEffect(() => {
    if (!newest || lastCapturedTimestamp.current === newest.timestamp) return;
    lastCapturedTimestamp.current = newest.timestamp;
    void fetch('/__midi-capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'midi', message: newest }),
    });
  }, [newest?.timestamp]);

  useEffect(() => {
    if (!selectedControl || !newestSignature) return;
    setAssignments((current) => {
      const next = { ...current, [selectedControl]: { signature: newestSignature, data: newest.data, kind: newest.kind } };
      localStorage.setItem(MIDI_CONTROL_MAP_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setSelectedControl(null);
  }, [newest?.timestamp]);

  const activeControls = useMemo(() => {
    if (!newestSignature) return new Set<string>();
    return new Set(Object.entries(assignments).filter(([, value]) => value.signature === newestSignature).map(([key]) => key));
  }, [assignments, newestSignature]);

  const machineButton = (section: string, label: string, className = '', secondary?: string) => {
    const id = controlId(section, label);
    const assignment = assignments[id];
    const activate = async () => {
      if (configureMode) {
        setSelectedControl(id);
        setSendNotice('');
        return;
      }
      if (section === 'group') {
        setSendNotice(`${label} : sélection en cours…`);
        try {
          const fid = await onSelectMachineGroup(['A', 'B', 'C', 'D'].indexOf(label));
          setSendNotice(`Groupe ${label} sélectionné sur l’EP-133 · relecture OK · FID ${fid}.`);
        } catch (error) {
          setSendNotice(`Groupe ${label} non sélectionné : ${error instanceof Error ? error.message : 'erreur EP-133'}.`);
        }
        return;
      }
      if (!assignment) {
        setSendNotice(`${label} n’est pas encore configuré.`);
        return;
      }
      if (onSendLearned(assignment.data)) setSendNotice(`${label} envoyé à l’EP-133.`);
      else setSendNotice(`${label} utilise un SysEx observé : renvoi verrouillé jusqu’à validation.`);
    };
    return <button
      className={`${className} ${selectedControl === id ? 'learning' : ''} ${activeControls.has(id) ? 'received' : ''} ${assignments[id] ? 'mapped' : ''}`}
      onClick={() => void activate()}
      title={assignment?.signature || 'Contrôle non configuré'}
      key={id}
    ><b>{label}</b>{secondary && <small>{secondary}</small>}</button>;
  };

  return <main className="machine-test-page">
    <header className="machine-test-header">
      <button className="home-back" onClick={onBack}>← ACCUEIL</button>
      <div><small>DIAGNOSTIC EN LECTURE SEULE</small><h1>TEST MACHINE</h1></div>
      <button className={sysexEnabled ? 'connected' : ''} onClick={onConnect}>{sysexEnabled ? 'MIDI + SYSEX ✓' : connected ? 'ACTIVER MIDI + SYSEX' : 'CONNECTER L’EP‑133'}</button>
    </header>

    <section className="machine-test-help">
      <b>{selectedControl ? `APPUIE MAINTENANT SUR ${selectedControl.split(':')[1]} SUR LA MACHINE` : configureMode ? 'CLIQUE UN CONTRÔLE, PUIS ACTIONNE LE MÊME SUR L’EP-133' : 'MODE TEST · CLIQUE UN CONTRÔLE CONFIGURÉ POUR L’ENVOYER À LA MACHINE'}</b>
      <span>{connected ? inputNames.join(' + ') : 'Connexion nécessaire pour recevoir les contrôles.'}</span>
      <div className="machine-test-mode"><button className={!configureMode ? 'active' : ''} onClick={() => { setConfigureMode(false); setSelectedControl(null); }}>TEST</button><button className={configureMode ? 'active' : ''} onClick={() => setConfigureMode(true)}>CONFIGURER</button></div>
      {sendNotice && <small className="machine-test-notice">{sendNotice}</small>}
      <small className="machine-test-notice">CAPTURE LOCALE TEMPORAIRE ACTIVE · tmp/ep133-midi-capture.ndjson</small>
    </section>

    <div className="machine-test-layout">
      <section className="ep133-face" aria-label="Façade de test EP-133">
        <div className="ep133-ports"><span>OUTPUT</span><span className="orange">INPUT</span><span>SYNC</span><span>MIDI</span><span>USB</span><span>POWER</span></div>
        <div className="ep133-brand-panel"><div><b>K.O. II</b><small>サンプラー</small><span>64 MB SAMPLER COMPOSER</span></div><i aria-hidden="true" /></div>
        <div className="ep133-display"><div className="display-groups">A<br />B<br /><b>C</b><br />D</div><strong>{newest ? newest.kind.toUpperCase() : '1.33'}</strong><span>● ▶　FX　◉</span></div>
        <div className="ep133-real-controls">
          <div className="control volume-control"><span>VOLUME</span>{machineButton('knob', 'VOLUME', 'knob volume-knob')}</div>
          <div className="control sound-control">{machineButton('function', 'SOUND', 'split-control', 'EDIT')}</div>
          <div className="control main-control">{machineButton('function', 'MAIN', 'split-control', 'COMMIT')}</div>
          <div className="control tempo-control">{machineButton('function', 'TEMPO', 'split-control', 'LOOP')}</div>
          <div className="control x-control"><span>BPM</span>{machineButton('knob', 'X', 'knob x-knob')}</div>
          <div className="control y-control"><span>METRONOME</span>{machineButton('knob', 'Y', 'knob y-knob')}</div>

          <div className="keys-control">{machineButton('function', 'KEYS')}</div>
          <div className="fader-button-control">{machineButton('function', 'FADER')}</div>
          <div className="fader-control">{machineButton('fader', 'FADER', 'fader-track')}</div>
          <div className="shift-control">{machineButton('function', 'SHIFT')}</div>

          {['A', 'B', 'C', 'D'].map((label) => <div className={`group-control group-${label.toLowerCase()}`} key={label}>{machineButton('group', label, 'group')}</div>)}

          {[
            ['7', 'LEVEL'], ['8', 'PITCH'], ['9', 'TIME'],
            ['4', 'LPF'], ['5', 'HPF'], ['6', '→ FX'],
            ['1', 'ATK'], ['2', 'REL'], ['3', 'PAN'],
            ['.', 'TUNE'], ['0', 'VEL'], ['ENTER', 'MOD'],
          ].map(([label, secondary], index) => <div className={`pad-control pad-${index}`} key={label}><span>{secondary}</span>{machineButton('pad', label, 'pad')}</div>)}

          <div className="sample-control">{machineButton('function', 'SAMPLE', 'split-control orange-top', 'CHOP')}</div>
          <div className="timing-control">{machineButton('function', 'TIMING', 'split-control', 'CORRECT')}</div>
          <div className="fx-control">{machineButton('function', 'FX', 'split-control', 'OUTPUT')}</div>
          <div className="erase-control">{machineButton('function', 'ERASE', 'split-control light-top', 'SYSTEM')}</div>
          <div className="minus-control">{machineButton('function', '−', 'square-light')}</div>
          <div className="plus-control">{machineButton('function', '+', 'square-light')}</div>
          <div className="record-control">{machineButton('function', 'RECORD', 'record-button')}</div>
          <div className="play-control">{machineButton('function', 'PLAY', 'play-button')}</div>
        </div>
      </section>

      <aside className="midi-event-monitor">
        <header><div><small>TRACES REÇUES</small><h2>JOURNAL MIDI</h2></div><b>{observations.length}</b></header>
        <div className="midi-event-list">
          {observations.length ? observations.map((message, index) => <article className={index === 0 ? 'latest' : ''} key={`${message.timestamp}-${index}`}>
            <span>{message.kind.toUpperCase()}</span>
            <code>{message.hex}</code>
            <small>{message.channel ? `CH ${message.channel}` : 'SYSTÈME'}{message.note !== undefined ? ` · NOTE ${message.note}` : ''}{message.velocity !== undefined ? ` · VEL ${message.velocity}` : ''}</small>
          </article>) : <p>Connecte la machine puis actionne un contrôle. Les messages apparaîtront ici, y compris le SysEx autorisé par le navigateur.</p>}
        </div>
      </aside>
    </div>

    <footer className="machine-test-footer"><span>{Object.keys(assignments).length} CONTRÔLE(S) CARTOGRAPHIÉ(S)</span><button onClick={() => { localStorage.removeItem(MIDI_CONTROL_MAP_STORAGE_KEY); setAssignments({}); setSelectedControl(null); }}>EFFACER LA CARTOGRAPHIE</button></footer>
  </main>;
}
