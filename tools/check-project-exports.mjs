import assert from 'node:assert/strict';
import { createEp133ProjectDocument, createMidiFile } from '../src/core/project/exporters.ts';
import { inspectEp133Archive, readEp133ProjectDocument, readMidiFile } from '../src/core/project/importers.ts';
import { zipSync, strToU8 } from 'fflate';

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

const importedMidi = readMidiFile(midi);
assert.equal(importedMidi.ppqn, 96);
assert.equal(importedMidi.bpm, 120);
assert.equal(importedMidi.events.length, 2);
assert.equal(importedMidi.patterns.A[0].pad, 0);
assert.equal(importedMidi.patterns.B[0].note, 48);
assert.equal(importedMidi.events[0].duration, 0.25);

assert.equal(readEp133ProjectDocument(JSON.stringify(project)).schema, 'ep.project.v1');
assert.throws(() => readEp133ProjectDocument('{"schema":"inconnu"}'), /ep\.project\.v1/);

const archive = zipSync({
  '/meta.json': strToU8(JSON.stringify({ product: 'ep133', device_version: '2.5.0' })),
  '/projects/P01.tar': new Uint8Array([0]),
  '/sounds/001 TEST.wav': new Uint8Array([1, 2, 3]),
});
const archiveSummary = inspectEp133Archive(archive, 'test.ppak');
assert.equal(archiveSummary.kind, 'ppak');
assert.equal(archiveSummary.projects[0], 'projects/P01.tar');
assert.equal(archiveSummary.sounds.length, 1);
assert.equal(archiveSummary.meta?.product, 'ep133');

console.log('Lecture/écriture MIDI, ep.project.v1 et inspection .pak/.ppak : OK');
