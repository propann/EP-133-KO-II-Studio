import { AVATAR_PRESETS, Avatar } from '../components/shared/Avatar';
import type { PlayerProfile } from '../core/project/playerProfile';

interface PlayerProfilePageProps {
  profile: PlayerProfile;
  machineConnected: boolean;
  onBack: () => void;
  onChange: (patch: Partial<PlayerProfile>) => void;
  onChangeGear: (patch: Partial<PlayerProfile['gear']>) => void;
  onResetStats: () => void;
}

const activeSpec = (avatarId: string) => AVATAR_PRESETS.find((spec) => spec.id === avatarId) || AVATAR_PRESETS[0];

/**
 * Fiche personnage — identité du joueur, matériel déclaré et bilan cumulé
 * sur toutes les sessions. Module de l'écosystème Studio (accessible
 * depuis l'accueil), pas seulement du jeu.
 */
export function PlayerProfilePage({ profile, machineConnected, onBack, onChange, onChangeGear, onResetStats }: PlayerProfilePageProps) {
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
      <h2>MATOS DÉCLARÉ</h2>
      <div className="profile-gear-grid">
        <label>MODÈLE<input value={profile.gear.model} maxLength={40} onChange={(event) => onChangeGear({ model: event.target.value })} /></label>
        <label>MÉMOIRE<select value={profile.gear.memory} onChange={(event) => onChangeGear({ memory: event.target.value as PlayerProfile['gear']['memory'] })}>
          <option value="">NON DÉCLARÉE</option>
          <option value="64">64 MO</option>
          <option value="128">128 MO</option>
        </select></label>
        <div className="profile-gear-status"><small>CONNEXION</small><span className={machineConnected ? 'online' : ''}><i />{machineConnected ? 'EP‑133 CONNECTÉ' : 'NON CONNECTÉ'}</span></div>
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
      <button className="profile-reset" disabled={totalHits === 0 && stats.sessionsPlayed === 0} onClick={() => { if (window.confirm('Remettre le bilan cumulé à zéro ? Le pseudo, l’avatar et le matos déclaré restent inchangés.')) onResetStats(); }}>RÉINITIALISER LE BILAN</button>
    </section>
  </main>;
}
