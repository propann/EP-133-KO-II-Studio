import { AVATAR_PRESETS, Avatar } from '../components/shared/Avatar';
import type { DeviceInventory, DeviceSoundIndex } from '../core/project/device';
import type { PlayerMachine, PlayerProfile } from '../core/project/playerProfile';

interface PlayerProfilePageProps {
  profile: PlayerProfile;
  machineConnected: boolean;
  midiStatus: string;
  midiInputNames: string[];
  midiOutputNames: string[];
  machineSampleCount: number;
  deviceInventory: DeviceInventory | null;
  deviceSoundIndex: DeviceSoundIndex | null;
  onBack: () => void;
  onChange: (patch: Partial<PlayerProfile>) => void;
  onChangeMachine: (id: string, patch: Partial<PlayerMachine>) => void;
  onAddMachine: () => void;
  onRemoveMachine: (id: string) => void;
  onConnectMidi: () => void;
  onCloneMachine: () => void;
  onScanMachine: (id: string) => void;
  onViewScanReport: () => void;
  lastScanSave: { machineId: string; path: string; at: string } | null;
  scanSaveError: { machineId: string; message: string } | null;
  scanSaveMachineId: string;
  sampleFolderName: string;
  sampleFolderNeedsReconnect: boolean;
  onOpenSampleFolder: () => void;
  onReconnectSampleFolder: () => void;
  localLibraryFolderName: string;
  localLibraryNeedsReconnect: boolean;
  onOpenLocalLibraryFolder: () => void;
  onReconnectLocalLibraryFolder: () => void;
  onResetStats: () => void;
}

const activeSpec = (avatarId: string) => AVATAR_PRESETS.find((spec) => spec.id === avatarId) || AVATAR_PRESETS[0];

/**
 * Fiche personnage — identité du joueur, machines EP-133 déclarées (le scan,
 * le clone et le dossier de travail se lancent d'ici) et bilan cumulé sur
 * toutes les sessions. Module de l'écosystème Studio (accessible depuis
 * l'accueil), pas seulement du jeu.
 *
 * SCAN et CLONE sont deux outils distincts, déjà construits ailleurs dans le
 * projet — pas de doublon ici :
 * - CLONE copie réellement projets + PCM (pont local, 20-30 min la première
 *   fois) : « CLONER » ouvre `MachineCloneDialog`, déjà entièrement
 *   fonctionnel.
 * - SCAN est l'état des lieux rapide (nombre de projets/sons, mémoire) écrit
 *   sur le disque, sans les PCM — exactement ce que `MachineCloneDialog`
 *   écrit déjà en secours quand le pont n'est pas lancé
 *   (`saveDeviceProfile` + `createDeviceClone` + `writeCloneManifest`),
 *   juste déclenché d'un clic ici plutôt que de rouvrir la fenêtre de clone.
 */
export function PlayerProfilePage({ profile, machineConnected, midiStatus, midiInputNames, midiOutputNames, machineSampleCount, deviceInventory, deviceSoundIndex, onBack, onChange, onChangeMachine, onAddMachine, onRemoveMachine, onConnectMidi, onCloneMachine, onScanMachine, onViewScanReport, lastScanSave, scanSaveError, scanSaveMachineId, sampleFolderName, sampleFolderNeedsReconnect, onOpenSampleFolder, onReconnectSampleFolder, localLibraryFolderName, localLibraryNeedsReconnect, onOpenLocalLibraryFolder, onReconnectLocalLibraryFolder, onResetStats }: PlayerProfilePageProps) {
  const { stats } = profile;
  const totalHits = stats.perfect + stats.good + stats.miss;
  const accuracy = totalHits > 0 ? Math.round(((stats.perfect + stats.good) / totalHits) * 100) : null;
  return <main className="profile-page">
    <header className="module-header"><button onClick={onBack}>← ACCUEIL</button><div><small>ÉCOSYSTÈME STUDIO</small><h1>FICHE PERSONNAGE</h1></div><span className={profile.pseudo ? 'ready' : ''}>{profile.pseudo || 'SANS PSEUDO'}</span></header>

    <section className="profile-identity">
      <div className="profile-avatar-preview"><Avatar spec={activeSpec(profile.avatarId)} size={112} /></div>
      <div className="profile-identity-fields">
        <label>PSEUDO<input value={profile.pseudo} maxLength={24} placeholder="TON NOM DE JOUEUR" onChange={(event) => onChange({ pseudo: event.target.value })} /></label>
        <div className="profile-avatar-grid">{AVATAR_PRESETS.map((spec) => <button key={spec.id} className={spec.id === profile.avatarId ? 'active' : ''} title={spec.label} onClick={() => onChange({ avatarId: spec.id })}><Avatar spec={spec} size={40} /></button>)}</div>
      </div>
    </section>

    <section className="profile-gear">
      <h2>MACHINES DÉCLARÉES · {profile.machines.length}</h2>
      <div className="profile-machines">
        {profile.machines.map((machine) => <article className="profile-machine" key={machine.id}>
          <div className="profile-machine-fields">
            <label>NOM<input value={machine.name} maxLength={40} onChange={(event) => onChangeMachine(machine.id, { name: event.target.value })} /></label>
            <label>MÉMOIRE<select value={machine.memory} onChange={(event) => onChangeMachine(machine.id, { memory: event.target.value as PlayerMachine['memory'] })}>
              <option value="">NON DÉCLARÉE</option>
              <option value="64">64 MO</option>
              <option value="128">128 MO</option>
            </select></label>
          </div>
          <div className="profile-machine-status">
            <span className={machineConnected ? 'online' : ''}><i />{machineConnected ? 'EP‑133 CONNECTÉ' : 'NON CONNECTÉ'}</span>
            {/* Diagnostic réel du hook MIDI (useWebMidi.status) — jusqu'ici calculé
                mais affiché nulle part, y compris sur le banc de test. Dit
                précisément pourquoi ça échoue plutôt qu'un simple binaire. */}
            <small className="profile-midi-status">{midiStatus}</small>
            {midiInputNames.length > 0 && <small>ENTRÉE · {midiInputNames.join(' + ')}</small>}
            {midiOutputNames.length > 0 && <small>SORTIE · {midiOutputNames.join(' + ')}</small>}
            {machineSampleCount > 0 && <small>{machineSampleCount} ÉCHANTILLONS CHARGÉS</small>}
            {/* Retour d'info du dernier SCAN, juste à côté du statut de connexion — toujours quelque chose de visible, jamais un clic silencieux. */}
            {scanSaveMachineId === machine.id && <small className="profile-scan-pending">⋯ SAUVEGARDE EN COURS</small>}
            {scanSaveMachineId !== machine.id && lastScanSave?.machineId === machine.id && <small className="profile-scan-feedback">✓ SAUVEGARDÉ {new Date(lastScanSave.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {lastScanSave.path}</small>}
            {scanSaveMachineId !== machine.id && scanSaveError?.machineId === machine.id && <small className="profile-folder-warning">{scanSaveError.message}</small>}
          </div>
          {(deviceInventory || deviceSoundIndex) && <div className="profile-machine-scan-summary">
            <span>{deviceInventory ? `PROJET P${String(deviceInventory.project).padStart(2, '0')}` : 'PROJET —'}</span>
            <span>{deviceSoundIndex?.soundCount ?? '—'} SONS</span>
            <span>{deviceSoundIndex ? `${(deviceSoundIndex.usedBytes / 1e6).toFixed(1)} MO` : '— MO'}</span>
          </div>}
          {sampleFolderName && <div className="profile-machine-scan-summary">
            <span>DOSSIER MÉMORISÉ · {sampleFolderName}</span>
            {sampleFolderNeedsReconnect && <span className="profile-folder-warning">AUTORISATION À RENOUVELER</span>}
          </div>}
          <div className="profile-machine-actions">
            {!machineConnected && <button className="profile-connect" onClick={onConnectMidi}>CONNECTER</button>}
            <button className="profile-connect" disabled={scanSaveMachineId === machine.id} onClick={() => onScanMachine(machine.id)}>{scanSaveMachineId === machine.id ? 'SAUVEGARDE EN COURS…' : 'SCANNER · SAUVEGARDER'}</button>
            <button onClick={onViewScanReport}>RAPPORT DÉTAILLÉ</button>
            <button className="profile-scan" onClick={onCloneMachine}>CLONER</button>
            {sampleFolderNeedsReconnect
              ? <button className="profile-connect" onClick={onReconnectSampleFolder}>RECONNECTER LE DOSSIER</button>
              : <button onClick={onOpenSampleFolder}>{sampleFolderName ? 'CHANGER DE DOSSIER' : 'DOSSIER DE TRAVAIL'}</button>}
            {profile.machines.length > 1 && <button className="profile-machine-remove" onClick={() => { if (window.confirm(`Retirer « ${machine.name} » de la fiche ?`)) onRemoveMachine(machine.id); }}>RETIRER</button>}
          </div>
        </article>)}
      </div>
      <button className="profile-add-machine" onClick={onAddMachine}>+ DÉCLARER UNE AUTRE MACHINE</button>
      <p className="profile-gear-note">Le dossier de travail est mémorisé sur cet ordinateur (IndexedDB) — plus besoin de le rechoisir à chaque visite, seulement de reconfirmer l’autorisation si le navigateur la redemande. Un support de type drive/cloud est envisagé plus tard.</p>
    </section>

    <section className="profile-library">
      <h2>BIBLIOTHÈQUE PERSO</h2>
      <p className="profile-gear-note">Tes propres sons sur cet ordinateur — celui d’avant le dossier de sauvegarde machine ci-dessus. Réglé ici ; parcouru, écouté et glissé sur les pads depuis SONS &amp; TRANSFERT.</p>
      <div className="profile-machine-scan-summary">
        <span>{localLibraryFolderName ? `DOSSIER · ${localLibraryFolderName}` : 'AUCUN DOSSIER CONNECTÉ'}</span>
        {localLibraryNeedsReconnect && <span className="profile-folder-warning">AUTORISATION À RENOUVELER</span>}
      </div>
      <div className="profile-machine-actions">
        {localLibraryNeedsReconnect
          ? <button className="profile-connect" onClick={onReconnectLocalLibraryFolder}>RECONNECTER LE DOSSIER</button>
          : <button className={localLibraryFolderName ? '' : 'profile-connect'} onClick={onOpenLocalLibraryFolder}>{localLibraryFolderName ? 'CHANGER DE DOSSIER' : 'CONNECTER MA BIBLIOTHÈQUE'}</button>}
      </div>
    </section>

    <section className="profile-stats">
      <h2>BILAN CUMULÉ · {stats.sessionsPlayed} SESSION{stats.sessionsPlayed > 1 ? 'S' : ''}</h2>
      <div className="profile-stats-grid">
        <div className="profile-stat perfect"><span>PERFECT</span><b>{stats.perfect}</b></div>
        <div className="profile-stat good"><span>GOOD</span><b>{stats.good}</b></div>
        <div className="profile-stat miss"><span>MISS</span><b>{stats.miss}</b></div>
        <div className="profile-stat"><span>MEILLEUR COMBO</span><b>{stats.bestCombo}</b></div>
        <div className="profile-stat"><span>PRÉCISION</span><b>{accuracy === null ? '—' : `${accuracy}%`}</b></div>
      </div>
      <button className="profile-reset" disabled={totalHits === 0 && stats.sessionsPlayed === 0} onClick={() => { if (window.confirm('Remettre le bilan cumulé à zéro ? Le pseudo, l’avatar et les machines déclarées restent inchangés.')) onResetStats(); }}>RÉINITIALISER LE BILAN</button>
    </section>
  </main>;
}
