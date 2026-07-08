# AI Avatar Video Studio

HeyGen-style MVP for prompt-to-video workflows. The app includes a React dashboard, Express API, auth, subscriptions, brand kit, media library, caption tools, analytics, scheduler, render job monitor, and a bundled FFmpeg render endpoint.

## What Works

- Email/password signup and login with JWT sessions
- Prompt-to-script and AI scene plan endpoints
- Ready-made templates for motivation reels, ads, explainers, and agency pitches
- Avatar picker and safe avatar job placeholder
- Project creation with generated script, scenes, render job tracking, and MP4 export
- Project retry and render job linkage
- Voice preset API with generated mock TTS WAV audio and manifest per project
- Final MP4 export muxes generated voiceover into an AAC audio track
- Auto captions, hashtags, and export metadata saved per project
- Production pack saved per project with avatar job, voiceover manifest, scene assets, and export checklist
- Scene generator creates provider-safe SVG storyboard thumbnails plus asset manifests
- Export package manifest download and one-click scheduling from completed projects
- Full ZIP export bundle with MP4, subtitles, voiceover files, storyboard assets, script, captions, and manifest
- Revocable public share pages for completed exports
- Share analytics with active links, statuses, and public view counts
- Client review approvals and change requests from public share pages
- Brand-aware renders with saved colors, subtitle styling, and watermark metadata
- Brand kit editor for logo, colors, fonts, subtitle styling, and watermark settings
- Media library metadata manager
- Caption optimizer with hooks, CTAs, and hashtags
- Client folders for organizing projects, exports, and campaign work
- Provider catalog for vetted voice, avatar, lip-sync, and render integrations
- Analytics dashboard for project and export counts
- Team workspace and invite flow
- Scheduler with mock publish flow
- Background job monitor with retry/cancel actions
- MP4 render endpoint using `ffmpeg-static`

## Quick Start

Requirements:

- Node.js 20.19+ or 22.12+

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
- `POST /api/projects/:id/retry`
- `GET /api/projects/:id/export`
- `GET /api/projects/:id/package`
- `GET /api/projects/:id/bundle`
- `POST /api/projects/:id/schedule`
- `POST /api/projects/:id/share`
- `DELETE /api/projects/:id/share`
- `GET /api/share/:token`
- `POST /api/share/:token/review`
- `GET /share/:token`
- `GET /api/client-folders`
- `POST /api/client-folders`
- `POST /api/client-folders/:folderId/projects`
- `GET /api/provider-catalog`
- `GET /api/provider-catalog/:providerId/setup`
- `DELETE /api/projects/:id`
- `GET /api/templates`
- `GET /api/voiceover/voices`
- `POST /api/voiceover/preview`
- `POST /api/scene-assets`
- `POST /api/scripts`
- `POST /api/ai-script`
- `POST /api/render`
- `GET /api/analytics/summary`
- `GET /api/brand-kit/me`
- `POST /api/captions/optimize`
- `GET /api/jobs`

## Local Persistence

The backend stores MVP data in JSON files under `backend/data` by default. This keeps users, projects, subscriptions, brand kits, media metadata, jobs, settings, workspaces, and scheduled posts available after a restart while keeping setup simple.

Rendered videos and subtitles are written to `backend/storage` and served from `/media`.

## Production Connections To Add

- Real LLM provider for scripts
- Replace mock TTS audio with a real TTS provider such as Piper, Coqui TTS, ElevenLabs, Azure TTS, or a licensed XTTS/F5-TTS model
- Real avatar/lip-sync/video provider such as SadTalker, MuseTalk, or a licensed hosted lip-sync API
- Production database persistence such as PostgreSQL or Supabase
- Stripe, Paddle, Razorpay, or local payment provider webhooks
- Redis/BullMQ render workers for long-running jobs
- Provider worker manifests from `/api/provider-catalog/:providerId/setup`

## Researched Provider Repos

- Piper TTS: https://github.com/rhasspy/piper and current fork https://github.com/OHF-voice/piper1-gpl
- Coqui TTS: https://github.com/coqui-ai/TTS
- F5-TTS: https://github.com/SWivid/F5-TTS
- SadTalker: https://github.com/OpenTalker/SadTalker
- MuseTalk: https://github.com/TMElyralab/MuseTalk
- Wav2Lip: https://github.com/Rudrabha/Wav2Lip
- Remotion: https://github.com/remotion-dev/remotion

Always review project, model, checkpoint, and media licenses before enabling a provider for paid/commercial usage.

## Safety Boundaries

This project does not include account spam automation, platform rule bypassing, fake engagement systems, or impersonation tooling.
