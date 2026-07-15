# AGENTS.md

## Scope

These instructions apply to the entire `abdulbasit742/heygen` repository.

Project: **AI Avatar Video Studio**, with an Express backend, React/Vite frontend, FFmpeg render pipeline, JSON-file MVP persistence, public capability links, and provider dry-run jobs.

## Trust boundaries

- Browser sessions are server-owned HttpOnly cookies. Do not reintroduce access tokens in `localStorage`, sessionStorage, URLs, or React state.
- `backend/src/config/runtimePolicy.mjs` is the source of truth for origins, session lifetime, cookie mode, and required signing secret.
- Provider credentials remain server-side and optional.
- Public share URLs are bearer capabilities: keep them random, expiring, revocable, no-store, and data-minimized.
- Generated files under storage/data/generated-assets are runtime artifacts and must not be committed.

## Working method

1. Read `README.md`, `docs/security-audit.md`, the relevant manifests, routes, service modules, and tests before editing.
2. Preserve project ownership checks and validate untrusted route, media, provider, and review inputs.
3. Keep authentication, rendering, scheduling, provider execution, sharing, and billing side effects explicit and bounded.
4. Do not hand-edit generated media, bundles, dependency trees, or persisted runtime JSON.
5. Update tests and documentation whenever public routes, session behavior, environment variables, or provider/media handling changes.

## Commands

```bash
npm run install:all
npm run test
npm run security-check
npm run build
npm run dev
```

## Security requirements

- Never add a fallback JWT secret or wildcard credentialed CORS.
- Use HTTPS and Secure cookies in production.
- Do not return browser session tokens from login/signup responses.
- Keep mutation-origin checks and bounded authentication attempts.
- Do not collect reviewer email or other unnecessary personal data on public capability pages.
- Treat model output, prompts, uploaded media, archive contents, captions, filenames, and provider responses as untrusted.
- Do not enable real publishing, voice/likeness cloning, provider billing, or third-party execution without explicit consent, authorization, audit logging, limits, and license review.
- Static media URLs are not private; do not claim confidentiality until authenticated media delivery exists.

## Completion checklist

- Relevant policy tests, security scanner, syntax checks, and frontend build pass or unavailable checks are stated precisely.
- No secrets, populated environment files, runtime data, or generated media are introduced.
- Browser token persistence, wildcard origins, and unbounded public writes do not regress.
- Documentation reflects any changed session, share, media, provider, or deployment contract.
