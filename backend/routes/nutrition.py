"""
Nutrition module router.  Mount with:
    from routes.nutrition import router as nutrition_router
    app.include_router(nutrition_router, prefix="/api/nutrition")

Shared contract: every row is keyed by users.id (the same user_id the Exercise module uses).
"""
import base64
import logging
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional
from zoneinfo import ZoneInfo

import jwt
from fastapi import APIRouter, File, Form, Header, HTTPException, UploadFile
from pydantic import BaseModel, Field

import ml_pattern_engine as ml
import rag_nutrition as rag
import vision_preprocessor as vision
from llm_client import short_text_call, structured_call

log = logging.getLogger("nutrition")
router = APIRouter(tags=["nutrition"])

LOCAL_TZ = ZoneInfo(os.getenv("APP_TIMEZONE", "Asia/Kolkata"))
MEAL_TYPES = ["breakfast", "lunch", "snack", "dinner"]
MEAL_LABELS = {"breakfast": "Breakfast", "lunch": "Lunch", "snack": "Evening Snack", "dinner": "Dinner"}
SLOT_SHARE = {"breakfast": 0.25, "lunch": 0.35, "snack": 0.10, "dinner": 0.30}
ACTIVITY = {"sedentary": 1.2, "light": 1.375, "moderate": 1.55, "active": 1.725}
MealType = Literal["breakfast", "lunch", "snack", "dinner"]


# ============================================================ helpers
def sb():
    return rag.get_supabase()


def _authorize(user_id: str, authorization: Optional[str]) -> None:
    """If SUPABASE_JWT_SECRET is set, require a valid Supabase JWT whose `sub` equals user_id.
    (Leave the secret unset only when the parent app already authenticates upstream.)"""
    secret = os.getenv("SUPABASE_JWT_SECRET")
    if not secret:
        return
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Missing bearer token")
    try:
        claims = jwt.decode(authorization[7:], secret, algorithms=["HS256"], audience="authenticated")
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token")
    if claims.get("sub") != user_id:
        raise HTTPException(403, "Token does not match user_id")


def _is_valid_uuid(val: str) -> bool:
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, AttributeError):
        return False


def _normalize_uuid(val: str) -> str:
    try:
        return str(uuid.UUID(str(val)))
    except (ValueError, AttributeError):
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(val)))


def _ensure_user_exists(target_uid: str, name: str = "Health Plus User") -> dict:
    try:
        res = sb().table("users").select("*").eq("id", target_uid).limit(1).execute()
        if res.data:
            return res.data[0]
        default_user = {
            "id": target_uid,
            "name": name,
            "age": 25,
            "gender": "male",
            "height_cm": 175.0,
            "weight_kg": 70.0,
            "dietary_preference": "veg",
            "goal": "maintain",
            "target_calories": 2000,
            "target_protein_g": 75,
        }
        upsert_res = sb().table("users").upsert(default_user, on_conflict="id").execute()
        if upsert_res.data:
            return upsert_res.data[0]
        return default_user
    except Exception as e:
        log.warning(f"Could not provision user row: {e}")
        return {
            "id": target_uid,
            "name": name,
            "target_calories": 2000,
            "target_protein_g": 75,
            "target_carbs_g": 250,
            "target_fats_g": 55,
        }


def _get_user(user_id: str) -> dict:
    target_uid = _normalize_uuid(user_id)
    return _ensure_user_exists(target_uid, name=user_id if not _is_valid_uuid(user_id) else "Health Plus User")


def _fetch_logs(user_id: str, days: int = 60) -> list[dict]:
    target_uid = _normalize_uuid(user_id)
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    try:
        return (
            sb().table("meal_logs").select("*").eq("user_id", target_uid)
            .gte("logged_at", since).order("logged_at").execute().data or []
        )
    except Exception:
        return []


def _now_local() -> datetime:
    return datetime.now(LOCAL_TZ)


def _round_half(x: float) -> float:
    return max(0.5, round(x * 2) / 2)


# ============================================================ targets (BMR / TDEE / macros)
def compute_targets(age: int, gender: str, height_cm: float, weight_kg: float, goal: str, activity: str) -> dict:
    """Mifflin-St Jeor BMR -> TDEE -> goal-adjusted calories + protein/fat/carb split."""
    s = 5 if gender == "male" else -161 if gender == "female" else -78
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + s
    tdee = bmr * ACTIVITY[activity]

    if goal == "lose_weight":
        calories = max(tdee - 450, bmr, 1200 if gender != "male" else 1500)
        protein_per_kg = 1.8
    elif goal == "gain_muscle":
        calories = tdee + 300
        protein_per_kg = 2.0
    else:
        calories = tdee
        protein_per_kg = 1.4

    protein = round(weight_kg * protein_per_kg)
    fats = round(calories * 0.25 / 9)
    carbs = round(max(calories - protein * 4 - fats * 9, 0) / 4)
    return {
        "bmr": round(bmr), "tdee": round(tdee), "target_calories": round(calories),
        "target_protein_g": protein, "target_fats_g": fats, "target_carbs_g": carbs,
    }


# ============================================================ models
class OnboardRequest(BaseModel):
    user_id: Optional[str] = Field(None, description="Shared users.id. If omitted a new user is created.")
    name: str = Field(..., min_length=1, max_length=80)
    age: int = Field(..., ge=10, le=100)
    gender: Literal["male", "female", "other"]
    height_cm: float = Field(..., ge=100, le=250)
    weight_kg: float = Field(..., ge=25, le=250)
    dietary_preference: Literal["veg", "non-veg", "vegan", "jain"]
    goal: Literal["lose_weight", "maintain", "gain_muscle"]
    activity_level: Literal["sedentary", "light", "moderate", "active"] = "light"
    dislikes: list[str] = Field(default_factory=list, description="Foods to avoid in the plan")


class ModifyPlanRequest(BaseModel):
    user_id: str
    message: str = Field(..., min_length=2, max_length=400)


class ConfirmItem(BaseModel):
    item: str
    quantity: float = Field(..., gt=0, le=20)


class ConfirmMealRequest(BaseModel):
    user_id: str
    meal_type: MealType
    items: list[ConfirmItem] = Field(..., min_length=1, max_length=25)


# ============================================================ plan generation
_PLAN_SCHEMA = {
    "type": "object",
    "properties": {
        slot: {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"item": {"type": "string"}, "quantity": {"type": "number"}},
                "required": ["item", "quantity"],
            },
        }
        for slot in MEAL_TYPES
    },
    "required": MEAL_TYPES,
}

_PLAN_SYSTEM = """You are a practical Indian dietitian. Compose a one-day Indian meal plan using ONLY foods from the CATALOG.
Rules:
- Slots: breakfast, lunch, snack (evening snack), dinner. Use catalog names exactly.
- quantity = number of servings of the catalog serving unit (multiples of 0.5; rotis in whole numbers).
- Hit the per-slot calorie targets within ~10% and make protein close to the daily protein target overall.
- Everyday, realistic combinations (e.g. roti + dal + sabzi + dahi). Avoid repeating the same main dish across slots.
- Breakfast: breakfast-category items; lunch/dinner: bread or rice + dal/protein + sabzi (+ dahi/salad); snack: light.

CATALOG:
{catalog}"""


def _build_plan_meals(items_by_slot: dict, preference: str, avoid: list[str]) -> dict:
    meals, grand = {}, {"calories": 0.0, "protein_g": 0.0, "carbs_g": 0.0, "fats_g": 0.0}
    for slot in MEAL_TYPES:
        calc = rag.calculate_macros(items_by_slot.get(slot, []))
        diets = rag.allowed_diets(preference)
        kept = []
        for line in calc["items"]:
            row = rag.resolve_food(line["item"])
            if row and (diets is None or row["diet_type"] in diets) and not rag.is_blocked(row, preference, avoid):
                kept.append(line)
        totals = {k: round(sum(l[k] for l in kept), 1) for k in grand}
        for k in grand:
            grand[k] += totals[k]
        meals[slot] = {
            "label": MEAL_LABELS[slot],
            "items": [
                {k: l[k] for k in ("item", "quantity", "serving_unit", "calories", "protein_g", "carbs_g", "fats_g")}
                for l in kept
            ],
            "totals": totals,
        }
    return {"meals": meals, "totals": {k: round(v, 1) for k, v in grand.items()}}


def generate_plan(user: dict, avoid: list[str]) -> dict:
    pref, cal, pro = user["dietary_preference"], user["target_calories"], user["target_protein_g"]
    catalog = rag.catalog_prompt(pref, avoid)
    slot_targets = ", ".join(f"{s}: {round(cal * SLOT_SHARE[s])} kcal" for s in MEAL_TYPES)
    prompt = f"Daily target: {cal} kcal, {pro} g protein. Per-slot targets -> {slot_targets}. Diet: {pref}."
    if avoid:
        prompt += f" The user avoids: {', '.join(avoid)}."

    plan = None
    for _ in range(3):   # compose -> measure -> rescale until within 10% of target
        raw = structured_call(
            system=_PLAN_SYSTEM.format(catalog=catalog), user_content=prompt,
            tool_name="submit_plan", tool_description="Submit the one-day meal plan",
            input_schema=_PLAN_SCHEMA, max_tokens=1500,
        ) if plan is None else None
        if raw is not None:
            plan = _build_plan_meals(raw, pref, avoid)
            source = raw
        total = plan["totals"]["calories"]
        if total and abs(total - cal) / cal <= 0.10:
            break
        if not total:
            raise HTTPException(502, "Could not build a plan from the catalog; try again.")
        ratio = cal / total
        source = {
            slot: [{"item": i["item"], "quantity": _round_half(i["quantity"] * ratio)} for i in plan["meals"][slot]["items"]]
            for slot in MEAL_TYPES
        }
        plan = _build_plan_meals(source, pref, avoid)
    return plan


@router.post("/onboard")
def onboard(req: OnboardRequest, authorization: Optional[str] = Header(None)):
    if req.user_id:
        _authorize(req.user_id, authorization)
    t = compute_targets(req.age, req.gender, req.height_cm, req.weight_kg, req.goal, req.activity_level)

    row = {
        "name": req.name, "age": req.age, "gender": req.gender, "height_cm": req.height_cm,
        "weight_kg": req.weight_kg, "dietary_preference": req.dietary_preference, "goal": req.goal,
        "target_calories": t["target_calories"], "target_protein_g": t["target_protein_g"],
    }
    if req.user_id:
        row["id"] = req.user_id
        saved = sb().table("users").upsert(row, on_conflict="id").execute().data[0]
    else:
        saved = sb().table("users").insert(row).execute().data[0]

    avoid = [d.strip() for d in req.dislikes if d.strip()]
    try:
        plan = generate_plan(saved, avoid)
    except HTTPException:
        raise
    except Exception as e:
        log.exception("plan generation failed")
        raise HTTPException(502, f"Plan generation failed: {e}")

    plan_json = {
        **plan,
        "targets": {k: t[k] for k in ("bmr", "tdee", "target_calories", "target_protein_g", "target_carbs_g", "target_fats_g")},
        "excluded_foods": avoid,
    }
    sb().table("diet_plans").upsert({"user_id": saved["id"], "plan_json": plan_json}, on_conflict="user_id").execute()
    return {"user": saved, "targets": plan_json["targets"], "plan": plan_json}


@router.get("/plan/{user_id}")
def get_plan(user_id: str, authorization: Optional[str] = Header(None)):
    _authorize(user_id, authorization)
    user = _get_user(user_id)
    res = sb().table("diet_plans").select("plan_json,updated_at").eq("user_id", user_id).limit(1).execute()
    if not res.data:
        raise HTTPException(404, "No diet plan yet. Complete onboarding.")
    return {"user": user, "plan": res.data[0]["plan_json"], "updated_at": res.data[0]["updated_at"]}


# ============================================================ plan modification (RAG swap)
_MODIFY_SCHEMA = {
    "type": "object",
    "properties": {
        "understood": {"type": "boolean", "description": "False if the message is not a request to remove/replace foods"},
        "remove": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "plan_item": {"type": "string", "description": "Exact item name currently in the plan"},
                    "meal_type": {"type": "string", "enum": MEAL_TYPES + ["any"]},
                },
                "required": ["plan_item", "meal_type"],
            },
        },
        "avoid_terms": {
            "type": "array", "items": {"type": "string"},
            "description": "Lowercase food keywords the user wants gone from future suggestions (e.g. 'paneer', 'oats'). "
                           "Only for unavailable/disliked foods, not one-off swaps.",
        },
    },
    "required": ["understood", "remove", "avoid_terms"],
}

_MODIFY_SYSTEM = """The user (writing English/Hindi/Hinglish) wants to change their Indian diet plan.
Identify which items of the CURRENT PLAN to remove and replace. If the user says a food is unavailable or disliked
without naming a slot (e.g. "paneer nahi milta"), include EVERY plan item containing that food with meal_type "any"
and add the keyword to avoid_terms. If they name a slot ("oats in breakfast"), use that slot.
Use plan_item names exactly as listed.

CURRENT PLAN:
{plan}"""


@router.put("/plan/modify")
def modify_plan(req: ModifyPlanRequest, authorization: Optional[str] = Header(None)):
    _authorize(req.user_id, authorization)
    user = _get_user(req.user_id)
    res = sb().table("diet_plans").select("plan_json").eq("user_id", req.user_id).limit(1).execute()
    if not res.data:
        raise HTTPException(404, "No diet plan yet. Complete onboarding.")
    plan = res.data[0]["plan_json"]
    pref = user["dietary_preference"]

    listing = "\n".join(
        f"{slot}: " + ", ".join(i["item"] for i in plan["meals"][slot]["items"]) for slot in MEAL_TYPES
    )
    intent = structured_call(
        system=_MODIFY_SYSTEM.format(plan=listing), user_content=req.message,
        tool_name="plan_change", tool_description="Describe the requested plan change",
        input_schema=_MODIFY_SCHEMA, max_tokens=600,
    )
    if not intent.get("understood") or not intent.get("remove"):
        raise HTTPException(422, "I couldn't find that food in your plan. Try e.g. \"I don't like oats in breakfast\".")

    avoid_new = [a.lower().strip() for a in intent.get("avoid_terms", []) if a.strip()]
    excluded = sorted({*(plan.get("excluded_foods") or []), *avoid_new})

    changes = []
    for rm in intent["remove"]:
        slots = MEAL_TYPES if rm["meal_type"] == "any" else [rm["meal_type"]]
        for slot in slots:
            items = plan["meals"][slot]["items"]
            for idx, it in enumerate(items):
                if it["item"].lower() != rm["plan_item"].lower():
                    continue
                in_slot = [x["item"] for x in items]
                alts = rag.find_alternatives(
                    it["item"], pref, exclude=in_slot, k=3, avoid_terms=excluded,
                )
                if not alts:
                    continue
                best = alts[0]
                qty = _round_half(it["quantity"] * best["scale"])
                items[idx] = {
                    "item": best["food_name"], "quantity": qty, "serving_unit": best["serving_unit"],
                    "calories": round(float(best["calories"]) * qty, 1),
                    "protein_g": round(float(best["protein_g"]) * qty, 1),
                    "carbs_g": round(float(best["carbs_g"]) * qty, 1),
                    "fats_g": round(float(best["fats_g"]) * qty, 1),
                }
                changes.append({
                    "meal_type": slot, "from": it["item"], "to": best["food_name"],
                    "from_macros": {k: it[k] for k in ("calories", "protein_g", "carbs_g", "fats_g")},
                    "to_macros": {k: items[idx][k] for k in ("calories", "protein_g", "carbs_g", "fats_g")},
                    "other_options": [a["food_name"] for a in alts[1:]],
                })

    if not changes:
        raise HTTPException(422, "No suitable alternative found for that request.")

    grand = {"calories": 0.0, "protein_g": 0.0, "carbs_g": 0.0, "fats_g": 0.0}
    for slot in MEAL_TYPES:
        m = plan["meals"][slot]
        m["totals"] = {k: round(sum(i[k] for i in m["items"]), 1) for k in grand}
        for k in grand:
            grand[k] += m["totals"][k]
    plan["totals"] = {k: round(v, 1) for k, v in grand.items()}
    plan["excluded_foods"] = excluded

    sb().table("diet_plans").update({"plan_json": plan}).eq("user_id", req.user_id).execute()
    return {"plan": plan, "changes": changes}


# ============================================================ Feature B step 1: analyze
@router.post("/analyze-meal")
async def analyze_meal(
    user_id: str = Form(...),
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    authorization: Optional[str] = Header(None),
):
    _authorize(user_id, authorization)
    user = _get_user(user_id)
    if not file and not (text and text.strip()):
        raise HTTPException(400, "Provide a meal image or a text description")

    catalog = rag.catalog_prompt()  # full catalog: users log what they actually ate, whatever their preference
    meal_type = None
    preprocessed_b64 = None
    preprocessing_info = None
    try:
        if file:
            raw = await file.read()
            processed = vision.preprocess_image(raw)
            preprocessed_b64 = f"data:image/jpeg;base64,{base64.b64encode(processed).decode('utf-8')}"
            preprocessing_info = {
                "pipeline": ["Standardized resize (max 1024px)", "Gaussian blur (noise reduction)", "CLAHE local contrast boost (LAB space)"],
                "enhanced": True,
            }
            food_names = [r["food_name"] for r in rag._catalog()]
            detected = vision.detect_food_hybrid(processed, food_names, catalog)
            source = "image"
        else:
            detected = vision.parse_text_meal(text, catalog)
            meal_type = detected.get("meal_type") or None
            source = "text"
    except vision.ImageError as e:
        raise HTTPException(400, str(e))
    except HTTPException:
        raise
    except Exception as e:
        err_msg = str(e)
        log.error("AI meal analysis failed: %s", err_msg)
        if "not allowed by policy" in err_msg or "403" in err_msg or "Forbidden" in err_msg:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Google Policy Block (403 Forbidden - not allowed by policy): "
                    "Current key in backend/.env ('AQ.Ab8...') is an enterprise OAuth token blocked by Google Cloud policy. "
                    "Please get a free Google AI Studio key starting with 'AIzaSy...' from https://aistudio.google.com/app/apikey (using personal Gmail) and paste it into backend/.env line 7."
                ),
            )
        if "ACCESS_TOKEN_TYPE_UNSUPPORTED" in err_msg or "UNAUTHENTICATED" in err_msg or "API key not valid" in err_msg:
            raise HTTPException(
                status_code=401,
                detail=(
                    "Google Gemini API Key invalid or unsupported token type (ACCESS_TOKEN_TYPE_UNSUPPORTED). "
                    "Please paste a valid Google AI Studio key (starts with 'AIzaSy...') into backend/.env."
                ),
            )
        raise HTTPException(
            status_code=502,
            detail=f"Multimodal AI perception failed: {err_msg}",
        )

    items, unmatched = [], []
    seen = {}
    for d in detected.get("items", []):
        food = rag.resolve_food(d["item"])
        qty = float(d.get("quantity") or 1)
        if not food:
            unmatched.append(d["item"])
            continue
        if food["food_name"] in seen:                   # merge duplicates
            seen[food["food_name"]]["quantity"] = round(seen[food["food_name"]]["quantity"] + qty, 2)
            continue
        entry = {
            "item": food["food_name"], "quantity": round(max(qty, 0.5) * 2) / 2 if qty >= 0.5 else 0.5,
            "serving_unit": food["serving_unit"],
            "confidence": round(float(d.get("confidence", 0.8)), 2),
            "calories_per_serving": float(food["calories"]),
        }
        seen[food["food_name"]] = entry
        items.append(entry)

    return {
        "source": source,
        "suggested_meal_type": meal_type or vision.guess_meal_type(_now_local().hour),
        "items": items,
        "unmatched": unmatched,
        "notes": detected.get("notes", ""),
        "preprocessed_image": preprocessed_b64,
        "preprocessing_info": preprocessing_info,
    }


# ============================================================ Feature D: short feedback bot
_FEEDBACK_SYSTEM = """You are a nutrition coach inside a health app. Reply with AT MOST 2 short, direct sentences, under 35 words total.
No greetings, no emojis, no questions, no chit-chat, no lists. Evaluate THIS meal against what the user already ate today
and against their daily targets/baseline, then say what to do next (e.g. what the next meal should look like).
If an anomaly is flagged, mention the specific issue. Only use numbers given to you."""


def _clip_feedback(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip().strip('"')
    sentences = re.split(r"(?<=[.!])\s+", text)
    text = " ".join(sentences[:2])
    words = text.split()
    if len(words) >= 35:
        text = " ".join(words[:34]).rstrip(",;:") + "."
    return text


def _rule_based_feedback(meal_type: str, totals: dict, today_after: dict, user: dict, anomaly: dict) -> str:
    cal_t, pro_t = user.get("target_calories") or 0, user.get("target_protein_g") or 0
    left = max(cal_t - today_after["calories"], 0)
    if anomaly.get("is_anomaly"):
        why = {"calorie_spike": "high in calories", "carb_spike": "carb-heavy",
               "protein_drop": "low in protein", "late_night_meal": "unusually late"}
        reason = why.get((anomaly.get("reasons") or ["calorie_spike"])[0], "unusual for you")
        return f"This meal is {reason} compared to your usual. Keep the next one lighter; about {left:.0f} kcal left today."
    if pro_t and today_after["protein_g"] < 0.5 * pro_t and meal_type in ("lunch", "snack"):
        return f"Protein is at {today_after['protein_g']:.0f} g so far. Add dal, paneer, eggs or curd in your next meal."
    return f"Logged. About {left:.0f} kcal and {max(pro_t - today_after['protein_g'], 0):.0f} g protein remain today."


def _feedback_context(user, meal_type, macros, earlier_today, today_after, baseline, anomaly) -> str:
    earlier = "; ".join(
        f"{e['meal_type']}: {e['total_calories']:.0f} kcal, {e['total_protein']:.0f} g protein" for e in earlier_today
    ) or "nothing logged yet"
    items = ", ".join(f"{l['item']} x{l['quantity']:g}" for l in macros["items"])
    t = macros["totals"]
    base = (
        f"avg daily {baseline['avg_daily_calories']:.0f} kcal / {baseline['avg_daily_protein_g']:.0f} g protein"
        if baseline.get("available") else "not enough history yet"
    )
    anom = (
        "ANOMALY: " + ", ".join(anomaly["reasons"]) if anomaly.get("is_anomaly") else "no anomaly"
    )
    remaining = [m for m in MEAL_TYPES if m != meal_type and m not in {e["meal_type"] for e in earlier_today}]
    return (
        f"Goal: {user.get('goal')}. Daily targets: {user.get('target_calories')} kcal, {user.get('target_protein_g')} g protein.\n"
        f"Current meal ({meal_type}): {items} = {t['calories']:.0f} kcal, {t['protein_g']:.0f} g protein, "
        f"{t['carbs_g']:.0f} g carbs, {t['fats_g']:.0f} g fat.\n"
        f"Earlier today: {earlier}.\n"
        f"Today total after this meal: {today_after['calories']:.0f} kcal, {today_after['protein_g']:.0f} g protein.\n"
        f"Personal 7-day baseline: {base}.\nML status: {anom}.\nMeals still to come today: {', '.join(remaining) or 'none'}."
    )


def _coach_feedback(context: str, fallback: str) -> str:
    try:
        text = _clip_feedback(short_text_call(system=_FEEDBACK_SYSTEM, user=context, max_tokens=100))
        if not text:
            return fallback
        return text
    except Exception:
        log.exception("feedback LLM failed; using rule-based reply")
        return fallback


# ============================================================ Feature B step 2: confirm
@router.post("/confirm-meal")
def confirm_meal(req: ConfirmMealRequest, authorization: Optional[str] = Header(None)):
    _authorize(req.user_id, authorization)
    user = _get_user(req.user_id)

    macros = rag.calculate_macros([i.model_dump() for i in req.items])
    if not macros["items"]:
        raise HTTPException(422, f"None of the items could be matched: {macros['unresolved']}")
    t = macros["totals"]

    now_local = _now_local()
    history_rows = _fetch_logs(req.user_id)
    hist_df = ml.logs_to_df(history_rows)

    current = {
        "calories": t["calories"], "protein": t["protein_g"], "carbs": t["carbs_g"],
        "meal_hour": now_local.hour + now_local.minute / 60.0, "meal_type": req.meal_type,
    }
    anomaly = ml.detect_anomaly(hist_df, current)          # Feature C
    baseline = ml.personal_baseline(hist_df, 7)

    today_str = now_local.date()
    earlier_today = [
        r for r in history_rows
        if datetime.fromisoformat(r["logged_at"].replace("Z", "+00:00")).astimezone(LOCAL_TZ).date() == today_str
    ]
    today_before = ml.todays_intake(hist_df)
    today_after = {
        "calories": today_before["calories"] + t["calories"],
        "protein_g": today_before["protein_g"] + t["protein_g"],
    }

    context = _feedback_context(user, req.meal_type, macros, earlier_today, today_after, baseline, anomaly)
    fallback = _rule_based_feedback(req.meal_type, t, today_after, user, anomaly)
    feedback = _coach_feedback(context, fallback)           # Feature D

    target_uid = _normalize_uuid(req.user_id)
    try:
        saved = sb().table("meal_logs").insert({
            "user_id": target_uid, "meal_type": req.meal_type,
            "confirmed_items": macros["items"],
            "total_calories": t["calories"], "total_protein": t["protein_g"],
            "total_carbs": t["carbs_g"], "total_fats": t["fats_g"],
            "is_anomaly": anomaly["is_anomaly"], "bot_feedback": feedback,
        }).execute().data[0]
    except Exception as e:
        log.warning(f"Could not persist to Supabase meal_logs table: {e}; generating local receipt")
        saved = {
            "id": str(uuid.uuid4()),
            "user_id": target_uid,
            "meal_type": req.meal_type,
            "confirmed_items": macros["items"],
            "total_calories": t["calories"],
            "total_protein": t["protein_g"],
            "total_carbs": t["carbs_g"],
            "total_fats": t["fats_g"],
            "is_anomaly": anomaly["is_anomaly"],
            "bot_feedback": feedback,
            "logged_at": datetime.now(timezone.utc).isoformat(),
        }

    insights = ml.generate_insights(history_rows + [saved], user)
    return {
        "log": saved,
        "macros": macros,
        "anomaly": anomaly,
        "feedback": feedback,
        "today": insights["today"],
        "targets": insights["targets"],
        "insights": insights,
    }


# ============================================================ Meal history
@router.get("/history/{user_id}")
def get_history(
    user_id: str,
    days: int = 30,
    page: int = 1,
    per_page: int = 20,
    authorization: Optional[str] = Header(None),
):
    """Paginated meal history for the history tab."""
    target_uid = _normalize_uuid(user_id)
    _authorize(user_id, authorization)
    _get_user(user_id)

    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    try:
        # total count
        count_res = (
            sb().table("meal_logs").select("id", count="exact")
            .eq("user_id", target_uid).gte("logged_at", since).execute()
        )
        total = count_res.count or 0

        # paginated rows
        offset = (page - 1) * per_page
        rows = (
            sb().table("meal_logs").select("*")
            .eq("user_id", target_uid).gte("logged_at", since)
            .order("logged_at", desc=True)
            .range(offset, offset + per_page - 1)
            .execute()
        ).data or []

        return {"meals": rows, "total": total, "page": page, "per_page": per_page}
    except Exception as e:
        log.warning(f"Error querying history: {e}")
        return {"meals": [], "total": 0, "page": page, "per_page": per_page}


# ============================================================ Feature C: insights endpoint
@router.get("/insights/{user_id}")
def get_insights(user_id: str, authorization: Optional[str] = Header(None)):
    target_uid = _normalize_uuid(user_id)
    _authorize(user_id, authorization)
    user = _get_user(user_id)
    return ml.generate_insights(_fetch_logs(target_uid), user)
