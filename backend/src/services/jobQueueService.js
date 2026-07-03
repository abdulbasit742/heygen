import crypto from 'crypto';
import { loadMap, saveMap } from './jsonFileStore.js';

const STORE_FILE = 'jobs.json';
const jobs = loadMap(STORE_FILE);

function persistJobs() {
  saveMap(STORE_FILE, jobs);
}

const VALID_STATUSES = ['queued', 'processing', 'completed', 'failed', 'cancelled'];

function now() {
  return new Date().toISOString();
}

function safePercent(value) {
  const number = Number(value || 0);
  return Math.max(0, Math.min(100, number));
}

export function createJob(ownerId, input = {}) {
  const id = crypto.randomUUID();
  const job = {
    id,
    ownerId,
    type: input.type || 'video_render',
    title: input.title || 'Untitled render job',
    projectId: input.projectId || null,
    status: 'queued',
    progress: 0,
    attempts: 0,
    maxAttempts: input.maxAttempts || 3,
    payload: input.payload || {},
    result: null,
    error: null,
    createdAt: now(),
    updatedAt: now()
  };

  jobs.set(id, job);
  persistJobs();
  return job;
}

export function listJobs({ ownerId, status } = {}) {
  return [...jobs.values()]
    .filter(job => !ownerId || job.ownerId === ownerId)
    .filter(job => !status || job.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getJob(id, ownerId) {
  const job = jobs.get(id);
  if (!job) return null;
  if (ownerId && job.ownerId !== ownerId) return null;
  return job;
}

export function updateJob(id, patch = {}) {
  const existing = jobs.get(id);
  if (!existing) return null;

  const nextStatus = patch.status && VALID_STATUSES.includes(patch.status)
    ? patch.status
    : existing.status;

  const updated = {
    ...existing,
    ...patch,
    status: nextStatus,
    progress: patch.progress === undefined ? existing.progress : safePercent(patch.progress),
    updatedAt: now()
  };

  jobs.set(id, updated);
  persistJobs();
  return updated;
}

export function startMockJob(id) {
  const job = getJob(id);
  if (!job || job.status === 'cancelled') return job;

  updateJob(id, {
    status: 'processing',
    progress: 15,
    attempts: job.attempts + 1
  });

  setTimeout(() => {
    const current = getJob(id);
    if (!current || current.status === 'cancelled') return;
    updateJob(id, { status: 'processing', progress: 45 });
  }, 700);

  setTimeout(() => {
    const current = getJob(id);
    if (!current || current.status === 'cancelled') return;
    updateJob(id, { status: 'processing', progress: 75 });
  }, 1400);

  setTimeout(() => {
    const current = getJob(id);
    if (!current || current.status === 'cancelled') return;
    updateJob(id, {
      status: 'completed',
      progress: 100,
      result: {
        exportUrl: `/exports/${id}.mp4`,
        message: 'Mock render completed. Connect FFmpeg worker for real MP4 output.'
      }
    });
  }, 2200);

  return getJob(id);
}

export function retryJob(id, ownerId) {
  const job = getJob(id, ownerId);
  if (!job) return null;
  if (job.attempts >= job.maxAttempts) {
    return updateJob(id, { status: 'failed', error: 'Max retry attempts reached.' });
  }

  updateJob(id, {
    status: 'queued',
    progress: 0,
    error: null,
    result: null
  });

  return startMockJob(id);
}

export function cancelJob(id, ownerId) {
  const job = getJob(id, ownerId);
  if (!job) return null;
  if (['completed', 'failed'].includes(job.status)) return job;
  return updateJob(id, { status: 'cancelled', progress: 0 });
}
