import { useState } from 'react';
import { midiNoteName } from '../core/project/exporters';
import type { DeviceInventory, DeviceSoundIndex } from '../core/project/device';
import { loadDeviceProfile, saveDeviceProfile } from '../core/project/deviceProfile';

interface SoundsPageProps {
  inventory: DeviceInventory | null;
  soundIndex: DeviceSoundIndex | null;
  midiConnected: boolean;
  onBack: () => void;
  onConnectMidi: () => void;
}

export function SoundsPage({ inventory, soundIndex, midiConnected, onBack, onConnectMidi }: SoundsPageProps) {
  const existingProfile = loadDeviceProfile(localStorage);
  const [deviceName, setDeviceName] = useState(existingProfile?.name || 'MON EP-133');
  const [capacityMb, setCapacityMb] = useState<64 | 128>(existingProfile?.capacityMb || 64);
  const [sampleFolderName, setSampleFolderName] = useState(existingProfile?.sampleFolderName || '');
  const [localSampleCount, setLocalSampleCount] = useState(existingProfile?.localSampleCount || 0);
  const [profileSaved, setProfileSaved] = useState(Boolean(existingProfile));
  const usedMb = (soundIndex?.usedBytes || 0) / 1e6;
  const usedPercent = Math.min(100, usedMb / capacityMb * 100);
  const saveProfile = () => {
    saveDeviceProfile(localStorage, { name: deviceName, capacityMb, sampleFolderName, localSampleCount });
    setProfileSaved(true);
  };
  const chooseFolder = (files: FileList | null) => {
    const list = files ? [...files] : [];
    const firstPath = list[0]?.webkitRelativePath || '';
    setSampleFolderName(firstPath.split('/')[0] || 'DOSSIER SAMPLES');
    setLocalSampleCount(list.length);
    setProfileSaved(false);
  };
  return <main className="sound-library-page">
    <header className="module-header"><button onClick={onBack}>← ACCUEIL</button><div><small>MODULE 03</small><h1>SONS & TRANSFERT EP‑133</h1></div><span className={soundIndex ? 'ready' : ''}>{soundIndex ? `MIROIR · ${soundIndex.soundCount} SONS` : 'AUCUN SCAN'}</span></header>
    <section className="device-profile"><div><small>PROFIL DE LA MACHINE</small><h2>{profileSaved ? deviceName : 'PREMIÈRE CONNEXION'}</h2></div><label>NOM<input value={deviceName} maxLength={32} onChange={(event) => { setDeviceName(event.target.value.toUpperCase()); setProfileSaved(false); }} /></label><label>MÉMOIRE DÉCLARÉE<select value={capacityMb} onChange={(event) => { setCapacityMb(Number(event.target.value) as 64 | 128); setProfileSaved(false); }}><option value={64}>64 MO</option><option value={128}>128 MO</option></select></label><label className="sample-folder">DOSSIER SAMPLES<input type="file" multiple {...({ webkitdirectory: '', directory: '' } as Record<string, string>)} onChange={(event) => chooseFolder(event.currentTarget.files)} /><span>{sampleFolderName || 'AUCUN DOSSIER'} · {localSampleCount} FICHIER(S)</span></label><button onClick={saveProfile}>ENREGISTRER LE PROFIL</button></section>
    <section className="sound-library-summary"><div><b>{soundIndex?.soundCount || 0}</b><small>SONS SUR LA MACHINE</small></div><div><b>{usedMb.toFixed(2)} MO</b><small>OCCUPÉS / {capacityMb} MO DÉCLARÉS</small><i><span style={{ width: `${usedPercent}%` }} /></i></div><div><b>{inventory?.pads.length || 0}</b><small>PADS DU PROJET {inventory?.project || '—'}</small></div><button onClick={onConnectMidi}>{midiConnected ? 'MIDI CONNECTÉ ✓' : 'CONNECTER EP‑133'}</button></section>
    <section className="sound-transfer-zone"><div><small>TRANSFERT SÉCURISÉ</small><h2>PRÉPARER UN NOUVEAU SON</h2><p>Le transfert écrira dans la mémoire globale de la machine. La prochaine étape ajoutera la conversion 46 875 Hz, la pré-écoute, le choix d’un emplacement libre et une confirmation explicite avant toute écriture.</p><button disabled>＋ IMPORTER WAV — BIENTÔT</button></div><aside><b>AUCUNE ÉCRITURE AUTOMATIQUE</b><span>Un emplacement occupé ne sera jamais remplacé sans validation.</span></aside></section>
    <section className="sound-inventory"><header><h2>INVENTAIRE GLOBAL</h2><span>{soundIndex?.soundCount || 0} SLOTS OCCUPÉS · MÉTADONNÉES EN MIROIR</span></header><div>{soundIndex?.sounds.map((sound) => <article key={sound.slot}><b>{sound.slot.toString().padStart(3, '0')}</b><div><strong>{sound.fileName}</strong><small>{(sound.bytes / 1000).toFixed(1)} KO · AUDIO LOCAL {sampleFolderName ? 'À RAPPROCHER' : 'ABSENT'}</small></div></article>) || <p>Aucun inventaire global disponible.</p>}</div></section>
    <section className="sound-inventory project-pads"><header><h2>PADS DU PROJET</h2><span>NOMS ET PARAMÈTRES LUS SUR LA MACHINE</span></header><div>{inventory?.pads.map((pad) => { const sound = inventory.sounds[String(pad.slot)]; return <article key={`${pad.group}-${pad.pad}`}><b>{pad.group}{pad.pad.toString().padStart(2, '0')}</b><div><strong>{sound?.name || `SON ${pad.slot}`}</strong><small>SLOT {pad.slot} · {pad.playMode === 1 ? 'KEYS' : pad.playMode === 2 ? 'LEGATO' : 'ONE'} · ROOT {midiNoteName(pad.rootNote)}</small></div></article>; }) || <p>Aucun inventaire disponible.</p>}</div></section>
  </main>;
}
