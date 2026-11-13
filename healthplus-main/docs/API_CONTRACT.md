# HEALTH PLUS — Complete REST API Contract Specification

> **Document Version:** 1.0.0  
> **Base URL:** `https://api.healthplus.casavital.io/api/v1` (Production) / `http://localhost:8000/api/v1` (Local Dev)  
> **Status:** Production Standard  
> **Author:** CASA Vital Backend Engineering  

---

## 1. Global Conventions & Standards

### 1.1 Headers
- `Authorization: Bearer <SUPABASE_JWT_ACCESS_TOKEN>` (Required for all protected endpoints).
- `Content-Type: application/json` (or `multipart/form-data` for image recognition).
- `X-Client-Version: 1.0.0` (Client build identifier).

### 1.2 Unified Success & Error Formats

**Success Envelope:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "meta": { "timestamp": "2026-11-10T06:30:00Z" }
}
```

**Error Envelope (RFC 7807 Compliant):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Daily calorie target must be greater than 1200 kcal",
    "details": [
      { "field": "daily_calorie_target", "issue": "Below safe metabolic floor" }
    ]
  },
  "meta": { "timestamp": "2026-11-10T06:30:00Z" }
}
```

---

## 2. API Endpoint Specifications

---

### 2.1 Profile & Onboarding

#### `GET /profile`
- **Summary:** Retrieve current authenticated user's profile and preferences.
- **Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "id": "c7a840c5-5c58-48be-8f3e-d67bdf8491a1",
    "display_name": "Rahul Verma",
    "age": 29,
    "height_cm": 178.0,
    "weight_kg": 74.5,
    "gender": "male",
    "activity_level": "moderately_active",
    "fitness_goal": "muscle_gain",
    "bmr_kcal": 1720.5,
    "tdee_kcal": 2408.7,
    "target_calories_kcal": 2600.0,
    "target_protein_g": 130.0,
    "target_carbs_g": 325.0,
    "target_fat_g": 72.0,
    "onboarding_completed": true,
    "preferences": {
      "dietary_style": "vegetarian",
      "regional_preference": ["North Indian", "South Indian"],
      "food_allergies": ["peanuts"],
      "disliked_foods": ["bitter gourd"],
      "food_budget_tier": "medium",
      "camera_consent": true,
      "ai_context_consent": true
    }
  }
}
```

#### `PUT /profile`
- **Summary:** Update physical metrics, preferences, or complete onboarding.
- **Request Body:**
```json
{
  "display_name": "Rahul Verma",
  "age": 29,
  "height_cm": 178.0,
  "weight_kg": 74.0,
  "gender": "male",
  "activity_level": "moderately_active",
  "fitness_goal": "muscle_gain",
  "dietary_style": "vegetarian",
  "food_allergies": ["peanuts"],
  "disliked_foods": ["bitter gourd"],
  "regional_preference": ["North Indian"]
}
```
- **Response 200 OK:** Returns updated profile object with newly recalculated BMR/TDEE and macro targets.

---

### 2.2 Food Recognition & Nutrition Diary

#### `POST /food/recognize`
- **Summary:** Upload a food photo for computer vision recognition and Indian nutrition matching.
- **Content-Type:** `multipart/form-data`
- **Form Fields:** `image: File` (Max 8 MB, JPEG/PNG/WebP).
- **Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "detected_items": [
      {
        "food_item_id": "8f8b7252-92ab-426b-85ee-fce4e0c3848b",
        "predicted_name": "Dal Makhani",
        "confidence": 0.942,
        "default_serving_unit": "1 katori (150g)",
        "default_portion_multiplier": 1.0,
        "nutrition_per_unit": {
          "calories_kcal": 240.0,
          "protein_g": 9.2,
          "carbs_g": 26.5,
          "fat_g": 11.4
        }
      },
      {
        "food_item_id": "4b68e991-6872-46bb-9e23-7fa34526b382",
        "predicted_name": "Whole Wheat Roti",
        "confidence": 0.915,
        "default_serving_unit": "2 medium rotis (70g)",
        "default_portion_multiplier": 1.0,
        "nutrition_per_unit": {
          "calories_kcal": 160.0,
          "protein_g": 5.8,
          "carbs_g": 32.0,
          "fat_g": 1.2
        }
      }
    ],
    "is_low_confidence": false,
    "quality_warning": null
  }
}
```

#### `GET /foods/search`
- **Summary:** Autocomplete search across verified Indian food database.
- **Query Params:** `query=paneer&limit=10`
- **Response 200 OK:** List of matching `food_items` with nutritional breakdowns per standard portion.

#### `POST /meals`
- **Summary:** Save a confirmed meal log (from scanner or manual search).
- **Request Body:**
```json
{
  "meal_type": "lunch",
  "log_date": "2026-11-10",
  "source": "camera_scan",
  "items": [
    {
      "food_item_id": "8f8b7252-92ab-426b-85ee-fce4e0c3848b",
      "custom_name": "Dal Makhani",
      "portion_multiplier": 1.0,
      "portion_description": "1 katori (150g)",
      "calories_kcal": 240.0,
      "protein_g": 9.2,
      "carbs_g": 26.5,
      "fat_g": 11.4,
      "confidence_score": 0.942
    },
    {
      "food_item_id": "4b68e991-6872-46bb-9e23-7fa34526b382",
      "custom_name": "Whole Wheat Roti",
      "portion_multiplier": 1.5,
      "portion_description": "3 medium rotis (105g)",
      "calories_kcal": 240.0,
      "protein_g": 8.7,
      "carbs_g": 48.0,
      "fat_g": 1.8,
      "confidence_score": 0.915
    }
  ]
}
```
- **Response 201 Created:** Returns newly created `meal_log` with calculated totals and immutable item snapshots.

#### `GET /meals/daily`
- **Summary:** Fetch all meals logged on a given date.
- **Query Params:** `date=2026-11-10`
- **Response 200 OK:** Daily meal logs grouped by `meal_type` (breakfast, lunch, snacks, dinner) with aggregate daily calories and macros.

#### `DELETE /meals/{id}`
- **Summary:** Delete a specific logged meal.
- **Response 200 OK:** Confirmation of deletion and updated daily totals.

---

### 2.3 Diet Planner & Grocery Lists

#### `POST /diet-plans/generate`
- **Summary:** Generate a data-driven 10-stage personalized diet plan based on IFCT 2017 & ICMR-NIN 2024 RDA formulations.
- **Request Body:**
```json
{
  "duration_days": 7,
  "start_date": "2026-11-10",
  "fitness_goal": "muscle_gain",
  "calorie_target_kcal": 2400.0,
  "dietary_style": "lacto_vegetarian",
  "condition_filters": ["diabetic_safe", "low_sodium_dash"],
  "strict_allergen_exclusions": ["peanuts", "gluten"],
  "regional_preference": "North Indian"
}
```
- **Response 201 Created:** Returns structured `diet_plan` object with day-by-day meals, exact ingredient weights, IFCT codes, and fact-grounded reasonings.
- **Validation Error 422:** Fails if `calorie_target_kcal < 1500` (male) or `< 1200` (female) with error code `CLINICAL_FLOOR_VIOLATION`.

#### `POST /diet-plans/meals/swap`
- **Summary:** Swap a single meal with an approved alternative recipe matching the target macro vector $\pm 5\%$.
- **Request Body:**
```json
{
  "diet_plan_id": "42617f1a-b673-4556-9ef0-1a7395ba57cb",
  "meal_slot": "dinner",
  "current_recipe_id": "paneer-bhurji",
  "requested_cuisine": "North Indian Homestyle"
}
```
- **Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "recipe_id": "soya-matar",
    "title": "Soya Chunk Matar with 3 Whole Wheat Phulkas",
    "calories_kcal": 495.0,
    "protein_g": 38.6,
    "carbs_g": 51.4,
    "fat_g": 10.8,
    "fiber_g": 9.8,
    "sodium_mg": 380.0,
    "potassium_mg": 640.0,
    "ingredients": [
      { "name": "Textured Soya Chunks", "amount": "65g dry", "ifct_code": "IFCT-D022" },
      { "name": "Green Sweet Peas", "amount": "50g", "ifct_code": "IFCT-B024" },
      { "name": "Whole Wheat Flour", "amount": "75g", "ifct_code": "IFCT-A011" }
    ],
    "steps": [
      "Boil soya chunks in salted water for 5 minutes and squeeze out excess moisture.",
      "Saute cumin, onion paste, and pureed tomatoes until fragrant.",
      "Add soya chunks and simmer for 8 minutes to absorb gravy."
    ],
    "why_recommended": "Soya chunks deliver an outstanding 52% protein density with complete amino acid scoring (PDCAAS 1.0) and virtually zero saturated fat, accelerating muscle repair within your calorie target."
  }
}
```

#### `GET /grocery-lists/current`
- **Summary:** Retrieve active grocery checklist aggregated from current diet plan.
- **Response 200 OK:** Ingredients consolidated across days and grouped by category (Produce, Grains, Dairy, Spices, Pantry).

---

### 2.4 Exercise Studio & Posture Tracking

#### `POST /workouts`
- **Summary:** Submit completed exercise session telemetry from client camera tracking.
- **Request Body:**
```json
{
  "exercise_type": "squats",
  "reps_completed": 15,
  "duration_seconds": 64,
  "avg_form_score": 91.5,
  "form_status": "good",
  "form_feedback_summary": [
    "Consistent squat depth achieved on 13 of 15 reps",
    "Minor knee cave detected on rep 14"
  ],
  "estimated_calories_burned": 28.5,
  "session_status": "completed",
  "started_at": "2026-11-10T06:15:00Z",
  "ended_at": "2026-11-10T06:16:04Z"
}
```
- **Response 201 Created:** Workout session saved and immediately linked to `daily_features`.

#### `GET /workouts`
- **Summary:** Retrieve user's historical workout sessions.
- **Query Params:** `limit=20&exercise_type=squats`
- **Response 200 OK:** Array of completed workout sessions and rep volume stats.

---

### 2.5 Health Pattern Intelligence Engine

#### `POST /insights/analyze`
- **Summary:** Trigger pattern analysis across user's historical features and baselines.
- **Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "insights_generated": 2,
    "insights": [
      {
        "id": "1e792d41-3b7c-48c0-84c1-f3b141872f2a",
        "pattern_type": "co_occurrence",
        "headline": "Elevated Protein Intake on Workout Days",
        "explanation": "Your recorded protein consumption averages 104g on days with recorded exercise, compared to 76g on rest days.",
        "evidence_payload": {
          "workout_days_evaluated": 5,
          "rest_days_evaluated": 9,
          "avg_protein_workout_g": 104.2,
          "avg_protein_rest_g": 76.1,
          "window_dates": "2026-10-27 to 2026-11-09"
        },
        "actionable_guidance": "This habit strongly supports your muscle gain target. Consider keeping pre-prepped high-protein snacks handy on rest days too.",
        "confidence_score": 0.89
      }
    ]
  }
}
```

#### `GET /insights`
- **Summary:** Retrieve active health patterns and the latest Weekly Health Story.
- **Response 200 OK:** List of active insight cards with full evidence breakdowns.

---

### 2.6 Context-Aware AI Coach

#### `POST /coach/chat`
- **Summary:** Send a question to the conversational coach with automatic authorized data grounding.
- **Request Body:**
```json
{
  "conversation_id": "47318534-c289-4b8f-ba5d-e25f6902ec56",
  "message": "Why was my energy feeling low earlier this week?"
}
```
- **Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "message_id": "993a4b92-5fe4-44e1-9541-ef5202869dfb",
    "sender": "coach",
    "content": "Looking at your records for Monday and Tuesday, your logged calorie intake was around 1,540 kcal—about 860 kcal below your estimated maintenance target of 2,400 kcal. Additionally, your recorded carbohydrate intake was under 140g. When daily energy intake drops significantly below your personal baseline, feeling sluggish is a very natural response.",
    "grounding_citations": [
      {
        "source": "meal_logs",
        "date_range": "2026-11-03 to 2026-11-04",
        "logged_calories": [1520, 1560]
      }
    ],
    "suggested_followups": [
      "How can I add 300 healthy calories to my lunch?",
      "What are high-energy snack ideas for work?"
    ]
  }
}
```

---

### 2.7 Dashboard & Progress Summary

#### `GET /dashboard`
- **Summary:** Single aggregated payload providing today's nutrition rings, recent meals, latest workout stats, streak count, and top pattern insight.
- **Response 200 OK:** Consolidated dashboard state for fast single-roundtrip initial render.

#### `GET /progress/weekly`
- **Summary:** Historical analytics payload for progress charts over 7, 30, or 90 days.
- **Query Params:** `days=30`
- **Response 200 OK:** Array of daily calories, macro splits, workout volumes, and consistency index.

