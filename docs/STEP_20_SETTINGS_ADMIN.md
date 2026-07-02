# Step 20 — Settings & Admin Layer

Added:
- Backend settings API
- Per-user app settings store
- Provider status endpoint
- Safety-mode defaults
- Frontend settings panel

Routes:
- `GET /api/settings`
- `PUT /api/settings`
- `POST /api/settings/reset`
- `GET /api/settings/providers`

The provider status endpoint shows whether the app is running in mock mode or has real API keys configured.
