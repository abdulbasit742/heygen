import assert from 'node:assert/strict';
import test from 'node:test';
import { consumeRateLimit, extractSessionToken, isTrustedMutation, parseCookieHeader, sessionCookieOptions } from '../backend/src/security/sessionPolicy.mjs';

test('parses cookies without accepting malformed fragments', () => {
  assert.deepEqual(parseCookieHeader('a=1; session=hello%20world; invalid'), { a: '1', session: 'hello world' });
});

test('prefers the HttpOnly cookie token over bearer fallback', () => {
  assert.deepEqual(extractSessionToken({ cookie: 'heygen_session=cookie-token', authorization: 'Bearer api-token' }, 'heygen_session'), { token: 'cookie-token', source: 'cookie' });
});

test('keeps bearer compatibility for non-browser API clients', () => {
  assert.deepEqual(extractSessionToken({ authorization: 'Bearer api-token' }, 'heygen_session'), { token: 'api-token', source: 'bearer' });
});

test('builds HttpOnly SameSite cookie options', () => {
  assert.deepEqual(sessionCookieOptions({ cookieSecure: true, sessionHours: 12 }), {
    httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 43_200_000,
  });
});

test('allows safe methods and same-origin mutations', () => {
  const allowed = ['https://studio.example'];
  assert.equal(isTrustedMutation({ method: 'GET', origin: 'https://evil.example' }, allowed), true);
  assert.equal(isTrustedMutation({ method: 'POST', origin: 'https://studio.example' }, allowed), true);
});

test('blocks cross-site and unapproved browser mutations', () => {
  const allowed = ['https://studio.example'];
  assert.equal(isTrustedMutation({ method: 'POST', origin: 'https://evil.example' }, allowed), false);
  assert.equal(isTrustedMutation({ method: 'POST', secFetchSite: 'cross-site' }, allowed), false);
});

test('rate limiter resets after its window', () => {
  const records = new Map();
  assert.equal(consumeRateLimit(records, 'ip', 0, { windowMs: 1000, max: 2 }).allowed, true);
  assert.equal(consumeRateLimit(records, 'ip', 10, { windowMs: 1000, max: 2 }).allowed, true);
  assert.equal(consumeRateLimit(records, 'ip', 20, { windowMs: 1000, max: 2 }).allowed, false);
  assert.equal(consumeRateLimit(records, 'ip', 1001, { windowMs: 1000, max: 2 }).allowed, true);
});
