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

export interface Ep133MemoryFit {
  fits: boolean;
  remainingBytes: number;
}

/**
 * Compare un poids déjà estimé (`estimateEp133ConversionBytes`) à l'espace
 * restant sur la machine, à partir de l'occupation et de la capacité déjà
 * connues (dernier scan, `DeviceSoundIndex.usedBytes`, et le profil 64/128 Mo
 * — voir `SoundsPage`). Mo au sens décimal (1 Mo = 1 000 000 octets), cohérent
 * avec le reste du projet (ex. « 56,21 Mo » pour 527 sons). Ne suppose jamais
 * que l'espace est suffisant : une entrée non finie ou négative retombe sur
 * 0 plutôt qu'un calcul silencieusement erroné — même précaution que le bug
 * « NaN son » déjà trouvé et corrigé sur un calcul d'occupation similaire
 * (REGISTRE_IDEES.md Q-16).
 */
export function estimateEp133MemoryFit(estimatedBytes: number, usedBytes: number, capacityMb: number): Ep133MemoryFit {
  const capacityBytes = Number.isFinite(capacityMb) && capacityMb > 0 ? capacityMb * 1e6 : 0;
  const safeUsedBytes = Number.isFinite(usedBytes) && usedBytes > 0 ? usedBytes : 0;
  const remainingBytes = Math.max(0, capacityBytes - safeUsedBytes);
  return { fits: estimatedBytes <= remainingBytes, remainingBytes };
}
