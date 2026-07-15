import assert from 'node:assert/strict';
import test from 'node:test';
import { loadRuntimeConfig, normalizeOrigin, parseAllowedOrigins } from '../backend/src/config/runtimePolicy.mjs';

test('requires a non-placeholder JWT secret', () => {
  assert.throws(() => loadRuntimeConfig({ JWT_SECRET: 'dev_secret_change_me' }), /JWT_SECRET/);
  assert.throws(() => loadRuntimeConfig({ JWT_SECRET: 'short' }), /JWT_SECRET/);
});

test('uses localhost only as a development origin default', () => {
  assert.deepEqual(parseAllowedOrigins('', 'development'), ['http://localhost:5173']);
  assert.throws(() => parseAllowedOrigins('', 'production'), /required/);
});

test('normalizes and deduplicates explicit origins', () => {
  assert.deepEqual(parseAllowedOrigins('https://studio.example,https://studio.example/'), ['https://studio.example']);
});

test('rejects origin paths and credentials', () => {
  assert.throws(() => normalizeOrigin('https://example.com/path'), /path/);
  assert.throws(() => normalizeOrigin('https://user:pass@example.com'), /credentials/);
});

test('loads bounded session and port settings', () => {
  const config = loadRuntimeConfig({
    NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(48), FRONTEND_URL: 'https://studio.example',
    SESSION_HOURS: '999', PORT: '99999', SESSION_COOKIE_SECURE: 'true',
  });
  assert.equal(config.sessionHours, 168);
  assert.equal(config.port, 65535);
  assert.equal(config.cookieSecure, true);
});
