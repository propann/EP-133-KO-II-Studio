import assert from 'node:assert/strict';
import { isEp133MidiPort, midiPanicMessages, officialGroupIndexFromNote, officialInternalPadFromNote, officialPadFromNote } from '../src/core/midi/useWebMidi.ts';

assert.equal(isEp133MidiPort('EP-133:EP-133 MIDI 1 20:0'), true);
assert.equal(isEp133MidiPort('EP 133 MIDI'), true);
assert.equal(isEp133MidiPort('Midi Through Port-0'), false);

assert.equal(officialPadFromNote(36), 9);
assert.equal(officialPadFromNote(45), 0);
assert.equal(officialPadFromNote(83), 2);
assert.equal(officialPadFromNote(35), undefined);
assert.equal(officialPadFromNote(84), undefined);
assert.equal(officialGroupIndexFromNote(36), 0);
assert.equal(officialGroupIndexFromNote(48), 1);
assert.equal(officialGroupIndexFromNote(83), 3);
assert.equal(officialGroupIndexFromNote(84), undefined);
assert.equal(officialInternalPadFromNote(45), 1, 'la touche visuelle 7 correspond au pad interne 1');
assert.equal(officialInternalPadFromNote(36), 10, 'la touche visuelle point correspond au pad interne 10');

const panic = midiPanicMessages();
assert.equal(panic.length, 33);
assert.deepEqual(panic[0], [0xfc]);
for (let channel = 0; channel < 16; channel += 1) {
  assert.deepEqual(panic[1 + channel * 2], [0xb0 | channel, 123, 0]);
  assert.deepEqual(panic[2 + channel * 2], [0xb0 | channel, 120, 0]);
}

console.log('Transport MIDI : mapping et PANIC sur 16 canaux OK');
