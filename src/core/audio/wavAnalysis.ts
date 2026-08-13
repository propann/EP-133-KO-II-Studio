/**
 * Préparation déterministe du WAV (plan P2, item 2) : avant tout transfert
 * vers l'EP-133, savoir ce qu'on envoie sans dépendre du décodage
 * navigateur. `AudioContext.decodeAudioData()` rééchantillonne parfois à la
 * fréquence native du contexte audio — la fréquence source réelle serait
 * alors perdue, exactement ce que ce module doit rapporter fidèlement. On
 * lit donc l'en-tête RIFF/fmt et les échantillons PCM à la main, sans
 * dépendance externe.
 *
 * Couvre PCM entier 8/16/24/32 bits et IEEE float 32 bits (formats WAV les
 * plus courants) ; tout le reste (compressé, ADPCM, en-tête corrompu) rend
 * `null` plutôt que de lever une exception — un fichier illisible ne doit
 * jamais casser le parcours de préparation.
 */

export interface WavAnalysisReport {
  /** Poids du fichier tel quel, en octets — pas une estimation post-conversion. */
  weightBytes: number;
  durationSeconds: number;
  /** Fréquence d'échantillonnage source, lue dans l'en-tête `fmt ` — jamais celle du AudioContext de lecture. */
  sampleRate: number;
  channels: number;
  bitDepth: number;
  /** Niveau crête normalisé 0–1 (1 = plein code numérique) sur tous canaux confondus. */
  peakLevel: number;
  /** Vrai si au moins un échantillon atteint exactement le code numérique maximal ou minimal — signe probable d'écrêtage à la source, pas seulement un niveau élevé. */
  clipped: boolean;
  clippedSampleCount: number;
}

interface RiffChunk { id: string; start: number; length: number }

function readChunks(view: DataView, from: number, to: number): RiffChunk[] {
  const chunks: RiffChunk[] = [];
  let offset = from;
  while (offset + 8 <= to) {
    const id = String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
    const length = view.getUint32(offset + 4, true);
    chunks.push({ id, start: offset + 8, length });
    offset += 8 + length + (length % 2); // les chunks RIFF sont alignés sur 2 octets
  }
  return chunks;
}

/** Un seul passage sur les octets bruts, jamais de tableau intermédiaire de flottants pour tout le fichier. Le code entier brut (pas la valeur normalisée) sert à détecter l'écrêtage exact. */
function scanSamples(view: DataView, dataStart: number, dataLength: number, bitDepth: number, isFloat: boolean): { peakLevel: number; clipped: boolean; clippedSampleCount: number } {
  const bytesPerSample = bitDepth / 8;
  const sampleCount = Math.floor(dataLength / bytesPerSample);
  const maxCode = bitDepth === 8 ? 127 : bitDepth === 16 ? 32767 : bitDepth === 24 ? 8388607 : 2147483647;
  const minCode = -(maxCode + 1);
  let peak = 0;
  let clippedCount = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    const byteOffset = dataStart + index * bytesPerSample;
    if (isFloat) {
      const value = view.getFloat32(byteOffset, true);
      const magnitude = Math.abs(value);
      if (magnitude > peak) peak = magnitude;
      if (magnitude >= 1) clippedCount += 1;
      continue;
    }
    let raw: number;
    if (bitDepth === 8) raw = view.getUint8(byteOffset) - 128; // WAV 8 bits est non signé par convention, on recentre sur 0
    else if (bitDepth === 16) raw = view.getInt16(byteOffset, true);
    else if (bitDepth === 24) {
      const b0 = view.getUint8(byteOffset); const b1 = view.getUint8(byteOffset + 1); const b2 = view.getUint8(byteOffset + 2);
      raw = b0 | (b1 << 8) | (b2 << 16);
      if (raw & 0x800000) raw -= 0x1000000; // complément à deux sur 24 bits
    } else {
      raw = view.getInt32(byteOffset, true);
    }
    const magnitude = Math.abs(raw) / (maxCode + 1);
    if (magnitude > peak) peak = magnitude;
    if (raw === maxCode || raw === minCode) clippedCount += 1;
  }
  return { peakLevel: Math.min(1, peak), clipped: clippedCount > 0, clippedSampleCount: clippedCount };
}

export interface WaveformPeaks {
  channels: number;
  sampleRate: number;
  durationSeconds: number;
  /** Un seul canal, crête max entre tous les canaux source par point — suffisant
   * pour l'affichage (Phase 4, forme d'onde/trim), pas une réduction utilisable
   * pour l'export final. */
  values: Float32Array;
}

/**
 * Crêtes réduites à `targetPoints` valeurs, pour dessiner une forme d'onde sans
 * charger un `AudioContext` ni dépendre de `decodeAudioData()` (même piège que
 * `analyzeWavBuffer` : rééchantillonnage silencieux possible). Lit les mêmes
 * octets PCM bruts, par un chemin séparé pour ne jamais risquer de régression
 * sur `analyzeWavBuffer` — testé indépendamment.
 */
export function computeWaveformPeaks(bytes: ArrayBuffer, targetPoints = 1000): WaveformPeaks | null {
  if (bytes.byteLength < 44) return null;
  const view = new DataView(bytes);
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
  if (riff !== 'RIFF' || wave !== 'WAVE') return null;

  const chunks = readChunks(view, 12, bytes.byteLength);
  const fmtChunk = chunks.find((chunk) => chunk.id === 'fmt ');
  const dataChunk = chunks.find((chunk) => chunk.id === 'data');
  if (!fmtChunk || !dataChunk || fmtChunk.length < 16) return null;

  const audioFormat = view.getUint16(fmtChunk.start, true);
  const channels = view.getUint16(fmtChunk.start + 2, true);
  const sampleRate = view.getUint32(fmtChunk.start + 4, true);
  const bitDepth = view.getUint16(fmtChunk.start + 14, true);
  if (!channels || !sampleRate || ![8, 16, 24, 32].includes(bitDepth)) return null;
  if (audioFormat !== 1 && audioFormat !== 3) return null;
  if (audioFormat === 3 && bitDepth !== 32) return null;
  const isFloat = audioFormat === 3;

  const bytesPerSample = bitDepth / 8;
  const bytesPerFrame = channels * bytesPerSample;
  const dataLength = Math.min(dataChunk.length, bytes.byteLength - dataChunk.start);
  const frameCount = bytesPerFrame > 0 ? Math.floor(dataLength / bytesPerFrame) : 0;
  if (!frameCount) return null;

  const maxCode = bitDepth === 8 ? 127 : bitDepth === 16 ? 32767 : bitDepth === 24 ? 8388607 : 2147483647;
  const frameMagnitude = (frameIndex: number) => {
    let peak = 0;
    const frameStart = dataChunk.start + frameIndex * bytesPerFrame;
    for (let channel = 0; channel < channels; channel += 1) {
      const byteOffset = frameStart + channel * bytesPerSample;
      let magnitude: number;
      if (isFloat) magnitude = Math.abs(view.getFloat32(byteOffset, true));
      else if (bitDepth === 8) magnitude = Math.abs(view.getUint8(byteOffset) - 128) / 128;
      else if (bitDepth === 16) magnitude = Math.abs(view.getInt16(byteOffset, true)) / (maxCode + 1);
      else if (bitDepth === 24) {
        const b0 = view.getUint8(byteOffset); const b1 = view.getUint8(byteOffset + 1); const b2 = view.getUint8(byteOffset + 2);
        let raw = b0 | (b1 << 8) | (b2 << 16);
        if (raw & 0x800000) raw -= 0x1000000; // complément à deux sur 24 bits
        magnitude = Math.abs(raw) / (maxCode + 1);
      } else magnitude = Math.abs(view.getInt32(byteOffset, true)) / (maxCode + 1);
      if (magnitude > peak) peak = magnitude;
    }
    return Math.min(1, peak);
  };

  const points = Math.max(1, Math.min(targetPoints, frameCount));
  const framesPerPoint = frameCount / points;
  const values = new Float32Array(points);
  for (let point = 0; point < points; point += 1) {
    const start = Math.floor(point * framesPerPoint);
    const end = Math.max(start + 1, Math.floor((point + 1) * framesPerPoint));
    // Sous-échantillonne à l'intérieur d'un point large (fichier long) pour rester
    // rapide sans perdre les crêtes visibles à l'oeil sur un fichier court.
    const step = Math.max(1, Math.floor((end - start) / 400));
    let peak = 0;
    for (let frame = start; frame < end; frame += step) {
      const magnitude = frameMagnitude(frame);
      if (magnitude > peak) peak = magnitude;
    }
    values[point] = peak;
  }

  return { channels, sampleRate, durationSeconds: frameCount / sampleRate, values };
}

/** `null` pour tout ce qui n'est pas un WAV PCM/float exploitable — jamais une exception. */
export function analyzeWavBuffer(bytes: ArrayBuffer, weightBytes = bytes.byteLength): WavAnalysisReport | null {
  if (bytes.byteLength < 44) return null;
  const view = new DataView(bytes);
  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
  if (riff !== 'RIFF' || wave !== 'WAVE') return null;

  const chunks = readChunks(view, 12, bytes.byteLength);
  const fmtChunk = chunks.find((chunk) => chunk.id === 'fmt ');
  const dataChunk = chunks.find((chunk) => chunk.id === 'data');
  if (!fmtChunk || !dataChunk || fmtChunk.length < 16) return null;

  const audioFormat = view.getUint16(fmtChunk.start, true);
  const channels = view.getUint16(fmtChunk.start + 2, true);
  const sampleRate = view.getUint32(fmtChunk.start + 4, true);
  const bitDepth = view.getUint16(fmtChunk.start + 14, true);
  if (!channels || !sampleRate || ![8, 16, 24, 32].includes(bitDepth)) return null;
  if (audioFormat !== 1 && audioFormat !== 3) return null; // PCM entier (1) ou IEEE float (3) seulement — le reste (compressé) est hors scope
  if (audioFormat === 3 && bitDepth !== 32) return null; // IEEE float n'est exploité ici qu'en 32 bits, seul cas réellement répandu

  const dataLength = Math.min(dataChunk.length, bytes.byteLength - dataChunk.start);
  const bytesPerFrame = channels * (bitDepth / 8);
  const durationSeconds = bytesPerFrame > 0 ? Math.floor(dataLength / bytesPerFrame) / sampleRate : 0;

  const { peakLevel, clipped, clippedSampleCount } = scanSamples(view, dataChunk.start, dataLength, bitDepth, audioFormat === 3);

  return { weightBytes, durationSeconds, sampleRate, channels, bitDepth, peakLevel, clipped, clippedSampleCount };
}
