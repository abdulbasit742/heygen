import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { addMedia, deleteMedia, getMediaById, listMedia } from '../services/mediaLibraryService.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const media = listMedia({
    ownerId: req.user.id,
    category: req.query.category,
    type: req.query.type
  });

  res.json({ media });
});

router.post('/', requireAuth, (req, res, next) => {
  try {
    const media = addMedia(req.user.id, req.body);
    res.status(201).json({ media });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', requireAuth, (req, res) => {
  const media = getMediaById(req.params.id);
  if (!media) return res.status(404).json({ error: 'Media item not found.' });
  if (media.ownerId !== 'system' && media.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'You cannot access this media item.' });
  }
  return res.json({ media });
});

router.delete('/:id', requireAuth, (req, res) => {
  const deleted = deleteMedia(req.user.id, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Media item not found or cannot be deleted.' });
  return res.json({ ok: true });
});

export default router;
