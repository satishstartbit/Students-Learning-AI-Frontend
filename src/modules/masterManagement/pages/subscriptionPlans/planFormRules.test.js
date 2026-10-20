import test from 'node:test';
import assert from 'node:assert/strict';
import { familySizeProblem, minimumProblem, planPayload, priceProblem, trialProblem } from './planFormRules.js';

test('students and parents: a whole number, at least 1', () => {
  assert.equal(familySizeProblem('1'), null);
  assert.equal(familySizeProblem(4), null);
  assert.match(familySizeProblem('0'), /1 or more/);
  assert.match(familySizeProblem('2.5'), /whole number/);
  assert.equal(familySizeProblem(''), null, 'blank is the required rule’s job');
});

test('trial days 0-365; price 0 or a chargeable amount', () => {
  assert.equal(trialProblem('0'), null);
  assert.match(trialProblem('366'), /0 to 365/);
  assert.equal(priceProblem('0'), null);
  assert.match(priceProblem('0.25'), /at least 0\.50/);
});

test('minimum amount: 0 or chargeable, never above the price', () => {
  assert.equal(minimumProblem('0', { price: '70' }), null);
  assert.equal(minimumProblem('20', { price: '70' }), null);
  assert.equal(minimumProblem('70', { price: '70' }), null, 'equal to the price is fine');
  assert.match(minimumProblem('80', { price: '70' }), /more than the price/);
  assert.match(minimumProblem('0.3', { price: '70' }), /at least 0\.50/);
  assert.match(minimumProblem('-1', { price: '70' }), /0 or more/);
});

test('payload: numbers for every required field', () => {
  assert.deepEqual(planPayload({ price: '70', minimumAmount: '20', trialDays: '0', maxStudents: '3', maxParents: '2' }), {
    price: 70,
    minimumAmount: 20,
    trialDays: 0,
    maxStudents: 3,
    maxParents: 2,
  });
});
