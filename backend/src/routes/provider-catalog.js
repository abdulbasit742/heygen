import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getProviderCatalogItem, listProviderCatalog } from '../services/providerCatalogService.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  const recommendedOnly = req.query.recommended === 'true';
  res.json(listProviderCatalog({
    category: req.query.category,
    recommendedOnly
  }));
});

router.get('/:providerId', (req, res) => {
  const provider = getProviderCatalogItem(req.params.providerId);
  if (!provider) return res.status(404).json({ error: 'Provider not found.' });
  return res.json({ provider });
});

export default router;
