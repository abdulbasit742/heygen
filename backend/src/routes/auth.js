import { Router } from 'express';
import { requireAuth, signSession } from '../middleware/auth.js';
import { createUser, verifyUser } from '../services/userStore.js';

const router = Router();

router.post('/signup', async (req, res, next) => {
  try {
    const user = await createUser(req.body);
    const token = signSession(user);
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const user = await verifyUser(req.body.email, req.body.password);

    if (!user) {
      return res.status(401).json({ error: 'Wrong email or password.' });
    }

    const token = signSession(user);
    return res.json({ user, token });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
