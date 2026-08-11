/**
 * Fiche personnage du joueur — identité (pseudo, avatar), machines EP-133
 * déclarées (plusieurs possibles) et statistiques cumulées sur toutes les
 * sessions de jeu. Persistant en localStorage, indépendant d'un projet
 * Studio ou d'un exercice précis : c'est un module de l'écosystème Studio
 * (accessible depuis l'accueil), pas seulement du jeu — la fiche devient le
 * point d'entrée du scan machine et du dossier de travail (11/08).
 */
export const PLAYER_PROFILE_KEY = 'ep133-rhythm-hero:player-profile:v1';

export interface PlayerStats {
  sessionsPlayed: number;
  perfect: number;
  good: number;
  miss: number;
  bestCombo: number;
}

export interface PlayerMachine {
  id: string;
  name: string;
  memory: '' | '64' | '128';
}

export interface PlayerProfile {
  pseudo: string;
  avatarId: string;
  machines: PlayerMachine[];
  stats: PlayerStats;
}

export const emptyPlayerStats = (): PlayerStats => ({ sessionsPlayed: 0, perfect: 0, good: 0, miss: 0, bestCombo: 0 });

function randomMachineId() {
  return globalThis.crypto?.randomUUID?.() || `machine-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const emptyMachine = (): PlayerMachine => ({ id: randomMachineId(), name: 'EP-133 K.O. II', memory: '' });

export const defaultPlayerProfile = (): PlayerProfile => ({
  pseudo: '',
  avatarId: 'kick',
  machines: [emptyMachine()],
  stats: emptyPlayerStats(),
});

function readMachine(value: unknown): PlayerMachine | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Partial<PlayerMachine>;
  return {
    id: typeof record.id === 'string' && record.id ? record.id : randomMachineId(),
    name: typeof record.name === 'string' && record.name.trim() ? record.name : 'EP-133 K.O. II',
    memory: record.memory === '64' || record.memory === '128' ? record.memory : '',
  };
}

/** Relit la fiche locale ; une entrée corrompue ou absente retombe sur un profil vide plutôt que d'échouer. Convertit aussi l'ancien format à une seule machine (`gear`) vers `machines`. */
export function loadPlayerProfile(storage: Pick<Storage, 'getItem'>): PlayerProfile {
  try {
    const raw: unknown = JSON.parse(storage.getItem(PLAYER_PROFILE_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return defaultPlayerProfile();
    const value = raw as Partial<PlayerProfile> & { gear?: { model?: string; memory?: string } };
    const stats = (value.stats && typeof value.stats === 'object' ? value.stats : {}) as Partial<PlayerStats>;
    let machines = Array.isArray(value.machines) ? value.machines.map(readMachine).filter((m): m is PlayerMachine => m !== null) : [];
    if (!machines.length && value.gear && typeof value.gear === 'object') {
      // Ancien format (une seule machine sous `gear.model`/`gear.memory`).
      machines = [{ id: randomMachineId(), name: typeof value.gear.model === 'string' && value.gear.model ? value.gear.model : 'EP-133 K.O. II', memory: value.gear.memory === '64' || value.gear.memory === '128' ? value.gear.memory : '' }];
    }
    if (!machines.length) machines = [emptyMachine()];
    return {
      pseudo: typeof value.pseudo === 'string' ? value.pseudo : '',
      avatarId: typeof value.avatarId === 'string' ? value.avatarId : 'kick',
      machines,
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
