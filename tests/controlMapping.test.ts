import { describe, expect, it } from 'vitest';
import { groupForMappedObservation, loadControlAssignments, midiObservationSignature, MIDI_CONTROL_MAP_STORAGE_KEY } from '../src/core/midi/controlMapping';
import type { MidiObservation } from '../src/core/midi/useWebMidi';

const observation = (patch: Partial<MidiObservation>): MidiObservation => ({
  kind: 'sysex', data: [0xf0, 0xf7], hex: 'F0 F7', inputName: 'EP-133', timestamp: 1, ...patch,
});

describe('mapping des contrôles MIDI EP-133', () => {
  it('produit des signatures stables pour note, CC et SysEx', () => {
    expect(midiObservationSignature(observation({ kind: 'note', channel: 1, note: 60, velocity: 100, data: [0x90, 60, 100], hex: '90 3C 64' }))).toBe('note:ch1:60');
    expect(midiObservationSignature(observation({ kind: 'control', channel: 2, data: [0xB1, 16, 127], hex: 'B1 10 7F' }))).toBe('control:ch2:16');
    expect(midiObservationSignature(observation({ kind: 'sysex', hex: 'F0 00 20 76 F7' }))).toBe('sysex:F0 00 20 76 F7');
  });

  it('associe une observation à A-D sans réémettre le message', () => {
    const message = observation({ kind: 'sysex', hex: 'F0 00 20 76 33 40 12 F7' });
    const assignments = { 'group:A': { signature: midiObservationSignature(message), data: message.data, kind: message.kind } };
    expect(groupForMappedObservation(message, assignments)).toBe('A');
    expect(groupForMappedObservation(observation({ hex: 'F0 01 F7' }), assignments)).toBeUndefined();
  });

  it('ignore une cartographie locale invalide', () => {
    const storage = { getItem: (key: string) => key === MIDI_CONTROL_MAP_STORAGE_KEY ? '{invalid' : null };
    expect(loadControlAssignments(storage)).toEqual({});
  });
});
