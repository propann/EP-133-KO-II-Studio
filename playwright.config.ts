import { defineConfig, devices } from '@playwright/test';

/**
 * Scénarios de régression d'interface, complémentaires aux 4 scripts
 * `tools/check-*.mjs` et à `vitest` (logique pure). Ici on vérifie de vrais
 * comportements React dans un vrai Chromium, avec un faux `navigator.
 * requestMIDIAccess` (Web MIDI n'existe pas dans Chromium headless) — voir
 * `e2e/midi-connection.spec.ts` et `docs/REGISTRE_IDEES.md` R-16.
 *
 * Formalise le dernier point ouvert de Q-03 : les scénarios Playwright
 * étaient jusqu'ici utilisés à la main pendant chaque session, jamais
 * committés.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // --host 127.0.0.1 explicite : `vite preview` répond parfois seulement
    // sur ::1 (IPv6) selon la résolution locale de "localhost", ce qui fait
    // échouer silencieusement l'attente de Playwright sur 127.0.0.1.
    command: 'npm run preview -- --port 4173 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
