import { AVATAR_PRESETS, Avatar } from '../components/shared/Avatar';
import type { DeviceInventory, DeviceSoundIndex } from '../core/project/device';
import type { PlayerMachine, PlayerProfile } from '../core/project/playerProfile';

interface PlayerProfilePageProps {
  profile: PlayerProfile;
  machineConnected: boolean;
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
  onViewScanReport: () => void;
  sampleFolderName: string;
  sampleFolderNeedsReconnect: boolean;
  onOpenSampleFolder: () => void;
  onReconnectSampleFolder: () => void;
  onResetStats: () => void;
}

const activeSpec = (avatarId: string) => AVATAR_PRESETS.find((spec) => spec.id === avatarId) || AVATAR_PRESETS[0];

/**
 * Fiche personnage — identité du joueur, machines EP-133 déclarées (le clone
 * et le dossier de travail se lancent d'ici) et bilan cumulé sur toutes les
 * sessions. Module de l'écosystème Studio (accessible depuis l'accueil),
 * pas seulement du jeu.
 *
 * SCAN et CLONE sont deux outils distincts, déjà construits ailleurs dans
 * le projet — pas de doublon ici :
 * - le scan (`tools/scan_ep133_readonly.py` côté machine) alimente
 *   `deviceInventory`/`deviceSoundIndex`, déjà chargés par App.tsx et déjà
 *   détaillés dans Sons & Transfert. « SCANNER » affiche juste le résumé et
 *   renvoie vers ce rapport complet, sans le reconstruire.
 * - le clone (`tools/clone_ep133_readonly.py` + pont local) copie
 *   réellement projets/PCM/métadonnées ; « CLONER » ouvre `MachineCloneDialog`,
 *   déjà entièrement fonctionnel.
 */
export function PlayerProfilePage({ profile, machineConnected, machineSampleCount, deviceInventory, deviceSoundIndex, onBack, onChange, onChangeMachine, onAddMachine, onRemoveMachine, onConnectMidi, onCloneMachine, onViewScanReport, sampleFolderName, sampleFolderNeedsReconnect, onOpenSampleFolder, onReconnectSampleFolder, onResetStats }: PlayerProfilePageProps) {
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
          <div className="profile-machine-status"><span className={machineConnected ? 'online' : ''}><i />{machineConnected ? 'EP‑133 CONNECTÉ' : 'NON CONNECTÉ'}</span>{machineSampleCount > 0 && <small>{machineSampleCount} ÉCHANTILLONS CHARGÉS</small>}</div>
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
            <button onClick={onViewScanReport}>SCANNER · RAPPORT</button>
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
