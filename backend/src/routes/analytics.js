import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getAnalyticsSummary } from '../services/analyticsService.js';

const router = Router();

router.get('/summary', requireAuth, (req, res) => {
  res.json({ analytics: getAnalyticsSummary(req.user.id) });
});

export default router;
