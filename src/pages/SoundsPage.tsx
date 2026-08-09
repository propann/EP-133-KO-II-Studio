import { midiNoteName } from '../core/project/exporters';
import type { DeviceInventory } from '../core/project/device';

interface SoundsPageProps {
  inventory: DeviceInventory | null;
  midiConnected: boolean;
  onBack: () => void;
  onConnectMidi: () => void;
}

export function SoundsPage({ inventory, midiConnected, onBack, onConnectMidi }: SoundsPageProps) {
  return <main className="sound-library-page">
    <header className="module-header"><button onClick={onBack}>← ACCUEIL</button><div><small>MODULE 03</small><h1>SONS & TRANSFERT EP‑133</h1></div><span className={inventory ? 'ready' : ''}>{inventory ? `PROJET ${inventory.project} · LECTURE SEULE` : 'AUCUN SCAN'}</span></header>
    <section className="sound-library-summary"><div><b>{inventory ? Object.keys(inventory.sounds).length : 0}</b><small>SONS UTILISÉS</small></div><div><b>{inventory?.pads.length || 0}</b><small>PADS AFFECTÉS</small></div><div><b>A–D</b><small>GROUPES</small></div><button onClick={onConnectMidi}>{midiConnected ? 'MIDI CONNECTÉ ✓' : 'CONNECTER EP‑133'}</button></section>
    <section className="sound-transfer-zone"><div><small>TRANSFERT SÉCURISÉ</small><h2>PRÉPARER UN NOUVEAU SON</h2><p>Le transfert écrira dans la mémoire globale de la machine. La prochaine étape ajoutera la conversion 46 875 Hz, la pré-écoute, le choix d’un emplacement libre et une confirmation explicite avant toute écriture.</p><button disabled>＋ IMPORTER WAV — BIENTÔT</button></div><aside><b>AUCUNE ÉCRITURE AUTOMATIQUE</b><span>Un emplacement occupé ne sera jamais remplacé sans validation.</span></aside></section>
    <section className="sound-inventory"><header><h2>INVENTAIRE DU PROJET</h2><span>NOMS ET PARAMÈTRES LUS SUR LA MACHINE</span></header><div>{inventory?.pads.map((pad) => { const sound = inventory.sounds[String(pad.slot)]; return <article key={`${pad.group}-${pad.pad}`}><b>{pad.group}{pad.pad.toString().padStart(2, '0')}</b><div><strong>{sound?.name || `SON ${pad.slot}`}</strong><small>SLOT {pad.slot} · {pad.playMode === 1 ? 'KEYS' : pad.playMode === 2 ? 'LEGATO' : 'ONE'} · ROOT {midiNoteName(pad.rootNote)}</small></div></article>; }) || <p>Aucun inventaire disponible.</p>}</div></section>
  </main>;
}
