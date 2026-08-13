import { useEffect, useRef, useState } from 'react';
import type { MidiObservation } from '../core/midi/useWebMidi';
import { MIDI_CONTROL_MAP_STORAGE_KEY, midiObservationSignature, loadControlAssignments, type ControlAssignment } from '../core/midi/controlMapping';
import type { EditorGroup } from '../core/project/exporters.ts';

interface MachineTestPageProps {
  connected: boolean;
  sysexEnabled: boolean;
  inputNames: string[];
  observations: MidiObservation[];
  /** Groupe actif réel (physique A–D ou dernière sélection depuis le
   * Studio/Sons & Transfert) — affiché en surbrillance sur l'écran de la
   * façade, au lieu du « C » figé qu'il y avait avant. */
  machineGroup: EditorGroup;
  onBack: () => void;
  /** Retente une connexion SysEx explicite (mode « surveiller tous les
   * ports »). La connexion automatique au chargement échoue silencieusement
   * si le navigateur exige un geste pour ce premier octroi — ce bouton
   * reste donc affiché tant que sysexEnabled est faux, pour fournir ce
   * geste. Retiré par erreur le 13 août (remplacé uniquement par la
   * pastille passive), restauré le même jour après un test réel. */
  onConnect: () => void;
  onSendLearned: (data: number[]) => boolean;
  onSelectMachineGroup: (groupIndex: number) => Promise<number>;
}

function loadAssignments(): Record<string, ControlAssignment> { return loadControlAssignments(localStorage); }

/**
 * Session de diagnostic téléchargeable (REGISTRE_IDEES.md R-20, idée reprise
 * de `etude/codex/05_PISTES_PRIORITAIRES.md` § P0 après vérification :
 * « exporter une session de diagnostic anonymisée : port, firmware déclaré,
 * direction, hexadécimal, résultat »). Purement client, aucune écriture
 * disque ni réseau — contrairement à la capture temporaire dev-only
 * (`/__midi-capture`, vite.config.ts), ceci fonctionne aussi en production
 * et donne un fichier que l'utilisateur choisit explicitement de partager.
 */
function downloadDiagnosticLog(context: { connected: boolean; sysexEnabled: boolean; inputNames: string[]; observations: MidiObservation[] }) {
  const payload = {
    exportedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    connected: context.connected,
    sysexEnabled: context.sysexEnabled,
    inputNames: context.inputNames,
    observationCount: context.observations.length,
    observations: context.observations,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ep133-diagnostic-${payload.exportedAt.replace(/[:.]/g, '-')}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function controlId(section: string, label: string) {
  return `${section}:${label}`;
}

/** L'écran OLED de la façade EP-133 (145 px de haut) ne peut pas montrer le
 * journal complet — on y tronque le hexadécimal, comme le ferait un vrai
 * petit écran. Le fichier téléchargé, lui, contient toujours tout. */
function truncateHex(hex: string, max = 21) {
  return hex.length > max ? `${hex.slice(0, max)}…` : hex;
}

export function MachineTestPage({ connected, sysexEnabled, inputNames, observations, machineGroup, onBack, onConnect, onSendLearned, onSelectMachineGroup }: MachineTestPageProps) {
  const [selectedControl, setSelectedControl] = useState<string | null>(null);
  const [configureMode, setConfigureMode] = useState(false);
  const [sendNotice, setSendNotice] = useState('');
  const [assignments, setAssignments] = useState<Record<string, ControlAssignment>>(loadAssignments);
  // Le bouton virtuel bouge très bien au clic (:active dure tant que la
  // souris reste enfoncée), mais un vrai message reçu de la machine était
  // instantané : dès qu'un AUTRE message arrivait derrière (fréquent en
  // rafale), le contrôle repassait « inactif » avant d'avoir pu être vu.
  // On mémorise donc chaque contrôle touché pendant une courte fenêtre,
  // indépendamment des messages suivants, pour garantir un flash visible.
  const [recentlyReceived, setRecentlyReceived] = useState<Set<string>>(new Set());
  const receivedTimersRef = useRef<number[]>([]);
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

  useEffect(() => () => { receivedTimersRef.current.forEach((id) => window.clearTimeout(id)); }, []);

  useEffect(() => {
    if (!newestSignature) return;
    const matches = Object.keys(assignments).filter((key) => assignments[key].signature === newestSignature);
    if (!matches.length) return;
    setRecentlyReceived((current) => new Set([...current, ...matches]));
    // Chaque message programme sa propre extinction, sans dépendre du
    // cleanup de l'effet suivant — sinon un deuxième contrôle touché juste
    // après annulerait l'extinction du premier et le laisserait allumé
    // indéfiniment.
    receivedTimersRef.current.push(window.setTimeout(() => {
      setRecentlyReceived((current) => {
        const next = new Set(current);
        matches.forEach((key) => next.delete(key));
        return next;
      });
    }, 220));
  }, [newest?.timestamp, assignments, newestSignature]);

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
      className={`${className} ${selectedControl === id ? 'learning' : ''} ${recentlyReceived.has(id) ? 'received' : ''} ${assignments[id] ? 'mapped' : ''}`}
      onClick={() => void activate()}
      title={assignment?.signature || 'Contrôle non configuré'}
      key={id}
    ><b>{label}</b>{secondary && <small>{secondary}</small>}</button>;
  };

  return <main className="machine-test-page">
    <header className="machine-test-header">
      <button className="home-back" onClick={onBack}>← ACCUEIL</button>
      <div className="machine-test-title"><small>DIAGNOSTIC EN LECTURE SEULE</small><h1>TEST MACHINE</h1></div>
      <div className="machine-test-connect-block">
        <div className={`home-machine-status ${connected ? 'online' : ''}`}><i className={connected ? 'online' : ''} /><span>{sysexEnabled ? 'MIDI + SYSEX' : connected ? 'CONNECTÉ' : 'EP‑133 PRÊT À CONNECTER'}</span></div>
        {!sysexEnabled && <button className="machine-test-retry" onClick={onConnect}>{connected ? 'ACTIVER SYSEX' : 'CONNECTER L’EP‑133'}</button>}
      </div>
    </header>

    <section className="machine-test-help">
      <b>{selectedControl ? `APPUIE MAINTENANT SUR ${selectedControl.split(':')[1]} SUR LA MACHINE` : configureMode ? 'CLIQUE UN CONTRÔLE, PUIS ACTIONNE LE MÊME SUR L’EP-133' : 'CLIQUE UN CONTRÔLE CONFIGURÉ POUR L’ENVOYER À LA MACHINE'}</b>
      <span>{connected ? inputNames.join(' + ') : 'Connexion nécessaire pour recevoir les contrôles.'}</span>
      <div className="machine-test-mode"><button className={configureMode ? 'active' : ''} onClick={() => { setConfigureMode((current) => !current); setSelectedControl(null); }}>{configureMode ? 'TERMINER LA CONFIGURATION' : 'CONFIGURER'}</button></div>
      {sendNotice && <small className="machine-test-notice">{sendNotice}</small>}
      <small className="machine-test-notice">CAPTURE LOCALE TEMPORAIRE ACTIVE · tmp/ep133-midi-capture.ndjson</small>
    </section>

    <div className="machine-test-layout">
      <section className="ep133-face" aria-label="Façade de test EP-133">
        <div className="ep133-ports"><span>OUTPUT</span><span className="orange">INPUT</span><span>SYNC</span><span>MIDI</span><span>USB</span><span>POWER</span></div>
        <div className="ep133-brand-panel"><div><b>K.O. II</b><small>サンプラー</small><span>64 MB SAMPLER COMPOSER</span></div><i aria-hidden="true" /></div>
        <div className="ep133-display">
          <div className="display-groups">{(['A', 'B', 'C', 'D'] as const).map((label) => <span key={label}>{label === machineGroup ? <b>{label}</b> : label}</span>)}</div>
          <div className="ep133-display-journal" aria-label="Journal MIDI affiché sur l’écran de l’EP-133">
            {observations.length
              ? observations.slice(0, 3).map((message, index) => <p className={index === 0 ? 'latest' : ''} key={`${message.timestamp}-${index}`}><b>{message.kind.slice(0, 3).toUpperCase()}</b><code>{truncateHex(message.hex)}</code></p>)
              : <p className="idle">EN ATTENTE DE SIGNAL MIDI…</p>}
          </div>
        </div>
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
    </div>

    <footer className="machine-test-footer">
      <span>{Object.keys(assignments).length} CONTRÔLE(S) CARTOGRAPHIÉ(S)</span>
      <div className="machine-test-footer-actions">
        <button disabled={!observations.length} title="Relis le fichier avant de le partager — il inclut les noms des ports MIDI détectés." onClick={() => downloadDiagnosticLog({ connected, sysexEnabled, inputNames, observations })}>⬇ JOURNAL DE DIAGNOSTIC · {observations.length}</button>
        <button onClick={() => { localStorage.removeItem(MIDI_CONTROL_MAP_STORAGE_KEY); setAssignments({}); setSelectedControl(null); }}>EFFACER LA CARTOGRAPHIE</button>
      </div>
    </footer>
  </main>;
}
