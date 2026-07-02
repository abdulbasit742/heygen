import { Router } from 'express';
import { generateHashtags, generateHooks, optimizeCaption } from '../services/captionOptimizerService.js';

const router = Router();

router.post('/optimize', (req, res) => {
  res.json({ result: optimizeCaption(req.body) });
});

router.post('/hooks', (req, res) => {
  res.json({ hooks: generateHooks(req.body?.topic, req.body?.tone) });
});

router.post('/hashtags', (req, res) => {
  res.json({ hashtags: generateHashtags(req.body) });
});

export default router;
