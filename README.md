# arrowfin-test

Candles for the MES and NQ futures contracts: an Express API that aggregates 1 minute candles into 1m, 5m, 15m and 1h, and a Next.js page that charts them.

## Run it

Requires Node 22.12 or newer (vitest 5). From the repo root:

```bash
npm install     # installs backend and frontend (npm workspaces)
npm run dev     # API on http://localhost:3001, web on http://localhost:3000
npm test        # backend tests (vitest + supertest)
```

The frontend reaches the API through a Next rewrite at `/api`, so there is no CORS setup. To point it somewhere else, set `API_URL` in `frontend/.env`. The backend reads `DATASET_PATH` if set, otherwise `backend/dataset/candles_1m.json`.

## Docs

- [API.md](API.md): the `GET /candles` contract, response shape and errors.
- [DECISIONS.md](DECISIONS.md): prompts used and the main decisions.
- [REVIEW.md](REVIEW.md): Part 3 code review.
