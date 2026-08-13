import type { KeyboardEvent } from 'react';
import type { AppLanguage } from '../core/i18n';

interface HomePageProps {
  connected: boolean;
  project?: number;
  scannedSoundCount: number;
  language: AppLanguage;
  onLanguageChange: (language: AppLanguage) => void;
  onOpenGame: () => void;
  onOpenStudio: () => void;
  onOpenSounds: () => void;
  onOpenDocumentation: () => void;
  onOpenMachineTest: () => void;
  onOpenProfile: () => void;
}

const copy = {
  fr: {
    tagline: 'CRÉER · CLONER · TRANSFÉRER', intro: 'Extrais les morceaux de ta machine, transforme patterns, scènes, Songs et sons, puis prépare leur retour vers l’EP‑133.', connected: 'CONNECTÉ', ready: 'EP‑133 PRÊT À CONNECTER', project: 'PROJET', sounds: 'SONS SCANNÉS',
    cards: [['CRÉER','PATTERN & SONG STUDIO','Ouvre des morceaux de la machine et travaille groupes, patterns, scènes et positions Song dans un véritable éditeur.'],['CLONER · GÉRER','SONS & TRANSFERT','Clone projets et samples, inspecte la bibliothèque réelle et prépare précisément les emplacements de la machine.'],['CONNECTER','TEST MACHINE','Inspecte MIDI et SysEx, associe les contrôles physiques et vérifie la communication dans les deux sens.'],['IDENTITÉ','FICHE PERSONNAGE','Avatar, machines déclarées et bilan cumulé de toutes tes sessions de jeu.'],['MODULE INCLUS','RHYTHM HERO','Retrouve les exercices progressifs, partitions animées et entraînements avec les pads de l’EP‑133.'],['COMPRENDRE','DOCUMENTATION','Guides du Studio et de la machine, connexion MIDI, formats et procédures vérifiées.']], official: 'GUIDE OFFICIEL EP‑133 ↗', local: 'OPEN SOURCE · LOCAL · SANS COMPTE', language: 'Langue',
  },
  en: {
    tagline: 'CREATE · CLONE · TRANSFER', intro: 'Extract music from your device, reshape patterns, scenes, Songs and sounds, then prepare their return to the EP‑133.', connected: 'CONNECTED', ready: 'EP‑133 READY TO CONNECT', project: 'PROJECT', sounds: 'SCANNED SOUNDS',
    cards: [['CREATE','PATTERN & SONG STUDIO','Open music from the device and edit groups, patterns, scenes and Song positions in a true editor.'],['CLONE · MANAGE','SOUNDS & TRANSFER','Clone projects and samples, inspect the real library and prepare device slots precisely.'],['CONNECT','MACHINE TEST','Inspect MIDI and SysEx, map physical controls and verify two-way communication.'],['IDENTITY','CHARACTER SHEET','Avatar, declared machines and cumulative results across all your play sessions.'],['INCLUDED MODULE','RHYTHM HERO','Practice with progressive exercises, animated notation and the real EP‑133 pads.'],['LEARN','DOCUMENTATION','Studio and device guides, MIDI connection, formats and verified procedures.']], official: 'OFFICIAL EP‑133 GUIDE ↗', local: 'OPEN SOURCE · LOCAL · NO ACCOUNT', language: 'Language',
  },
  es: {
    tagline: 'CREAR · CLONAR · TRANSFERIR', intro: 'Extrae la música de tu máquina, transforma patterns, escenas, Songs y sonidos, y prepara su regreso al EP‑133.', connected: 'CONECTADO', ready: 'EP‑133 LISTO PARA CONECTAR', project: 'PROYECTO', sounds: 'SONIDOS ESCANEADOS',
    cards: [['CREAR','PATTERN & SONG STUDIO','Abre música de la máquina y edita grupos, patterns, escenas y posiciones Song.'],['CLONAR · GESTIONAR','SONIDOS Y TRANSFERENCIA','Clona proyectos y samples, inspecciona la biblioteca real y prepara los slots de la máquina.'],['CONECTAR','PRUEBA DE MÁQUINA','Inspecciona MIDI y SysEx, asigna controles físicos y verifica la comunicación bidireccional.'],['IDENTIDAD','FICHA DE PERSONAJE','Avatar, máquinas declaradas y balance acumulado de todas tus sesiones de juego.'],['MÓDULO INCLUIDO','RHYTHM HERO','Practica con ejercicios progresivos, partitura animada y los pads reales del EP‑133.'],['COMPRENDER','DOCUMENTACIÓN','Guías del Studio y de la máquina, conexión MIDI, formatos y procedimientos verificados.']], official: 'GUÍA OFICIAL EP‑133 ↗', local: 'CÓDIGO ABIERTO · LOCAL · SIN CUENTA', language: 'Idioma',
  },
} as const;

function activateWithKeyboard(event: KeyboardEvent<HTMLElement>, action: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  action();
}

export function HomePage({ connected, project, scannedSoundCount, language, onLanguageChange, onOpenGame, onOpenStudio, onOpenSounds, onOpenDocumentation, onOpenMachineTest, onOpenProfile }: HomePageProps) {
  const t = copy[language];
  const actions = [onOpenStudio, onOpenSounds, onOpenMachineTest, onOpenProfile, onOpenGame, onOpenDocumentation];
  const classes = ['studio-card', 'sounds-card', 'machine-test-card', 'profile-card', 'game-card', 'docs-card'];
  return <main className="home-screen">
    <header className="home-brand"><span>EP‑133</span><b>KO II STUDIO</b><div className="language-switch" aria-label={t.language}>{(['fr','en','es'] as AppLanguage[]).map((item) => <button className={language === item ? 'active' : ''} onClick={() => onLanguageChange(item)} aria-pressed={language === item} key={item}>{item.toUpperCase()}</button>)}</div><small>{t.tagline}</small></header>
    <section className="home-intro"><p>{t.intro}</p><div className={`home-machine-status ${connected ? 'online' : ''}`}><i className={connected ? 'online' : ''} /><span>{connected ? t.connected : t.ready}</span>{project !== undefined && <small>{t.project} {project} · {scannedSoundCount} {t.sounds}</small>}</div></section>
    <section className="home-tools">{t.cards.map(([eyebrow, title, description], index) => <article className={`home-card ${classes[index]}`} role="button" tabIndex={0} onClick={actions[index]} onKeyDown={(event) => activateWithKeyboard(event, actions[index])} key={title}><span className="home-number">{String(index + 1).padStart(2, '0')}</span><small>{eyebrow}</small><h2>{title}</h2><p>{description}</p></article>)}</section>
    <footer className="home-footer"><span>EP‑133 KO II STUDIO</span><a href="https://teenage.engineering/guides/ep-133" target="_blank" rel="noreferrer">{t.official}</a><span>{t.local}</span></footer>
  </main>;
}
