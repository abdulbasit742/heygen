# Reference review

Reviewed on 2026-07-15 before the session and public-review hardening change.

## Immich

Relevant pattern: server-set authentication and shared-link cookies use HttpOnly, SameSite, Secure-aware cookie options with explicit lifetimes.

Adopted:

- server-owned browser sessions;
- HttpOnly and SameSite=Lax cookie defaults;
- explicit cookie lifetime and production Secure mode;
- capability links treated separately from account sessions.

Not adopted:

- Immich's full authentication stack, database, object storage, or shared-link feature set.

## Remotion

Relevant pattern: rendering systems expose explicit execution, concurrency, timeout, and deployment boundaries rather than treating media generation as an ordinary unbounded request.

Adopted:

- keep provider/render actions explicit and reviewable;
- preserve dry-run provider handoffs;
- document that media generation requires operational limits and licensing review.

Not adopted:

- Remotion's rendering framework, browser runtime, cloud renderer, or package ecosystem.

## LiveKit

Relevant pattern: signed identity/capability credentials are scoped and lifetime-bound rather than stored indefinitely in browser-readable state.

Adopted:

- signed session claims with issuer, audience, and bounded lifetime;
- short-lived, revocable capability links for public review;
- server verification on every protected request.

Not adopted:

- realtime media transport, room grants, distributed infrastructure, or SDK migration.

## Result

The smallest coherent improvement was to harden the existing Express/React boundary instead of replacing the application: fail-closed runtime configuration, HttpOnly cookie sessions, explicit browser origins, mutation-origin checks, bounded authentication attempts, and minimized public reviews. Existing project, render, export, and scheduling APIs remain in place.
