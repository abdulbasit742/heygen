# Step 02 — Backend API Skeleton

Added:
- Express health route
- Project creation route
- Project list route
- Project detail route
- Input validation middleware
- In-memory project/job store
- Placeholder render progress simulation

## Run

```bash
cd backend
npm install
npm run dev
```

## Test

```bash
curl http://localhost:4000/health

curl -X POST http://localhost:4000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Create a motivational AI avatar video about discipline","platform":"instagram_reels"}'
```
