"""
RAG nutrition lookup over Supabase `indian_food_nutrition` (pgvector).

Resolution strategy for a free-text food name:
  1. exact match on food_name / alias (in-memory index of the ~100 row table)
  2. vector similarity via the `match_indian_foods` SQL function
Macros are computed from DB values only - never from the LLM.
"""
import logging
import os
import re
import sys
from functools import lru_cache
from typing import Optional

from fastembed import TextEmbedding
from supabase import Client, create_client

log = logging.getLogger("rag_nutrition")

EMBED_MODEL = "BAAI/bge-small-en-v1.5"  # 384 dims, matches vector(384)
MIN_VECTOR_SIMILARITY = 0.55

DIET_ALLOWED = {
    "veg": ["veg", "vegan", "jain"],
    "vegan": ["vegan"],
    "jain": ["veg", "vegan", "jain"],   # dairy is fine for Jain; root veg/onion/garlic blocked below
    "non-veg": ["veg", "vegan", "jain", "non-veg"],
}

# Jain diet avoids root vegetables, onion and garlic
JAIN_BLOCKED_TERMS = (
    "aloo", "potato", "onion", "pyaz", "garlic", "lehsun", "gajar", "carrot",
    "mooli", "radish", "beet", "shakarkandi", "mushroom", "pav bhaji", "vada pav",
    "samosa", "biryani", "pulao",
)


def is_blocked(food: dict, preference: Optional[str], avoid_terms: Optional[list[str]] = None) -> bool:
    """True if the food violates the Jain rules or any user-avoided term (name or alias)."""
    haystack = " ".join([food["food_name"], *(food.get("aliases") or [])]).lower()
    if preference == "jain" and any(t in haystack for t in JAIN_BLOCKED_TERMS):
        return True
    return any(_norm(t) and _norm(t) in _norm(haystack) for t in (avoid_terms or []))


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL / SUPABASE_SERVICE_KEY not set")
    return create_client(url, key)


@lru_cache(maxsize=1)
def _embedder() -> TextEmbedding:
    return TextEmbedding(model_name=EMBED_MODEL)


def embed(text: str) -> list[float]:
    return next(iter(_embedder().embed([text]))).tolist()


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9 ]", "", s.lower()).strip()


@lru_cache(maxsize=1)
def _catalog() -> list[dict]:
    try:
        rows = (
            get_supabase()
            .table("indian_food_nutrition")
            .select("id,food_name,serving_unit,calories,protein_g,carbs_g,fats_g,region,category,diet_type,aliases")
            .execute()
            .data
        )
        if rows:
            return rows
    except Exception as e:
        log.warning("Supabase catalog fetch failed (%s), loading local seed catalog", e)

    # Robust local fallback from seed_indian_foods
    try:
        sys_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if sys_path not in sys.path:
            sys.path.insert(0, sys_path)
        from seed_indian_foods import FOODS
        rows = []
        for idx, item in enumerate(FOODS, 1):
            fn, su, cal, pro, carb, fat, reg, cat, diet, aliases = item
            rows.append({
                "id": str(idx),
                "food_name": fn,
                "serving_unit": su,
                "calories": float(cal),
                "protein_g": float(pro),
                "carbs_g": float(carb),
                "fats_g": float(fat),
                "region": reg,
                "category": cat,
                "diet_type": diet,
                "aliases": aliases or []
            })
        return rows
    except Exception as e2:
        log.error("Could not load local seed catalog: %s", e2)
        raise RuntimeError("No food catalog available")


def refresh_catalog() -> None:
    _catalog.cache_clear()


@lru_cache(maxsize=1)
def _name_index() -> dict[str, dict]:
    idx: dict[str, dict] = {}
    for r in _catalog():
        idx[_norm(r["food_name"])] = r
        for a in r.get("aliases") or []:
            idx.setdefault(_norm(a), r)
    return idx


def catalog_prompt(
    preference: Optional[str] = None,
    avoid_terms: Optional[list[str]] = None,
    categories: Optional[set[str]] = None,
) -> str:
    """
    Compact catalog listing so LLM steps map to canonical names. When a dietary preference /
    avoid list is given the catalog is pre-filtered, so the model can only choose allowed foods.
    """
    diets = allowed_diets(preference)
    rows = [
        r for r in _catalog()
        if (diets is None or r["diet_type"] in diets)
        and not is_blocked(r, preference, avoid_terms)
        and (categories is None or r["category"] in categories)
    ]
    return "\n".join(
        f"- {r['food_name']} | 1 serving = {r['serving_unit']} | {r['calories']:.0f} kcal, "
        f"{r['protein_g']:.0f}g P, {r['carbs_g']:.0f}g C, {r['fats_g']:.0f}g F"
        for r in rows
    )


def allowed_diets(preference: Optional[str]) -> Optional[list[str]]:
    return DIET_ALLOWED.get(preference) if preference else None


def search_foods(
    query: str,
    k: int = 5,
    category: Optional[str] = None,
    diets: Optional[list[str]] = None,
    min_similarity: float = 0.0,
) -> list[dict]:
    try:
        res = get_supabase().rpc(
            "match_indian_foods",
            {
                "query_embedding": embed(query),
                "match_count": k,
                "min_similarity": min_similarity,
                "filter_category": category,
                "allowed_diets": diets,
            },
        ).execute()
        if res.data:
            return res.data
    except Exception as e:
        log.warning("Supabase match_indian_foods failed (%s), running local search", e)

    # Local fallback matching over in-memory catalog
    q_norm = _norm(query)
    q_words = set(q_norm.split())
    matches = []
    for r in _catalog():
        if category and r.get("category") != category:
            continue
        if diets and r.get("diet_type") not in diets:
            continue
        fn_norm = _norm(r["food_name"])
        aliases = [r["food_name"]] + (r.get("aliases") or [])
        score = 0.0
        if q_norm == fn_norm or any(q_norm == _norm(a) for a in aliases):
            score = 1.0
        elif q_norm in fn_norm or any(q_norm in _norm(a) for a in aliases):
            score = 0.85
        elif any(_norm(a) in q_norm for a in aliases):
            score = 0.80
        else:
            fn_words = set(fn_norm.split())
            common = q_words.intersection(fn_words)
            if common:
                score = 0.60 + 0.1 * min(len(common), 3)

        if score >= max(min_similarity, 0.5):
            matches.append({**r, "similarity": score})

    matches.sort(key=lambda x: x["similarity"], reverse=True)
    return matches[:k]


def resolve_food(name: str) -> Optional[dict]:
    """Map a free-text name to a catalog row. Returns None when nothing is close enough."""
    key = _norm(name)
    row = _name_index().get(key)
    if row:
        return {**row, "match": "exact", "similarity": 1.0}
    # singular/plural tolerance
    for variant in (key.rstrip("s"), key + "s"):
        row = _name_index().get(variant)
        if row:
            return {**row, "match": "exact", "similarity": 1.0}
    hits = search_foods(name, k=1, min_similarity=MIN_VECTOR_SIMILARITY)
    if hits:
        full = next((r for r in _catalog() if r["id"] == hits[0]["id"]), hits[0])
        return {**full, "match": "vector", "similarity": hits[0]["similarity"]}
    return None


def calculate_macros(items: list[dict]) -> dict:
    """
    items: [{"item": "roti", "quantity": 3}, ...]  (quantity = number of servings of the
    food's serving_unit, e.g. 3 rotis, 1.5 katori dal).
    Returns per-item breakdown + totals. Unresolved items are reported, never guessed.
    """
    resolved, unresolved = [], []
    totals = {"calories": 0.0, "protein_g": 0.0, "carbs_g": 0.0, "fats_g": 0.0}

    for it in items:
        qty = float(it.get("quantity", 1) or 0)
        if qty <= 0:
            continue
        food = resolve_food(str(it.get("item", "")))
        if not food:
            unresolved.append(it.get("item"))
            continue
        line = {
            "item": food["food_name"],
            "requested_as": it.get("item"),
            "quantity": qty,
            "serving_unit": food["serving_unit"],
            "calories": round(float(food["calories"]) * qty, 1),
            "protein_g": round(float(food["protein_g"]) * qty, 1),
            "carbs_g": round(float(food["carbs_g"]) * qty, 1),
            "fats_g": round(float(food["fats_g"]) * qty, 1),
            "match": food["match"],
            "category": food["category"],
            "diet_type": food["diet_type"],
        }
        resolved.append(line)
        for k in totals:
            totals[k] += line[k]

    return {
        "items": resolved,
        "unresolved": unresolved,
        "totals": {k: round(v, 1) for k, v in totals.items()},
    }


def _macro_distance(a: dict, b: dict) -> float:
    """Relative macro distance between two catalog rows (per serving)."""
    d = 0.0
    for k, w in (("calories", 1.0), ("protein_g", 1.5), ("carbs_g", 0.7), ("fats_g", 0.7)):
        base = max(float(a[k]), 1.0)
        d += w * abs(float(a[k]) - float(b[k])) / base
    return d


def find_alternatives(
    food_name: str,
    dietary_preference: Optional[str],
    exclude: Optional[list[str]] = None,
    k: int = 3,
    avoid_terms: Optional[list[str]] = None,
) -> list[dict]:
    """
    Macro-equivalent swaps for `food_name`: same category, allowed by the user's diet,
    ranked by (macro closeness, semantic similarity). Returns catalog rows with a
    `scale` telling how many servings of the alternative match the original calories.
    """
    original = resolve_food(food_name)
    if not original:
        return []
    exclude_norm = {_norm(e) for e in (exclude or [])} | {_norm(original["food_name"])}

    cands = search_foods(
        original["food_name"],
        k=25,
        category=original["category"],
        diets=allowed_diets(dietary_preference),
    )
    if len(cands) < k + 1:  # widen across categories if the category is thin
        cands += search_foods(original["food_name"], k=25, diets=allowed_diets(dietary_preference))

    seen, scored = set(), []
    for c in cands:
        if c["id"] in seen or _norm(c["food_name"]) in exclude_norm:
            continue
        full = next((r for r in _catalog() if r["id"] == c["id"]), c)
        if is_blocked(full, dietary_preference, avoid_terms):
            continue
        seen.add(c["id"])
        dist = _macro_distance(original, c) - 0.3 * float(c.get("similarity", 0))
        if c["category"] != original["category"]:
            dist += 1.0
        scored.append((dist, c))
    scored.sort(key=lambda x: x[0])

    out = []
    for _, c in scored[:k]:
        scale = round(float(original["calories"]) / max(float(c["calories"]), 1.0), 1)
        scale = min(max(scale, 0.5), 3.0)
        out.append({**c, "scale": scale})
    return out
