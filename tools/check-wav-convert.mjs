import assert from 'node:assert/strict';
import { convertWavForEp133, EP133_TARGET_SAMPLE_RATES, estimateEp133ConversionBytes } from '../src/core/audio/wavConvert.ts';
import { analyzeWavBuffer } from '../src/core/audio/wavAnalysis.ts';

/** WAV PCM 16 bits minimal, même forme que le générateur de tools/check-wav-analysis.mjs. */
function buildWav({ sampleRate, channels, frames }) {
  const bytesPerSample = 2;
  const dataLength = frames.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  const writeString = (offset, text) => { for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i)); };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);
  frames.forEach((value, index) => view.setInt16(44 + index * bytesPerSample, value, true));
  return buffer;
}

const sineFrames = (sampleRate, seconds, freq, amplitude = 20000) => {
  const count = Math.round(sampleRate * seconds);
  return Array.from({ length: count }, (_, i) => Math.round(Math.sin((2 * Math.PI * freq * i) / sampleRate) * amplitude));
};

// 1) Resampling réel : 44 100 Hz -> HI (46 875 Hz, cible firmware 2.5).
const source44k = buildWav({ sampleRate: 44100, channels: 1, frames: sineFrames(44100, 0.05, 440) });
const converted = await convertWavForEp133(source44k, EP133_TARGET_SAMPLE_RATES.HI);
assert.ok(converted);
assert.equal(converted.sampleRate, 46875);
assert.equal(converted.channels, 1);
assert.equal(converted.bitDepth, 16);
assert.ok(Math.abs(converted.durationSeconds - 0.05) < 0.01, 'durée globalement préservée après resampling');
const report = analyzeWavBuffer(converted.bytes);
assert.ok(report);
assert.equal(report.sampleRate, 46875, 'le WAV produit déclare la nouvelle fréquence dans son propre en-tête');
assert.ok(report.peakLevel > 0.3 && report.peakLevel <= 1, 'signal toujours présent après resampling, pas écrasé');

// 2) Même fréquence source et cible : pas de resampling, juste ré-encodage 16 bits ditheré.
const source26k = buildWav({ sampleRate: 26250, channels: 1, frames: sineFrames(26250, 0.02, 300, 10000) });
const identity = await convertWavForEp133(source26k, EP133_TARGET_SAMPLE_RATES.LO);
assert.ok(identity);
assert.equal(identity.sampleRate, 26250);
const identityReport = analyzeWavBuffer(identity.bytes);
assert.ok(identityReport);
assert.ok(Math.abs(identityReport.peakLevel - 10000 / 32768) < 0.01, 'crête quasi identique sans resampling (écart borné au dither ~1 LSB)');

// 3) Downmix stéréo -> mono : un canal plein, un canal silencieux -> exactement la moitié.
const leftLoud = sineFrames(22050, 0.02, 220, 30000);
const stereoFrames = leftLoud.flatMap((value) => [value, 0]);
const stereoSource = buildWav({ sampleRate: 22050, channels: 2, frames: stereoFrames });
const mono = await convertWavForEp133(stereoSource, 22050, 1);
assert.ok(mono);
assert.equal(mono.channels, 1);
const monoReport = analyzeWavBuffer(mono.bytes);
assert.ok(monoReport);
assert.ok(Math.abs(monoReport.peakLevel - 30000 / 32768 / 2) < 0.02, 'downmix = moyenne des deux canaux (un plein, un silencieux -> moitié)');

// 4) Entrée invalide : jamais d'exception, toujours null — et sans même tenter de charger le WASM.
assert.equal(await convertWavForEp133(new ArrayBuffer(10), 46875), null, 'tampon trop court');

// 5) Trim appliqué avant conversion : seule la portion sélectionnée (WaveformTrim) est convertie.
// Silence, puis 100 trames fortes entre 0,02 s et 0,06 s, puis silence à nouveau, à 5000 Hz pour un calcul de trame simple.
const trimSource = buildWav({
  sampleRate: 5000,
  channels: 1,
  frames: [...Array(100).fill(0), ...sineFrames(5000, 0.02, 500, 25000), ...Array(100).fill(0)],
});
const trimmed = await convertWavForEp133(trimSource, 5000, 1, { startSeconds: 0.02, endSeconds: 0.04 });
assert.ok(trimmed);
assert.ok(Math.abs(trimmed.durationSeconds - 0.02) < 1e-6, 'durée = exactement la fenêtre de trim, pas le fichier entier');
const trimmedReport = analyzeWavBuffer(trimmed.bytes);
assert.ok(trimmedReport);
assert.ok(trimmedReport.peakLevel > 0.5, 'la portion convertie contient bien le signal fort, pas le silence autour');

const emptyTrim = await convertWavForEp133(trimSource, 5000, 1, { startSeconds: 0.05, endSeconds: 0.05 });
assert.equal(emptyTrim, null, 'sélection vide (start === end) -> rien à convertir, jamais un WAV de longueur 0');

// 6) estimateEp133ConversionBytes : doit prédire EXACTEMENT le poids que produit une vraie
// conversion, pas une approximation — sinon l'affichage "avant transfert" mentirait.
const estimateSource = buildWav({ sampleRate: 48000, channels: 2, frames: sineFrames(48000, 0.1, 300, 15000).flatMap((v) => [v, v]) });
for (const [label, targetRate] of Object.entries(EP133_TARGET_SAMPLE_RATES)) {
  const estimated = estimateEp133ConversionBytes(0.1, 2, targetRate);
  const real = await convertWavForEp133(estimateSource, targetRate, 2);
  assert.ok(real, `conversion réelle attendue pour ${label}`);
  assert.equal(estimated, real.bytes.byteLength, `estimation ${label} (${estimated} o) doit égaler le poids réel (${real.bytes.byteLength} o)`);
}

console.log('Conversion EP-133 (resampling libsamplerate-js, dither TPDF, downmix) : OK');
