import { useState } from 'react';
import type { DeviceInventory, DeviceSoundIndex } from '../../core/project/device';
import { createDeviceClone, loadDeviceProfile, saveDeviceProfile } from '../../core/project/deviceProfile';
import { chooseLocalDirectory, writeCloneManifest, type LocalDirectoryHandle } from '../../core/storage/localFolders';

interface MachineCloneDialogProps {
  inventory: DeviceInventory | null;
  soundIndex: DeviceSoundIndex | null;
  onClose: () => void;
}

export function MachineCloneDialog({ inventory, soundIndex, onClose }: MachineCloneDialogProps) {
  const existing = loadDeviceProfile(localStorage);
  const [name, setName] = useState(existing?.name || 'MON EP-133');
  const [capacityMb, setCapacityMb] = useState<64 | 128>(existing?.capacityMb || 64);
  const [folderName, setFolderName] = useState(existing?.sampleFolderName || '');
  const [localSampleCount, setLocalSampleCount] = useState(existing?.localSampleCount || 0);
  const [created, setCreated] = useState(false);
  const [directory, setDirectory] = useState<LocalDirectoryHandle | null>(null);
  const [writtenPath, setWrittenPath] = useState('');
  const chooseFolder = async () => {
    try {
      const selected = await chooseLocalDirectory();
      setDirectory(selected); setFolderName(selected.name); setLocalSampleCount(0);
    } catch (error) {
      if ((error as { name?: string }).name !== 'AbortError') window.alert(error instanceof Error ? error.message : 'Impossible d’ouvrir le dossier local.');
    }
  };
  const createClone = async () => {
    if (!directory) return;
    const profile = saveDeviceProfile(localStorage, { name, capacityMb, sampleFolderName: folderName, localSampleCount });
    const manifest = createDeviceClone(localStorage, profile, soundIndex?.soundCount || 0, soundIndex?.usedBytes || 0, inventory?.project || null);
    setWrittenPath(await writeCloneManifest(directory, name, manifest));
    setCreated(true);
  };
  return <div className="machine-clone-overlay" role="dialog" aria-modal="true" aria-labelledby="clone-title"><section className="machine-clone-dialog">
    <header><div><small>MIROIR HORS LIGNE</small><h2 id="clone-title">CLONER LA MACHINE</h2></div><button onClick={onClose}>✕</button></header>
    <p>Crée une base locale de référence. Cette étape n'écrit rien sur l'EP‑133.</p>
    <div className="clone-form"><label>NOM DE LA MACHINE<input value={name} maxLength={32} onChange={(event) => setName(event.target.value.toUpperCase())} /></label><label>VERSION MÉMOIRE<select value={capacityMb} onChange={(event) => setCapacityMb(Number(event.target.value) as 64 | 128)}><option value={64}>64 MO</option><option value={128}>128 MO</option></select></label><label className="clone-folder">DOSSIER PARENT<button onClick={() => void chooseFolder()}>{folderName || 'CHOISIR SUR LE DISQUE DUR'}</button><span>{folderName || '…'} / clone / {name || 'NOM-MACHINE'}</span></label></div>
    <div className="clone-scope"><article><b>{soundIndex?.soundCount || 0}</b><span>SLOTS INDEXÉS</span></article><article><b>{((soundIndex?.usedBytes || 0) / 1e6).toFixed(2)} MO</b><span>MÉMOIRE OCCUPÉE</span></article><article><b>{inventory ? `P${String(inventory.project).padStart(2, '0')}` : '—'}</b><span>PROJET SCANNÉ</span></article></div>
    <div className="clone-status"><b>INSTANTANÉ INITIAL</b><span>Inventaire et sauvegarde projet prêts.</span><b>AUDIO</b><span>Copie complète à lancer plus tard par le pont local dans le dossier choisi.</span><b>TIME MACHINE</b><span>Prévu : instantanés datés, différences, retour arrière et restauration.</span></div>
    {created && <p className="clone-created">MANIFESTE ÉCRIT SUR LE PC : {writtenPath} · AUCUNE ÉCRITURE MACHINE</p>}
    <footer><button onClick={onClose}>FERMER</button><button className="clone-create" disabled={!name.trim() || !directory || !soundIndex} onClick={() => void createClone()}>{created ? 'RÉÉCRIRE L’INSTANTANÉ' : 'CRÉER SUR LE DISQUE DUR'}</button></footer>
  </section></div>;
}
