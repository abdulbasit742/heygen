import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  cancelScheduledPost,
  createScheduledPost,
  getScheduledPost,
  getSupportedPlatforms,
  listScheduledPosts,
  markPostPublished,
  updateScheduledPost
} from '../services/schedulerService.js';

const router = Router();

router.use(requireAuth);

router.get('/platforms', (_req, res) => {
  res.json({ platforms: getSupportedPlatforms() });
});

router.get('/', (req, res) => {
  const posts = listScheduledPosts({
    ownerId: req.user.id,
    status: req.query.status,
    platform: req.query.platform
  });

  res.json({ posts });
});

router.post('/', (req, res, next) => {
  try {
    const post = createScheduledPost(req.user.id, req.body);
    res.status(201).json({ post });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', (req, res) => {
  const post = getScheduledPost(req.params.id);
  if (!post || post.ownerId !== req.user.id) return res.status(404).json({ error: 'Scheduled post not found.' });
  return res.json({ post });
});

router.put('/:id', (req, res) => {
  const post = getScheduledPost(req.params.id);
  if (!post || post.ownerId !== req.user.id) return res.status(404).json({ error: 'Scheduled post not found.' });
  return res.json({ post: updateScheduledPost(req.params.id, req.body) });
});

router.post('/:id/cancel', (req, res) => {
  const post = getScheduledPost(req.params.id);
  if (!post || post.ownerId !== req.user.id) return res.status(404).json({ error: 'Scheduled post not found.' });
  return res.json({ post: cancelScheduledPost(req.params.id) });
});

router.post('/:id/mock-publish', (req, res) => {
  const post = getScheduledPost(req.params.id);
  if (!post || post.ownerId !== req.user.id) return res.status(404).json({ error: 'Scheduled post not found.' });

  return res.json({
    post: markPostPublished(req.params.id, {
      provider: 'mock-publisher',
      message: 'Official platform API integration placeholder.'
    })
  });
});

export default router;
