import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PHONE_EXAMPLE,
  PHONE_PARTS,
  fillPhoneParts,
  formatPhoneAsYouType,
  formatPhoneForDisplay,
  isOtherCountryPhone,
  joinPhone,
  nationalDigits,
  splitPhone,
} from './phoneFormat.js';

const EMPTY = ['', '', ''];

/** Types `keys` one at a time, the way the boxes see them (caret always at the end of the focused box). */
function typeIntoBoxes(keys) {
  let parts = EMPTY;
  let box = 0;
  for (const key of keys) {
    const result = fillPhoneParts(parts, box, parts[box] + key);
    parts = result.parts;
    box = result.box;
    if (parts[box].length === PHONE_PARTS[box].length && box < PHONE_PARTS.length - 1) box += 1;
  }
  return parts;
}

test('three boxes after +1: area code, first 3, last 4', () => {
  assert.deepEqual(
    PHONE_PARTS.map((p) => [p.key, p.length, p.placeholder]),
    [['area', 3, 'XXX'], ['exchange', 3, 'XXX'], ['line', 4, 'XXXX']]
  );
  assert.equal(PHONE_EXAMPLE, '+1 (416) 555-1234');
});

test('a value splits into its boxes and joins back as +1 (XXX) XXX-XXXX', () => {
  for (const raw of ['+14165551234', '4165551234', '(416) 555-1234', '416-555-1234', '+1 416 555 1234', '+1 (416) 555-1234']) {
    assert.deepEqual(splitPhone(raw), ['416', '555', '1234'], raw);
  }
  assert.equal(joinPhone(['416', '555', '1234']), '+1 (416) 555-1234');
  assert.deepEqual(splitPhone(''), EMPTY);
  assert.deepEqual(splitPhone(null), EMPTY);
  assert.equal(joinPhone(EMPTY), '');
});

test('a half-filled set of boxes keeps every box where it was', () => {
  // Area code not finished but the next box already typed: nothing slides left.
  const value = joinPhone(['41', '555', '']);
  assert.equal(value, '+1 (41) 555-');
  assert.deepEqual(splitPhone(value), ['41', '555', '']);
  assert.deepEqual(splitPhone(joinPhone(['', '', '1234'])), ['', '', '1234']);
});

test('typing digit by digit fills the boxes in order', () => {
  assert.deepEqual(typeIntoBoxes('4165551234'), ['416', '555', '1234']);
  // A leading 1 in the area code box is the country code, not a digit of the number.
  assert.deepEqual(typeIntoBoxes('14165551234'), ['416', '555', '1234']);
  // More than ten digits: the rest has nowhere to go.
  assert.deepEqual(typeIntoBoxes('416555123499'), ['416', '555', '1234']);
});

test('a whole number typed, pasted or autofilled into one box runs on into the next', () => {
  assert.deepEqual(fillPhoneParts(EMPTY, 0, '4165551234'), { parts: ['416', '555', '1234'], box: 2, caret: 4 });
  assert.deepEqual(fillPhoneParts(EMPTY, 0, '+1 416 555 1234').parts, ['416', '555', '1234']);
  assert.deepEqual(fillPhoneParts(['416', '', ''], 1, '5551234'), { parts: ['416', '555', '1234'], box: 2, caret: 4 });
  // A 4th digit in a full box goes to the front of the next one, like one long field.
  assert.deepEqual(fillPhoneParts(['416', '555', '1234'], 0, '4167'), { parts: ['416', '755', '5123'], box: 1, caret: 1 });
});

test('boxes take digits only', () => {
  assert.deepEqual(fillPhoneParts(EMPTY, 1, '5a5-').parts, ['', '55', '']);
  assert.deepEqual(fillPhoneParts(['416', '555', '12'], 2, '').parts, ['416', '555', '']);
});

test('another country keeps one free-format field', () => {
  assert.equal(isOtherCountryPhone('+442079460958'), true);
  assert.equal(isOtherCountryPhone('+44 20 7946 0958'), true);
  assert.equal(isOtherCountryPhone('+14165551234'), false);
  assert.equal(isOtherCountryPhone('+1 (416) 555-1234'), false);
  assert.equal(isOtherCountryPhone('4165551234'), false);
  assert.equal(isOtherCountryPhone(''), false);
  assert.equal(formatPhoneAsYouType('+442079460958'), '+44 20 7946 0958');
});

test('stored numbers display as +1 (416) 555-1234', () => {
  assert.equal(formatPhoneForDisplay('+14165551234', 'CA'), '+1 (416) 555-1234');
  // Rows saved before E.164 normalisation hold the bare national number.
  assert.equal(formatPhoneForDisplay('4165551234', 'CA'), '+1 (416) 555-1234');
  assert.equal(formatPhoneForDisplay('+12125550100', 'CA'), '+1 (212) 555-0100');
  assert.equal(formatPhoneForDisplay('+442079460958', 'CA'), '+44 20 7946 0958');
  assert.equal(formatPhoneForDisplay('', 'CA'), '');
  assert.equal(formatPhoneForDisplay(null, 'CA'), '');
});

test('any written form of a +1 number formats as +1 (416) 555-1234', () => {
  for (const raw of ['4165551234', '416-555-1234', '416.555.1234', '1 416 555 1234', '+1 416 555 1234', '+14165551234']) {
    assert.equal(formatPhoneAsYouType(raw), '+1 (416) 555-1234', raw);
  }
  assert.equal(nationalDigits('+1 (416'), '416');
});
