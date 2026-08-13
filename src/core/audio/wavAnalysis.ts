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

export interface ParsedWavFormat {
  view: DataView;
  channels: number;
  sampleRate: number;
  bitDepth: number;
  isFloat: boolean;
  bytesPerSample: number;
  bytesPerFrame: number;
  dataStart: number;
  frameCount: number;
  maxCode: number;
}

/**
 * En-tête + trames décrites une seule fois, partagé par `computeWaveformPeaks`,
 * `detectSilenceTrim` et `wavConvert.ts` (ajoutés après coup) —
 * `analyzeWavBuffer` garde volontairement son propre chemin de lecture séparé,
 * déjà testé, pour ne jamais risquer de régression dessus en le faisant
 * dépendre de ce code plus récent. Exportée pour que `wavConvert.ts`
 * (extraction des échantillons pour le resampling) n'ait pas à reparser
 * l'en-tête une quatrième fois.
 */
export function parseWavFormat(bytes: ArrayBuffer): ParsedWavFormat | null {
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

  const bytesPerSample = bitDepth / 8;
  const bytesPerFrame = channels * bytesPerSample;
  const dataLength = Math.min(dataChunk.length, bytes.byteLength - dataChunk.start);
  const frameCount = bytesPerFrame > 0 ? Math.floor(dataLength / bytesPerFrame) : 0;
  const maxCode = bitDepth === 8 ? 127 : bitDepth === 16 ? 32767 : bitDepth === 24 ? 8388607 : 2147483647;

  return { view, channels, sampleRate, bitDepth, isFloat: audioFormat === 3, bytesPerSample, bytesPerFrame, dataStart: dataChunk.start, frameCount, maxCode };
}

/**
 * Valeur signée normalisée (-1..1, pas seulement sa magnitude) d'un seul
 * canal à un octet donné — le bloc de décodage bit-depth partagé par
 * `frameMagnitude` (crête) et `wavConvert.ts` (extraction réelle pour le
 * resampling), pour ne l'écrire qu'une fois.
 */
export function readSignedSample(format: ParsedWavFormat, byteOffset: number): number {
  if (format.isFloat) return format.view.getFloat32(byteOffset, true);
  if (format.bitDepth === 8) return (format.view.getUint8(byteOffset) - 128) / 128;
  if (format.bitDepth === 16) return format.view.getInt16(byteOffset, true) / (format.maxCode + 1);
  if (format.bitDepth === 24) {
    const b0 = format.view.getUint8(byteOffset); const b1 = format.view.getUint8(byteOffset + 1); const b2 = format.view.getUint8(byteOffset + 2);
    let raw = b0 | (b1 << 8) | (b2 << 16);
    if (raw & 0x800000) raw -= 0x1000000; // complément à deux sur 24 bits
    return raw / (format.maxCode + 1);
  }
  return format.view.getInt32(byteOffset, true) / (format.maxCode + 1);
}

/** Crête normalisée 0–1, tous canaux confondus, d'une seule trame. */
function frameMagnitude(format: ParsedWavFormat, frameIndex: number): number {
  let peak = 0;
  const frameStart = format.dataStart + frameIndex * format.bytesPerFrame;
  for (let channel = 0; channel < format.channels; channel += 1) {
    const magnitude = Math.abs(readSignedSample(format, frameStart + channel * format.bytesPerSample));
    if (magnitude > peak) peak = magnitude;
  }
  return Math.min(1, peak);
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
  const format = parseWavFormat(bytes);
  if (!format || !format.frameCount) return null;

  const points = Math.max(1, Math.min(targetPoints, format.frameCount));
  const framesPerPoint = format.frameCount / points;
  const values = new Float32Array(points);
  for (let point = 0; point < points; point += 1) {
    const start = Math.floor(point * framesPerPoint);
    const end = Math.max(start + 1, Math.floor((point + 1) * framesPerPoint));
    // Sous-échantillonne à l'intérieur d'un point large (fichier long) pour rester
    // rapide sans perdre les crêtes visibles à l'oeil sur un fichier court.
    const step = Math.max(1, Math.floor((end - start) / 400));
    let peak = 0;
    for (let frame = start; frame < end; frame += step) {
      const magnitude = frameMagnitude(format, frame);
      if (magnitude > peak) peak = magnitude;
    }
    values[point] = peak;
  }

  return { channels: format.channels, sampleRate: format.sampleRate, durationSeconds: format.frameCount / format.sampleRate, values };
}

export interface SilenceTrimSuggestion {
  startSeconds: number;
  endSeconds: number;
}

/**
 * Suggestion d'auto-trim par seuil (REGISTRE_IDEES.md A-08) : cherche la
 * première et la dernière trame dont le niveau dépasse `thresholdDb`, avec
 * `guardMs` conservés avant/après pour ne jamais couper pile sur une attaque
 * ou un relâchement. `null` si tout le fichier reste sous le seuil (silence
 * total) ou si ce n'est pas un WAV exploitable — jamais une plage vide ou
 * inversée. Seulement une suggestion : n'écrit rien, ne modifie aucune
 * sélection tant que l'appelant ne l'applique pas explicitement.
 */
export function detectSilenceTrim(bytes: ArrayBuffer, thresholdDb = -40, guardMs = 10): SilenceTrimSuggestion | null {
  const format = parseWavFormat(bytes);
  if (!format || !format.frameCount) return null;

  const threshold = 10 ** (thresholdDb / 20);
  let firstLoud = -1;
  for (let frame = 0; frame < format.frameCount; frame += 1) {
    if (frameMagnitude(format, frame) >= threshold) { firstLoud = frame; break; }
  }
  if (firstLoud === -1) return null; // silence total : rien à suggérer

  let lastLoud = firstLoud;
  for (let frame = format.frameCount - 1; frame >= firstLoud; frame -= 1) {
    if (frameMagnitude(format, frame) >= threshold) { lastLoud = frame; break; }
  }

  const guardFrames = Math.round((guardMs / 1000) * format.sampleRate);
  const startFrame = Math.max(0, firstLoud - guardFrames);
  const endFrame = Math.min(format.frameCount - 1, lastLoud + guardFrames);
  return { startSeconds: startFrame / format.sampleRate, endSeconds: (endFrame + 1) / format.sampleRate };
}

/**
 * Gain (dB) à appliquer pour amener un `peakLevel` déjà mesuré (0–1, par
 * `analyzeWavBuffer`) à `targetDb` sous le plein code numérique — marge de
 * sécurité par défaut (REGISTRE_IDEES.md A-06/A-07 : Peak d'abord, jamais au-delà
 * de 0 dBFS). Silence total (`peakLevel` 0) renvoie `null` : aucun gain fini ne
 * le « normalise ». Calcul seulement — n'applique aucun traitement au signal.
 */
export function suggestNormalizationGainDb(peakLevel: number, targetDb = -1): number | null {
  if (!(peakLevel > 0)) return null;
  const targetLinear = 10 ** (targetDb / 20);
  return 20 * Math.log10(targetLinear / peakLevel);
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
