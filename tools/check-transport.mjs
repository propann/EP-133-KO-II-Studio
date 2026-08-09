import assert from 'node:assert/strict';
import { midiPanicMessages, officialPadFromNote } from '../src/core/midi/useWebMidi.ts';

assert.equal(officialPadFromNote(36), 9);
assert.equal(officialPadFromNote(45), 0);
assert.equal(officialPadFromNote(83), 2);
assert.equal(officialPadFromNote(35), undefined);
assert.equal(officialPadFromNote(84), undefined);

const panic = midiPanicMessages();
assert.equal(panic.length, 33);
assert.deepEqual(panic[0], [0xfc]);
for (let channel = 0; channel < 16; channel += 1) {
  assert.deepEqual(panic[1 + channel * 2], [0xb0 | channel, 123, 0]);
  assert.deepEqual(panic[2 + channel * 2], [0xb0 | channel, 120, 0]);
}

console.log('Transport MIDI : mapping et PANIC sur 16 canaux OK');
