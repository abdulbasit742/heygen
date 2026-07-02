import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  cancelJob,
  createJob,
  getJob,
  listJobs,
  retryJob,
  startMockJob
} from '../services/jobQueueService.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const jobs = listJobs({ ownerId: req.user.id, status: req.query.status });
  res.json({ jobs });
});

router.post('/', (req, res) => {
  const job = createJob(req.user.id, req.body);
  startMockJob(job.id);
  res.status(201).json({ job: getJob(job.id, req.user.id) });
});

router.get('/:id', (req, res) => {
  const job = getJob(req.params.id, req.user.id);
  if (!job) return res.status(404).json({ error: 'Job not found.' });
  return res.json({ job });
});

router.post('/:id/retry', (req, res) => {
  const job = retryJob(req.params.id, req.user.id);
  if (!job) return res.status(404).json({ error: 'Job not found.' });
  return res.json({ job });
});

router.post('/:id/cancel', (req, res) => {
  const job = cancelJob(req.params.id, req.user.id);
  if (!job) return res.status(404).json({ error: 'Job not found.' });
  return res.json({ job });
});

export default router;
