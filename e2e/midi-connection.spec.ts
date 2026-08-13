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
