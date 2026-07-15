#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const findings = [];
const required = [
  'backend/src/config/runtimePolicy.mjs',
  'backend/src/config/runtime.js',
  'backend/src/security/sessionPolicy.mjs',
  'backend/src/middleware/auth.js',
  'backend/src/routes/auth.js',
  'backend/src/server.js',
  'frontend/src/api.js',
  'tests/runtime-policy.test.mjs',
  'tests/session-policy.test.mjs',
];

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function report(file, rule, detail) {
  findings.push({ file, rule, detail });
}

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) report(file, 'missing-file', 'required security file is missing');
}

if (!findings.length) {
  const runtime = read('backend/src/config/runtimePolicy.mjs');
  const auth = read('backend/src/middleware/auth.js');
  const authRoutes = read('backend/src/routes/auth.js');
  const server = read('backend/src/server.js');
  const client = read('frontend/src/api.js');
  const session = read('backend/src/security/sessionPolicy.mjs');
  const shareRoute = read('backend/src/routes/share.js');
  const shareService = read('backend/src/services/shareService.js');

  if (!/JWT_SECRET must be a non-placeholder secret/.test(runtime) || /process\.env\.JWT_SECRET\s*\|\|\s*['"]/.test(auth + runtime)) {
    report('backend auth', 'jwt-secret-fallback', 'JWT secret must fail closed without a hardcoded fallback');
  }
  if (!/httpOnly:\s*true/.test(session) || !/sameSite:\s*['"]lax['"]/.test(session)) {
    report('backend/src/security/sessionPolicy.mjs', 'cookie-policy', 'HttpOnly SameSite cookie policy is required');
  }
  if (!/setSessionCookie/.test(authRoutes) || /json\(\{\s*user\s*,\s*token/.test(authRoutes)) {
    report('backend/src/routes/auth.js', 'token-response', 'browser auth responses must not return bearer tokens');
  }
  if (!/createMemoryRateLimiter/.test(authRoutes) || !/\/logout/.test(authRoutes)) {
    report('backend/src/routes/auth.js', 'auth-controls', 'bounded auth attempts and logout are required');
  }
  if (!/withCredentials:\s*true/.test(client)) {
    report('frontend/src/api.js', 'cookie-client', 'Axios must send credentialed cookie requests');
  }
  if (/localStorage\.setItem\(\s*['"]auth_(?:token|user)/.test(client) || /headers\.common\.Authorization/.test(client)) {
    report('frontend/src/api.js', 'persistent-bearer', 'browser must not persist or globally attach bearer tokens');
  }
  if (/FRONTEND_URL\s*\|\|\s*['"]\*['"]/.test(server) || /origin:\s*['"]\*['"]/.test(server)) {
    report('backend/src/server.js', 'wildcard-cors', 'credentialed CORS cannot use wildcard origins');
  }
  if (!/isTrustedMutation/.test(server) || !/X-Content-Type-Options/.test(server)) {
    report('backend/src/server.js', 'request-boundary', 'mutation-origin and baseline response controls are required');
  }
  if (/reviewerEmail/.test(shareRoute + shareService) || !/reviewLimiter/.test(shareRoute)) {
    report('public share review', 'review-privacy', 'public reviews must not retain email and must be rate limited');
  }
}

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'dist', 'storage', 'data', 'generated-assets'].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else {
      const relative = path.relative(root, target).split(path.sep).join('/');
      if (entry.name.startsWith('.env') && entry.name !== '.env.example') {
        report(relative, 'populated-env', 'only environment examples may be tracked');
        continue;
      }
      if (fs.statSync(target).size > 1_500_000) continue;
      const text = fs.readFileSync(target, 'utf8');
      if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) {
        report(relative, 'private-key', 'private key material found');
      }
    }
  }
}

walk(root);

if (findings.length) {
  console.error(`Security check failed with ${findings.length} finding(s):`);
  for (const finding of findings) console.error(`- ${finding.file} [${finding.rule}]: ${finding.detail}`);
  process.exit(1);
}

console.log('Session, origin, and public-share security checks passed.');
