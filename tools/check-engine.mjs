import assert from 'node:assert/strict';
import { classifyHit, emptyScore, scoreHit } from '../src/core/engine/scoring.ts';
import { barsAfterStepEdit, measureFromGlobalStep, usedBars } from '../src/core/project/editor.ts';
import { adviseTempo, buildPadReport } from '../src/core/engine/report.ts';

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

const sessionNotes = [
  { pad: 0, grade: 'PERFECT', deltaMs: 5 },
  { pad: 0, grade: 'GOOD', deltaMs: -60 },
  { pad: 0, grade: 'MISS', deltaMs: Infinity },
  { pad: 2, grade: 'MISS', deltaMs: Infinity },
  { pad: 2, grade: 'MISS', deltaMs: Infinity },
  { pad: 4, grade: 'PERFECT', deltaMs: -10 },
];
const padReport = buildPadReport(sessionNotes);
assert.equal(padReport.length, 3, 'un pad jamais joué ne doit pas apparaître');
assert.equal(padReport[0].pad, 2, 'le pad le plus fautif (2 MISS) doit passer en premier');
assert.equal(padReport[0].miss, 2);
assert.equal(padReport[0].averageDeltaMs, null, 'aucune frappe jugeable pour un pad tout en MISS');
const padZero = padReport.find((entry) => entry.pad === 0);
assert.equal(padZero.hits, 3);
assert.equal(padZero.perfect, 1);
assert.equal(padZero.good, 1);
assert.equal(padZero.miss, 1);
assert.equal(Math.round(padZero.averageDeltaMs), -27, 'moyenne signée des seules frappes jugées (5 et -60), pas du MISS');
assert.deepEqual(buildPadReport([]), [], 'aucune frappe -> aucune ligne, jamais une exception');

assert.equal(adviseTempo({ perfect: 0, good: 0, miss: 0 }).direction, 'garder', 'pas assez de données -> pas de conseil');
assert.equal(adviseTempo({ perfect: 2, good: 3, miss: 5 }).direction, 'reduire', '50% de MISS doit inviter à ralentir');
assert.equal(adviseTempo({ perfect: 18, good: 1, miss: 0 }).direction, 'augmenter', '95% PERFECT doit inviter à accélérer');
assert.equal(adviseTempo({ perfect: 8, good: 8, miss: 4 }).direction, 'garder', 'ni trop propre ni trop fautif -> pas de conseil forcé');

console.log('Score et extension automatique des partitions : OK');
