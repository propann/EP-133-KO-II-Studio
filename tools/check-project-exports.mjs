import assert from 'node:assert/strict';
import { createEp133ProjectDocument, createMidiFile } from '../src/core/project/exporters.ts';

const patterns = {
  A: [{ id: 'kick', beat: 0, pad: 0 }],
  B: [{ id: 'bass', beat: 1, pad: 10, note: 48 }],
  C: [],
  D: [],
};

const midi = createMidiFile(patterns, 120);
assert.equal(new TextDecoder().decode(midi.slice(0, 4)), 'MThd');
assert.equal(new TextDecoder().decode(midi.slice(14, 18)), 'MTrk');
assert.ok([...midi].includes(45), 'la note officielle du pad A-7 doit être exportée');
assert.ok([...midi].includes(48), 'la hauteur du piano-roll doit être conservée');

const project = createEp133ProjectDocument({
  title: 'TEST', patterns,
  pads: [{ group: 'B', pad: 11, slot: 444, playMode: 0, rootNote: 26 }],
  padModes: { 'B:10': 'KEYS' },
});
assert.equal(project.schema, 'ep.project.v1');
assert.equal(project.patterns.length, 4);
assert.equal(project.patterns[1].events[0].note, 48);
assert.equal(project.pads[0].playMode, 1);
assert.deepEqual(project.scenes[0].groupPatterns, [1, 1, 1, 1]);

console.log('Exports MIDI et ep.project.v1 : OK');
