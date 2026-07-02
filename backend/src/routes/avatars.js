import { Router } from 'express';
import { buildAvatarJob, getAvatarById, listAvatars } from '../services/avatarService.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    avatars: listAvatars({
      language: req.query.language,
      type: req.query.type
    })
  });
});

router.get('/:id', (req, res) => {
  const avatar = getAvatarById(req.params.id);
  if (!avatar) return res.status(404).json({ error: 'Avatar not found.' });
  return res.json({ avatar });
});

router.post('/job', (req, res, next) => {
  try {
    const job = buildAvatarJob(req.body);
    res.status(201).json({ job });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
