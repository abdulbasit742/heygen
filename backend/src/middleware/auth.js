import jwt from 'jsonwebtoken';
import { getRuntimeConfig } from '../config/runtime.js';
import { extractSessionToken, sessionCookieOptions } from '../security/sessionPolicy.mjs';
import { getUserById } from '../services/userStore.js';

export function signSession(user) {
  const config = getRuntimeConfig();
  return jwt.sign(
    { sub: user.id },
    config.jwtSecret,
    {
      expiresIn: `${config.sessionHours}h`,
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    },
  );
}

export function setSessionCookie(res, user) {
  const config = getRuntimeConfig();
  res.cookie(config.sessionCookieName, signSession(user), sessionCookieOptions(config));
}

export function clearSessionCookie(res) {
  const config = getRuntimeConfig();
  const { maxAge: _maxAge, ...options } = sessionCookieOptions(config);
  res.clearCookie(config.sessionCookieName, options);
}

export function requireAuth(req, res, next) {
  const config = getRuntimeConfig();
  const { token, source } = extractSessionToken(req.headers, config.sessionCookieName);
  if (!token) return res.status(401).json({ error: 'Login required.' });

  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    });
    const user = getUserById(payload.sub);
    if (!user) return res.status(401).json({ error: 'Invalid session.' });
    req.user = user;
    req.authSource = source;
    return next();
  } catch {
    if (source === 'cookie') clearSessionCookie(res);
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }
}
