import assert from 'node:assert/strict';
import { estimateEp133MemoryFit } from '../src/core/audio/ep133Targets.ts';

// Pas de dépendance WASM ici (contrairement à check-wav-convert.mjs) : ce
// module doit rester léger et rapide à tester, c'est tout son intérêt.

// 1) Large marge : tient largement.
const roomy = estimateEp133MemoryFit(100_000, 1_000_000, 64); // 100 Ko sur 63 Mo restants
assert.equal(roomy.remainingBytes, 63_000_000);
assert.equal(roomy.fits, true);

// 2) Pile à la limite : tient exactement (<=, pas <).
const exact = estimateEp133MemoryFit(63_000_000, 1_000_000, 64);
assert.equal(exact.fits, true);

// 3) Un octet de trop : ne tient plus.
const overByOne = estimateEp133MemoryFit(63_000_001, 1_000_000, 64);
assert.equal(overByOne.fits, false);

// 4) Machine jamais scannée (capacité inconnue) : jamais un espace supposé disponible.
const unknownCapacity = estimateEp133MemoryFit(1000, 0, NaN);
assert.equal(unknownCapacity.remainingBytes, 0);
assert.equal(unknownCapacity.fits, false);

// 5) Entrées défensives : jamais de calcul silencieusement faux sur des valeurs
// négatives/non finies (même précaution que le bug « NaN son » déjà trouvé ailleurs,
// REGISTRE_IDEES.md Q-16) — jamais de NaN qui se propagerait dans l'affichage.
const negativeUsed = estimateEp133MemoryFit(1000, -50, 64);
assert.equal(negativeUsed.remainingBytes, 64_000_000, 'occupation négative traitée comme 0, pas soustraite');
assert.equal(Number.isFinite(negativeUsed.remainingBytes), true);
const negativeCapacity = estimateEp133MemoryFit(1000, 0, -64);
assert.equal(negativeCapacity.remainingBytes, 0);
assert.equal(Number.isFinite(negativeCapacity.remainingBytes), true);

console.log('Cibles EP-133 et jauge de mémoire (estimateEp133MemoryFit) : OK');
