/**
 * Fiche personnage du joueur — identité (pseudo, avatar), matériel déclaré
 * et statistiques cumulées sur toutes les sessions de jeu. Persistant en
 * localStorage, indépendant d'un projet Studio ou d'un exercice précis :
 * c'est un module de l'écosystème Studio (accessible depuis l'accueil),
 * pas seulement du jeu.
 */
export const PLAYER_PROFILE_KEY = 'ep133-rhythm-hero:player-profile:v1';

export interface PlayerStats {
  sessionsPlayed: number;
  perfect: number;
  good: number;
  miss: number;
  bestCombo: number;
}

export interface PlayerGear {
  model: string;
  memory: '' | '64' | '128';
}

export interface PlayerProfile {
  pseudo: string;
  avatarId: string;
  gear: PlayerGear;
  stats: PlayerStats;
}

export const emptyPlayerStats = (): PlayerStats => ({ sessionsPlayed: 0, perfect: 0, good: 0, miss: 0, bestCombo: 0 });

export const defaultPlayerProfile = (): PlayerProfile => ({
  pseudo: '',
  avatarId: 'kick',
  gear: { model: 'EP-133 K.O. II', memory: '' },
  stats: emptyPlayerStats(),
});

/** Relit la fiche locale ; une entrée corrompue ou absente retombe sur un profil vide plutôt que d'échouer. */
export function loadPlayerProfile(storage: Pick<Storage, 'getItem'>): PlayerProfile {
  try {
    const raw: unknown = JSON.parse(storage.getItem(PLAYER_PROFILE_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return defaultPlayerProfile();
    const value = raw as Partial<PlayerProfile>;
    const gear = (value.gear && typeof value.gear === 'object' ? value.gear : {}) as Partial<PlayerGear>;
    const stats = (value.stats && typeof value.stats === 'object' ? value.stats : {}) as Partial<PlayerStats>;
    return {
      pseudo: typeof value.pseudo === 'string' ? value.pseudo : '',
      avatarId: typeof value.avatarId === 'string' ? value.avatarId : 'kick',
      gear: { model: typeof gear.model === 'string' ? gear.model : 'EP-133 K.O. II', memory: gear.memory === '64' || gear.memory === '128' ? gear.memory : '' },
      stats: {
        sessionsPlayed: Number.isFinite(stats.sessionsPlayed) ? Number(stats.sessionsPlayed) : 0,
        perfect: Number.isFinite(stats.perfect) ? Number(stats.perfect) : 0,
        good: Number.isFinite(stats.good) ? Number(stats.good) : 0,
        miss: Number.isFinite(stats.miss) ? Number(stats.miss) : 0,
        bestCombo: Number.isFinite(stats.bestCombo) ? Number(stats.bestCombo) : 0,
      },
    };
  } catch {
    return defaultPlayerProfile();
  }
}

export function savePlayerProfile(storage: Pick<Storage, 'setItem'>, profile: PlayerProfile) {
  storage.setItem(PLAYER_PROFILE_KEY, JSON.stringify(profile));
}

/** Cumule le bilan d'une session qui vient de se terminer dans la fiche — appelé une fois au STOP, jamais pendant la lecture. */
export function addSessionToProfile(profile: PlayerProfile, session: { perfect: number; good: number; miss: number; maxCombo: number }): PlayerProfile {
  if (session.perfect + session.good + session.miss === 0) return profile;
  return {
    ...profile,
    stats: {
      sessionsPlayed: profile.stats.sessionsPlayed + 1,
      perfect: profile.stats.perfect + session.perfect,
      good: profile.stats.good + session.good,
      miss: profile.stats.miss + session.miss,
      bestCombo: Math.max(profile.stats.bestCombo, session.maxCombo),
    },
  };
}
