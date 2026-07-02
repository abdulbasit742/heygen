import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'ai-avatar-video-backend',
    version: '0.2.0',
    timestamp: new Date().toISOString()
  });
});

export default router;
