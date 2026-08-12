import assert from 'node:assert/strict';
import { classifyHit, emptyScore, scoreHit } from '../src/core/engine/scoring.ts';
import { barsAfterStepEdit, measureFromGlobalStep, nudgeSelectedNotes, stepKeyFromBeat, usedBars } from '../src/core/project/editor.ts';
import { adviseTempo, buildPadReport } from '../src/core/engine/report.ts';
import { buildPracticePlan } from '../src/core/engine/practicePlan.ts';

assert.equal(classifyHit(0, 35, 90), 'PERFECT');
assert.equal(classifyHit(-35, 35, 90), 'PERFECT');
assert.equal(classifyHit(36, 35, 90), 'GOOD');
assert.equal(classifyHit(-90, 35, 90), 'GOOD');
assert.equal(classifyHit(91, 35, 90), 'MISS');

const exercise = {
  id: 'test', title: 'TEST', description: '', bpm: 120, bars: 1,
  grading: { perfectMs: 35, goodMs: 90 },
  targets: [{ id: 'first', beat: 1, pad: 0 }, { id: 'second', beat: 1.5, pad: 0 }],
};
const targets = exercise.targets.map((target) => ({ ...target }));
const perfect = scoreHit(exercise, { pad: 0, velocity: 100, timestamp: 0 }, 1.1, targets, emptyScore());
assert.equal(perfect.grade, 'GOOD');
assert.equal(Math.round(perfect.deltaMs), 50);
assert.equal(perfect.target?.id, 'first');
assert.equal(targets[0].hit, true);
assert.equal(perfect.score.combo, 1);
assert.equal(perfect.score.hits, 1);

const second = scoreHit(exercise, { pad: 0, velocity: 100, timestamp: 0 }, 1.5, targets, perfect.score);
assert.equal(second.target?.id, 'second', 'une cible déjà jouée ne doit pas être réutilisée');
assert.equal(second.score.combo, 2);
assert.equal(second.score.maxCombo, 2);

const miss = scoreHit(exercise, { pad: 7, velocity: 100, timestamp: 0 }, 1.5, targets, second.score);
assert.equal(miss.grade, 'MISS');
assert.equal(miss.score.combo, 0);
assert.equal(miss.score.maxCombo, 2);
assert.equal(miss.score.hits, 2, 'un MISS ne doit pas compter comme frappe précise');
assert.equal(miss.confusedPad, null, 'aucune cible non jouée à proximité -> pas de confusion signalée');

// « Pad confondu » (12 août, REGISTRE_IDEES.md Q-07 partie non couverte au 12 août) :
// une cible non jouée sur un AUTRE pad à proximité doit être signalée sur un MISS.
const confusionExercise = {
  id: 'confusion', title: 'CONFUSION', description: '', bpm: 120, bars: 1,
  grading: { perfectMs: 35, goodMs: 90 },
  targets: [{ id: 'ride-target', beat: 1, pad: 5 }],
};
const confusionTargets = confusionExercise.targets.map((target) => ({ ...target }));
// Frappe sur le pad 0 (KICK), à 10ms de la cible RIDE (pad 5) -> dans la fenêtre GOOD.
const confused = scoreHit(confusionExercise, { pad: 0, velocity: 100, timestamp: 0 }, 1.02, confusionTargets, emptyScore());
assert.equal(confused.grade, 'MISS', 'aucune cible sur le pad 0 lui-même -> MISS');
assert.equal(confused.confusedPad, 5, 'une cible RIDE non jouée à 10ms doit être détectée comme confusion');
assert.equal(confusionTargets[0].hit, undefined, 'la cible confondue ne doit jamais être marquée jouée — elle reste disponible pour une vraie frappe');

// Hors fenêtre GOOD (200ms) : pas de confusion signalée, juste un MISS sec.
const tooFar = scoreHit(confusionExercise, { pad: 0, velocity: 100, timestamp: 0 }, 1.4, confusionTargets, emptyScore());
assert.equal(tooFar.grade, 'MISS');
assert.equal(tooFar.confusedPad, null, 'cible hors fenêtre GOOD -> pas de confusion');

assert.equal(measureFromGlobalStep(0), 0);
assert.equal(measureFromGlobalStep(15), 0);
assert.equal(measureFromGlobalStep(16), 1);
assert.equal(barsAfterStepEdit(2, 0, false), 2, 'écrire avant la réserve ne doit pas agrandir');
assert.equal(barsAfterStepEdit(2, 1, false), 3, 'écrire dans la réserve ajoute une mesure');
assert.equal(barsAfterStepEdit(2, 1, true), 2, 'supprimer une note existante ne doit pas agrandir');
assert.equal(barsAfterStepEdit(2, 4, false), 6, 'une édition distante conserve une mesure vide après elle');
assert.equal(usedBars([]), 1);
assert.equal(usedBars([{ beat: 0 }, { beat: 3.75 }]), 1);
assert.equal(usedBars([{ beat: 4 }]), 2);

// Multi-sélection + nudge (plan P1/P2, REGISTRE_IDEES.md E-15/E-18).
assert.equal(stepKeyFromBeat(0, 0), '0:0:0');
assert.equal(stepKeyFromBeat(1, 0), '0:0:4', 'battement 1 = mesure 0, pas 4 (1 temps = 4 pas de 1/4)');
assert.equal(stepKeyFromBeat(4, 0), '1:0:0', 'battement 4 = début de la mesure 1');
assert.equal(stepKeyFromBeat(4.25, 2), '1:2:1');

assert.equal(nudgeSelectedNotes([{ id: 'a', group: 'A', beat: 0, pad: 0, velocity: 100, duration: 0.25 }], new Set(), 1), null, 'sélection vide -> rien ne bouge');
assert.equal(nudgeSelectedNotes([{ id: 'a', group: 'A', beat: 0, pad: 0, velocity: 100, duration: 0.25 }], new Set(['0:0:0']), 0), null, 'delta nul -> rien ne bouge');

const simpleNudge = nudgeSelectedNotes(
  [{ id: 'a', group: 'A', beat: 0, pad: 0, velocity: 100, duration: 0.25 }],
  new Set(['0:0:0']),
  1,
);
assert.equal(simpleNudge.notes[0].beat, 0.25, 'un pas vers la droite = +1/4 de temps');
assert.deepEqual([...simpleNudge.selectedKeys], ['0:0:1'], 'la clé de sélection suit la note déplacée');

const blockedNudge = nudgeSelectedNotes(
  [{ id: 'a', group: 'A', beat: 0, pad: 0, velocity: 100, duration: 0.25 }],
  new Set(['0:0:0']),
  -1,
);
assert.equal(blockedNudge, null, 'un déplacement qui sortirait de la grille (mesure < 0) ne doit rien changer, pas même partiellement');

const twoNotesNudge = nudgeSelectedNotes(
  [
    { id: 'a', group: 'A', beat: 0, pad: 0, velocity: 100, duration: 0.25 },
    { id: 'b', group: 'A', beat: 1, pad: 0, velocity: 100, duration: 0.25 },
  ],
  new Set(['0:0:0', '0:0:4']),
  1,
);
assert.deepEqual(twoNotesNudge.notes.map((note) => note.beat).sort(), [0.25, 1.25], 'les deux notes gardent leur écart relatif (1 temps) après le déplacement');

const overwriteNudge = nudgeSelectedNotes(
  [
    { id: 'moving', group: 'A', beat: 0, pad: 0, velocity: 100, duration: 0.25 },
    { id: 'still', group: 'A', beat: 0.25, pad: 0, velocity: 50, duration: 0.5 },
  ],
  new Set(['0:0:0']),
  1,
);
assert.equal(overwriteNudge.notes.length, 1, 'la note déplacée remplace la note immobile déjà présente à la position d’arrivée, jamais de doublon');
assert.equal(overwriteNudge.notes[0].id, 'moving', 'la note déplacée doit gagner, pas celle qui était déjà là');

const sessionNotes = [
  { pad: 0, grade: 'PERFECT', deltaMs: 5 },
  { pad: 0, grade: 'GOOD', deltaMs: -60 },
  { pad: 0, grade: 'MISS', deltaMs: Infinity, confusedPad: 5 },
  { pad: 2, grade: 'MISS', deltaMs: Infinity, confusedPad: 5 },
  { pad: 2, grade: 'MISS', deltaMs: Infinity, confusedPad: 5 },
  { pad: 4, grade: 'PERFECT', deltaMs: -10 },
];
const padReport = buildPadReport(sessionNotes);
assert.equal(padReport.length, 3, 'un pad jamais joué ne doit pas apparaître');
assert.equal(padReport[0].pad, 2, 'le pad le plus fautif (2 MISS) doit passer en premier');
assert.equal(padReport[0].miss, 2);
assert.equal(padReport[0].averageDeltaMs, null, 'aucune frappe jugeable pour un pad tout en MISS');
assert.equal(padReport[0].confusedWithPad, 5, 'les deux MISS du pad 2 pointent vers le pad 5 -> signalé');
assert.equal(padReport[0].confusedCount, 2);
const padZero = padReport.find((entry) => entry.pad === 0);
assert.equal(padZero.hits, 3);
assert.equal(padZero.perfect, 1);
assert.equal(padZero.good, 1);
assert.equal(padZero.miss, 1);
assert.equal(Math.round(padZero.averageDeltaMs), -27, 'moyenne signée des seules frappes jugées (5 et -60), pas du MISS');
assert.equal(padZero.confusedWithPad, null, 'un seul MISS confondu -> sous le seuil de bruit, pas signalé');
assert.equal(padZero.confusedCount, 0);
const padFour = padReport.find((entry) => entry.pad === 4);
assert.equal(padFour.confusedWithPad, null, 'aucun MISS sur ce pad -> pas de confusion possible');
assert.deepEqual(buildPadReport([]), [], 'aucune frappe -> aucune ligne, jamais une exception');

assert.equal(adviseTempo({ perfect: 0, good: 0, miss: 0 }).direction, 'garder', 'pas assez de données -> pas de conseil');
assert.equal(adviseTempo({ perfect: 2, good: 3, miss: 5 }).direction, 'reduire', '50% de MISS doit inviter à ralentir');
assert.equal(adviseTempo({ perfect: 18, good: 1, miss: 0 }).direction, 'augmenter', '95% PERFECT doit inviter à accélérer');
assert.equal(adviseTempo({ perfect: 8, good: 8, miss: 4 }).direction, 'garder', 'ni trop propre ni trop fautif -> pas de conseil forcé');

// Parcours 7/30 jours (rotation de styles + répétition sur MISS > 25%).
const styles = ['a', 'b', 'c'];
const today = '2026-08-12';

assert.deepEqual(buildPracticePlan([], [], 7, today), [], 'aucun style dédié -> aucun parcours, pas une exception');

const emptyLogPlan = buildPracticePlan([], styles, 4, today);
assert.deepEqual(emptyLogPlan.map((day) => day.status), ['today', 'upcoming', 'upcoming', 'upcoming']);
assert.deepEqual(emptyLogPlan.map((day) => day.styleId), ['a', 'b', 'c', 'a'], 'rotation simple sur les styles dédiés, aucune séance jouée');
assert.deepEqual(emptyLogPlan.map((day) => day.difficulty), [1, 1, 1, 2], 'un tour complet de la rotation augmente la difficulté');
assert.equal(emptyLogPlan[3].date, '2026-08-15');

const cleanSession = [{ date: today, styleId: 'a', difficulty: 1, perfect: 9, good: 1, miss: 0 }];
const cleanPlan = buildPracticePlan(cleanSession, styles, 3, today);
assert.equal(cleanPlan[0].status, 'done');
assert.equal(cleanPlan[0].repeat, false);
assert.deepEqual(cleanPlan[0].result, { perfect: 9, good: 1, miss: 0 });
assert.deepEqual(cleanPlan.slice(1).map((day) => day.styleId), ['b', 'c'], 'une séance propre avance la rotation sans répéter');

const missedSession = [{ date: today, styleId: 'a', difficulty: 1, perfect: 1, good: 1, miss: 8 }];
const repeatPlan = buildPracticePlan(missedSession, styles, 4, today);
assert.equal(repeatPlan[1].repeat, true, '80% de MISS la veille doit déclencher une répétition');
assert.equal(repeatPlan[1].styleId, 'a');
assert.equal(repeatPlan[1].difficulty, 1, 'répète au même niveau, ne réduit pas la difficulté');
assert.equal(repeatPlan[2].repeat, false, 'le jour non joué qui suit une répétition ne propage pas de répétition supplémentaire');
assert.deepEqual(repeatPlan.slice(2).map((day) => day.styleId), ['b', 'c'], 'la rotation reprend là où elle s’était arrêtée après la répétition');

console.log('Score et extension automatique des partitions : OK');
