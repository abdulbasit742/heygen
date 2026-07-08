import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getProviderCatalogItem, getProviderSetup, listProviderCatalog } from '../services/providerCatalogService.js';
import { createProviderWorkerJob } from '../services/providerWorkerJobService.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  const recommendedOnly = req.query.recommended === 'true';
  res.json(listProviderCatalog({
    category: req.query.category,
    recommendedOnly
  }));
});

router.get('/:providerId/setup', (req, res) => {
  const setup = getProviderSetup(req.params.providerId);
  if (!setup) return res.status(404).json({ error: 'Provider not found.' });
  return res.json(setup);
});

router.post('/:providerId/jobs', (req, res) => {
  try {
    const job = createProviderWorkerJob(req.user.id, req.params.providerId, req.body);
    return res.status(201).json({ job });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Provider worker job create failed.' });
  }
});

router.get('/:providerId', (req, res) => {
  const provider = getProviderCatalogItem(req.params.providerId);
  if (!provider) return res.status(404).json({ error: 'Provider not found.' });
  return res.json({ provider });
});

export default router;
