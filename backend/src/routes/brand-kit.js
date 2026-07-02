import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getBrandKit, updateBrandKit } from '../services/brandKitService.js';

const router = Router();

router.get('/me', requireAuth, (req, res) => {
  res.json({ brandKit: getBrandKit(req.user.id) });
});

router.put('/me', requireAuth, (req, res) => {
  const brandKit = updateBrandKit(req.user.id, req.body);
  res.json({ brandKit });
});

export default router;
