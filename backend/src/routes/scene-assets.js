import { Router } from 'express';
import { createSceneAssetJobs } from '../services/sceneAssetService.js';

const router = Router();

router.post('/', (req, res, next) => {
  try {
    const scenes = Array.isArray(req.body?.scenes) ? req.body.scenes : [];
    const assets = createSceneAssetJobs({ scenes, style: req.body?.style });
    res.status(201).json({ assets });
  } catch (error) {
    next(error);
  }
});

export default router;
