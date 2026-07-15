import { Router } from 'express';
import { clearSessionCookie, requireAuth, setSessionCookie } from '../middleware/auth.js';
import { createMemoryRateLimiter } from '../security/sessionPolicy.mjs';
import { createUser, verifyUser } from '../services/userStore.js';

const router = Router();
const authLimiter = createMemoryRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  key: (req) => `${req.ip || 'unknown'}:${String(req.body?.email || '').trim().toLowerCase().slice(0, 254)}`,
});

router.post('/signup', authLimiter, async (req, res) => {
  try {
    const user = await createUser(req.body);
    setSessionCookie(res, user);
    return res.status(201).json({ user });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Signup failed.' });
  }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const user = await verifyUser(req.body?.email, req.body?.password);
    if (!user) return res.status(401).json({ error: 'Wrong email or password.' });
    setSessionCookie(res, user);
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', (_req, res) => {
  clearSessionCookie(res);
  return res.status(204).end();
});

router.get('/me', requireAuth, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  return res.json({ user: req.user });
});

export default router;
