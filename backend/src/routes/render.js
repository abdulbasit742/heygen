import { Router } from 'express';
import { renderVideo } from '../services/renderService.js';
const router = Router();
router.post('/', async (req, res, next) => {
  try {
    const { script, title = 'ai-video' } = req.body;
    if (!script) return res.status(400).json({ error: 'script is required' });
    const result = await renderVideo({ script, title });
    res.json(result);
  } catch (err) { next(err); }
});
export default router;
