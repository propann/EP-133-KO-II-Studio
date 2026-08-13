import assert from 'node:assert/strict';
import { normalizePlayerProfile, defaultPlayerProfile, loadPlayerProfile, savePlayerProfile } from '../src/core/project/playerProfile.ts';

// Couvre normalizePlayerProfile, extrait le 13 août pour être réutilisé à la
// fois par loadPlayerProfile (localStorage) et par la restauration depuis
// profile.json (dossier de travail, App.tsx) — même format, deux origines.

// 1) Entrée absente/corrompue : jamais d'exception, profil vide par défaut.
for (const bad of [null, undefined, 42, 'texte', []]) {
  const result = normalizePlayerProfile(bad);
  assert.equal(result.pseudo, '');
  assert.equal(result.avatarId, 'kick');
  assert.equal(result.machines.length, 1);
}

// 2) Ancien format à une seule machine (`gear.model`/`gear.memory`) converti vers `machines`.
const legacy = normalizePlayerProfile({ pseudo: 'JOUEUR', gear: { model: 'MA MACHINE', memory: '128' } });
assert.equal(legacy.machines.length, 1);
assert.equal(legacy.machines[0].name, 'MA MACHINE');
assert.equal(legacy.machines[0].memory, '128');

// 3) Profil valide : round-trip fidèle (rien perdu, rien inventé).
const valid = {
  pseudo: 'ENZO',
  avatarId: 'snare',
  machines: [{ id: 'm1', name: 'STUDIO', memory: '64' }],
  stats: { sessionsPlayed: 3, perfect: 10, good: 5, miss: 2, bestCombo: 42 },
};
const normalized = normalizePlayerProfile(valid);
assert.equal(normalized.pseudo, 'ENZO');
assert.equal(normalized.avatarId, 'snare');
assert.deepEqual(normalized.machines, valid.machines);
assert.deepEqual(normalized.stats, valid.stats);

// 4) Stats corrompues (NaN/texte) retombent sur 0, jamais un NaN propagé à l'affichage.
const corruptStats = normalizePlayerProfile({ stats: { sessionsPlayed: 'beaucoup', perfect: NaN } });
assert.equal(corruptStats.stats.sessionsPlayed, 0);
assert.equal(corruptStats.stats.perfect, 0);
assert.equal(Number.isFinite(corruptStats.stats.sessionsPlayed), true);

// 5) loadPlayerProfile/savePlayerProfile (localStorage) : round-trip via un stockage en mémoire.
// (defaultPlayerProfile() génère un id de machine aléatoire à chaque appel —
// on compare le pseudo/avatarId, pas l'objet entier, pour ne pas dépendre de cet id.)
const memoryStorage = (() => {
  const store = new Map();
  return { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
})();
const empty = loadPlayerProfile(memoryStorage);
assert.equal(empty.pseudo, defaultPlayerProfile().pseudo);
assert.equal(empty.avatarId, defaultPlayerProfile().avatarId);
savePlayerProfile(memoryStorage, normalized);
assert.deepEqual(loadPlayerProfile(memoryStorage), normalized);

console.log('Fiche personnage : normalisation, ancien format, round-trip localStorage : OK');
