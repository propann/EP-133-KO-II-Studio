/**
 * Cibles de conversion EP-133 et estimation de poids — délibérément séparé
 * de `wavConvert.ts`, qui importe `@alexanderolsen/libsamplerate-js` (glue
 * WASM ~2 Mo) au niveau module. Ce fichier-ci n'a aucune dépendance lourde,
 * pour rester importable statiquement (ex. depuis `WaveformTrim.tsx`, pour
 * afficher un poids en direct) sans jamais tirer le module de conversion
 * dans le bundle principal — voir `wavConvert.ts` pour le chargement différé
 * réel (`import()` dynamique au premier clic de conversion).
 */

/** Cibles EP-133 exposées par le firmware 2.5 (REGISTRE_IDEES.md R-03). */
export const EP133_TARGET_SAMPLE_RATES = { LO: 26250, MID: 32000, HI: 46875 } as const;
export type Ep133TargetRate = keyof typeof EP133_TARGET_SAMPLE_RATES;

/**
 * Poids exact du WAV PCM 16 bits que produirait `convertWavForEp133`
 * (`wavConvert.ts`), calculé sans lancer le resampling réel — juste de
 * l'arithmétique (44 octets d'en-tête + durée × fréquence cible × 2
 * octets/échantillon × canaux). Le nombre de trames après resampling est
 * toujours `round(duration × targetRate)`, quel que soit l'algorithme
 * utilisé par `libsamplerate-js` : la durée est ce qui est préservé, pas le
 * nombre de trames d'origine — vérifié exact face à une vraie conversion
 * dans `tools/check-wav-convert.mjs`. Sert à afficher un poids « avant
 * transfert » (Roadmap Phase 4) instantanément, y compris pendant qu'on
 * ajuste encore la sélection de trim.
 */
export function estimateEp133ConversionBytes(durationSeconds: number, channels: 1 | 2, targetSampleRate: number): number {
  const frameCount = Math.max(0, Math.round(durationSeconds * targetSampleRate));
  return 44 + frameCount * channels * 2;
}
