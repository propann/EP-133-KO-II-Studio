import { test, expect } from '@playwright/test';

/**
 * Web MIDI n'existe pas dans un Chromium headless. On simule un EP-133 déjà
 * autorisé par le navigateur (une entrée et une sortie nommées « EP-133 »)
 * pour exercer le vrai chemin de `src/core/midi/useWebMidi.ts` — filtrage
 * `isEp133MidiPort`, ouverture asynchrone des ports, mise à jour de l'état
 * `connected` — sans machine réelle ni extension navigateur.
 *
 * Complète `tools/check-*.mjs` (logique pure côté Node) : ceci vérifie que
 * l'état MIDI atteint réellement l'écran, dans un vrai DOM React. Formalise
 * le dernier point ouvert de Q-03 (docs/REGISTRE_IDEES.md) : les scénarios
 * Playwright étaient jusqu'ici rejoués à la main à chaque session, jamais
 * committés. Voir aussi R-16.
 *
 * Ne remplace pas la validation sur machine réelle (mapping SysEx, notes
 * physiques 36–83) : ce test ne connaît que la forme des messages, pas leur
 * exactitude matérielle.
 */
function installMockWebMidi() {
  class MockMIDIPort {
    name: string;
    type: 'input' | 'output';
    connection = 'closed';
    state = 'connected';
    onmidimessage: ((event: unknown) => void) | null = null;
    constructor(name: string, type: 'input' | 'output') {
      this.name = name;
      this.type = type;
    }
    async open() { this.connection = 'open'; return this; }
    async close() { this.connection = 'closed'; return this; }
    send() { /* aucun test n'observe encore les octets envoyés ici */ }
  }

  const input = new MockMIDIPort('EP-133', 'input');
  const output = new MockMIDIPort('EP-133', 'output');
  const access = {
    inputs: new Map([['ep133-in', input]]),
    outputs: new Map([['ep133-out', output]]),
    onstatechange: null as (() => void) | null,
  };

  // `access` n'implémente pas toute l'interface MIDIAccess réelle (pas
  // d'EventTarget, pas de sysexEnabled) — suffisant pour ce que le hook lit
  // vraiment (`inputs`, `outputs`, `onstatechange`), casté explicitement
  // plutôt que de prétendre respecter le type complet.
  (navigator as unknown as { requestMIDIAccess: () => Promise<typeof access> }).requestMIDIAccess = async () => access;
}

test('l\'accueil détecte automatiquement un EP-133 déjà autorisé par le navigateur', async ({ page }) => {
  // Injecté avant tout script de la page, donc avant que useWebMidi() ne
  // lise navigator.requestMIDIAccess au montage. Scopé à ce seul test :
  // l'autre scénario ci-dessous vérifie justement l'absence de mock.
  await page.addInitScript(installMockWebMidi);
  await page.goto('/');

  const status = page.locator('.home-machine-status');
  await expect(status.locator('i')).toHaveClass('online');
  // Le libellé exact varie avec la langue (FR/EN/ES) ; on vérifie le
  // comportement, pas la traduction du jour.
  await expect(status.locator('span')).toContainText(/CONNECT/i);
});

test('l\'accueil affiche « prêt à connecter » sans EP-133 détecté', async ({ page }) => {
  // Pas de page.addInitScript ici : Web MIDI reste totalement absent,
  // comme un vrai navigateur headless sans Chrome/Chromium autorisé.
  await page.goto('/');

  const status = page.locator('.home-machine-status');
  await expect(status.locator('i')).not.toHaveClass('online');
});

test('un exercice officiel peut être copié dans USER hors ligne', async ({ page }) => {
  page.on('dialog', (dialog) => void dialog.accept());
  await page.goto('/');
  await page.locator('.game-card').click();
  const styles = page.locator('.mode-select option');
  const before = await styles.count();
  await page.getByRole('button', { name: 'DUPLIQUER', description: /Copier l’exercice officiel/ }).click();
  await expect(styles).toHaveCount(before + 1);
  await expect(page.getByRole('button', { name: 'DUPLIQUER' })).toBeDisabled();
});

test('le Studio exporte une archive .ppak hors ligne', async ({ page }) => {
  await page.goto('/');
  await page.locator('.studio-card').click();
  await expect(page.getByText('ÉDITEUR EP‑133 COMPLET')).toBeVisible();
  await page.locator('summary').filter({ hasText: 'FICHIER' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Exporter une archive EP‑133/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.ppak$/);
});

test('le Song Arranger annule et rétablit une Song Position', async ({ page }) => {
  await page.goto('/');
  await page.locator('.studio-card').click();
  await page.locator('summary').filter({ hasText: 'FICHIER' }).click();
  await page.getByRole('button', { name: 'Ouvrir…' }).click();
  await page.getByRole('button', { name: 'DEMO GROOVE' }).click();
  await page.getByRole('button', { name: 'PATTERNS', exact: true }).click();
  await page.getByRole('button', { name: 'SONG', exact: true }).click();
  const positions = page.locator('.song-position-card');
  await expect(positions).toHaveCount(4);
  await positions.first().locator('summary[aria-label="Actions de la Song Position"]').click();
  await page.locator('.song-position-menu').getByRole('button', { name: 'DUPLIQUER' }).click();
  await expect(positions).toHaveCount(5);
  await page.locator('button.studio-undo').filter({ hasText: 'ANNULER SONG' }).click();
  await expect(positions).toHaveCount(4);
  await page.locator('button.studio-redo').filter({ hasText: 'RÉTABLIR SONG' }).click();
  await expect(positions).toHaveCount(5);
});

test('COMMIT est annulable comme une transaction structurelle', async ({ page }) => {
  await page.goto('/');
  await page.locator('.studio-card').click();
  await page.locator('summary').filter({ hasText: 'FICHIER' }).click();
  await page.getByRole('button', { name: 'Ouvrir…' }).click();
  await page.getByRole('button', { name: 'DEMO GROOVE' }).click();
  await page.getByRole('button', { name: 'PATTERNS', exact: true }).click();
  await page.getByRole('button', { name: 'COMMIT · CRÉER SCÈNE' }).click();
  await page.getByRole('button', { name: 'SONG', exact: true }).click();
  const positions = page.locator('.song-position-card');
  await expect(positions).toHaveCount(5);
  await page.locator('button.studio-undo').filter({ hasText: 'ANNULER' }).click();
  await expect(positions).toHaveCount(4);
  await page.locator('button.studio-redo').filter({ hasText: 'RÉTABLIR' }).click();
  await expect(positions).toHaveCount(5);
});

test('le tempo et le nom du Studio passent dans Annuler/Rétablir', async ({ page }) => {
  await page.goto('/');
  await page.locator('.studio-card').click();
  await page.locator('summary').filter({ hasText: 'FICHIER' }).click();
  await page.getByRole('button', { name: 'Ouvrir…' }).click();
  await page.getByRole('button', { name: 'DEMO GROOVE' }).click();
  const name = page.locator('.exercise-editor header input');
  const tempo = page.getByRole('button', { name: 'Augmenter le tempo' });
  const undo = page.locator('button.studio-undo').filter({ hasText: 'ANNULER' });
  const redo = page.locator('button.studio-redo').filter({ hasText: 'RÉTABLIR' });
  await expect(name).toHaveValue('DEMO GROOVE');
  await name.fill('NOUVEAU GROOVE');
  await tempo.click();
  await undo.click();
  await expect(name).toHaveValue('NOUVEAU GROOVE');
  await undo.click();
  await expect(name).toHaveValue('DEMO GROOVE');
  await redo.click();
  await expect(name).toHaveValue('NOUVEAU GROOVE');
  await redo.click();
  await expect(name).toHaveValue('NOUVEAU GROOVE');
});

test('Ctrl+D duplique les notes sélectionnées dans le pattern', async ({ page }) => {
  await page.goto('/');
  await page.locator('.studio-card').click();
  await page.locator('summary').filter({ hasText: 'FICHIER' }).click();
  await page.getByRole('button', { name: 'Ouvrir…' }).click();
  await page.getByRole('button', { name: 'DEMO GROOVE' }).click();
  await page.getByRole('button', { name: 'PATTERNS', exact: true }).click();
  const checked = page.locator('.editor-grid:not(.key-grid) button.checked:not(.committed)');
  const before = await checked.count();
  expect(before).toBeGreaterThan(0);
  await checked.first().click({ modifiers: ['Control'] });
  await page.keyboard.press('Control+d');
  await expect(checked).toHaveCount(before + 1);
});

test('le Studio récupère une sauvegarde de secours locale', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ep133-rhythm-hero:studio-autosave:v1', JSON.stringify({
      savedAt: '2026-08-14T15:30:00.000Z',
      document: {
        schema: 'ep.project.v1', product: 'ep133', metadata: { title: 'BROUILLON RÉCUPÉRÉ' },
        settings: { bpm: 110 }, pads: [],
        patterns: [{ id: 'A01', bars: 1, events: [{ tick: 0, pad: 1, velocity: 100, duration: 24 }] }],
        scenes: [{ scene: 1, groupPatterns: [1, 0, 0, 0], timeSignature: [4, 4] }], song: [1], currentScene: 1,
      },
    }));
  });
  page.on('dialog', (dialog) => void dialog.accept());
  await page.goto('/');
  await page.locator('.studio-card').click();
  const recover = page.getByRole('button', { name: 'RÉCUPÉRER LA SAUVEGARDE DE SECOURS' });
  await expect(recover).toBeVisible();
  await recover.click();
  await expect(page.locator('.editor-overlay')).toBeVisible();
  await expect(page.locator('.exercise-editor header input')).toHaveValue('BROUILLON RÉCUPÉRÉ');
  await expect(recover).not.toBeVisible();
});
