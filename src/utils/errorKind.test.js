import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyError, ERROR_KINDS, isRetryableKind } from './errorKind.js';
import { parseApiError } from './errorHandler.js';

const axiosError = (status, body = {}) => ({ response: { status, data: body }, request: {} });

test('no connection on the device wins over everything else', () => {
  assert.equal(classifyError(null, { online: false }), ERROR_KINDS.OFFLINE);
  assert.equal(classifyError(parseApiError(axiosError(500)), { online: false }), ERROR_KINDS.OFFLINE);
});

test('a request that never got an answer: unreachable, or a timeout', () => {
  assert.equal(classifyError(parseApiError({ request: {}, message: 'Network Error' }), { online: true }), ERROR_KINDS.UNREACHABLE);
  assert.equal(classifyError(parseApiError({ request: {}, code: 'ECONNABORTED' }), { online: true }), ERROR_KINDS.TIMEOUT);
  assert.equal(classifyError({ isNetworkError: true }, { online: true }), ERROR_KINDS.UNREACHABLE);
});

test('HTTP answers map to their own views', () => {
  const kindOf = (status) => classifyError(parseApiError(axiosError(status, { message: 'x' })), { online: true });
  assert.equal(kindOf(500), ERROR_KINDS.SERVER);
  assert.equal(kindOf(502), ERROR_KINDS.SERVER);
  assert.equal(kindOf(503), ERROR_KINDS.MAINTENANCE);
  assert.equal(kindOf(404), ERROR_KINDS.NOT_FOUND);
  assert.equal(kindOf(403), ERROR_KINDS.FORBIDDEN);
  assert.equal(kindOf(422), ERROR_KINDS.GENERIC);
  assert.equal(kindOf(409), ERROR_KINDS.GENERIC);
  assert.equal(classifyError(null, { online: true }), ERROR_KINDS.GENERIC);
  assert.equal(classifyError('plain message', { online: true }), ERROR_KINDS.GENERIC);
});

test('a server fault never shows its internal message to the person', () => {
  const parsed = parseApiError(axiosError(500, { message: 'SequelizeDatabaseError: relation "x" does not exist' }));
  assert.doesNotMatch(parsed.message, /Sequelize/);
  assert.match(parsed.message, /on our side/);
  // Everything else keeps the server's own words (they're written for people).
  assert.equal(parseApiError(axiosError(409, { message: 'That email is already in use' })).message, 'That email is already in use');
});

test('network messages say which of the three it was', () => {
  assert.match(parseApiError({ request: {}, code: 'ECONNABORTED' }).message, /too long/);
  assert.match(parseApiError({ request: {} }).message, /can.t reach the server/);
  // Re-parsing a parsed error keeps it as it was.
  const once = parseApiError({ request: {}, code: 'ECONNABORTED' });
  assert.equal(parseApiError(once), once);
});

test('only failures a retry can fix offer Try again', () => {
  assert.equal(isRetryableKind(ERROR_KINDS.OFFLINE), true);
  assert.equal(isRetryableKind(ERROR_KINDS.SERVER), true);
  assert.equal(isRetryableKind(ERROR_KINDS.NOT_FOUND), false);
  assert.equal(isRetryableKind(ERROR_KINDS.FORBIDDEN), false);
});
