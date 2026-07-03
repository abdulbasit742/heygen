import { Router } from 'express';
import { renderVideo } from '../services/renderService.js';
const router = Router();
router.post('/', async (req, res, next) => {
  try {
    const { script, title = 'ai-video', brandKit, voiceover } = req.body;
    if (!script) return res.status(400).json({ error: 'script is required' });
    const result = await renderVideo({ script, title, brandKit, voiceover });
    res.json(result);
  } catch (err) { next(err); }
});
export default router;
