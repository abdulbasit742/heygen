const PLACEHOLDER_SECRETS = new Set([
  'dev_secret_change_me',
  'change_this_to_a_long_random_secret',
  'replace_me',
  'secret',
]);

function boundedInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === '') return fallback;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new Error('boolean environment value must be true or false');
}

export function normalizeOrigin(value) {
  let url;
  try {
    url = new URL(String(value || '').trim());
  } catch {
    throw new Error(`Invalid frontend origin: ${value}`);
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Frontend origins must use HTTP or HTTPS');
  if (url.username || url.password || url.search || url.hash) throw new Error('Frontend origins cannot include credentials, query, or hash');
  if (url.pathname !== '/' && url.pathname !== '') throw new Error('Frontend origins must not include a path');
  return url.origin;
}

export function parseAllowedOrigins(value, nodeEnv = 'development') {
  const entries = String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
  if (!entries.length && nodeEnv !== 'production') return ['http://localhost:5173'];
  if (!entries.length) throw new Error('FRONTEND_URL or FRONTEND_ORIGINS is required in production');
  return [...new Set(entries.map(normalizeOrigin))];
}

export function loadRuntimeConfig(env = process.env) {
  const nodeEnv = String(env.NODE_ENV || 'development').trim().toLowerCase();
  const jwtSecret = String(env.JWT_SECRET || '').trim();
  if (jwtSecret.length < 32 || PLACEHOLDER_SECRETS.has(jwtSecret.toLowerCase())) {
    throw new Error('JWT_SECRET must be a non-placeholder secret of at least 32 characters');
  }
  const frontendOrigins = parseAllowedOrigins(env.FRONTEND_ORIGINS || env.FRONTEND_URL, nodeEnv);
  const sessionHours = boundedInteger(env.SESSION_HOURS, 12, 1, 168);
  return Object.freeze({
    nodeEnv,
    port: boundedInteger(env.PORT, 4000, 1, 65535),
    jwtSecret,
    jwtIssuer: 'heygen-clone',
    jwtAudience: 'heygen-frontend',
    sessionHours,
    sessionCookieName: 'heygen_session',
    cookieSecure: nodeEnv === 'production' ? true : parseBoolean(env.SESSION_COOKIE_SECURE, false),
    frontendOrigins,
    jsonLimit: String(env.JSON_BODY_LIMIT || '512kb'),
  });
}
