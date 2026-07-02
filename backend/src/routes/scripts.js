import { Router } from 'express';
import { generateScript } from '../services/scriptService.js';
const router = Router();
router.post('/', async (req, res, next) => {
  try {
    const { prompt, language = 'English', tone = 'motivational' } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });
    const script = await generateScript({ prompt, language, tone });
    res.json({ script });
  } catch (err) { next(err); }
});
export default router;
