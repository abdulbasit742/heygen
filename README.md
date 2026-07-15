# AI Avatar Video Studio

HeyGen-style MVP for prompt-to-video workflows. The app includes a React dashboard, Express API, creator accounts, templates, brand settings, render jobs, exports, scheduling, provider handoff plans, and revocable client-review links.

## Current capabilities

- Email/password creator accounts with server-owned HttpOnly cookie sessions
- Prompt-to-script and AI scene-plan endpoints
- Templates for short-form video workflows
- Avatar and voice preset selection
- Project creation, retry, progress tracking, and MP4 export
- Voiceover, captions, scene thumbnails, brand snapshots, and production packs
- ZIP export bundles and project package manifests
- Revocable, expiring public share links with bounded client feedback
- Client folders, workspace invites, analytics, settings, scheduler mocks, and job monitoring
- Provider catalog and dry-run handoff jobs before any real provider execution
- FFmpeg-based local render endpoint

The scheduler remains a mock publishing flow. Provider jobs are dry runs unless a separately reviewed integration is explicitly enabled.

## Requirements

- Node.js 20.19+ or 22+

## Local setup

```bash
npm run install:all
cp backend/.env.example backend/.env
```

Generate a session secret and put the result in `backend/.env`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Minimum local configuration:

```dotenv
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=<generated value of at least 32 characters>
SESSION_HOURS=12
SESSION_COOKIE_SECURE=false
```

Start both applications:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

The backend fails to start when `JWT_SECRET` is missing, short, or a known placeholder. Production also requires an explicit frontend origin. Use HTTPS and `SESSION_COOKIE_SECURE=true` in production.

## Session and origin model

Browser authentication uses an HttpOnly, SameSite=Lax cookie. The JavaScript client does not store or attach a bearer token. A small user-display hint may be kept in `sessionStorage`; it is not authorization and disappears with the browser session. The server verifies the signed cookie on every protected request.

Credentialed browser requests are accepted only from `FRONTEND_URL` or comma-separated `FRONTEND_ORIGINS`. State-changing cross-site requests are rejected. Bearer tokens remain accepted by protected routes only as a compatibility path for trusted non-browser API clients that obtain a valid signed token outside this browser flow.

## Public review links

A share link is a capability URL. Anyone who has it can view that export and submit a review until it expires or is revoked.

- tokens are random and expiration-bound;
- review submissions are rate limited;
- reviewer email is not collected or retained;
- pages and API responses use `no-store`, and pages request `noindex`;
- feedback history is bounded.

Do not place sensitive source media, personal data, or confidential client content in a public share unless the capability-link model is acceptable.

## Verification

```bash
npm run test
npm run security-check
npm run build
```

The policy tests are dependency-free. CI additionally installs the backend/frontend lockfiles, checks active JavaScript syntax, runs the security scanner, and builds the frontend on Node 20.19 and 22.

## API notes

Key routes include:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/projects`
- `GET /api/projects/:id/export`
- `GET /api/projects/:id/bundle`
- `POST /api/projects/:id/schedule`
- `POST /api/projects/:id/share`
- `DELETE /api/projects/:id/share`
- `GET /api/share/:token`
- `POST /api/share/:token/review`
- `GET /share/:token`
- `GET /api/provider-catalog`
- `POST /api/provider-catalog/:providerId/jobs`

## Persistence and deployment limits

MVP records are stored in JSON files under `backend/data`; rendered files are written under `backend/storage` and generated assets under `backend/generated-assets`. These directories are ignored by Git.

This is not a production database or private object-storage design. Media paths are still served as static URLs and are not individually authorized. Before handling confidential assets, move them to authenticated storage with per-user authorization, retention controls, backups, and deletion workflows.

## Provider connections

Optional provider keys stay in `backend/.env` or a deployment secret manager. Never expose them through Vite variables or browser code. Review model, checkpoint, media, voice, and commercial-use licenses before enabling any provider.

Reference projects previously considered include Piper, Coqui TTS, F5-TTS, SadTalker, MuseTalk, Wav2Lip, and Remotion. A provider catalog entry or dry run is not proof that production usage is licensed or safe.

## Safety boundaries

This project does not include account-spam automation, platform-rule bypassing, fake engagement, hidden publishing, or impersonation tooling. Model output and uploaded media remain untrusted. Real publishing, payments, biometric avatar creation, or third-party provider execution require separate authorization, consent, audit logging, and operational review.

See:

- [Reference review](docs/reference-review.md)
- [Changed-area security audit](docs/security-audit.md)
