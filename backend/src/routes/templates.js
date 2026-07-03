import { Router } from 'express';
import { listTemplates } from '../services/templateService.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ templates: listTemplates() });
});

export default router;
