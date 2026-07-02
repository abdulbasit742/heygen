import { Router } from 'express';
import { generateVideoScript } from '../services/aiScriptGenerator.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const result = await generateVideoScript(req.body);
    res.json({ result });
  } catch (error) {
    next(error);
  }
});

export default router;
