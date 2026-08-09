import assert from 'node:assert/strict';
import { createEp133ProjectDocument, createMidiFile } from '../src/core/project/exporters.ts';
import { decodeEp133ProjectTar, inspectEp133Archive, readEp133ProjectDocument, readMidiFile } from '../src/core/project/importers.ts';
import { exerciseTargetsToNotes, normalizeSequencerNote, notesToExerciseTargets } from '../src/core/project/model.ts';
import { deleteStudioProject, duplicateStudioProject, loadStudioLibrary, renameStudioProject, storeStudioProject, studioStateFromDocument } from '../src/core/project/studioLibrary.ts';
import { zipSync, strToU8 } from 'fflate';

const patterns = {
  A: [{ id: 'kick', group: 'A', beat: 0, pad: 0, velocity: 117, duration: 0.5 }],
  B: [{ id: 'bass', group: 'B', beat: 1, pad: 10, note: 48, velocity: 83, duration: 0.25 }],
  C: [],
  D: [],
};

const midi = createMidiFile(patterns, 120);
assert.equal(new TextDecoder().decode(midi.slice(0, 4)), 'MThd');
assert.equal(new TextDecoder().decode(midi.slice(14, 18)), 'MTrk');
assert.ok([...midi].includes(45), 'la note officielle du pad A-7 doit être exportée');
assert.ok([...midi].includes(48), 'la hauteur du piano-roll doit être conservée');

const project = createEp133ProjectDocument({
  title: 'TEST', bpm: 120, patterns,
  pads: [{ group: 'B', pad: 11, slot: 444, playMode: 0, rootNote: 26 }],
  padModes: { 'A:0': 'ONE', 'B:10': 'KEYS' },
});
assert.equal(project.schema, 'ep.project.v1');
assert.equal(project.patterns.length, 4);
assert.equal(project.patterns[1].events[0].note, 48);
assert.equal(project.patterns[0].events[0].velocity, 117);
assert.equal(project.patterns[0].events[0].duration, 48);
assert.equal(project.settings.bpm, 120);
assert.equal(project.pads[0].playMode, 1);
assert.deepEqual(project.scenes[0].groupPatterns, [1, 1, 1, 1]);

const importedMidi = readMidiFile(midi);
assert.equal(importedMidi.ppqn, 96);
assert.equal(importedMidi.bpm, 120);
assert.equal(importedMidi.events.length, 2);
assert.equal(importedMidi.patterns.A[0].pad, 0);
assert.equal(importedMidi.patterns.A[0].velocity, 117);
assert.equal(importedMidi.patterns.A[0].duration, 0.5);
assert.equal(importedMidi.patterns.B[0].note, 48);
assert.equal(importedMidi.events[0].duration, 0.5);

const adaptedNotes = exerciseTargetsToNotes([{ id: 'jeu', beat: 2, pad: 3 }], 'C');
assert.equal(adaptedNotes[0].group, 'C');
assert.equal(adaptedNotes[0].velocity, 100);
assert.equal(adaptedNotes[0].duration, 0.25);
assert.deepEqual(notesToExerciseTargets(adaptedNotes), [{ id: 'jeu', beat: 2, pad: 3, note: undefined }]);
assert.equal(normalizeSequencerNote({ id: 'fort', group: 'D', beat: 0, pad: 0, velocity: 999, duration: 0 }).velocity, 127);
assert.equal(normalizeSequencerNote({ id: 'court', group: 'D', beat: 0, pad: 0, duration: 0 }).duration, 1 / 96);

const memoryStorage = {
  value: '',
  getItem() { return this.value || null; },
  setItem(_key, value) { this.value = value; },
};
const storedStudio = storeStudioProject(memoryStorage, [], project);
assert.equal(loadStudioLibrary(memoryStorage).length, 1);
const restoredStudio = studioStateFromDocument(storedStudio.library[0].document);
assert.equal(restoredStudio.title, 'TEST');
assert.equal(restoredStudio.bpm, 120);
assert.equal(restoredStudio.patterns.A[0].velocity, 117);
assert.equal(restoredStudio.patterns.A[0].duration, 0.5);
assert.equal(restoredStudio.patterns.B[0].note, 48);
assert.equal(restoredStudio.padModes['B:10'], 'KEYS');
const renamedLibrary = renameStudioProject(memoryStorage, storedStudio.library, storedStudio.id, 'TEST RENOMMÉ');
assert.equal(renamedLibrary[0].document.metadata.title, 'TEST RENOMMÉ');
const duplicatedStudio = duplicateStudioProject(memoryStorage, renamedLibrary, storedStudio.id, 'TEST COPIE');
assert.equal(duplicatedStudio.library.length, 2);
assert.equal(duplicatedStudio.library.find((item) => item.id === duplicatedStudio.id).document.metadata.title, 'TEST COPIE');
const deletedLibrary = deleteStudioProject(memoryStorage, duplicatedStudio.library, duplicatedStudio.id);
assert.equal(deletedLibrary.length, 1);
assert.equal(loadStudioLibrary(memoryStorage)[0].document.metadata.title, 'TEST RENOMMÉ');

assert.equal(readEp133ProjectDocument(JSON.stringify(project)).schema, 'ep.project.v1');
assert.throws(() => readEp133ProjectDocument('{"schema":"inconnu"}'), /ep\.project\.v1/);

const tarMember = (name, payload) => {
  const header = new Uint8Array(512);
  header.set(strToU8(name), 0);
  header.set(strToU8('0000644\0'), 100);
  header.set(strToU8(payload.length.toString(8)), 124);
  header[124 + payload.length.toString(8).length] = 0;
  header.fill(32, 148, 156);
  header[156] = 48;
  const checksum = header.reduce((sum, byte) => sum + byte, 0).toString(8);
  header.set(strToU8(checksum), 148);
  header[148 + checksum.length] = 0;
  const padded = new Uint8Array(Math.ceil(payload.length / 512) * 512);
  padded.set(payload);
  return [header, padded];
};
const padRecord = new Uint8Array(26);
padRecord[1] = 0x44;
padRecord[2] = 0x01;
padRecord[3] = 2;
new DataView(padRecord.buffer).setUint32(8, 46875, true);
new DataView(padRecord.buffer).setFloat32(12, 120, true);
padRecord.set([100, 0, 0, 5, 255, 0, 1, 2, 60, 255], 16);
const patternRecord = new Uint8Array([0, 2, 2, 9, 24, 0, 48, 60, 110, 18, 0, 6, 48, 0, 1, 3, 0, 0xff, 0x7f, 0]);
const scenesRecord = new Uint8Array(712);
scenesRecord.set([0, 0, 0, 0, 0, 4, 4]);
for (let index = 0; index < 99; index += 1) scenesRecord.set([0, 0, 0, 0, 4, 4], 7 + index * 6);
scenesRecord.set([1, 1, 1, 1, 4, 4], 7);
const sceneTrailer = 7 + 99 * 6;
scenesRecord[sceneTrailer + 3] = 1;
scenesRecord[sceneTrailer + 11] = 1;
scenesRecord[sceneTrailer + 12] = 1;
const settingsRecord = new Uint8Array(224);
new DataView(settingsRecord.buffer).setFloat32(4, 123.5, true);
const tarParts = [
  ...tarMember('pads/a/p01', padRecord),
  ...tarMember('patterns/a01', patternRecord),
  ...tarMember('scenes', scenesRecord),
  ...tarMember('settings', settingsRecord),
  new Uint8Array(1024),
];
const tarLength = tarParts.reduce((sum, part) => sum + part.length, 0);
const projectTar = new Uint8Array(tarLength);
let tarOffset = 0;
tarParts.forEach((part) => { projectTar.set(part, tarOffset); tarOffset += part.length; });
const decodedTar = decodeEp133ProjectTar(projectTar);
assert.equal(decodedTar.pads[0].slot, 324);
assert.equal(decodedTar.pads[0].playMode, 2);
assert.equal(decodedTar.patterns[0].notes[0].pad, 7);
assert.equal(decodedTar.patterns[0].notes[0].velocity, 110);
assert.equal(decodedTar.patterns[0].automation[0].value, 32767);
assert.deepEqual(decodedTar.scenes[0].groupPatterns, [1, 1, 1, 1]);
assert.deepEqual(decodedTar.song, [1]);
assert.equal(decodedTar.bpm, 123.5);
assert.equal(decodedTar.warnings.length, 0);

const archive = zipSync({
  '/meta.json': strToU8(JSON.stringify({ product: 'ep133', device_version: '2.5.0' })),
  '/projects/P01.tar': projectTar,
  '/sounds/001 TEST.wav': new Uint8Array([1, 2, 3]),
});
const archiveSummary = inspectEp133Archive(archive, 'test.ppak');
assert.equal(archiveSummary.kind, 'ppak');
assert.equal(archiveSummary.projects[0], 'projects/P01.tar');
assert.equal(archiveSummary.sounds.length, 1);
assert.equal(archiveSummary.meta?.product, 'ep133');
assert.equal(archiveSummary.decodedProjects[0].patterns[0].notes.length, 1);

console.log('MIDI, ep.project.v1 et décodage lecture seule .pak/.ppak/TAR : OK');
