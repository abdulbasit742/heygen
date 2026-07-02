# Step 15 — Brand Kit

This step adds reusable brand styling for exported avatar videos.

## Added
- Backend brand kit service
- Auth-protected brand kit API
- Frontend brand kit editor
- Logo URL, colors, font, subtitle style, and watermark metadata
- Database table for future PostgreSQL persistence

## API

```http
GET /api/brand-kit/me
PUT /api/brand-kit/me
```

## Example Payload

```json
{
  "name": "My Creator Brand",
  "logoUrl": "https://example.com/logo.png",
  "primaryColor": "#7c3aed",
  "secondaryColor": "#22c55e",
  "accentColor": "#f97316",
  "fontFamily": "Inter",
  "watermark": {
    "enabled": true,
    "text": "My Brand",
    "position": "top-right"
  }
}
```

## Next Improvement
Connect this brand kit to the FFmpeg render layer so exported videos automatically include watermark, brand colors, and subtitle styling.
