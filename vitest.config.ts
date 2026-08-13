import { defineConfig } from 'vitest/config';

/**
 * Couche de test complémentaire (docs/REGISTRE_IDEES.md R-04, Q-03).
 * N'entre pas en concurrence avec `npm run test:engine/transport/exports/wav` :
 * `tests/legacy-checks.test.ts` importe ces mêmes scripts tels quels, sans
 * dupliquer leur logique. Vitest transforme le TypeScript via esbuild, donc
 * ces vérifications tournent ici même sur un Node plus ancien que la version
 * 22 exigée par `--experimental-strip-types` dans `package.json`.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
