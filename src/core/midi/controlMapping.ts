import type { MidiObservation } from './useWebMidi';
import type { EditorGroup } from '../project/exporters';

export const MIDI_CONTROL_MAP_STORAGE_KEY = 'ep133-rhythm-hero:midi-control-map:v1';

export interface ControlAssignment {
  signature: string;
  data: number[];
  kind: MidiObservation['kind'];
}

export function midiObservationSignature(message: MidiObservation) {
  if (message.kind === 'note') return `${message.kind}:ch${message.channel ?? '-'}:${message.note ?? '-'}`;
  if (message.kind === 'control') return `${message.kind}:ch${message.channel ?? '-'}:${message.data[1] ?? '-'}`;
  return `${message.kind}:${message.hex}`;
}

export function groupForMappedObservation(message: MidiObservation, assignments: Record<string, ControlAssignment | string>) {
  const observed = midiObservationSignature(message);
  return (['A', 'B', 'C', 'D'] as EditorGroup[]).find((group) => {
    const assignment = assignments[`group:${group}`];
    return typeof assignment !== 'string' && assignment?.signature === observed;
  });
}

export function loadControlAssignments(storage: Pick<Storage, 'getItem'>): Record<string, ControlAssignment> {
  try {
    const stored = JSON.parse(storage.getItem(MIDI_CONTROL_MAP_STORAGE_KEY) || '{}') as Record<string, ControlAssignment | string>;
    return Object.fromEntries(Object.entries(stored).flatMap(([key, value]) => typeof value === 'string' ? [] : [[key, value]]));
  } catch {
    return {};
  }
}
