import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getProviderStatus, getSettings, resetSettings, updateSettings } from '../services/settingsService.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  res.json({ settings: getSettings(req.user.id) });
});

router.put('/', (req, res) => {
  const settings = updateSettings(req.user.id, req.body);
  res.json({ settings });
});

router.post('/reset', (req, res) => {
  res.json({ settings: resetSettings(req.user.id) });
});

router.get('/providers', (_req, res) => {
  res.json({ providers: getProviderStatus() });
});

export default router;
