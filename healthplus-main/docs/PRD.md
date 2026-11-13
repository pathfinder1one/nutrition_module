# HEALTH PLUS — Product Requirements Document (PRD)

> **Document Version:** 1.0.0  
> **Status:** Approved Architecture Draft  
> **Author:** CASA Vital Team (Product & Engineering)  
> **Product Name:** HEALTH PLUS  
> **Tagline:** Observe. Understand. Guide.  
> **Category:** AI-Powered Personal Health and Wellness Platform  

---

## 1. Executive Summary & Vision

**HEALTH PLUS** is a unified, intelligent personal wellness ecosystem developed by **CASA Vital**. Rather than functioning as an isolated calorie tracker, a disconnected workout counter, or an open-ended generic chatbot, HEALTH PLUS bridges nutrition, physical activity, and historical lifestyle habits into a continuous, explainable feedback loop.

### 1.1 The Core Product Philosophy
1. **Observe:** Collect user-confirmed food logs, macro/micronutrient estimates, and computer-vision-assisted exercise performance metrics.
2. **Understand:** Analyze historical records through statistical baseline modeling, identify meaningful behavioral and physiological patterns over time, and compare activity against the user's personal baseline (not arbitrary generic stereotypes).
3. **Guide:** Provide contextual, explainable, and actionable suggestions through an AI-powered personal coach and dynamic diet/workout planners.

### 1.2 Key Differentiators
- **Health Pattern Intelligence Engine:** Uncovers multi-week trends, habit co-occurrences, and baseline shifts backed by transparent evidence chips rather than black-box guesses.
- **Explainability First:** Zero fabricated statistics, zero simulated trends. If a user logs data for only three days, the platform explicitly acknowledges data constraints instead of extrapolating falsified progress.
- **Strict Medical Non-Prescription Boundary:** Clearly demarcates wellness guidance from clinical or physiotherapy diagnosis.
- **Premium Startup Aesthetic:** Combines nature-inspired wellness tones (Deep Forest Green, Emerald, Sage, Warm Ivory, Gold) with fluid kinetic animations and selective 3D visualizations.

---

## 2. Target Users & Personas

| Persona | Archetype | Needs & Goals | Core Frustration with Existing Tools |
| :--- | :--- | :--- | :--- |
| **P1: Active Professional** | Busy software engineer or consultant (26–42 yrs) | Quick meal logging (Indian/multicultural foods), posture-correct workouts at home, high-level pattern summaries. | Cumbersome manual logging, tools ignoring Indian cuisine specifics, noisy push notifications. |
| **P2: Lifestyle Improver** | Beginner to intermediate fitness seeker | Actionable diet planning on a budget, habit consistency tracking, voice cues during exercise. | Generic diet plans with inaccessible ingredients, intimidating interfaces, no feedback on posture. |
| **P3: Habit Optimizer** | Data-oriented wellness enthusiast | Wants to see correlations between meal consistency, energy levels, and exercise frequency over 30–90 days. | Disconnected apps for food, gym, and sleep; lack of holistic pattern synthesis. |

---

## 3. Product Scope & Module Breakdown

### Module 1: Landing Website
- **Objective:** Premium, startup-grade marketing front that articulates the product philosophy and hooks prospective users.
- **Required Sections:**
  1. Fixed Header / Navigation Bar with blur backdrop and quick CTA.
  2. Hero Section featuring strong headline, value prop, primary/secondary CTAs, 3D interactive wellness core, ambient organic gradient mesh.
  3. Product Introduction & Mission Statement.
  4. Problem Statement (fragmented health tools, blind calorie counting).
  5. The Solution (integrated Observe-Understand-Guide triad).
  6. How HEALTH PLUS Works (3-step interactive progression).
  7. Main Feature Showcase (tabs/bento grid).
  8. Interactive Food Scanning Demonstration.
  9. Exercise Intelligence & Posture Demonstration.
  10. Health Pattern Intelligence Showcase (connecting nodes/evidence).
  11. AI Personal Coach Showcase.
  12. Why HEALTH PLUS (comparison matrix).
  13. FAQ (collapsible accordions).
  14. Footer with system status, privacy, terms, and brand links.

### Module 2: Authentication & Authorization
- **Technology:** Supabase Auth with JSON Web Tokens (JWT) verified server-side in FastAPI.
- **Features:** Signup, Login, Password Reset, Email Verification, Session Persistence, Secure Logout.
- **Security:** Strict Row-Level Security (RLS) on PostgreSQL. Client requests must supply bearer tokens; user identity is derived purely from verified claims, never trusted from client request bodies.

### Module 3: User Onboarding & Personal Profile
- **Workflow:** Multi-step wizard with persistent progress indicator, back/next navigation, and optional field skip.
- **Collected Attributes:** Name, Age, Height (cm), Weight (kg), Biological Gender (collected solely where required for Mifflin-St Jeor metabolic formulas), Activity Level (Sedentary, Lightly Active, Moderately Active, Very Active, Extra Active), Primary Goal (Weight Loss, Maintenance, Muscle Gain, Endurance), Dietary Preferences (Vegetarian, Vegan, Eggetarian, Non-Vegetarian, Jain, Pescatarian), Regional Preferences (North Indian, South Indian, Coastal, Continental, etc.), Allergies (Nuts, Dairy, Gluten, Soy, Shellfish, etc. — **strictly enforced as exclusions**), Disliked Foods, Food Budget Tier, Preferred Meal Timings, Preferred Workout Days.
- **Constraints:** Profile editable anytime in Settings. No forced optional fields.

### Module 4: Main Dashboard
- **Components:**
  - Welcome banner with contextual greeting, current streak, and quick action bar (Scan Food, Start Exercise, Ask Coach).
  - Daily Nutrition Summary (Calorie budget vs. consumed, Macronutrient breakdown: Carbs, Protein, Fat with animated progress rings).
  - Today's Meal Summary (Breakfast, Lunch, Snacks, Dinner log cards).
  - Daily Activity & Exercise Summary (Completed sessions, reps, duration).
  - Goal Progress Card with transparent calculation indicators.
  - Recent Activity Feed.
  - Weekly Nutrition & Activity Trend Preview.
  - Health Pattern Insight Widget (highlights highest-confidence current insight).
  - Meaningful, inspiring Empty States for new accounts (no dummy/fake metrics).

### Module 5: AI Indian Food Scanner & IFCT 2017 Dataset Integration
- **Workflow:** Image upload / live camera capture -> Preview & blur validation -> Multi-dish optical vision recognition -> Top predicted items with confidence scores -> User portion confirmation (e.g. 1 bowl, 2 rotis, 150g) -> Chemical mapping against Indian Food Composition Tables (IFCT 2017, ICMR-NIN) -> Structured macro and micronutrient extraction (Calories, Protein, Carbs, Fats, Dietary Fiber, Sodium, Potassium, Iron) -> User saves meal -> Instant dispatch to Nutrition Diary & Timeline.
- **Data Foundation:** 100% grounded in peer-reviewed ICMR-NIN 2017 food composition analyses and ICMR-NIN 2024 Dietary Guidelines for Indians. No speculative or crowd-sourced estimates.
- **Edge Cases Handled:** Multi-dish thali plates, low-confidence predictions, offline/API errors, camera permission denial, duplicate logs.
- **Transparency Notice:** Explicitly informs users that camera estimation provides an approximation, backed by a direct "Inspect IFCT Food Codes" ingredient breakdown modal.

### Module 6: Nutrition Diary
- **Structure:** Daily breakdown categorized into Breakfast, Lunch, Snacks, and Dinner.
- **Capabilities:** Add from scanner, add manually with autocompleting search, edit quantity/portion, delete log, view hourly meal timeline, compare actual consumed vs. planned diet targets.
- **Data Integrity:** Snapshots food nutrition at the moment of logging so historical data remains immutable even if master food entries update.

### Module 7: Data-Driven Personalized Diet Planner & Recommendation Engine
- **Engine:** 10-stage optimization pipeline combining Mifflin-St Jeor metabolic formulations, ICMR-NIN 2024 RDA distributions, IFCT 2017 recipe retrieval, and mathematical constraint scoring.
- **Condition-Aware Safety Engine:** Explicit clinical rules for Type 2 Diabetes / Pre-diabetes (Glycemic Index < 55), Hypertension (Sodium cap < 1,800 mg/day, high Potassium), and Celiac (strict gluten exclusion).
- **Clinical Safety Floor Policy:** Strict refusal to generate starvation deficits (< 1,500 kcal/day for males, < 1,200 kcal/day for females).
- **Features:** Today's Plan, 7-day Weekly Plan, authentic appetizing Indian recipe cards (exact grams, prep/cook times, step-by-step instructions), one-click "Swap Meal" with real-time target recalculation, and automatic grocery list dispatch.
- **Explainability:** Fact-grounded generative explanation layer detailing why each recipe was chosen to satisfy the user's specific baseline.

### Module 8: Grocery List
- **Functionality:** Aggregates ingredients across the active diet plan for the selected date window (e.g., 3 days, 7 days).
- **Features:** Categorized grouping (Produce, Grains & Pulses, Dairy, Spices, Pantry), quantity consolidation (e.g., 300g oats + 200g oats = 500g oats), interactive check-off items, add manual items, remove items, clear completed items.

### Module 9: Exercise Studio & Realistic Human Pose Biomechanics
- **Scope:** Real-time camera-based workout session tracking for Squats and Push-ups with realistic human biomechanical visualization (zero stick-figures).
- **Integration Boundary:** Consumes structured events from the specialized exercise sub-system developed by CASA Vital exercise specialists (A & B) via standardized JSON pose telemetry.
- **HUD Elements:** Live camera viewfinder, 33-point MediaPipe landmark overlay, anatomical muscle/joint contours, live joint angle arcs (e.g. knee flexion 88°, hip hinge 42°), rep counter HUD with progress bar, cadence tracker (1.8s/rep), and movement phase indicator (Descent, Inflection, Ascent).
- **Privacy Standard:** Zero video uploads. All 33 3D pose landmarks are computed locally inside browser WebAssembly memory.

### Module 10: Adaptive AI Voice Fitness Coach
- **Capabilities:** Low-latency, contextual audio guidance during active exercise sessions (e.g., "Keep your chest up", "Great depth, drive through your heels", "Hold at the top").
- **Architecture:** Client-side deterministic cue engine using Web SpeechSynthesis API for sub-100ms response time, preventing jitter or LLM network latency during strenuous exercise.
- **User Control:** Mute/unmute toggle, voice rate and pitch selectors, volume control.

### Module 11: Health Pattern Intelligence Engine (Core Differentiator)
- **Role:** Deep analytical pipeline that evaluates multi-day/multi-week user records to surface explainable, non-obvious correlations and baseline deviations.
- **Key Pattern Types:**
  1. *Activity Consistency:* Variance in workout days and cadence.
  2. *Nutrition Logging Consistency:* Regularity of complete daily tracking.
  3. *Activity Shifts:* Meaningful increases or drops compared to the rolling 14-day baseline.
  4. *Nutrition Shifts:* Shifts in protein density, late-night eating frequency, or hydration.
  5. *Co-occurrence Patterns:* Relationships between regular meal logging and workout completion.
  6. *Weekly Health Story:* An editorial narrative synthesizing what went well, what shifted, observed patterns, and one actionable focus for the next week.
- **Integrity Rule:** Missing logs are flagged as "unrecorded data", never penalized as "user skipped meal". Correlation is explicitly distinguished from causation. Every insight card provides an "Evidence" toggle displaying the underlying data points.

### Module 12: Context-Aware AI Personal Health Coach
- **Nature:** Conversational assistant grounded strictly in the user's authorized profile, meal logs, workout sessions, and pattern insights.
- **Safety & Guardrails:**
  - Zero hallucination of user stats (references only verified backend metrics).
  - Hard clinical boundary: Automatically redirects symptom questions, prescription requests, or potential eating disorder patterns to licensed medical professionals.
  - Suggested contextual prompts (e.g., "Why was my protein lower on workout days?", "Suggest a high-protein vegetarian breakfast based on my allergies").

### Module 13: Progress Reports
- **Visual Analytics:** Interactive trend charts showing calorie intake vs. burn, macronutrient adherence over 7/30/90 days, workout volume and repetition records, consistency index.
- **Data Filtering:** Custom date ranges, metric toggles, exportable summary format.

### Module 14: Notifications & Settings
- **Preferences:** Notification toggles for meal tracking reminders, workout alerts, weekly story publication.
- **Privacy & Compliance:** Camera permission state, AI feature opt-in/opt-out, Data export (JSON dump), Permanent account and data deletion request (GDPR/DPDP compliance).

---

## 4. Non-Functional Requirements

### 4.1 Performance & Latency
- First Contentful Paint (FCP) < 1.2s on desktop, < 1.8s on 4G mobile.
- Exercise Studio camera rendering: Stable 30–60 FPS with pose overlay.
- Real-time voice coaching cue latency < 150ms.
- API endpoints P95 response time < 250ms (excluding external AI vision/LLM generation).

### 4.2 Security & Compliance
- HTTPS / TLS 1.3 across all endpoints.
- Supabase PostgreSQL with strict Row Level Security (RLS) policies.
- Zero client-side API secrets; all external services (OpenAI/Anthropic/Gemini, Vision APIs) routed through FastAPI backend.
- Ephemeral image processing: uploaded meal photos are processed in memory and discarded or securely retained only with explicit user consent.
- Camera feeds in Exercise Studio are processed strictly client-side in the browser canvas; raw video is **never** uploaded or recorded on servers.

### 4.3 Accessibility
- WCAG 2.1 AA compliance across all UI components.
- Full keyboard navigation and visible focus rings.
- Strict support for `prefers-reduced-motion` across CSS animations, Framer Motion, and Three.js scenes.
- Screen reader labels for all icon buttons, progress rings, and data charts.

---

## 5. Success Metrics & KPIs

1. **User Engagement:** Weekly Active Users (WAU) logging meals >= 4 days/week.
2. **Scanner Usability:** > 85% of scanned meals confirmed with 1 or fewer manual ingredient corrections.
3. **Exercise Retention:** Average workout completion rate > 80% once session is initiated.
4. **Insight Value:** > 75% positive user feedback on Health Pattern Intelligence insight cards ("Was this helpful?").
5. **System Health:** Zero unauthorized cross-user data access incidents, < 0.1% unhandled API 500 errors.

