# Step 10 — Billing & Subscriptions

Added a mock subscription layer for MVP testing.

## Backend
- `GET /api/billing/plans`
- `GET /api/billing/me`
- `POST /api/billing/checkout/mock`
- Plan limits for Free, Pro, and Agency
- Project creation limit check

## Frontend
- Pricing cards
- Current usage display
- Mock checkout button

## Production note
Replace mock checkout with Stripe, Paddle, Razorpay, or local payment provider webhooks before charging real users.
