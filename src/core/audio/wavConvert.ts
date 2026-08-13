/**
 * Conversion contrôlée vers le format accepté par l'EP-133 (Roadmap Phase 4,
 * REGISTRE_IDEES.md A-03/A-04/A-05, R-07). Le firmware 2.5 propose trois
 * taux — LO 26 250 Hz, MID 32 000 Hz, HI 46 875 Hz — voir
 * `etude/05_FIRMWARE_2.5_IMPACT.md` ; ce module ne suppose donc jamais une
 * cible fixe, elle est toujours un paramètre explicite.
 *
 * Extrait les échantillons réels avec `parseWavFormat`/`readSignedSample`
 * (`wavAnalysis.ts`) — jamais `AudioContext.decodeAudioData()`, même
 * précaution que le reste du module WAV. Le resampling lui-même délègue à
 * `@alexanderolsen/libsamplerate-js` (port WebAssembly de la référence
 * `libsamplerate`) plutôt qu'un ré-échantillonnage linéaire maison : voir
 * `etude/02_BIBLIOTHEQUES_TECHNIQUES.md` pour le choix.
 */

// Import par défaut + déstructuration plutôt que des exports nommés : le
// paquet est un module CommonJS dont Node (contrairement à Vite/esbuild) ne
// détecte pas fiablement les exports nommés à l'exécution directe (utilisé
// par tools/check-wav-convert.mjs, en dehors du bundler applicatif).
import libsamplerate from '@alexanderolsen/libsamplerate-js';
import { parseWavFormat, readSignedSample, type ParsedWavFormat } from './wavAnalysis.ts';

const { create, ConverterType } = libsamplerate;

// Réexportées pour compatibilité (tools/check-wav-convert.mjs) — la
// définition vit dans ep133Targets.ts, un module sans dépendance WASM, pour
// que WaveformTrim.tsx puisse les importer statiquement sans tirer les
// ~2 Mo de libsamplerate dans le bundle principal.
export { EP133_TARGET_SAMPLE_RATES, estimateEp133ConversionBytes, type Ep133TargetRate } from './ep133Targets.ts';

export interface WavConversionResult {
  bytes: ArrayBuffer;
  sampleRate: number;
  channels: number;
  bitDepth: 16;
  durationSeconds: number;
}

/** Trames interleaved en Float32 [-1, 1], valeurs réelles (pas seulement leur
 * magnitude) — c'est ce que `libsamplerate-js` attend en entrée. */
function extractInterleavedFloat32(format: ParsedWavFormat): Float32Array {
  const out = new Float32Array(format.frameCount * format.channels);
  let index = 0;
  for (let frame = 0; frame < format.frameCount; frame += 1) {
    const frameStart = format.dataStart + frame * format.bytesPerFrame;
    for (let channel = 0; channel < format.channels; channel += 1) {
      out[index] = Math.max(-1, Math.min(1, readSignedSample(format, frameStart + channel * format.bytesPerSample)));
      index += 1;
    }
  }
  return out;
}

/** Découpe des trames interleaved à un intervalle de trames [start, end) —
 * utilisé pour appliquer une sélection de trim (`WaveformTrim`) avant
 * resampling plutôt que de convertir tout le fichier source. */
function cropInterleaved(interleaved: Float32Array, channels: number, startFrame: number, endFrame: number): Float32Array {
  const safeStart = Math.max(0, Math.min(startFrame, endFrame));
  const safeEnd = Math.max(safeStart, endFrame);
  return interleaved.slice(safeStart * channels, safeEnd * channels);
}

/**
 * Repli mono/stéréo (REGISTRE_IDEES.md A-05, partiel — pas encore de choix
 * gauche/droite explicite, seulement moyenne pour le downmix). `fromChannels`
 * === `toChannels` renvoie l'entrée telle quelle, sans copie.
 */
function remixChannels(interleaved: Float32Array, fromChannels: number, toChannels: number): Float32Array {
  if (fromChannels === toChannels) return interleaved;
  const frameCount = interleaved.length / fromChannels;
  const out = new Float32Array(frameCount * toChannels);
  for (let frame = 0; frame < frameCount; frame += 1) {
    if (toChannels === 1) {
      let sum = 0;
      for (let channel = 0; channel < fromChannels; channel += 1) sum += interleaved[frame * fromChannels + channel];
      out[frame] = sum / fromChannels;
    } else {
      const value = interleaved[frame * fromChannels];
      for (let channel = 0; channel < toChannels; channel += 1) out[frame * toChannels + channel] = value;
    }
  }
  return out;
}

/**
 * Fondu linéaire en entrée/sortie, en place sur des trames interleaved déjà à
 * la fréquence de sortie finale — appliqué après resampling, pas avant, pour
 * que les durées en secondes restent exactes quelle que soit la cible
 * (LO/MID/HI). Fondu linéaire (pas à énergie constante) : simple, suffisant
 * pour un premier jet — voir Roadmap Phase 4. `fadeInSeconds`/
 * `fadeOutSeconds` à 0 ou négatif ne change rien. Chaque fondu est plafonné à
 * la moitié des trames disponibles, pour ne jamais réduire tout le signal au
 * silence sur un fichier très court si les deux durées demandées sont trop
 * grandes ou se chevauchent.
 */
function applyFade(interleaved: Float32Array, channels: number, sampleRate: number, fadeInSeconds: number, fadeOutSeconds: number): Float32Array {
  const frameCount = channels > 0 ? interleaved.length / channels : 0;
  if (!frameCount || (fadeInSeconds <= 0 && fadeOutSeconds <= 0)) return interleaved;

  const maxFadeFrames = Math.floor(frameCount / 2);
  const fadeInFrames = Math.max(0, Math.min(maxFadeFrames, Math.round(fadeInSeconds * sampleRate)));
  const fadeOutFrames = Math.max(0, Math.min(maxFadeFrames, Math.round(fadeOutSeconds * sampleRate)));
  if (!fadeInFrames && !fadeOutFrames) return interleaved;

  const out = interleaved.slice();
  for (let frame = 0; frame < fadeInFrames; frame += 1) {
    const gain = frame / fadeInFrames;
    for (let channel = 0; channel < channels; channel += 1) out[frame * channels + channel] *= gain;
  }
  for (let frame = 0; frame < fadeOutFrames; frame += 1) {
    const gain = frame / fadeOutFrames;
    const targetFrame = frameCount - 1 - frame;
    for (let channel = 0; channel < channels; channel += 1) out[targetFrame * channels + channel] *= gain;
  }
  return out;
}

/**
 * Encode des trames Float32 interleaved en WAV PCM 16 bits, avec dither TPDF
 * (REGISTRE_IDEES.md A-04) — bruit triangulaire d'environ 1 LSB avant
 * l'arrondi, pour ne jamais tronquer sèchement vers l'entier le plus proche.
 */
function encodeWavPcm16(samples: Float32Array, channels: number, sampleRate: number): ArrayBuffer {
  const dataLength = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  const writeString = (offset: number, text: string) => { for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index)); };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM entier
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);
  for (let index = 0; index < samples.length; index += 1) {
    const dither = (Math.random() - Math.random()) / 32768; // TPDF : somme de deux uniformes indépendantes
    const quantized = Math.round((samples[index] + dither) * 32767);
    view.setInt16(44 + index * 2, Math.max(-32768, Math.min(32767, quantized)), true);
  }
  return buffer;
}

/**
 * Conversion complète : extraction, repli de canaux éventuel, resampling
 * `libsamplerate-js` (qualité maximale, `SRC_SINC_BEST_QUALITY`) puis
 * encodage PCM 16 bits ditheré. `null` si la source n'est pas un WAV
 * PCM/float exploitable — jamais d'exception. N'écrit jamais sur disque et
 * ne touche à aucun fichier machine : produit seulement un nouveau tampon en
 * mémoire, à consommer par l'appelant (pré-écoute, futur export).
 */
export async function convertWavForEp133(sourceBytes: ArrayBuffer, targetSampleRate: number, targetChannels?: 1 | 2, trim?: { startSeconds: number; endSeconds: number }, fade?: { fadeInSeconds: number; fadeOutSeconds: number }): Promise<WavConversionResult | null> {
  const format = parseWavFormat(sourceBytes);
  if (!format || !format.frameCount) return null;

  let extracted = extractInterleavedFloat32(format);
  if (trim) {
    const startFrame = Math.round(trim.startSeconds * format.sampleRate);
    const endFrame = Math.round(trim.endSeconds * format.sampleRate);
    extracted = cropInterleaved(extracted, format.channels, startFrame, endFrame);
    if (!extracted.length) return null; // sélection vide (start >= end) : rien à convertir
  }

  const outChannels = targetChannels ?? (format.channels >= 2 ? 2 : 1);
  const remixed = remixChannels(extracted, format.channels, outChannels);

  let resampled = remixed;
  let outSampleRate = format.sampleRate;
  if (targetSampleRate !== format.sampleRate) {
    const converter = await create(outChannels, format.sampleRate, targetSampleRate, { converterType: ConverterType.SRC_SINC_BEST_QUALITY });
    try {
      // `simple()`, pas `full()` : on convertit un fichier complet en un seul
      // appel, jamais un flux par morceaux — `full()` est prévue pour ce
      // deuxième cas (WebRTC/websocket) et ne renvoyait pas le bon nombre de
      // trames ici, trouvé en écrivant le test de l'estimation de poids
      // (143 trames manquantes sur 2625 attendues).
      resampled = converter.simple(remixed);
    } finally {
      converter.destroy();
    }
    outSampleRate = targetSampleRate;
  }

  const faded = fade ? applyFade(resampled, outChannels, outSampleRate, fade.fadeInSeconds, fade.fadeOutSeconds) : resampled;
  const bytes = encodeWavPcm16(faded, outChannels, outSampleRate);
  return { bytes, sampleRate: outSampleRate, channels: outChannels, bitDepth: 16, durationSeconds: resampled.length / outChannels / outSampleRate };
}
