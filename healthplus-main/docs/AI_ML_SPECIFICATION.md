# HEALTH PLUS — AI/ML Architecture & Algorithmic Specification

> **Document Version:** 2.0.0  
> **Status:** Production Standard  
> **Author:** CASA Vital AI & Systems Engineering  
> **Target Platform:** HEALTH PLUS Personal Wellness Intelligence  

---

## 1. Algorithmic Classification & Scientific Foundation

HEALTH PLUS strictly rejects "AI theater" and ungrounded LLM prompts. Every intelligent capability is classified transparently into its true mathematical discipline. We do not invent fictional neural networks or mislabel statistical filters as custom deep learning.

| Feature Module | Method Classification | Core Technology / Library | Purpose & Execution Boundary |
| :--- | :--- | :--- | :--- |
| **Food Recognition** | Pretrained Computer Vision | Pretrained Food Classifier / Vision API + IFCT 2017 Lookup | Detects candidate dishes; user reviews portions and confirms exact serving. |
| **Diet Recommendation** | Multi-Stage Constrained Optimization | Linear / Integer Optimization + Vector Content Filtering | 10-stage pipeline solving macro/micronutrient equations over verified ICMR-NIN tables. |
| **Safety Engine** | Deterministic Hard Constraint Rules | Rule-based Exclusion Filters + Clinical Floor Floors | Eliminates allergens, enforces medical condition bounds (GI < 55, Sodium < 1800mg). |
| **Exercise Pose Detection** | Pose Estimation + Biomechanical Rules | MediaPipe Pose (WASM) + Joint Kinematics | Tracks 33 3D body landmarks client-side; calculates joint angles without cloud video streaming. |
| **Voice Coaching Cues** | Rule-Based State Machine + Speech Synthesis | Finite State Machine + Web SpeechSynthesis API | Fires deterministic verbal prompts in < 100ms based on angle thresholds (e.g. knee angle < 90°). |
| **Diet Energy Calculation** | Deterministic Metabolic Formulations | Mifflin-St Jeor Equation + Activity Multipliers | Computes baseline BMR & TDEE; strictly non-prescriptive floor constraints. |
| **Health Pattern Intelligence** | Statistical Baseline Modeling + Rolling Deviation Analysis | Rolling Averages, Z-Scores, Pearson Co-occurrence | Extracts personal baseline ($\mu, \sigma$); identifies shifts and behavioral links backed by evidence chips. |
| **Context-Aware Health Coach** | Grounded Generative AI (RAG) | Large Language Model API (via FastAPI Gateway) | Generates empathetic, contextual explanations using validated application metrics. |

---

## 2. Authoritative Nutrition Datasets & Scientific Citations

HEALTH PLUS relies on peer-reviewed, scientifically validated food composition tables rather than generic or crowd-sourced calorie estimates:

### 2.1 Primary Indian Dataset: Indian Food Composition Tables (IFCT 2017)
- **Publishing Authority:** ICMR - National Institute of Nutrition (NIN), Ministry of Health & Family Welfare, Government of India (Hyderabad).
- **Scope:** 528 key foods across 17 distinct food groups commonly consumed in India.
- **Nutritional Parameters:** 151 nutrient and bioactive parameters per food item, analyzed via advanced analytical methods:
  - Proximate principles (moisture, protein by Dumas/Kjeldahl, crude fat by Soxhlet, dietary fiber by enzymatic-gravimetric AOAC, available carbohydrate, energy).
  - Minerals and trace elements (calcium, iron, phosphorus, magnesium, sodium, potassium, zinc).
  - Fat-soluble and water-soluble vitamins (retinol, thiamine, riboflavin, niacin, total folates, ascorbic acid).
  - Amino acid and fatty acid profiles (saturated, MUFA, PUFA, essential amino acid breakdown).

### 2.2 Clinical Baseline: ICMR-NIN Dietary Guidelines for Indians (2024)
- **Publishing Authority:** ICMR-NIN (2024 Revision).
- **Application:** Defines baseline Recommended Dietary Allowances (RDA) and Estimated Average Requirements (EAR) across demographic segments:
  - Adult reference protein intake: 0.83 g/kg/day standard, extending to 1.6–2.0 g/kg/day for active hypertrophy training.
  - Total fat requirement: 20% to 30% of total energy intake, with saturated fatty acids capped at $< 8\%$ and trans-fat $< 1\%$.
  - Carbohydrate threshold: 50% to 60% of total daily energy, prioritizing complex dietary fibers ($> 30\text{g/day}$).
  - Sodium cap: $\le 2,000\text{mg/day}$ (corresponding to $\le 5\text{g}$ common salt).

### 2.3 Global Complement: USDA FoodData Central (Foundation Foods & FNDDS)
- **Publishing Authority:** Agricultural Research Service, U.S. Department of Agriculture.
- **Application:** Used for global ingredients, unprocessed whole foods, and micronutrient normalization where regional Indian data requires cross-verification.

---

## 3. The 10-Stage Data-Driven Diet Recommendation Pipeline

Instead of prompting an LLM to hallucinate arbitrary meal menus, HEALTH PLUS implements a **10-stage optimization pipeline** where generative models only act at the final step to explain mathematically verified meal allocations.

```
[1. User Profile & Constraints]
           │
[2. BMR / TDEE Calculation (Mifflin-St Jeor)]
           │
[3. Target Macro/Micro Distribution (ICMR-NIN RDA)]
           │
[4. Hard Safety & Exclusion Filter (Allergens & Clinical Floors)]
           │
[5. IFCT 2017 & USDA Food Database Retrieval]
           │
[6. Optimization & Scoring Algorithm (Content-Based Filtering)]
           │
[7. Multi-Meal Plan Construction (Macro Target ± 5%)]
           │
[8. Recipe Variety & Cultural Preference Filter]
           │
[9. Fact-Grounded Explanation Layer (LLM RAG)]
           │
[10. User Confirmation & Feedback Loop]
```

### Stage 1: User Profile Ingestion
Collects verified demographic and physiological variables:
- Age ($A$), Sex ($S$), Weight ($W$ in kg), Height ($H$ in cm).
- Health conditions: Type 2 Diabetes / Pre-diabetes, Hypertension, Celiac / Gluten sensitivity, Lactose intolerance, Chronic Kidney Disease, Hyperuricemia / Gout.
- Dietary preferences: Lacto-vegetarian, Ovo-vegetarian, Vegan, Non-vegetarian, Jain (no root vegetables).

### Stage 2: BMR & TDEE Formulation
- **Basal Metabolic Rate (BMR) via Mifflin-St Jeor Equation:**
  $$\text{BMR}_{\text{male}} = 10W + 6.25H - 5A + 5$$
  $$\text{BMR}_{\text{female}} = 10W + 6.25H - 5A - 161$$
- **Total Daily Energy Expenditure (TDEE):**
  $$\text{TDEE} = \text{BMR} \times \text{PAL}$$
  *(PAL: Sedentary $1.2$, Lightly Active $1.375$, Moderately Active $1.55$, Highly Active $1.725$).*

### Stage 3: Nutritional Target Distribution
Adjusts TDEE according to fitness goals within safe bounds:
- Weight Loss: $\text{TDEE} - 350\text{ kcal}$ to $-500\text{ kcal}$.
- Muscle Hypertrophy: $\text{TDEE} + 250\text{ kcal}$ to $+350\text{ kcal}$.
- Macronutrient allocation:
  - Protein: $1.6 - 2.0\text{ g/kg}$ (Hypertrophy) or $1.0 - 1.2\text{ g/kg}$ (Maintenance).
  - Dietary Fat: $25\% - 30\%$ of total target calories.
  - Carbohydrates: Remaining calorie allocation with $> 35\text{g}$ dietary fiber.

### Stage 4: Hard Safety Constraints & Clinical Floors
- **Absolute Calorie Floor:**
  $$\text{Calorie Target}_{\text{female}} \ge 1,200\text{ kcal/day}$$
  $$\text{Calorie Target}_{\text{male}} \ge 1,500\text{ kcal/day}$$
  *Any deficit request violating these floors is automatically rejected.*
- **Allergen Removal:** Binary exclusion vector removing all food items containing tagged allergens (e.g., gluten, tree nuts, peanuts, lactose, shellfish, soy).
- **Condition-Specific Clinical Rules:**
  - *Diabetic / Pre-diabetic:* Enforce Glycemic Index $\text{GI} < 55$, Glycemic Load $\text{GL} < 10$ per meal, and minimum $8\text{g}$ soluble fiber per meal.
  - *Hypertension / Cardiovascular:* Sodium capped at $\le 1,800\text{mg/day}$; Potassium target $\ge 3,500\text{mg/day}$.
  - *Chronic Kidney Disease (Non-dialysis):* Protein restricted to $0.6 - 0.8\text{ g/kg}$; Phosphorus and Potassium capped per clinical guideline.
  - *Gout / Hyperuricemia:* Strict exclusion of high-purine foods (organ meats, red meats, sardines, brewer's yeast, high-fructose syrups).

### Stage 5: Database Candidate Retrieval
Queries the verified IFCT 2017 database and recipe catalog for all compliant meal candidates meeting the dietary preference and allergen filters.

### Stage 6: Mathematical Scoring & Optimization
Recipes are scored based on proximity to meal target vector $\vec{T} = [c_{\text{target}}, p_{\text{target}}, f_{\text{target}}, k_{\text{target}}]$ using cosine similarity penalized by micro-nutrient deviations and preparation complexity:
$$\text{Score}(R_i) = \frac{\vec{R}_i \cdot \vec{T}}{\|\vec{R}_i\| \|\vec{T}\|} - \lambda_1 (\text{Sodium Deviation}) + \lambda_2 (\text{Fiber Bonus}) - \lambda_3 (\text{Repeat Penalty})$$

### Stage 7: Meal Plan Construction
Constructs 4 daily eating occasions (Breakfast: 25%, Lunch: 35%, Evening Snack: 10%, Dinner: 30%) such that the day's total macronutrients remain within $\pm 5\%$ of the target.

### Stage 8: Recipe Variety & Regional Cultural Filter
Enforces a 7-day non-repetition penalty ensuring main meals are not duplicated within 48 hours, while matching regional preference (North Indian, South Indian, Maharashtrian, Bengali, Gujarati).

### Stage 9: Fact-Grounded Generative Explanation Layer
The selected meal plan is provided to the LLM alongside its exact IFCT nutritional breakdown. The LLM produces a concise, empathetic explanation strictly referencing the verified ingredients (e.g. *"Selected Paneer Bhurji with Methi Paratha to provide 34g bioavailable protein for post-workout recovery, while fresh fenugreek supports glucose stabilization"*).

### Stage 10: Feedback & Swap Mechanism
Allows the user to trigger a single-meal swap (e.g., Dinner swap) which re-executes Stage 6 over alternative candidates matching the exact remaining calorie and macro budget.

---

## 4. Realistic Human Exercise Computer Vision & Pose Topology

### 4.1 33-Point MediaPipe Pose Topology
HEALTH PLUS eliminates stick-figure representations in favor of realistic human biomechanical tracking. The client-side WebAssembly engine processes camera frames at 60 FPS across 33 3D Cartesian coordinates ($x, y, z, \text{visibility}$):

- **Upper Torso & Shoulders:** Left Shoulder (11), Right Shoulder (12), Left Elbow (13), Right Elbow (14), Left Wrist (15), Right Wrist (16).
- **Core & Spine:** Mid-shoulder midpoint to mid-hip midpoint vector defining true anatomical spinal incline.
- **Lower Extremities:** Left Hip (23), Right Hip (24), Left Knee (25), Right Knee (26), Left Ankle (27), Right Ankle (28), Left Heel (29), Right Heel (30), Left Foot Index (31), Right Foot Index (32).

### 4.2 Joint Kinematics & Geometric Formulations

#### A. Squats (Knee Flexion & Hip Hinge)
- **Knee Flexion Angle ($\theta_{\text{knee}}$):**
  $$\theta_{\text{knee}} = \arccos\left(\frac{\vec{v}_{\text{hip-knee}} \cdot \vec{v}_{\text{ankle-knee}}}{\|\vec{v}_{\text{hip-knee}}\| \|\vec{v}_{\text{ankle-knee}}\|}\right)$$
  - Standing / Lockout: $\theta_{\text{knee}} > 165^\circ$.
  - Inflection / Optimal Depth: $85^\circ \le \theta_{\text{knee}} \le 95^\circ$.
- **Hip Hinge Angle ($\theta_{\text{hip}}$):**
  $$\theta_{\text{hip}} = \arccos\left(\frac{\vec{v}_{\text{shoulder-hip}} \cdot \vec{v}_{\text{knee-hip}}}{\|\vec{v}_{\text{shoulder-hip}}\| \|\vec{v}_{\text{knee-hip}}\|}\right)$$
  - Target incline during descent: $40^\circ \le \theta_{\text{hip}} \le 55^\circ$ without lumbar flexion.

#### B. Push-ups (Elbow Flexion & Rigid Plank)
- **Elbow Flexion Angle ($\theta_{\text{elbow}}$):**
  $$\theta_{\text{elbow}} = \arccos\left(\frac{\vec{v}_{\text{shoulder-elbow}} \cdot \vec{v}_{\text{wrist-elbow}}}{\|\vec{v}_{\text{shoulder-elbow}}\| \|\vec{v}_{\text{wrist-elbow}}\|}\right)$$
  - Top Lockout: $\theta_{\text{elbow}} > 165^\circ$.
  - Bottom Chest Depth: $85^\circ \le \theta_{\text{elbow}} \le 95^\circ$.
- **Plank Linearity:** Linear regression across Shoulder (11/12), Hip (23/24), and Ankle (27/28) must maintain deviation $< 15^\circ$ from $180^\circ$ straight axis.

### 4.3 Sub-100ms Deterministic Voice Coach Engine
- Evaluates kinematic states client-side in real-time.
- Latency is strictly sub-100ms (typical WebAssembly inference: $18\text{ms} - 32\text{ms}$).
- Web Speech API synthesizes audio cues locally without sending audio or video to any external server.
- Debounced by 3.8 seconds to avoid auditory fatigue.

### 4.4 CASA Vital Teammate Responsibility Boundary
- **Exercise Specialists A & B:** Author and train the core MediaPipe posture detection models, repetition counting state machines, and angle threshold configurations.
- **Frontend / Integration Architect:** Builds the responsive biometric HUD, live landmark coordinate visualizer, sound wave kinetic displays, and standardized JSON telemetry ingestion layer (`PoseTelemetryFrame`).

---

## 5. Module 11: Statistical Pattern Intelligence & Rolling Baselines

### 5.1 Missing Data Policy
- Missing records are categorized as `UNRECORDED_DATA` and strictly excluded from averaging.
- A day qualifies for baseline calculation only if $\ge 3$ meals or explicit daily completion confirmation was logged.

### 5.2 28-Day Rolling Gaussian Baselines
For any tracked biomarker $X$:
$$\mu_{28} = \frac{1}{N} \sum_{i=1}^N X_i, \quad \sigma_{28} = \sqrt{\frac{1}{N-1} \sum_{i=1}^N (X_i - \mu_{28})^2}$$
- **Deviation Trigger:** If $|Z| = \left|\frac{X_{\text{current}} - \mu_{28}}{\sigma_{28}}\right| \ge 1.75$ for 2 or more consecutive days, a significant lifestyle shift is flagged.

### 5.3 Co-Occurrence Mining
Evaluates correlations between independent lifestyle domains (e.g. workout session occurrence vs same-day protein intake) using two-sample Welch's t-test ($p < 0.05$) before surfacing insights to the user.

---

## 6. Regulatory & Non-Medical Boundary Enforcement

HEALTH PLUS explicitly enforces non-medical guardrails:
1. **Never Prescriptive Medicine:** We never calculate medication dosages, diagnose diseases, or suggest medical treatment plans.
2. **Clinical Floor:** Starvation diets below 1,500 kcal (male) or 1,200 kcal (female) are strictly prohibited.
3. **Medical Symptom Triage:** If a user queries symptoms (e.g. chest pain, severe hypoglycemia, chronic fatigue), the AI immediately stops coaching and outputs a standard clinical referral: *"Please consult a licensed physician or emergency medical care immediately."*
4. **Zero Hallucination Guarantee:** Generated insights must cite exact verified numbers from the user's database records.
