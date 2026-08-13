import { useCallback, useEffect, useRef, useState } from 'react';
import { PAD_MIDI_NOTES } from '../project/exporters.ts';

export interface MidiHit {
  pad: number;
  /** Présent pour une frappe reçue de l'EP-133 ; absent pour un clic virtuel. */
  groupIndex?: number;
  velocity: number;
  timestamp: number;
}

export interface MidiObservation {
  channel?: number;
  note?: number;
  velocity?: number;
  kind: 'note' | 'control' | 'program' | 'pressure' | 'pitch' | 'system' | 'sysex' | 'unknown';
  data: number[];
  hex: string;
  inputName: string;
  timestamp: number;
}

export type MidiPadMap = Record<string, number>;

export const midiKey = (channel: number, note: number) => `${channel}:${note}`;
export const isEp133MidiPort = (name?: string | null) => /\bEP[- ]?133\b/i.test(name || '');

export const midiPanicMessages = () => [
  [0xfc],
  ...Array.from({ length: 16 }, (_, channel) => [[0xb0 | channel, 123, 0], [0xb0 | channel, 120, 0]]).flat(),
];

const pack7 = (raw: number[]) => raw.flatMap((_, offset) => {
  if (offset % 7) return [];
  const chunk = raw.slice(offset, offset + 7);
  const flags = chunk.reduce((value, byte, bit) => value | ((byte & 0x80) ? 1 << bit : 0), 0);
  return [flags, ...chunk.map((byte) => byte & 0x7f)];
});

const unpack7 = (encoded: number[]) => {
  const raw: number[] = [];
  for (let index = 0; index < encoded.length;) {
    const flags = encoded[index++];
    for (let bit = 0; bit < 7 && index < encoded.length; bit += 1) {
      raw.push(encoded[index++] | ((flags & (1 << bit)) ? 0x80 : 0));
    }
  }
  return raw;
};

// Ordre officiel des notes dans chaque groupe : . 0 ENTER 1 2 3 4 5 6 7 8 9.
// Ordre visuel de notre grille : 7 8 9 / 4 5 6 / 1 2 3 / . 0 ENTER.
const NOTE_OFFSET_TO_VISUAL_PAD = [9, 10, 11, 6, 7, 8, 3, 4, 5, 0, 1, 2];

export function officialPadFromNote(note: number) {
  if (note < 36 || note > 83) return undefined;
  return NOTE_OFFSET_TO_VISUAL_PAD[(note - 36) % 12];
}

export function officialGroupIndexFromNote(note: number) {
  return note >= 36 && note <= 83 ? Math.floor((note - 36) / 12) : undefined;
}

export function officialInternalPadFromNote(note: number) {
  const visualPad = officialPadFromNote(note);
  return visualPad === undefined ? undefined : visualPad + 1;
}

interface WebMidiState {
  status: string;
  connected: boolean;
  sysexEnabled: boolean;
  inputNames: string[];
  outputConnected: boolean;
  outputNames: string[];
}

export function useWebMidi(
  onPadHit: (hit: MidiHit) => void,
  onObservation: (message: MidiObservation) => void,
) {
  const [state, setState] = useState<WebMidiState>({
    status: 'Non connecté',
    connected: false,
    sysexEnabled: false,
    inputNames: [],
    outputConnected: false,
    outputNames: [],
  });
  const accessRef = useRef<MIDIAccess | null>(null);
  // Empêche un double appel à requestMIDIAccess en développement (React
  // StrictMode invoque les effets deux fois de suite sur la même instance ;
  // accessRef n'est encore rempli qu'après la résolution du premier appel).
  const autoConnectAttemptedRef = useRef(false);
  const monitorAllInputsRef = useRef(false);
  const requestIdRef = useRef(0x300);
  const pendingFileRequestsRef = useRef(new Map<number, { resolve: (data: number[]) => void; reject: (error: Error) => void; timer: number }>());
  const channelRef = useRef(0);
  const hitRef = useRef(onPadHit);
  const observationRef = useRef(onObservation);

  useEffect(() => { hitRef.current = onPadHit; }, [onPadHit]);
  useEffect(() => { observationRef.current = onObservation; }, [onObservation]);

  const detachInputs = useCallback(() => {
    accessRef.current?.inputs.forEach((input) => { input.onmidimessage = null; });
  }, []);

  const attachInputs = useCallback(async (access: MIDIAccess, monitorAll = monitorAllInputsRef.current, sysexEnabled = false) => {
    // Un port débranché reste dans access.inputs (le navigateur ne le
    // retire pas), seul son .state passe à 'disconnected' — filtrer par nom
    // seul laissait la pastille « connecté » allumée après débranchement.
    const inputs = [...access.inputs.values()].filter((input) => input.state === 'connected' && (monitorAll || isEp133MidiPort(input.name)));
    const handler = (event: MIDIMessageEvent) => {
      const data = event.data;
      if (!data?.length) return;
      const bytes = Array.from(data);
      // Réponse TE FILE : F0 00 20 76 33 40 <request-id> 05 <status> ... F7.
      if (bytes.length >= 11 && bytes[0] === 0xf0 && bytes[1] === 0x00 && bytes[2] === 0x20 && bytes[3] === 0x76 && bytes[4] === 0x33 && bytes[5] === 0x40 && bytes[8] === 0x05) {
        const requestId = ((bytes[6] & 0x1f) << 7) | bytes[7];
        const pending = pendingFileRequestsRef.current.get(requestId);
        if (pending) {
          window.clearTimeout(pending.timer);
          pendingFileRequestsRef.current.delete(requestId);
          const status = bytes[9];
          const responseData = unpack7(bytes.slice(10, -1));
          if (status === 0) pending.resolve(responseData);
          else pending.reject(new Error(`EP-133 FILE status ${status}`));
        }
      }
      const status = bytes[0];
      const command = status & 0xf0;
      const channelMessage = status < 0xf0;
      const channel = channelMessage ? (status & 0x0f) + 1 : undefined;
      if (channel !== undefined) channelRef.current = channel - 1;
      const kind: MidiObservation['kind'] = status === 0xf0 ? 'sysex'
        : status >= 0xf0 ? 'system'
          : command === 0x80 || command === 0x90 ? 'note'
            : command === 0xb0 ? 'control'
              : command === 0xc0 ? 'program'
                : command === 0xd0 ? 'pressure'
                  : command === 0xe0 ? 'pitch'
                    : 'unknown';
      const note = kind === 'note' ? bytes[1] : undefined;
      const velocity = kind === 'note' ? bytes[2] : undefined;
      const inputName = (event.target as MIDIInput | null)?.name || 'Entrée MIDI';
      const timestamp = event.timeStamp || performance.now();
      const observation: MidiObservation = {
        channel,
        note,
        velocity,
        kind,
        data: bytes,
        hex: bytes.map((byte) => byte.toString(16).padStart(2, '0').toUpperCase()).join(' '),
        inputName,
        timestamp,
      };
      observationRef.current(observation);

      if (kind !== 'note' || command !== 0x90 || velocity === undefined || velocity === 0 || note === undefined) return;
      const pad = officialPadFromNote(note);
      const groupIndex = officialGroupIndexFromNote(note);
      if (pad !== undefined && groupIndex !== undefined) hitRef.current({ pad, groupIndex, velocity, timestamp });
    };

    if (!inputs.length) {
      setState((current) => ({ ...current, status: monitorAll ? 'Aucune entrée MIDI visible' : 'Entrée EP-133 introuvable', connected: false, inputNames: [] }));
      return;
    }

    try {
      await Promise.all(inputs.map(async (input) => {
        if (input.connection !== 'open') await input.open();
        input.onmidimessage = handler;
      }));
      const inputNames = inputs.map((input) => input.name || 'Entrée MIDI');
      setState((current) => ({ ...current, status: `${sysexEnabled ? 'Connecté SysEx' : 'Connecté MIDI'} : ${inputNames.join(' + ')}`, connected: true, sysexEnabled, inputNames }));
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'ouverture refusée';
      setState((current) => ({ ...current, status: `Port MIDI détecté mais impossible à ouvrir : ${detail}`, connected: false, sysexEnabled: false, inputNames: [] }));
    }
  }, []);

  const attachOutputs = useCallback(async (access: MIDIAccess) => {
    // Même correctif que attachInputs : ne garder que les sorties encore
    // réellement branchées, pas seulement celles qui portent le bon nom.
    const outputs = [...access.outputs.values()].filter((output) => output.state === 'connected' && isEp133MidiPort(output.name));
    try {
      await Promise.all(outputs.map((output) => output.connection === 'open' ? Promise.resolve(output) : output.open()));
      setState((current) => ({ ...current, outputConnected: outputs.length > 0, outputNames: outputs.map((output) => output.name || 'Sortie MIDI') }));
    } catch {
      setState((current) => ({ ...current, outputConnected: false, outputNames: [] }));
    }
  }, []);

  /** Initialise le canal d'événements FILE utilisé par l'outil officiel.
   * Cette séquence active l'observation des événements spontanés (notamment
   * les contrôles A–D) ; elle ne modifie ni projet, ni sample, ni affectation. */
  const subscribeToFileEvents = useCallback(() => {
    accessRef.current?.outputs.forEach((output) => {
      if (!isEp133MidiPort(output.name)) return;
      output.send([0xf0, 0x00, 0x20, 0x76, 0x33, 0x40, 0x61, 0x17, 0x01, 0xf7]);
      output.send([0xf0, 0x00, 0x20, 0x76, 0x33, 0x40, 0x61, 0x18, 0x05, 0x00, 0x01, 0x01, 0x00, 0x40, 0x00, 0x00, 0xf7]);
    });
  }, []);

  const connectWithInputScope = useCallback(async (monitorAll: boolean) => {
    if (!navigator.requestMIDIAccess) {
      setState((current) => ({ ...current, status: 'Web MIDI indisponible — utilise Chrome ou Chromium', connected: false, inputNames: [] }));
      return;
    }

    try {
      detachInputs();
      monitorAllInputsRef.current = monitorAll;
      // Les boutons de façade A–D et plusieurs contrôles EP-133 émettent des
      // notifications propriétaires. L'accès SysEx est demandé pour les
      // observer uniquement ; aucune de ces données n'est renvoyée par ce hook.
      const access = await navigator.requestMIDIAccess({ sysex: true });
      accessRef.current = access;
      await Promise.all([attachInputs(access, monitorAll, true), attachOutputs(access)]);
      subscribeToFileEvents();
      access.onstatechange = () => { void attachInputs(access, monitorAllInputsRef.current, true); void attachOutputs(access); };
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'autorisation refusée';
      setState((current) => ({ ...current, status: `Connexion MIDI impossible : ${detail}`, connected: false, inputNames: [], outputConnected: false, outputNames: [] }));
    }
  }, [attachInputs, attachOutputs, detachInputs, subscribeToFileEvents]);

  const connect = useCallback(() => connectWithInputScope(false), [connectWithInputScope]);
  const connectMonitor = useCallback(() => connectWithInputScope(true), [connectWithInputScope]);

  /** Connexion automatique complète (SysEx inclus) dès l'ouverture de
   * l'application, en réutilisant exactement le même chemin que le bouton
   * CONNECTER manuel. Si le navigateur a déjà autorisé le SysEx pour ce
   * site (visite précédente), il ne redemande rien et la machine apparaît
   * connectée sans aucun clic. Si l'autorisation n'a jamais été accordée,
   * cette tentative échoue silencieusement (ou déclenche l'invite native
   * du navigateur selon le moteur) — le bouton CONNECTER de chaque page
   * reste alors le repli pour le premier geste explicite. Non vérifié en
   * conditions réelles pour un tout premier accès jamais autorisé — voir
   * docs/A_VALIDER_PHYSIQUEMENT.md. */
  useEffect(() => {
    if (!navigator.requestMIDIAccess || autoConnectAttemptedRef.current) return;
    autoConnectAttemptedRef.current = true;
    void connectWithInputScope(false);
  }, [connectWithInputScope]);

  const sendPad = useCallback((pad: number, groupIndex: number, velocity = 100, timestamp = performance.now(), durationMs = 90) => {
    const note = PAD_MIDI_NOTES[pad] + groupIndex * 12;
    accessRef.current?.outputs.forEach((output) => {
      if (!isEp133MidiPort(output.name)) return;
      output.send([0x90 | channelRef.current, note, velocity], timestamp);
      output.send([0x80 | channelRef.current, note, 0], timestamp + durationMs);
    });
  }, []);

  const sendNote = useCallback((note: number, velocity = 100, timestamp = performance.now(), durationMs = 120) => {
    const safeNote = Math.max(0, Math.min(127, note));
    accessRef.current?.outputs.forEach((output) => {
      if (!isEp133MidiPort(output.name)) return;
      output.send([0x90 | channelRef.current, safeNote, velocity], timestamp);
      output.send([0x80 | channelRef.current, safeNote, 0], timestamp + durationMs);
    });
  }, []);

  /** Rejoue uniquement un message MIDI de canal appris (note, CC, programme,
   * pression ou pitch bend). Les SysEx observés ne sont jamais réémis sans
   * protocole d'écriture confirmé pour l'EP-133. */
  const sendLearnedMessage = useCallback((data: number[]) => {
    if (!data.length || data[0] >= 0xf0) return false;
    const message = data.map((byte) => Math.max(0, Math.min(255, Math.round(byte))));
    accessRef.current?.outputs.forEach((output) => {
      if (!isEp133MidiPort(output.name)) return;
      output.send(message);
      if ((message[0] & 0xf0) === 0x90 && message[2] > 0) {
        output.send([0x80 | (message[0] & 0x0f), message[1], 0], performance.now() + 90);
      }
    });
    return true;
  }, []);

  const sendFileRequest = useCallback((rawPayload: number[]) => new Promise<number[]>((resolve, reject) => {
    const output = [...(accessRef.current?.outputs.values() || [])].find((candidate) => isEp133MidiPort(candidate.name));
    if (!output) { reject(new Error('Sortie EP-133 introuvable')); return; }
    const requestId = requestIdRef.current++ & 0x0fff;
    const hi = (requestId >> 7) & 0x1f;
    const lo = requestId & 0x7f;
    const frame = [0xf0, 0x00, 0x20, 0x76, 0x33, 0x40, 0x60 | hi, lo, 0x05, ...pack7(rawPayload), 0xf7];
    const timer = window.setTimeout(() => {
      pendingFileRequestsRef.current.delete(requestId);
      reject(new Error('Délai de réponse EP-133 dépassé'));
    }, 3000);
    pendingFileRequestsRef.current.set(requestId, { resolve, reject, timer });
    output.send(frame);
  }), []);

  const getFileMetadata = useCallback(async (fileId: number, key: string) => {
    const keyBytes = [...new TextEncoder().encode(key), 0];
    const response = await sendFileRequest([0x07, 0x02, fileId >> 8, fileId & 0xff, 0, 0, ...keyBytes]);
    const text = new TextDecoder().decode(new Uint8Array(response.slice(2))).split('\0')[0];
    return text ? JSON.parse(text) as Record<string, unknown> : {};
  }, [sendFileRequest]);

  /** Sélection officielle A–D utilisée par EP Sample Tool : métadonnée active
   * du dossier groups, avec lecture préalable et readback obligatoire. */
  const selectMachineGroup = useCallback(async (groupIndex: number) => {
    if (groupIndex < 0 || groupIndex > 3) throw new Error('Groupe EP-133 invalide');
    await sendFileRequest([0x01, 0x01, 0x00, 0x40, 0x00, 0x00]);
    const projectMeta = await getFileMetadata(2000, 'active');
    const projectFid = Number(projectMeta.active);
    if (!Number.isInteger(projectFid) || projectFid < 3000) throw new Error('Projet actif EP-133 introuvable');
    const groupsFid = projectFid + 100;
    const groupFid = projectFid + 200 + groupIndex * 100;
    const json = [...new TextEncoder().encode(JSON.stringify({ active: groupFid })), 0];
    await sendFileRequest([0x07, 0x01, groupsFid >> 8, groupsFid & 0xff, ...json]);
    const readback = await getFileMetadata(groupsFid, 'active');
    if (Number(readback.active) !== groupFid) throw new Error(`Relecture groupe incorrecte (${String(readback.active)})`);
    return groupFid;
  }, [getFileMetadata, sendFileRequest]);

  const SOUNDS_NODE_ID = 1000;
  const PROJECTS_NODE_ID = 2000;

  /** Liste en direct les sons occupés sur /sounds (commande LIST 0x04,
   * paginée) — même protocole que `epsysex.FileClient.list_sounds()`
   * (kmorrill/ep-series-sysex), reproduit ici pour que SCAN (Fiche
   * personnage) reflète la machine réelle. Trouvé le 13 août : jusque-là
   * SCAN republiait `public/ep133-sound-index.json`, un instantané figé
   * au 9 août, sans jamais interroger la machine. */
  const listMachineSounds = useCallback(async () => {
    await sendFileRequest([0x01, 0x01, 0x00, 0x40, 0x00, 0x00]);
    const sounds: Array<{ slot: number; bytes: number; flags: number; fileName: string }> = [];
    let page = 0;
    for (;;) {
      const payload = await sendFileRequest([0x04, (page >> 8) & 0xff, page & 0xff, (SOUNDS_NODE_ID >> 8) & 0xff, SOUNDS_NODE_ID & 0xff]);
      if (payload.length <= 2) break;
      let offset = 2;
      while (offset + 7 <= payload.length) {
        const slot = (payload[offset] << 8) | payload[offset + 1];
        const flags = payload[offset + 2];
        const bytes = ((payload[offset + 3] << 24) | (payload[offset + 4] << 16) | (payload[offset + 5] << 8) | payload[offset + 6]) >>> 0;
        let nameEnd = offset + 7;
        while (nameEnd < payload.length && payload[nameEnd] !== 0) nameEnd += 1;
        const fileName = new TextDecoder().decode(new Uint8Array(payload.slice(offset + 7, nameEnd)));
        if (slot >= 1 && slot <= 999) sounds.push({ slot, bytes, flags, fileName });
        offset = nameEnd + 1;
      }
      page += 1;
    }
    return sounds;
  }, [sendFileRequest]);

  /** Numéro du projet actif (1–99) déduit de la métadonnée `active` du
   * dossier /projects — même lecture que `selectMachineGroup`, sans écrire. */
  const getActiveProjectNumber = useCallback(async () => {
    await sendFileRequest([0x01, 0x01, 0x00, 0x40, 0x00, 0x00]);
    const meta = await getFileMetadata(PROJECTS_NODE_ID, 'active');
    const fid = Number(meta.active);
    if (!Number.isInteger(fid) || fid < 3000) throw new Error('Projet actif EP-133 introuvable');
    return Math.round((fid - 3000) / 1000) + 1;
  }, [getFileMetadata, sendFileRequest]);

  const stopOutput = useCallback(() => {
    accessRef.current?.outputs.forEach((output) => {
      if (!isEp133MidiPort(output.name)) return;
      try {
        (output as MIDIOutput & { clear?: () => void }).clear?.();
        midiPanicMessages().forEach((message) => output.send(message));
      } catch {
        // Un port peut disparaître entre l'état connecté et STOP.
      }
    });
  }, []);

  const startOutputTransport = useCallback((timestamp = performance.now()) => {
    accessRef.current?.outputs.forEach((output) => { if (isEp133MidiPort(output.name)) output.send([0xfa], timestamp); });
  }, []);

  const sendClockWindow = useCallback((bpm: number, timestamp: number, durationMs: number) => {
    const clockMs = 60000 / bpm / 24;
    accessRef.current?.outputs.forEach((output) => {
      if (!isEp133MidiPort(output.name)) return;
      for (let offset = 0; offset < durationMs; offset += clockMs) output.send([0xf8], timestamp + offset);
    });
  }, []);

  useEffect(() => () => {
    stopOutput();
    detachInputs();
    if (accessRef.current) accessRef.current.onstatechange = null;
  }, [detachInputs, stopOutput]);

  return { ...state, connect, connectMonitor, sendPad, sendNote, sendLearnedMessage, selectMachineGroup, listMachineSounds, getActiveProjectNumber, stopOutput, startOutputTransport, sendClockWindow };
}
