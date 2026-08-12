import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createEp133ProjectDocument, createMidiFile } from '../src/core/project/exporters.ts';
import { decodeEp133ProjectTar, inspectEp133Archive, readEp133ProjectDocument, readMidiFile } from '../src/core/project/importers.ts';
import { exerciseTargetsToNotes, normalizeSequencerNote, notesToExerciseTargets } from '../src/core/project/model.ts';
import { deleteStudioProject, duplicateStudioProject, loadStudioLibrary, renameStudioProject, storeStudioProject, studioStateFromDocument } from '../src/core/project/studioLibrary.ts';
import { createDeviceClone, describeCloneDelta, DEVICE_CLONE_KEY, loadDeviceClone, loadDeviceProfile, saveDeviceProfile } from '../src/core/project/deviceProfile.ts';
import { findMissingDependencies } from '../src/core/project/device.ts';
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

// Banque multi-pattern/groupe avec trou volontaire (pas de B01), miroir de ep133-project-1.json.
const patternBank = {
  A: { 1: patterns.A, 2: [{ id: 'kick2', group: 'A', beat: 4, pad: 0, velocity: 90, duration: 0.5 }] },
  B: { 2: patterns.B },
  C: {},
  D: {},
};
const scenes = [
  { scene: 1, groupPatterns: { A: 1, B: null, C: null, D: null }, timeSignature: [4, 4] },
  { scene: 2, groupPatterns: { A: 2, B: 2, C: null, D: null }, timeSignature: [4, 4] },
];
const song = [1, 2];
const currentScene = 2;

const project = createEp133ProjectDocument({
  title: 'TEST', bpm: 120, patternBank, scenes, song, currentScene,
  pads: [{ group: 'B', pad: 11, slot: 444, playMode: 0, rootNote: 26 }],
  padModes: { 'A:0': 'ONE', 'B:10': 'KEYS' },
  patternLengths: { 'A:1': 4, 'A:2': 2, 'B:2': 3 },
});
assert.equal(project.schema, 'ep.project.v1');
assert.equal(project.patterns.length, 3, 'A01, A02, B02 — pas de B01');
assert.ok(!project.patterns.some((pattern) => pattern.id === 'B01'), 'le trou B01 doit être préservé, jamais comblé');
const a01 = project.patterns.find((pattern) => pattern.id === 'A01');
const a02 = project.patterns.find((pattern) => pattern.id === 'A02');
const b02 = project.patterns.find((pattern) => pattern.id === 'B02');
assert.equal(a01.events[0].velocity, 117);
assert.equal(a01.events[0].duration, 48);
assert.equal(a01.events[0].note, undefined, 'une frappe ONE simple (sans hauteur) ne doit jamais recevoir de note par défaut (bug trouvé le 12 août : note ?? 60 corrompait tout pad-trigger en note fixe après Sauvegarder→Ouvrir)');
assert.equal(a02.events[0].velocity, 90);
assert.equal(b02.events[0].note, 48);
assert.equal(a01.bars, 4, 'LN.4 doit rester distinct de la dernière note du pattern');
assert.equal(b02.bars, 3, 'la longueur native est propre à chaque groupe/pattern');
assert.equal(project.settings.bpm, 120);
assert.equal(project.pads[0].playMode, 1);
assert.equal(project.scenes.length, 2);
assert.deepEqual(project.scenes[0].groupPatterns, [1, 0, 0, 0], 'scène 1 : B/C/D MUTE (0)');
assert.deepEqual(project.scenes[1].groupPatterns, [2, 2, 0, 0]);
assert.deepEqual(project.song, [1, 2]);
assert.equal(project.currentScene, 2);

const withMutedScene = createEp133ProjectDocument({
  title: 'TEST', bpm: 120, patternBank,
  scenes: [...scenes, { scene: 3, groupPatterns: { A: null, B: null, C: null, D: null }, timeSignature: [4, 4] }],
  song, currentScene, pads: [], padModes: {},
});
assert.equal(withMutedScene.scenes.length, 2, 'une scène entièrement MUTE ne doit jamais être exportée, comme sur la machine réelle');

const roundTripped = studioStateFromDocument(project);
assert.deepEqual(Object.keys(roundTripped.patternBank.A).map(Number).sort((x, y) => x - y), [1, 2]);
assert.deepEqual(Object.keys(roundTripped.patternBank.B).map(Number).sort((x, y) => x - y), [2]);
assert.equal(roundTripped.patternBank.A[1][0].velocity, 117);
assert.equal(roundTripped.patternBank.A[2][0].velocity, 90);
assert.equal(roundTripped.patternBank.B[2][0].note, 48);
assert.equal(roundTripped.patternBank.A[1][0].note, undefined, 'round-trip complet : un pad-trigger reste un pad-trigger après Sauvegarder→Ouvrir, jamais une note fixe 60');
assert.equal(roundTripped.patternLengths['A:1'], 4);
assert.equal(roundTripped.patternLengths['B:2'], 3);
assert.equal(roundTripped.scenes.length, 2);
assert.deepEqual(roundTripped.scenes[0].groupPatterns, { A: 1, B: null, C: null, D: null });
assert.deepEqual(roundTripped.scenes[1].groupPatterns, { A: 2, B: 2, C: null, D: null });
assert.deepEqual(roundTripped.song, [1, 2]);
assert.equal(roundTripped.currentScene, 2);

const oldShapeDocument = {
  schema: 'ep.project.v1', product: 'ep133',
  metadata: { title: 'ANCIEN' }, settings: { bpm: 100 }, pads: [],
  patterns: [
    { id: 'A01', bars: 1, events: [{ tick: 0, pad: 1, note: 60, velocity: 100, duration: 48 }] },
    { id: 'B01', bars: 1, events: [] },
    { id: 'C01', bars: 1, events: [] },
    { id: 'D01', bars: 1, events: [] },
  ],
  scenes: [{ groupPatterns: [1, 1, 1, 1], timeSignature: [4, 4] }],
  song: [1],
};
const oldShapeState = studioStateFromDocument(oldShapeDocument);
assert.equal(oldShapeState.scenes[0].scene, 1, 'scène sans champ `scene` explicite retombe sur index+1');
assert.equal(oldShapeState.patterns.A[0].pad, 0);
assert.equal(oldShapeState.currentScene, null, '`currentScene` absent doit rester null, pas 0 ni NaN');

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

const memoryStorage = (() => {
  const store = new Map();
  return { getItem: (key) => store.has(key) ? store.get(key) : null, setItem: (key, value) => store.set(key, value) };
})();
const savedProfile = saveDeviceProfile(memoryStorage, { name: 'STUDIO NOIR', capacityMb: 64, sampleFolderName: 'EP133 Samples', localSampleCount: 12 });
assert.equal(savedProfile.name, 'STUDIO NOIR');
assert.equal(loadDeviceProfile(memoryStorage).capacityMb, 64);
const cloneManifest = createDeviceClone(memoryStorage, savedProfile, 527, 56210000, 1);
assert.equal(cloneManifest.history.length, 1);
assert.equal(cloneManifest.history[0].label, 'INSTANTANÉ INITIAL');
assert.equal(cloneManifest.audioStatus, 'local-bridge-required');
// Time Machine (plan P2 item 5) : chaque appel doit AJOUTER un point à la chronologie,
// pas l'écraser — c'était exactement le bug corrigé le 12 août.
const secondClone = createDeviceClone(memoryStorage, savedProfile, 540, 58000000, 2, 'clone');
assert.equal(secondClone.history.length, 2, 'le deuxième instantané doit s’ajouter à la chronologie, pas l’écraser');
assert.equal(secondClone.history[0].label, 'INSTANTANÉ INITIAL', 'le premier point ne doit pas être perdu');
assert.equal(secondClone.history[1].label, 'CLONE · +13 sons · +1.79 Mo · projet 1 → 2', 'comparaison exacte au point précédent');
assert.equal(loadDeviceClone(memoryStorage).history.length, 2, 'relecture depuis le stockage, pas seulement la valeur de retour');
const thirdClone = createDeviceClone(memoryStorage, savedProfile, 540, 58000000, 2, 'scan');
assert.equal(thirdClone.history.length, 3);
assert.equal(thirdClone.history[2].label, 'SCAN · Aucun changement détecté', 'mêmes valeurs que le point précédent -> aucun changement signalé, pas un delta à zéro affiché bêtement');

// Migration : un manifeste laissé par le code D'AVANT ce correctif (12 août) n'a que
// { createdAt, label } par entrée d'historique, sans soundCount/usedBytes — le premier
// nouveau point après mise à jour ne doit jamais afficher "NaN son" ou "NaN Mo".
assert.equal(describeCloneDelta({ createdAt: '2026-08-01T00:00:00.000Z', label: 'INSTANTANÉ INITIAL' }, { soundCount: 527, usedBytes: 56210000, scannedProject: 1 }), 'projet — → 1');
const legacyStorage = (() => {
  const store = new Map();
  store.set(DEVICE_CLONE_KEY, JSON.stringify({
    createdAt: '2026-08-01T00:00:00.000Z',
    profile: savedProfile,
    soundCount: 500, usedBytes: 50000000, scannedProject: 1, audioStatus: 'local-bridge-required',
    history: [{ createdAt: '2026-08-01T00:00:00.000Z', label: 'INSTANTANÉ INITIAL' }],
  }));
  return { getItem: (key) => store.has(key) ? store.get(key) : null, setItem: (key, value) => store.set(key, value) };
})();
const migratedClone = createDeviceClone(legacyStorage, savedProfile, 527, 56210000, 1, 'scan');
assert.equal(migratedClone.history.length, 2, 'le point historique existant doit être conservé, pas remplacé');
assert.ok(!migratedClone.history[1].label.includes('NaN'), `pas de "NaN" dans l’étiquette migrée : ${migratedClone.history[1].label}`);

const storedStudio = storeStudioProject(memoryStorage, [], project);
assert.equal(loadStudioLibrary(memoryStorage).length, 1);
const restoredStudio = studioStateFromDocument(storedStudio.library[0].document);
assert.equal(restoredStudio.title, 'TEST');
assert.equal(restoredStudio.bpm, 120);
assert.equal(restoredStudio.patternBank.A[1][0].velocity, 117);
assert.equal(restoredStudio.patternBank.A[1][0].duration, 0.5);
assert.equal(restoredStudio.patternBank.A[1][0].note, undefined, 'round-trip via localStorage (le vrai chemin Sauvegarder → bibliothèque → Ouvrir) : toujours pas de note inventée');
assert.equal(restoredStudio.patternBank.B[2][0].note, 48);
assert.equal(restoredStudio.padModes['B:10'], 'KEYS');
assert.deepEqual(restoredStudio.pads, [{ group: 'B', pad: 11, slot: 444 }], 'affectations son -> pad conservées pour la détection de dépendances, un round-trip localStorage complet, pas juste le document en mémoire');

// Détection des dépendances manquantes (plan P1, REGISTRE_IDEES.md Q-13).
assert.deepEqual(findMissingDependencies(restoredStudio.pads, null), [], 'aucune machine scannée -> jamais de faux avertissement');
const soundIndexWithSlot = { readOnly: true, scannedAt: '', soundCount: 1, usedBytes: 0, sounds: [{ slot: 444, bytes: 0, flags: 0, fileName: 'x' }] };
assert.deepEqual(findMissingDependencies(restoredStudio.pads, soundIndexWithSlot), [], 'le slot 444 existe dans la banque scannée -> pas de dépendance manquante');
const soundIndexWithoutSlot = { readOnly: true, scannedAt: '', soundCount: 0, usedBytes: 0, sounds: [] };
const missing = findMissingDependencies(restoredStudio.pads, soundIndexWithoutSlot);
assert.equal(missing.length, 1);
assert.deepEqual(missing[0], { group: 'B', pad: 11, slot: 444 });
assert.deepEqual(findMissingDependencies([{ group: 'A', pad: 1, slot: 0 }], soundIndexWithoutSlot), [], 'slot 0 (aucun son affecté) ne doit jamais être signalé comme manquant');
const renamedLibrary = renameStudioProject(memoryStorage, storedStudio.library, storedStudio.id, 'TEST RENOMMÉ');
assert.equal(renamedLibrary[0].document.metadata.title, 'TEST RENOMMÉ');
const duplicatedStudio = duplicateStudioProject(memoryStorage, renamedLibrary, storedStudio.id, 'TEST COPIE');
assert.equal(duplicatedStudio.library.length, 2);
assert.equal(duplicatedStudio.library.find((item) => item.id === duplicatedStudio.id).document.metadata.title, 'TEST COPIE');
const deletedLibrary = deleteStudioProject(memoryStorage, duplicatedStudio.library, duplicatedStudio.id);
assert.equal(deletedLibrary.length, 1);
assert.equal(loadStudioLibrary(memoryStorage)[0].document.metadata.title, 'TEST RENOMMÉ');

const machineProject = JSON.parse(fs.readFileSync('public/ep133-project-1.json', 'utf8'));
const loadedMachineProject = studioStateFromDocument(machineProject);
assert.equal(loadedMachineProject.bpm, 120);
const sortedKeys = (bank, group) => Object.keys(bank[group]).map(Number).sort((x, y) => x - y);
assert.deepEqual(sortedKeys(loadedMachineProject.patternBank, 'A'), [1, 2, 3]);
assert.deepEqual(sortedKeys(loadedMachineProject.patternBank, 'B'), [2, 3], 'pas de B01 dans le scan réel — le trou doit être préservé');
assert.deepEqual(sortedKeys(loadedMachineProject.patternBank, 'C'), [1, 2, 3]);
assert.deepEqual(sortedKeys(loadedMachineProject.patternBank, 'D'), [1, 2, 3]);
assert.equal(loadedMachineProject.scenes.length, 3);
assert.deepEqual(loadedMachineProject.song, [1]);
assert.equal(loadedMachineProject.currentScene, 3, 'currentScene (3) diffère de song[0] (1) dans ce scan réel');
// Vue de confort : toujours la première Song Position (scène 1), jamais currentScene.
assert.equal(loadedMachineProject.patterns.A.length, 25, 'L.01/S.01 doit charger A01');
assert.equal(loadedMachineProject.patterns.B.length, 0, 'un pattern B01 absent doit rester vide');
assert.equal(loadedMachineProject.patterns.C.length, 0, 'L.01/S.01 doit charger C01 et non C03');
assert.equal(loadedMachineProject.patterns.D.length, 6, 'L.01/S.01 doit charger D01');

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
scenesRecord.set([1, 0, 1, 1, 4, 4], 13); // scène 2 : groupe B à 0 (MUTE), doit quand même compter comme utilisée
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
const mutedGroupScene = decodedTar.scenes.find((scene) => scene.scene === 2);
assert.ok(mutedGroupScene, 'une scène avec un groupe à 0 doit rester considérée comme utilisée dès qu\'un autre groupe est actif');
assert.deepEqual(mutedGroupScene.groupPatterns, [1, 0, 1, 1]);
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
