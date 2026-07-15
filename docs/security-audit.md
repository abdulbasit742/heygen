# Changed-area security audit — 2026-07-15

## Fixed

- **Fallback signing secret:** authentication no longer accepts `dev_secret_change_me` or another short/placeholder JWT secret.
- **Environment load order:** validated configuration loads through a dedicated module before session signing is used.
- **Browser-readable bearer tokens:** the React client no longer stores access tokens in `localStorage` or attaches a global Authorization header.
- **Long browser token lifetime:** browser sessions now use a bounded HttpOnly, SameSite=Lax cookie; production defaults to Secure cookies.
- **Wildcard credentialed CORS:** browser origins must be explicitly configured, and state-changing cross-site requests are rejected.
- **Unbounded login/signup attempts:** authentication attempts are rate limited by client address and normalized email.
- **Weak account input boundaries:** names, emails, and passwords are normalized and length-validated before hashing or lookup.
- **Public review overcollection:** reviewer email was removed from the form, storage, and responses.
- **Public review spam:** review submissions are rate limited and stored feedback history is bounded.
- **Share indexing/cache exposure:** public share responses use no-store controls and request no indexing.
- **Missing baseline headers:** the Express app disables its framework banner and sets content-type, framing, referrer, and browser-permission headers.

## Verification controls

- dependency-free runtime/session policy tests;
- source scanner for secret fallbacks, wildcard CORS, browser bearer persistence, cookie settings, token responses, review email collection, populated environment files, and private keys;
- CI syntax checks and frontend production build on Node 20.19 and 22.

## Residual risks

- Rendered media and generated assets remain static public-by-URL resources. A private object store or authenticated media endpoint is required for confidential content.
- JSON-file persistence has no transactional concurrency, encryption-at-rest policy, backup strategy, tenancy isolation, or database migration model.
- The in-memory rate limiter resets on restart and is not shared between multiple server instances.
- Bearer authentication remains accepted for trusted non-browser clients; token issuance and revocation for such clients are not implemented here.
- Public share pages still use inline style and script content, so a strict nonce/hash Content Security Policy is not yet present.
- A browser session user hint is stored in `sessionStorage` for UI continuity. It is not authorization, but a new tab may require login again even while the HttpOnly cookie remains valid.
- Generated avatars, voices, likenesses, client media, and provider prompts may involve consent, biometric, copyright, privacy, and commercial-license obligations outside this code change.

## Production gate

Before public production use, add authenticated media delivery, durable database storage, distributed rate limiting, server-side audit logs with privacy controls, session revocation, HTTPS-only deployment, backups/deletion workflows, provider data-retention review, and explicit consent/provenance records for uploaded faces and voices.
