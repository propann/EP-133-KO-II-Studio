import assert from 'node:assert/strict';
import { classifyHit, emptyScore, scoreHit } from '../src/core/engine/scoring.ts';
import { barsAfterStepEdit, measureFromGlobalStep, usedBars } from '../src/core/project/editor.ts';

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

console.log('Score et extension automatique des partitions : OK');
