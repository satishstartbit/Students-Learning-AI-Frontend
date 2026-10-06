import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMailingAddress, isCanadianCountry, normalizeAddressText, normalizeStreetLine } from './address.js';

test('street line: Canada Post form, matching the backend rules', () => {
  assert.equal(normalizeStreetLine('Apt. 309, 11211 85 Street North-West'), '309-11211 85 ST NW');
  assert.equal(normalizeStreetLine('123 Main St., Apt 4'), '4-123 MAIN ST');
  assert.equal(normalizeStreetLine('123 Main Street West'), '123 MAIN ST W');
  assert.equal(normalizeStreetLine('123 Avenue Road'), '123 AVENUE RD');
  assert.equal(normalizeStreetLine('P.O. Box 123 Stn A'), 'PO BOX 123 STN A');
  assert.equal(normalizeStreetLine('309-11211 85 ST NW'), '309-11211 85 ST NW');
});

test('text lines: upper case without commas, periods or "#"', () => {
  assert.equal(normalizeAddressText("St. John's"), "ST JOHN'S");
  assert.equal(normalizeAddressText('ABC Company, Inc.'), 'ABC COMPANY INC');
});

test('Canada: empty country and the usual spellings', () => {
  assert.equal(isCanadianCountry(''), true);
  assert.equal(isCanadianCountry('canada'), true);
  assert.equal(isCanadianCountry('CA'), true);
  assert.equal(isCanadianCountry('United States'), false);
});

test('mailing block: the Canada Post example', () => {
  const address = { addressLine2: 'ABC Company', address: '123 Main Street West', city: 'Toronto', state: 'ON', postalCode: 'm5v2h1', country: 'Canada' };
  assert.deepEqual(formatMailingAddress(address, { recipient: 'John Doe' }), [
    'JOHN DOE',
    'ABC COMPANY',
    '123 MAIN ST W',
    'TORONTO ON  M5V 2H1',
  ]);
  assert.deepEqual(formatMailingAddress(address, { recipient: 'John Doe', international: true }).at(-1), 'CANADA');
});

test('mailing block: missing parts are skipped, nothing to print gives []', () => {
  assert.deepEqual(formatMailingAddress({ city: 'Regina', state: 'SK', country: 'Canada' }), ['REGINA SK']);
  assert.deepEqual(formatMailingAddress({ postalCode: 'S4P 3Y2' }), ['S4P 3Y2']);
  assert.deepEqual(formatMailingAddress({ country: 'Canada' }, { recipient: 'Jane' }), []);
  assert.deepEqual(formatMailingAddress(null), []);
});

test('mailing block: another country prints its name last and keeps its own words', () => {
  const lines = formatMailingAddress({ address: '1600 Pennsylvania Ave., N.W.', city: 'Washington', state: 'DC', postalCode: '20500', country: 'United States' });
  assert.deepEqual(lines, ['1600 PENNSYLVANIA AVE NW', 'WASHINGTON DC  20500', 'UNITED STATES']);
});
