# 21 — Background Job Queue

This module adds a safe in-memory job queue for video rendering tasks.

## Backend
- `GET /api/jobs` list jobs
- `POST /api/jobs` create and start a mock render job
- `GET /api/jobs/:id` read one job
- `POST /api/jobs/:id/retry` retry failed/cancelled jobs
- `POST /api/jobs/:id/cancel` cancel active jobs

## Frontend
- `JobMonitor.jsx` shows render progress, retry, and cancel buttons.

## Production Upgrade
Replace the in-memory store with BullMQ + Redis and connect the worker to FFmpeg.
