import { useCallback, useEffect, useRef, useState } from 'react';

export interface MidiHit {
  pad: number;
  velocity: number;
  timestamp: number;
}

export interface MidiObservation {
  channel: number;
  note: number;
  velocity: number;
  inputName: string;
  timestamp: number;
}

export type MidiPadMap = Record<string, number>;

export const midiKey = (channel: number, note: number) => `${channel}:${note}`;

// Ordre officiel des notes dans chaque groupe : . 0 ENTER 1 2 3 4 5 6 7 8 9.
// Ordre visuel de notre grille : 7 8 9 / 4 5 6 / 1 2 3 / . 0 ENTER.
const NOTE_OFFSET_TO_VISUAL_PAD = [9, 10, 11, 6, 7, 8, 3, 4, 5, 0, 1, 2];

export function officialPadFromNote(note: number) {
  if (note < 36 || note > 83) return undefined;
  return NOTE_OFFSET_TO_VISUAL_PAD[(note - 36) % 12];
}

interface WebMidiState {
  status: string;
  connected: boolean;
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
    inputNames: [],
    outputConnected: false,
    outputNames: [],
  });
  const accessRef = useRef<MIDIAccess | null>(null);
  const hitRef = useRef(onPadHit);
  const observationRef = useRef(onObservation);

  useEffect(() => { hitRef.current = onPadHit; }, [onPadHit]);
  useEffect(() => { observationRef.current = onObservation; }, [onObservation]);

  const detachInputs = useCallback(() => {
    accessRef.current?.inputs.forEach((input) => { input.onmidimessage = null; });
  }, []);

  const attachInputs = useCallback(async (access: MIDIAccess) => {
    const inputs = [...access.inputs.values()];
    const handler = (event: MIDIMessageEvent) => {
      const data = event.data;
      if (!data || (data[0] & 0xf0) !== 0x90 || data[2] === 0) return;

      const channel = (data[0] & 0x0f) + 1;
      const note = data[1];
      const velocity = data[2];
      const inputName = (event.target as MIDIInput | null)?.name || 'Entrée MIDI';
      const timestamp = event.timeStamp || performance.now();
      const observation = { channel, note, velocity, inputName, timestamp };
      observationRef.current(observation);

      const pad = officialPadFromNote(note);
      if (pad !== undefined) hitRef.current({ pad, velocity, timestamp });
    };

    if (!inputs.length) {
      setState((current) => ({ ...current, status: 'Aucune entrée MIDI détectée', connected: false, inputNames: [] }));
      return;
    }

    try {
      await Promise.all(inputs.map(async (input) => {
        if (input.connection !== 'open') await input.open();
        input.onmidimessage = handler;
      }));
      const inputNames = inputs.map((input) => input.name || 'Entrée MIDI');
      setState((current) => ({ ...current, status: `Connecté : ${inputNames.join(' + ')}`, connected: true, inputNames }));
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'ouverture refusée';
      setState((current) => ({ ...current, status: `Port MIDI détecté mais impossible à ouvrir : ${detail}`, connected: false, inputNames: [] }));
    }
  }, []);

  const attachOutputs = useCallback(async (access: MIDIAccess) => {
    const outputs = [...access.outputs.values()];
    try {
      await Promise.all(outputs.map((output) => output.connection === 'open' ? Promise.resolve(output) : output.open()));
      setState((current) => ({ ...current, outputConnected: outputs.length > 0, outputNames: outputs.map((output) => output.name || 'Sortie MIDI') }));
    } catch {
      setState((current) => ({ ...current, outputConnected: false, outputNames: [] }));
    }
  }, []);

  const connect = useCallback(async () => {
    if (!navigator.requestMIDIAccess) {
      setState((current) => ({ ...current, status: 'Web MIDI indisponible — utilise Chrome ou Chromium', connected: false, inputNames: [] }));
      return;
    }

    try {
      detachInputs();
      const access = await navigator.requestMIDIAccess({ sysex: false });
      accessRef.current = access;
      await Promise.all([attachInputs(access), attachOutputs(access)]);
      access.onstatechange = () => { void attachInputs(access); void attachOutputs(access); };
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'autorisation refusée';
      setState((current) => ({ ...current, status: `Connexion MIDI impossible : ${detail}`, connected: false, inputNames: [], outputConnected: false, outputNames: [] }));
    }
  }, [attachInputs, attachOutputs, detachInputs]);

  const sendPad = useCallback((pad: number, groupIndex: number, velocity = 100, timestamp = performance.now(), durationMs = 90) => {
    const noteByVisualPad = [45, 46, 47, 42, 43, 44, 39, 40, 41, 36, 37, 38];
    const note = noteByVisualPad[pad] + groupIndex * 12;
    accessRef.current?.outputs.forEach((output) => {
      output.send([0x90, note, velocity], timestamp);
      output.send([0x80, note, 0], timestamp + durationMs);
    });
  }, []);

  const sendNote = useCallback((note: number, velocity = 100, timestamp = performance.now(), durationMs = 120) => {
    const safeNote = Math.max(0, Math.min(127, note));
    accessRef.current?.outputs.forEach((output) => {
      output.send([0x90, safeNote, velocity], timestamp);
      output.send([0x80, safeNote, 0], timestamp + durationMs);
    });
  }, []);

  const stopOutput = useCallback(() => {
    accessRef.current?.outputs.forEach((output) => {
      (output as MIDIOutput & { clear: () => void }).clear();
      output.send([0xfc]);
      output.send([0xb0, 123, 0]);
    });
  }, []);

  const startOutputTransport = useCallback((timestamp = performance.now()) => {
    accessRef.current?.outputs.forEach((output) => output.send([0xfa], timestamp));
  }, []);

  const sendClockWindow = useCallback((bpm: number, timestamp: number, durationMs: number) => {
    const clockMs = 60000 / bpm / 24;
    accessRef.current?.outputs.forEach((output) => {
      for (let offset = 0; offset < durationMs; offset += clockMs) output.send([0xf8], timestamp + offset);
    });
  }, []);

  useEffect(() => () => {
    detachInputs();
    if (accessRef.current) accessRef.current.onstatechange = null;
  }, [detachInputs]);

  return { ...state, connect, sendPad, sendNote, stopOutput, startOutputTransport, sendClockWindow };
}
