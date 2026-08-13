import { describe, it } from 'vitest';

/**
 * Enveloppe vitest autour des scripts historiques `tools/check-*.mjs`, sans
 * réécrire une seule assertion : chaque script exécute déjà ses vérifications
 * (Node `assert/strict`) au moment de l'import, et lève si l'une d'elles
 * échoue. Un `it()` qui importe le script échoue donc exactement comme le
 * script échouerait en ligne de commande — c'est la même couverture, avec un
 * meilleur harnais (mode watch, rapport, et compatible Node < 22 puisque
 * vitest transforme le TypeScript via esbuild plutôt que
 * `--experimental-strip-types`).
 *
 * Ces scripts restent la source de vérité ; voir `docs/REGISTRE_IDEES.md`
 * R-04 et `etude/02_BIBLIOTHEQUES_TECHNIQUES.md`.
 */
describe('scripts de vérification historiques (tools/check-*.mjs)', () => {
  it('moteur de jeu, score et extension de grille', async () => {
    await import('../tools/check-engine.mjs');
  });

  it('transport MIDI, mapping et PANIC 16 canaux', async () => {
    await import('../tools/check-transport.mjs');
  });

  it('export MIDI, ep.project.v1 et décodage .pak/.ppak/TAR', async () => {
    await import('../tools/check-project-exports.mjs');
  });

  it('analyse WAV déterministe', async () => {
    await import('../tools/check-wav-analysis.mjs');
  });

  it('conversion EP-133 (resampling, dither, downmix)', async () => {
    await import('../tools/check-wav-convert.mjs');
  });

  it('cibles EP-133 et jauge de mémoire', async () => {
    await import('../tools/check-ep133-targets.mjs');
  });

  it('fiche personnage : normalisation, ancien format, round-trip localStorage', async () => {
    await import('../tools/check-player-profile.mjs');
  });
});
