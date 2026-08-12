import { useEffect, useState } from 'react';
import type { DeviceInventory, DeviceSoundIndex } from '../../core/project/device';
import { createDeviceClone, loadDeviceClone, loadDeviceProfile, saveDeviceProfile, type DeviceCloneManifest } from '../../core/project/deviceProfile';
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
  const [bridgeRoot, setBridgeRoot] = useState('');
  const [cloneStatus, setCloneStatus] = useState<Record<string, unknown> | null>(null);
  const [cloneError, setCloneError] = useState('');
  // Chronologie Time Machine (ROADMAP.md, plan P2 item 5) : la vraie liste des instantanés déjà
  // pris, pas la mention statique « Prévu : … » qu'il y avait ici auparavant.
  const [manifest, setManifest] = useState<DeviceCloneManifest | null>(() => loadDeviceClone(localStorage));
  useEffect(() => {
    fetch('/bridge/health', { cache: 'no-store' }).then((response) => response.ok ? response.json() : Promise.reject()).then((value: { root: string }) => setBridgeRoot(value.root)).catch(() => setBridgeRoot(''));
  }, []);
  useEffect(() => {
    if (!cloneStatus || cloneStatus.running === false) return;
    const timer = window.setInterval(() => fetch('/bridge/clone/status', { cache: 'no-store' }).then((response) => response.json()).then(setCloneStatus).catch(() => undefined), 1000);
    return () => window.clearInterval(timer);
  }, [cloneStatus]);
  const chooseFolder = async () => {
    try {
      // readwrite explicite : c'est ici, et seulement ici, que le manifeste est écrit.
      const selected = await chooseLocalDirectory('readwrite');
      setDirectory(selected); setFolderName(selected.name); setLocalSampleCount(0);
    } catch (error) {
      if ((error as { name?: string }).name !== 'AbortError') window.alert(error instanceof Error ? error.message : 'Impossible d’ouvrir le dossier local.');
    }
  };
  const createClone = async () => {
    if (!bridgeRoot && !directory) return;
    setCloneError('');
    try {
      const profile = saveDeviceProfile(localStorage, { name, capacityMb, sampleFolderName: folderName, localSampleCount });
      const nextManifest = createDeviceClone(localStorage, profile, soundIndex?.soundCount || 0, soundIndex?.usedBytes || 0, inventory?.project || null, 'clone');
      setManifest(nextManifest);
      if (bridgeRoot) {
        const response = await fetch('/bridge/clone/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, capacityMb }) });
        if (!response.ok) {
          const value = await response.json().catch(() => ({}) as { reason?: string; error?: string });
          setCloneError(value.reason || value.error || 'Impossible de lancer le clone.');
          return;
        }
        setCloneStatus({ running: true, manifest: { progress: { phase: 'starting', current: 0, total: 9 } } });
        setCreated(true);
        return;
      }
      setWrittenPath(await writeCloneManifest(directory as LocalDirectoryHandle, name, nextManifest));
      setCreated(true);
    } catch (error) {
      setCloneError(error instanceof Error ? error.message : 'Le clonage a échoué de façon inattendue.');
    }
  };
  const statusManifest = cloneStatus?.manifest as { status?: string; progress?: { phase?: string; current?: number; total?: number; elapsedSeconds?: number; estimatedRemainingSeconds?: number }; summary?: { errorCount?: number; projectsUpdated?: number; soundsAdded?: number; soundsUpdated?: number; soundsUnchanged?: number; soundsDeleted?: number } } | undefined;
  const progress = statusManifest?.progress;
  const percent = progress?.total ? Math.round((progress.current || 0) / progress.total * 100) : 0;
  const finished = statusManifest?.status === 'complete' || statusManifest?.status === 'partial';
  const changed = (statusManifest?.summary?.soundsAdded || 0) + (statusManifest?.summary?.soundsUpdated || 0) + (statusManifest?.summary?.projectsUpdated || 0);
  return <div className="machine-clone-overlay" role="dialog" aria-modal="true" aria-labelledby="clone-title"><section className="machine-clone-dialog">
    <header><div><small>MIROIR HORS LIGNE</small><h2 id="clone-title">CLONER LA MACHINE</h2></div><button onClick={onClose}>✕</button></header>
    <p><b>PRÉVOIR 20 À 30 MINUTES POUR LE PREMIER CLONE COMPLET.</b> Ensuite, le dossier existant est comparé et seuls les changements détectés sont recopiés. Cette opération n'écrit rien sur l'EP‑133.</p>
    <div className="clone-form"><label>NOM DE LA MACHINE<input value={name} maxLength={32} onChange={(event) => setName(event.target.value.toUpperCase())} /></label><label>VERSION MÉMOIRE<select value={capacityMb} onChange={(event) => setCapacityMb(Number(event.target.value) as 64 | 128)}><option value={64}>64 MO</option><option value={128}>128 MO</option></select></label><label className="clone-folder">DOSSIER PARENT<button disabled={Boolean(bridgeRoot)} onClick={() => void chooseFolder()}>{bridgeRoot || folderName || 'CHOISIR SUR LE DISQUE DUR'}</button><span>{bridgeRoot || folderName || '…'} / clone / {name || 'NOM-MACHINE'}</span></label></div>
    <div className="clone-scope"><article><b>{soundIndex?.soundCount || 0}</b><span>SLOTS INDEXÉS</span></article><article><b>{((soundIndex?.usedBytes || 0) / 1e6).toFixed(2)} MO</b><span>MÉMOIRE OCCUPÉE</span></article><article><b>{inventory ? `P${String(inventory.project).padStart(2, '0')}` : '—'}</b><span>PROJET SCANNÉ</span></article></div>
    <div className="clone-status"><b>INSTANTANÉ INITIAL</b><span>Inventaire et sauvegarde projet prêts.</span><b>PROGRESSION</b><span>9 projets, puis 527 samples · durée mesurée lors du premier clone complet.</span><b>AUDIO</b><span>Copie complète à lancer par le pont local dans le dossier choisi.</span><b>TIME MACHINE</b><span>{manifest ? `${manifest.history.length} instantané${manifest.history.length > 1 ? 's' : ''} enregistré${manifest.history.length > 1 ? 's' : ''} — chronologie ci-dessous.` : 'Aucun instantané pour l’instant — apparaît après un SCAN (fiche personnage) ou un CLONE.'}</span></div>
    {manifest && manifest.history.length > 0 && <div className="clone-history">
      <h3>CHRONOLOGIE · {manifest.history.length} INSTANTANÉ{manifest.history.length > 1 ? 'S' : ''}</h3>
      <ul>{[...manifest.history].reverse().map((entry, index) => <li key={`${entry.createdAt}-${index}`}>
        <b className={`clone-history-kind ${entry.kind}`}>{entry.kind === 'clone' ? 'CLONE' : 'SCAN'}</b>
        <span>{new Date(entry.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
        <small>{entry.label}</small>
      </li>)}</ul>
      <p className="clone-history-note">Chronologie et comparaison locales seulement — pas de retour arrière ni de restauration matérielle : ça nécessiterait un checkpoint et une écriture confirmée sur l’EP‑133, non disponibles ici.</p>
    </div>}
    {cloneStatus && <div className="clone-progress"><div><span style={{ width: `${percent}%` }} /></div><b>{String(progress?.phase || 'DÉMARRAGE').toUpperCase()} · {progress?.current || 0}/{progress?.total || 0} · {percent}%</b><small>ÉCOULÉ {Math.round(progress?.elapsedSeconds || 0)} S · RESTANT ≈ {Math.round(progress?.estimatedRemainingSeconds || 0)} S</small>{finished && <strong>{statusManifest?.status === 'complete' ? 'SYNCHRONISATION TERMINÉE' : 'SYNCHRONISATION PARTIELLE'} · {changed} CHANGEMENT(S) · {statusManifest.summary?.soundsUnchanged || 0} SONS INCHANGÉS · {statusManifest.summary?.soundsDeleted || 0} SLOT(S) ABSENT(S) · {statusManifest.summary?.errorCount || 0} ERREUR(S)</strong>}</div>}
    {cloneError && <p className="clone-error">{cloneError}</p>}
    {created && !cloneStatus && <p className="clone-created">MANIFESTE ÉCRIT SUR LE PC : {writtenPath} · AUCUNE ÉCRITURE MACHINE</p>}
    <footer><button onClick={onClose}>FERMER</button><button className="clone-create" disabled={!name.trim() || (!directory && !bridgeRoot) || !soundIndex || cloneStatus?.running === true} onClick={() => void createClone()}>{cloneStatus?.running ? 'CLONAGE EN COURS…' : bridgeRoot ? 'LANCER LE CLONE COMPLET' : created ? 'RÉÉCRIRE L’INSTANTANÉ' : 'CRÉER SUR LE DISQUE DUR'}</button></footer>
  </section></div>;
}
