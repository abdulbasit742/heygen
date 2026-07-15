const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function parseCookieHeader(value) {
  const cookies = {};
  for (const part of String(value || '').split(';')) {
    const separator = part.indexOf('=');
    if (separator < 1) continue;
    const name = part.slice(0, separator).trim();
    const raw = part.slice(separator + 1).trim();
    if (!name) continue;
    try { cookies[name] = decodeURIComponent(raw); } catch { cookies[name] = raw; }
  }
  return cookies;
}

export function extractSessionToken(headers, cookieName) {
  const cookies = parseCookieHeader(headers?.cookie);
  if (cookies[cookieName]) return { token: cookies[cookieName], source: 'cookie' };
  const authorization = String(headers?.authorization || '');
  if (authorization.startsWith('Bearer ')) return { token: authorization.slice(7).trim(), source: 'bearer' };
  return { token: '', source: 'none' };
}

export function sessionCookieOptions(config) {
  return Object.freeze({
    httpOnly: true,
    sameSite: 'lax',
    secure: Boolean(config.cookieSecure),
    path: '/',
    maxAge: config.sessionHours * 60 * 60 * 1000,
  });
}

export function isTrustedMutation({ method, origin, secFetchSite }, allowedOrigins) {
  if (SAFE_METHODS.has(String(method || 'GET').toUpperCase())) return true;
  if (String(secFetchSite || '').toLowerCase() === 'cross-site') return false;
  if (!origin) return true;
  return allowedOrigins.includes(origin);
}

export function consumeRateLimit(records, key, now, { windowMs, max }) {
  const safeKey = String(key || 'unknown').slice(0, 300);
  const current = records.get(safeKey);
  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + windowMs };
    records.set(safeKey, next);
    return { allowed: true, remaining: Math.max(0, max - 1), resetAt: next.resetAt };
  }
  current.count += 1;
  records.set(safeKey, current);
  return { allowed: current.count <= max, remaining: Math.max(0, max - current.count), resetAt: current.resetAt };
}

export function createMemoryRateLimiter({ windowMs = 15 * 60 * 1000, max = 10, key = (req) => req.ip || 'unknown', now = Date.now } = {}) {
  const records = new Map();
  return (req, res, next) => {
    const decision = consumeRateLimit(records, key(req), now(), { windowMs, max });
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(decision.remaining));
    res.setHeader('RateLimit-Reset', String(Math.ceil(decision.resetAt / 1000)));
    if (!decision.allowed) return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    return next();
  };
}
