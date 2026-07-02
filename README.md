# AI Avatar Video Studio

HeyGen-style MVP for prompt-to-video workflows. The app includes a React dashboard, Express API, auth, subscriptions, brand kit, media library, caption tools, analytics, scheduler, render job monitor, and a bundled FFmpeg render endpoint.

## What Works

- Email/password signup and login with JWT sessions
- Prompt-to-script and AI scene plan endpoints
- Avatar picker and safe avatar job placeholder
- Project creation with progress simulation
- Brand kit editor for logo, colors, fonts, and watermark settings
- Media library metadata manager
- Caption optimizer with hooks, CTAs, and hashtags
- Analytics dashboard for project and export counts
- Team workspace and invite flow
- Scheduler with mock publish flow
- Background job monitor with retry/cancel actions
- MP4 render endpoint using `ffmpeg-static`

## Quick Start

```bash
npm run install:all
copy backend\.env.example backend\.env
npm run dev
```

Frontend: http://localhost:5173

Backend: http://localhost:4000

## Build

```bash
npm run build
npm start
```

## API Notes

- `POST /api/auth/signup`
- `POST /api/projects`
- `POST /api/scripts`
- `POST /api/ai-script`
- `POST /api/render`
- `GET /api/analytics/summary`
- `GET /api/brand-kit/me`
- `POST /api/captions/optimize`
- `GET /api/jobs`

## Production Connections To Add

- Real LLM provider for scripts
- Real TTS provider such as ElevenLabs, Azure TTS, or XTTS
- Real avatar/lip-sync/video provider
- Real database persistence instead of in-memory stores
- Stripe, Paddle, Razorpay, or local payment provider webhooks
- Redis/BullMQ render workers for long-running jobs

## Safety Boundaries

This project does not include account spam automation, platform rule bypassing, fake engagement systems, or impersonation tooling.
