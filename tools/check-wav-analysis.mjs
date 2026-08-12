import assert from 'node:assert/strict';
import { analyzeWavBuffer } from '../src/core/audio/wavAnalysis.ts';

/** Construit un WAV PCM/float minimal valide à partir de trames déjà encodées en octets (LE), pour tester `analyzeWavBuffer` sans dépendre d'un vrai fichier. */
function buildWav({ sampleRate, channels, bitDepth, audioFormat = 1, frames }) {
  const bytesPerSample = bitDepth / 8;
  const dataLength = frames.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  const writeString = (offset, text) => { for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i)); };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, audioFormat, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);
  frames.forEach((value, index) => {
    const offset = 44 + index * bytesPerSample;
    if (audioFormat === 3) view.setFloat32(offset, value, true);
    else if (bitDepth === 8) view.setUint8(offset, value + 128);
    else if (bitDepth === 16) view.setInt16(offset, value, true);
    else if (bitDepth === 24) { view.setUint8(offset, value & 0xff); view.setUint8(offset + 1, (value >> 8) & 0xff); view.setUint8(offset + 2, (value >> 16) & 0xff); }
    else view.setInt32(offset, value, true);
  });
  return buffer;
}

// 16 bits, aucun écrêtage.
const cleanWav = buildWav({ sampleRate: 46875, channels: 1, bitDepth: 16, frames: [0, 1000, -1000, 500] });
const clean = analyzeWavBuffer(cleanWav);
assert.ok(clean);
assert.equal(clean.sampleRate, 46875, 'la fréquence source doit venir de l’en-tête, pas d’un rééchantillonnage');
assert.equal(clean.channels, 1);
assert.equal(clean.bitDepth, 16);
assert.equal(Math.round(clean.durationSeconds * 46875), 4, '4 trames à 46 875 Hz');
assert.equal(clean.clipped, false);
assert.equal(clean.clippedSampleCount, 0);
assert.ok(Math.abs(clean.peakLevel - 1000 / 32768) < 1e-6);
assert.equal(clean.weightBytes, cleanWav.byteLength);

// 16 bits, écrêtage aux deux extrêmes (32767 et -32768).
const clippedWav = buildWav({ sampleRate: 46875, channels: 1, bitDepth: 16, frames: [0, 32767, -32768, 100] });
const clipped = analyzeWavBuffer(clippedWav);
assert.ok(clipped);
assert.equal(clipped.clipped, true);
assert.equal(clipped.clippedSampleCount, 2, 'exactement les deux échantillons au code numérique extrême, pas un niveau simplement élevé');
assert.equal(clipped.peakLevel, 1, '-32768 normalisé donne exactement 1.0');

// 8 bits (non signé dans le fichier, recentré ici) : même logique d’écrêtage.
const wav8 = buildWav({ sampleRate: 22050, channels: 1, bitDepth: 8, frames: [0, 127, -128, 60] });
const report8 = analyzeWavBuffer(wav8);
assert.ok(report8);
assert.equal(report8.bitDepth, 8);
assert.equal(report8.clippedSampleCount, 2);
assert.equal(report8.peakLevel, 1);

// 24 bits : reconstruction correcte du complément à deux sur 3 octets.
const wav24 = buildWav({ sampleRate: 46875, channels: 1, bitDepth: 24, frames: [0, 8388607, -8388608, 1000] });
const report24 = analyzeWavBuffer(wav24);
assert.ok(report24);
assert.equal(report24.bitDepth, 24);
assert.equal(report24.clippedSampleCount, 2, 'les deux extrêmes 24 bits (8388607 et -8388608) doivent être détectés');
assert.equal(report24.peakLevel, 1);

// IEEE float 32 bits : un échantillon hors [-1, 1] doit aussi compter comme écrêté.
const wavFloat = buildWav({ sampleRate: 48000, channels: 1, bitDepth: 32, audioFormat: 3, frames: [0, 0.5, -1, 1.2] });
const reportFloat = analyzeWavBuffer(wavFloat);
assert.ok(reportFloat);
assert.equal(reportFloat.clippedSampleCount, 2, '-1.0 exact et 1.2 hors plage comptent tous deux comme écrêtés');
assert.equal(reportFloat.peakLevel, 1, 'le niveau crête reste borné à 1.0 même si la valeur brute dépasse (1.2)');

// Stéréo : la durée doit diviser par le nombre de canaux, pas par le nombre brut d’échantillons.
const stereoWav = buildWav({ sampleRate: 44100, channels: 2, bitDepth: 16, frames: [0, 0, 1000, -1000, 500, 500, 0, 0] });
const stereo = analyzeWavBuffer(stereoWav);
assert.ok(stereo);
assert.equal(stereo.channels, 2);
assert.equal(Math.round(stereo.durationSeconds * 44100), 4, '8 échantillons entrelacés / 2 canaux = 4 trames');

// Poids surchargé explicitement (taille réelle du fichier source, pas celle du tampon lu).
const withExplicitWeight = analyzeWavBuffer(cleanWav, 123456);
assert.equal(withExplicitWeight.weightBytes, 123456);

// Entrées invalides : jamais d’exception, toujours `null`.
assert.equal(analyzeWavBuffer(new ArrayBuffer(10)), null, 'tampon trop court');
const notWav = new ArrayBuffer(48);
new DataView(notWav).setUint32(0, 0, true); // pas "RIFF"
assert.equal(analyzeWavBuffer(notWav), null, 'en-tête RIFF absent');
const badDepthWav = buildWav({ sampleRate: 44100, channels: 1, bitDepth: 16, frames: [0] });
new DataView(badDepthWav).setUint16(34, 12, true); // profondeur non supportée (12 bits)
assert.equal(analyzeWavBuffer(badDepthWav), null, 'profondeur de bits non supportée');

console.log('Analyse WAV déterministe (poids, durée, fréquence, écrêtage) : OK');
