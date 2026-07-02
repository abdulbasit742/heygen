# Step 04 — AI Script Generator

Added a backend script generator for AI video projects.

## Endpoint

```http
POST /api/ai-script
```

## Example Body

```json
{
  "title": "Motivation Reel",
  "prompt": "earn online with AI video tools",
  "tone": "motivational",
  "platform": "instagram_reels"
}
```

## Returns

- hook
- full script
- scene list
- visual prompts
- subtitles
- captions
- hashtags
- total duration

This module currently uses a safe fallback generator and can later be connected to OpenAI or another LLM.
