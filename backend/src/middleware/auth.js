import jwt from 'jsonwebtoken';
import { getUserById } from '../services/userStore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

export function signSession(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, plan: user.plan },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ error: 'Login required.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = getUserById(payload.sub);

    if (!user) {
      return res.status(401).json({ error: 'Invalid session.' });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }
}
