import type { KeyboardEvent } from 'react';

interface HomePageProps {
  connected: boolean;
  project?: number;
  scannedSoundCount: number;
  onOpenGame: () => void;
  onOpenStudio: () => void;
  onOpenSounds: () => void;
  onOpenDocumentation: () => void;
  onOpenMachineTest: () => void;
}

function activateWithKeyboard(event: KeyboardEvent<HTMLElement>, action: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  action();
}

export function HomePage({ connected, project, scannedSoundCount, onOpenGame, onOpenStudio, onOpenSounds, onOpenDocumentation, onOpenMachineTest }: HomePageProps) {
  return <main className="home-screen">
    <header className="home-brand"><span>EP‑133</span><b>KO II STUDIO</b><small>CRÉER · CLONER · TRANSFÉRER</small></header>
    <section className="home-intro"><p>Extrais les morceaux de ta machine, transforme patterns, scènes, Songs et sons, puis prépare leur retour vers l’EP‑133.</p><div className="home-machine-status"><i className={connected ? 'online' : ''} /><span>{connected ? 'EP‑133 CONNECTÉ' : 'EP‑133 PRÊT À CONNECTER'}</span>{project !== undefined && <small>PROJET {project} · {scannedSoundCount} SONS SCANNÉS</small>}</div></section>
    <section className="home-tools">
      <article className="home-card studio-card" role="button" tabIndex={0} onClick={onOpenStudio} onKeyDown={(event) => activateWithKeyboard(event, onOpenStudio)}><span className="home-number">01</span><small>CRÉER</small><h2>PATTERN & SONG STUDIO</h2><p>Ouvre des morceaux de la machine et travaille groupes, patterns, scènes et positions Song dans un véritable éditeur.</p></article>
      <article className="home-card sounds-card" role="button" tabIndex={0} onClick={onOpenSounds} onKeyDown={(event) => activateWithKeyboard(event, onOpenSounds)}><span className="home-number">02</span><small>CLONER · GÉRER</small><h2>SONS & TRANSFERT</h2><p>Clone projets et samples, inspecte la bibliothèque réelle et prépare précisément les emplacements de la machine.</p></article>
      <article className="home-card machine-test-card" role="button" tabIndex={0} onClick={onOpenMachineTest} onKeyDown={(event) => activateWithKeyboard(event, onOpenMachineTest)}><span className="home-number">03</span><small>CONNECTER</small><h2>TEST MACHINE</h2><p>Inspecte MIDI et SysEx, associe les contrôles physiques et vérifie la communication dans les deux sens.</p></article>
      <article className="home-card game-card" role="button" tabIndex={0} onClick={onOpenGame} onKeyDown={(event) => activateWithKeyboard(event, onOpenGame)}><span className="home-number">04</span><small>MODULE INCLUS</small><h2>RHYTHM HERO</h2><p>Retrouve les exercices progressifs, partitions animées et entraînements avec les pads de l’EP‑133.</p></article>
      <article className="home-card docs-card" role="button" tabIndex={0} onClick={onOpenDocumentation} onKeyDown={(event) => activateWithKeyboard(event, onOpenDocumentation)}><span className="home-number">05</span><small>COMPRENDRE</small><h2>DOCUMENTATION</h2><p>Guide français, repères visuels, connexion MIDI, formats et sécurité de la machine.</p></article>
    </section>
    <footer className="home-footer"><span>EP‑133 KO II STUDIO</span><a href="https://teenage.engineering/guides/ep-133" target="_blank" rel="noreferrer">GUIDE OFFICIEL EP‑133 ↗</a><span>OPEN SOURCE · LOCAL · SANS COMPTE</span></footer>
  </main>;
}
