"""
FastAPI entrypoint for the Nutrition module.
Run locally:  uvicorn main:app --reload --port 8000
Render start: uvicorn main:app --host 0.0.0.0 --port $PORT
In the unified HEALTH PLUS app, just mount the router the same way next to the Exercise router.
"""
import os
import sys
from pathlib import Path

# Ensure backend root is on sys.path
BASE_DIR = Path(__file__).parent.resolve()
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routes.nutrition import router as nutrition_router  # noqa: E402
from routes.workout import router as workout_router  # noqa: E402

app = FastAPI(title="HEALTH PLUS - Unified Nutrition & Formwise Exercise Engine", version="1.0.0")

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware, allow_origins=origins, allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

app.include_router(nutrition_router, prefix="/api/nutrition")
app.include_router(workout_router, prefix="/api/workout")


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    print("Starting Uvicorn server on http://127.0.0.1:8000 ...", flush=True)
    uvicorn.run(app, host="127.0.0.1", port=8000)
