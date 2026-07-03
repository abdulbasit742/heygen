import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { generateVoiceover, listVoices } from '../services/voiceoverService.js';

const router = Router();

router.use(requireAuth);

router.get('/voices', (req, res) => {
  res.json({ voices: listVoices({ language: req.query.language }) });
});

router.post('/preview', async (req, res, next) => {
  try {
    const voiceover = await generateVoiceover({
      script: req.body.script || req.body.text || 'Preview voiceover for your AI avatar video.',
      title: req.body.title || 'Voice preview',
      voiceId: req.body.voiceId,
      language: req.body.language,
      durationSeconds: req.body.durationSeconds || 5
    });
    res.status(201).json({ voiceover });
  } catch (error) {
    next(error);
  }
});

export default router;
