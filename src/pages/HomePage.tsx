import type { KeyboardEvent } from 'react';

interface HomePageProps {
  connected: boolean;
  project?: number;
  scannedSoundCount: number;
  onOpenGame: () => void;
  onOpenStudio: () => void;
  onOpenSounds: () => void;
  onOpenDocumentation: () => void;
}

function activateWithKeyboard(event: KeyboardEvent<HTMLElement>, action: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  action();
}

export function HomePage({ connected, project, scannedSoundCount, onOpenGame, onOpenStudio, onOpenSounds, onOpenDocumentation }: HomePageProps) {
  return <main className="home-screen">
    <header className="home-brand"><span>EP‑133</span><b>RHYTHM HERO</b><small>JEU · CRÉATION · MACHINE</small></header>
    <section className="home-intro"><p>Apprends le rythme, construis tes propres partitions et transforme ton EP‑133 en véritable instrument de création.</p><div className="home-machine-status"><i className={connected ? 'online' : ''} /><span>{connected ? 'EP‑133 CONNECTÉ' : 'EP‑133 PRÊT À CONNECTER'}</span>{project !== undefined && <small>PROJET {project} · {scannedSoundCount} SONS SCANNÉS</small>}</div></section>
    <section className="home-tools">
      <article className="home-card game-card" role="button" tabIndex={0} onClick={onOpenGame} onKeyDown={(event) => activateWithKeyboard(event, onOpenGame)}><span className="home-number">01</span><small>APPRENDRE</small><h2>RHYTHM HERO</h2><p>Exercices progressifs, partitions animées, score et entraînement avec les pads de l’EP‑133.</p></article>
      <article className="home-card studio-card" role="button" tabIndex={0} onClick={onOpenStudio} onKeyDown={(event) => activateWithKeyboard(event, onOpenStudio)}><span className="home-number">02</span><small>CRÉER</small><h2>STUDIO EP‑133</h2><p>Quatre groupes, séquenceur, piano-roll KEYS, boucle, horloge MIDI et exports compatibles.</p></article>
      <article className="home-card sounds-card" role="button" tabIndex={0} onClick={onOpenSounds} onKeyDown={(event) => activateWithKeyboard(event, onOpenSounds)}><span className="home-number">03</span><small>GÉRER</small><h2>SONS & TRANSFERT</h2><p>Inspecte la bibliothèque réelle, prépare les samples et maîtrise précisément les emplacements de la machine.</p></article>
      <article className="home-card docs-card" role="button" tabIndex={0} onClick={onOpenDocumentation} onKeyDown={(event) => activateWithKeyboard(event, onOpenDocumentation)}><span className="home-number">04</span><small>COMPRENDRE</small><h2>DOCUMENTATION</h2><p>Guide français, repères visuels, connexion MIDI, formats et sécurité de la machine.</p></article>
    </section>
    <footer className="home-footer"><span>EP‑133 RHYTHM HERO</span><a href="https://teenage.engineering/guides/ep-133" target="_blank" rel="noreferrer">GUIDE OFFICIEL EP‑133 ↗</a><span>LOCAL · SANS COMPTE</span></footer>
  </main>;
}
