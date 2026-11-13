# HEALTH PLUS — Complete User Flows & Journey Maps

> **Document Version:** 1.0.0  
> **Status:** Production Architecture Blueprint  
> **Author:** CASA Vital Product & Engineering  

---

## 1. Flow Overview & Sitemap Matrix

```mermaid
flowchart TD
    Landing[Module 1: Landing Page] -->|Sign Up / Login| Auth[Module 2: Supabase Auth]
    Auth -->|New User| Onboarding[Module 3: Multi-Step Onboarding]
    Auth -->|Existing User| Dashboard[Module 4: Main Dashboard]
    Onboarding -->|Save Profile| Dashboard
    
    Dashboard --> Scanner[Module 5: AI Indian Food Scanner]
    Dashboard --> Diary[Module 6: Nutrition Diary]
    Dashboard --> DietPlanner[Module 7: Personalized Diet Planner]
    Dashboard --> Grocery[Module 8: Grocery List]
    Dashboard --> Exercise[Module 9 & 10: Exercise Studio + Voice Coach]
    Dashboard --> Insights[Module 11: Health Pattern Intelligence]
    Dashboard --> AICoach[Module 12: Context-Aware AI Coach]
    Dashboard --> Progress[Module 13: Progress Reports]
    Dashboard --> Settings[Module 14: Settings & Privacy]
    
    Scanner -->|Confirm & Save| Diary
    DietPlanner -->|Generate List| Grocery
    Exercise -->|Session Complete| Progress
    Diary & Exercise -->|Daily Records| Insights
    Insights & Diary & Exercise -->|Authorized Context| AICoach
```

---

## 2. User Flow 1: Authentication & Onboarding

### 2.1 Journey Narrative
The user visits HEALTH PLUS, signs up with email and password or OAuth via Supabase Auth, verifies their email, and enters a friendly, non-intimidating multi-step onboarding wizard. They supply baseline metrics needed for energy calculations and diet personalization, with optional fields clearly marked.

### 2.2 Detailed Step-by-Step State Flow
```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Web as React Frontend
    participant API as FastAPI Backend
    participant Auth as Supabase Auth
    participant DB as PostgreSQL DB

    User->>Web: Click "Get Started" / "Sign Up"
    Web->>Auth: supabase.auth.signUp(email, password)
    Auth-->>Web: Session + JWT + Verification Email sent
    Web->>User: Display "Verify Email" or proceed to Onboarding
    User->>Web: Begin Onboarding (Step 1: Core Metrics)
    Note over User,Web: Name, Age, Height (cm), Weight (kg), Gender (formula only)
    User->>Web: Step 2: Activity & Goals (Activity multiplier, Target goal)
    User->>Web: Step 3: Diet & Culture (Dietary style, Regional cuisine, Budget tier)
    User->>Web: Step 4: Strict Exclusions (Food allergies, Dislikes)
    User->>Web: Step 5: Routine & Preferences (Meal timings, Workout days)
    User->>Web: Click "Complete Setup"
    Web->>API: POST /api/v1/profile (Bearer JWT, payload)
    API->>API: Validate token claims & payload schemas
    API->>DB: INSERT / UPDATE profiles & user_preferences
    DB-->>API: Profile created
    API-->>Web: 201 Created (Profile details)
    Web->>User: Route to /dashboard with initial welcome state
```

### 2.3 Edge Cases & Guardrails
- **Allergy Enforcement:** Allergies entered (e.g. "Peanuts", "Dairy") are stored as normalized tokens and flagged with strict exclusion priority in diet generation.
- **Optional Skip:** Non-essential fields (food budget tier, exact meal timings) can be skipped with a single click.
- **Data Editing:** Users can revise any attribute at any time from `/settings/profile`.

---

## 3. User Flow 2: AI Indian Food Scanner & Nutrition Diary

### 3.1 Journey Narrative
A user has a meal (e.g. roti, dal makhani, paneer bhurji). They take a photo or select an existing image. The scanner inspects image quality, detects food items using visual AI, presents candidate dishes with confidence scores, lets the user adjust portion sizes, retrieves verified nutrition data from the structured database, and records it to the user's Nutrition Diary.

### 3.2 Detailed Step-by-Step State Flow
```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Food Scanner Modal
    participant API as FastAPI /api/v1/food/recognize
    participant Vision as Food Vision Service
    participant DB as Food Nutrition Database
    participant Diary as Nutrition Diary Service

    User->>UI: Upload or capture food image
    UI->>UI: Check client resolution & preview image
    UI->>API: POST /api/v1/food/recognize (multipart/form-data)
    API->>Vision: Process image with pretrained model
    Vision-->>API: Predicted items [{name: "Dal Makhani", conf: 0.94}, {name: "Roti", conf: 0.91}]
    API->>DB: Query standard portions and nutrient profiles
    DB-->>API: Cal/Protein/Carb/Fat per 100g or serving
    API-->>UI: 200 OK with candidates & default portion weights
    UI->>User: Display recognized items with interactive portion sliders
    alt User corrects or adds item
        User->>UI: Change portion (e.g., 2 Rotis -> 3 Rotis) or add "Salad"
        UI->>UI: Recalculate estimated macros in real time
    end
    User->>UI: Click "Confirm & Log to Diary"
    UI->>API: POST /api/v1/meals (meal_type, items, logged_at)
    API->>Diary: Create immutable meal_log and meal_log_items snapshots
    Diary-->>UI: 201 Created
    UI->>User: Toast notification + Dashboard nutrition rings update immediately
```

### 3.3 Handling Uncertainty & Failure Modes
- **Blurry or Unidentifiable Food:** If confidence < 50%, system displays: *"We couldn't clearly identify this dish. Please search our database or enter details manually."*
- **Camera Permission Blocked:** Displays clear browser settings prompt with fallback to manual search bar.
- **Transparency Statement:** Card explicitly notes: *"Nutritional estimates are calculated based on standard serving sizes and may vary with cooking oils and recipes."*

---

## 4. User Flow 3: Personalized Diet Planner & Grocery List

### 4.1 Step-by-Step Flow
1. **Access:** User navigates to `/diet-planner`.
2. **Preference Check:** The system verifies current BMR/TDEE calculation and user dietary preferences (e.g., 2,100 kcal target, Vegetarian, North Indian, Peanut allergy).
3. **Plan Generation:** User clicks "Generate My Plan" or views the existing weekly schedule.
4. **Meal Inspection:** User expands any meal card (e.g., Lunch: Palak Paneer with Brown Rice) to inspect ingredients, cooking time, and macro breakdown.
5. **Swap Meal Action:** If user dislikes a suggested meal, they click "Swap Meal". The backend queries recipe templates matching the user's macro target (+/- 10%) and excluding allergens, offering 3 instant alternatives.
6. **Grocery List Sync:** User clicks "Export to Grocery List". The system combines all recipe ingredients, aggregates weights, groups by supermarket aisles (Vegetables, Grains, Dairy), and saves to `/grocery-list`.

---

## 5. User Flow 4: Exercise Studio & Adaptive Voice Coach

### 5.1 Journey Narrative
The user selects an exercise (Squats or Push-ups), positions their device camera, and initiates a live session. The camera feed assesses joint angles and posture in real-time, displays live skeleton wireframes, counts completed reps, and delivers instantaneous audio cues. When the session finishes, a structured performance summary is recorded to the backend.

### 5.2 Flow Chart
```mermaid
stateDiagram-v2
    [*] --> SelectExercise: User chooses Squats or Push-ups
    SelectExercise --> CameraPermission: Request WebCam Access
    CameraPermission --> PermissionDenied: User Denies
    PermissionDenied --> SelectExercise: Show guidance to enable camera
    CameraPermission --> CameraActive: Access Granted
    
    CameraActive --> ReadyCheck: User enters frame (full body visible)
    ReadyCheck --> WorkoutActive: 3-2-1 Countdown starts
    
    state WorkoutActive {
        [*] --> TrackingPose
        TrackingPose --> AngleEvaluation: Joint landmarks detected
        AngleEvaluation --> RepCountIncrement: Full ROM completed
        AngleEvaluation --> PostureCue: Form deviation detected (e.g. knees caving)
        PostureCue --> VoiceSynthesizer: Immediate low-latency spoken prompt
        RepCountIncrement --> TrackingPose
    }
    
    WorkoutActive --> Paused: User clicks Pause / leaves frame
    Paused --> WorkoutActive: User clicks Resume
    WorkoutActive --> FinishSession: User clicks "Complete Workout" or reaches target
    
    FinishSession --> SummaryModal: Render Reps, Form Score, Active Duration
    SummaryModal --> BackendSync: POST /api/v1/workouts
    BackendSync --> [*]: Redirect to Dashboard / Progress
```

### 5.3 Biomechanical Safety & Confidence Thresholds
- **Confidence Check:** If landmark visibility score < 0.65 (e.g., lighting too dim or limbs cut off by frame), the system pauses rep evaluation and displays: *"Please adjust camera position so your full body is visible."*
- **Speech Throttling:** Spoken corrections have a minimum debounce cooldown of 4.5 seconds to avoid repetitive verbal clutter.

---

## 6. User Flow 5: Health Pattern Intelligence & Weekly Health Story

### 6.1 Systematic Processing Pipeline
```mermaid
flowchart TD
    RawData[(Historical Meal Logs & Workout Sessions)] --> Validate[Validation & Data Sanitization]
    Validate --> DailyFeats[Daily Feature Extraction:\nCalories, Protein %, Workout Volume, Logging Consistency]
    DailyFeats --> RollingBase[Calculate Personal Baseline:\n7-day & 28-day Rolling Averages + Standard Deviation]
    RollingBase --> DeviationCheck{Significant Deviation\nor Co-occurrence?}
    
    DeviationCheck -- Yes --> EvidenceCheck{Sufficient Data?\n>= 5 active days in 14-day window}
    DeviationCheck -- No --> NoPattern[Maintain Baseline State]
    
    EvidenceCheck -- Yes --> GenInsight[Generate Explainable Insight Card\nwith Underlying Evidence Chips]
    EvidenceCheck -- No --> DataNote[Prompt user: 'Log 2 more days to unlock pattern analysis']
    
    GenInsight --> WeeklyStory[Compile Weekly Health Story:\n1. Highlights 2. Shifts 3. Discovered Patterns 4. Next Focus]
    WeeklyStory --> UI[Display on Insights Page & Dashboard]
```

### 6.2 Example Evidence-Based Presentation
- **Headline:** *"Consistent Post-Workout Protein Adherence"*
- **Observation:** *"On days you completed a workout session, your recorded protein intake averaged 108g (vs. 74g on non-workout days)."*
- **Evidence Toggle:** *"Based on 4 workouts logged between Nov 1 and Nov 7, 2026. Data completeness: 88%."*
- **Actionable Takeaway:** *"Maintaining this protein distribution supports muscle recovery without requiring extra meal preparation."*

---

## 7. User Flow 6: Context-Aware AI Personal Health Coach

### 7.1 Conversational Journey
1. **Initiation:** User clicks floating AI Coach widget or visits `/ai-coach`.
2. **Context Assembly:** FastAPI backend gathers authorized user context:
   - Profile metrics (Age, Goal, Allergies, Diet style)
   - Last 7 days nutrition aggregates (Average Calories, Macro split)
   - Recent workout performance (Completed reps, session frequency)
   - Active Health Pattern insights
3. **Safety Verification:** Pre-prompt security sanitizes user input, rejecting prompt-injection attempts and screening for acute clinical queries (e.g., chest pain, self-diagnosis, medication prescriptions).
4. **Contextual Grounding:** LLM prompt is injected with the verified metrics as structured JSON.
5. **Execution:** Response streams to the UI with clickable context tags (e.g. `[Referencing Nov 5-9 Workout Logs]`).
6. **Follow-Up Suggestions:** Three relevant next question chips appear beneath the response.

