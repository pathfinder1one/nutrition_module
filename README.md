# HEALTH PLUS - Nutrition Module (Team CASA Vital)

## Setup
1. Run `supabase_schema.sql` in the Supabase SQL editor (creates tables, pgvector index, `match_indian_foods` RPC, RLS).
2. `cd backend && pip install -r requirements.txt && cp .env.example .env` (fill keys; default LLM is Gemini via `GEMINI_API_KEY`, set `LLM_PROVIDER=anthropic` to use Claude instead).
3. `python ../seed_indian_foods.py` (101 foods + 384-d embeddings; safe to re-run).
4. `uvicorn main:app --reload` (Render start: `uvicorn main:app --host 0.0.0.0 --port $PORT`).
5. Frontend: copy `frontend/src/components/NutritionHub.tsx`, set `VITE_API_BASE_URL`, render `<NutritionHub userId={currentUserId} />`.

## Integration contract
Every table keys on `users.id` (same `user_id` as the Exercise module). Mount in the unified app:
`app.include_router(nutrition_router, prefix="/api/nutrition")`.

## Endpoints
POST /onboard · GET /plan/{user_id} · PUT /plan/modify · POST /analyze-meal · POST /confirm-meal · GET /insights/{user_id}
