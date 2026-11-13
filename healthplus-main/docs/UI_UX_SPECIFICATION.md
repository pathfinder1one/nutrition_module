# HEALTH PLUS — Comprehensive UI/UX Specification

> **Document Version:** 1.0.0  
> **Status:** Production Design Blueprint  
> **Design Philosophy:** Editorial Wellness meets High-Tech Precision  
> **Author:** CASA Vital Design & Frontend Architecture  

---

## 1. Visual Identity & Design Pillars

### 1.1 Aesthetic Pillars
1. **Nature-Infused High-Tech:** Moving away from cold medical software and sterile white cards into rich, layered, organic wellness tones anchored by Deep Forest Green (`#123B32`) and illuminated by Emerald (`#187A5B`) and Warm Ivory (`#FAF9F5`).
2. **Editorial Depth & Structure:** Thoughtful typographic hierarchy utilizing **Manrope** for authoritative yet human headings and **Inter** for legible, crisp interface data.
3. **Intentional Kinetic Experience:** No static pages. Every screen features multi-layered ambient motion (organic floating orbs, gradient meshes, subtle particle networks, soft blur depths) optimized for performance and respect of `prefers-reduced-motion`.
4. **Honest Data Presentation:** Zero misleading charts, fabricated metrics, or speculative calorie claims.

---

## 2. Core Design Tokens & Palette

### 2.1 Color Palette
```css
:root {
  /* Brand Master Palette */
  --color-forest: #123B32;         /* Dominant dark surfaces, rich text, luxury grounding */
  --color-emerald: #187A5B;        /* Primary accent, success indicators, interactive triggers */
  --color-emerald-light: #22A078;  /* Hover states, gradient highlights */
  --color-sage: #DDECE3;           /* Secondary surfaces, subtle borders, chip backgrounds */
  --color-sage-soft: #EEF5F1;      /* Elevated soft cards, quiet backgrounds */
  --color-ivory: #FAF9F5;          /* Warm neutral background, card surfaces, canvas */
  --color-ivory-card: #FFFFFF;     /* Primary elevated container surface */
  --color-gold: #E7B76B;           /* Energy metrics, active streaks, premium accents */
  --color-gold-hover: #D8A252;     /* Gold button hover */

  /* Semantic UI Tokens */
  --color-text-primary: #123B32;
  --color-text-secondary: #4A635B;
  --color-text-muted: #7E968F;
  --color-border-subtle: rgba(18, 59, 50, 0.08);
  --color-border-hover: rgba(24, 122, 91, 0.28);
  
  /* Status Colors */
  --color-status-success: #187A5B;
  --color-status-warning: #D9822B;
  --color-status-danger: #D14343;
  --color-status-info: #2B6CB0;

  /* Elevation & Shadows */
  --shadow-subtle: 0 2px 8px -2px rgba(18, 59, 50, 0.05);
  --shadow-card: 0 10px 30px -5px rgba(18, 59, 50, 0.07), 0 4px 12px -2px rgba(18, 59, 50, 0.03);
  --shadow-glow-emerald: 0 0 28px -4px rgba(24, 122, 91, 0.25);
  --shadow-glow-gold: 0 0 24px -4px rgba(231, 183, 107, 0.3);

  /* Radius & Spacing */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
}
```

### 2.2 Typography Scale
- **Headings Font Family:** `Manrope`, sans-serif (Font weights: 500, 600, 700, 800)
- **Body & UI Font Family:** `Inter`, -apple-system, BlinkMacSystemFont, sans-serif (Font weights: 400, 500, 600)
- **Hierarchy:**
  - Display 1 (Hero Title): `clamp(2.75rem, 5vw, 4.5rem)` / Line height: `1.08` / Weight: `800` / Tracking: `-0.03em`
  - Heading 1 (Page Title): `2.25rem (36px)` / Line height: `1.2` / Weight: `700` / Tracking: `-0.02em`
  - Heading 2 (Section Title): `1.75rem (28px)` / Line height: `1.25` / Weight: `700` / Tracking: `-0.015em`
  - Heading 3 (Card Title): `1.25rem (20px)` / Line height: `1.35` / Weight: `600`
  - Body Large: `1.125rem (18px)` / Line height: `1.6` / Weight: `400`
  - Body Regular: `1.0rem (16px)` / Line height: `1.5` / Weight: `400`
  - Body Small / Captions: `0.875rem (14px)` / Line height: `1.4` / Weight: `500`
  - Micro / Data Badges: `0.75rem (12px)` / Line height: `1.3` / Weight: `600` / Tracking: `0.04em`

### 2.3 Responsive Breakpoints
- **Mobile (`sm`):** `360px – 639px` (Single column, bottom navigation bar, touch-friendly 44px+ hit targets)
- **Tablet (`md`):** `640px – 1023px` (Two column grids, collapsible side drawer)
- **Desktop (`lg`):** `1024px – 1279px` (Three column dashboard, expanded navigation rail)
- **Wide Display (`xl`):** `1280px – 1536px` (Max content container 1280px centered)
- **Ultra-Wide (`2xl`):** `1536px+` (Max content container 1440px with generous bilateral breathing room)

---

## 3. Screen-by-Screen Detailed Specifications

---

### Screen 1: Landing Website (Public Front)

**Sections Architecture:**
1. **Global Sticky Navbar:**
   - Left: HEALTH PLUS logomark (Stylized organic leaf + pulse node in Emerald and Gold) + CASA Vital attribution.
   - Center: Navlinks ("Product", "Food Scanner", "Exercise Studio", "Pattern Intelligence", "AI Coach", "FAQ").
   - Right: "Sign In" link (ghost) + "Get Started Free" button (Emerald pill with gold edge highlight).
   - Scroll effect: Translucent ivory frosted glass backdrop (`backdrop-blur-md bg-ivory/80 border-b border-border-subtle`).
2. **Hero Section:**
   - Headline: *"Observe Your Health. Understand The Pattern. Guide Your Wellness."*
   - Subtitle: *"The integrated AI wellness platform that connects your nutrition, home workouts, and lifestyle habits into an explainable, personalized journey."*
   - CTA Row: Primary: *"Experience Health Plus"* (Smooth scroll or trigger onboarding) | Secondary: *"Watch Interactive Demo"* (Modal preview with real-time pose tracking).
   - Visual Anchor: Interactive Three.js/R3F animated **Wellness Core** (translucent dual-orbital rings enclosing a living emerald-sage mesh sphere that gently pulses in sync with breathing cadence).
   - Live Metric Chips floating around core: *"Form Accuracy: 96%"*, *"Protein Consistency: 88%"*, *"No Fake Metrics"*.
3. **Product Mission & Introduction:**
   - High-impact editorial statement explaining the CASA Vital philosophy: health is non-linear; real progress comes from correlating food with movement over time.
4. **The Problem We Solve:**
   - Comparison grid highlighting modern wellness pain points: "Fragmented Point Solutions", "Unrealistic Restrictive Diets", "Disconnected Calorie Guesswork", "Black-Box Diagnostic Claims".
5. **Our Solution: The Triad:**
   - Three connected glassmorphic pillars:
     - *Observe:* Multimodal input (Vision, Camera posture, Manual precision).
     - *Understand:* Historical rolling baselines and correlation engine.
     - *Guide:* Actionable, safe, non-medical context-aware suggestions.
6. **How HEALTH PLUS Works:**
   - Horizontal milestone stepper showing the journey: Onboarding Profile -> Daily Logging -> Continuous Pattern Synthesis -> Intelligent Lifestyle Guidance.
7. **Main Feature Showcase (Bento Grid):**
   - 4 asymmetric feature panels with subtle interactive hover tilt (`tilt-3d` via Motion).
8. **AI Indian Food Scanner Interactive Demonstration:**
   - Side-by-side interactive playground showing an authentic Indian thali (roti, dal, sabzi, curd) being recognized, confidence scores resolving, and instant portion slider recalculating macros.
9. **Exercise Intelligence & Posture Demonstration:**
   - Real-time video canvas simulator showing squat depth detection, joint angle tracking (knee flexion at 92 degrees), green/gold wireframe overlay, and adaptive voice callout.
10. **Health Pattern Intelligence Showcase:**
    - Interactive connected node graph illustrating: *Workout on Tuesday + High Protein Intake -> Next Morning Energy Baseline High*.
    - Toggle showing transparent data evidence backing up every claim.
11. **AI Personal Coach Showcase:**
    - Clean chat interface simulation demonstrating a real context-aware conversation: answering a user's question by citing their actual last 5 days of protein and squats.
12. **Why HEALTH PLUS Comparison Matrix:**
    - Detailed feature matrix comparing HEALTH PLUS vs. Typical Calorie Trackers vs. Standalone Gym Apps.
13. **Frequently Asked Questions (FAQ):**
    - Accordion items covering data privacy, Indian cuisine accuracy, camera security (no video stored), and non-medical boundaries.
14. **Footer:**
    - Brand tagline, CASA Vital links, Privacy Policy, Terms of Service, Medical Disclaimers, and System Health status pill.

---

### Screen 2: Authentication Suite (Signup, Login, Password Reset, Email Verification)
- **Layout:** Split-screen layout on desktop:
  - Left panel (50%): Dynamic ambient generative art displaying slowly evolving emerald-forest contours with inspirational wellness quote.
  - Right panel (50%): Pristine Warm Ivory canvas with centered authentic form.
- **Form Controls:** Floating label inputs with smooth focus ring transition, password strength meter (entropy-based), OAuth button (Supabase Google integration), instant validation with reassuring inline error messages.
- **Email Verification Screen:** Clean envelope icon with floating pulse ring, "Check your inbox", resend timer countdown button.

---

### Screen 3: Multi-Step Onboarding Wizard
- **Navigation:** Persistent top step indicator with 5 milestones: `1. Physical Profile -> 2. Goals & Activity -> 3. Dietary Preferences -> 4. Allergies & Dislikes -> 5. Daily Routine`.
- **Interactions:**
  - Card selection for Dietary Style (Veg, Non-Veg, Vegan, Jain) featuring custom hand-crafted dual-tone line illustrations.
  - Visual allergy tag multi-select with instant warning preview: *"All selected allergens will be strictly excluded from all recommended diet plans."*
  - Activity Level Slider with descriptive everyday equivalents (e.g. "Sedentary: Desk job with light walking").
  - Clear "Skip non-essential info" button on optional steps.

---

### Screen 4: Main Dashboard (Command Center)
- **Header:** Personalized greeting ("Good morning, Rahul"), today's date, current logging streak badge with gold flame icon.
- **Top Metrics Grid (4 cards):**
  1. *Calorie Budget:* Radial progress ring showing (Consumed / Target kcal) + Remaining kcal.
  2. *Protein Progress:* Emerald bar indicator with current grams vs. target grams.
  3. *Carbs & Fats Breakdown:* Dual compact gauge indicating proportion.
  4. *Today's Movement:* Completed workout sessions and rep volume.
- **Middle Section (Two columns - 65% / 35%):**
  - Left Column:
    - *Today's Meal Timeline:* 4 horizontal cards (Breakfast, Lunch, Snacks, Dinner). Each shows logged food items, photo thumbnail, total calories, and a "+ Add / Scan Meal" button.
    - *Weekly Activity & Nutrition Trend:* Interactive Recharts composite chart showing daily calories vs. active workout days.
  - Right Column:
    - *Active Pattern Insight Highlight:* Prominent card with emerald border highlighting the top discovered insight with clickable "View Evidence" pill.
    - *AI Coach Quick Launcher:* Friendly card with prompt suggestion ("Ask me about your protein balance today") and input field.
    - *Quick Action Floating Bar:* Instant shortcuts to [Scan Meal], [Start Squats/Push-ups], [Generate Meal Plan].
- **Empty States:** For newly onboarded users, elegant cards illustrate the journey: *"Log your first meal or start a quick squat session to start training your personal baseline."* (Zero fake stats).

---

### Screen 5: AI Indian Food Scanner
- **Mode Selector:** Dual tab toggle: `[Camera Capture]` vs `[Upload Image]`.
- **Viewfinder Modal:**
  - Viewfinder with rounded corners and glowing emerald scan line animation scanning downward.
  - Guidelines: "Place your plate inside the frame with good lighting."
  - Shutter button with haptic feedback.
- **Results & Confirmation Drawer:**
  - Detected Items List: Each detected item displayed in an interactive card with a confidence badge (`94% Confidence`), item title, and estimated portion.
  - Portion Stepper & Unit Selector: Toggle between standard measures (e.g. "1 Katori (150g)", "2 Medium Rotis", "1 Plate").
  - Real-Time Nutrition Preview: Dynamically updates calories, protein, carbs, and fat as portion adjustments are made.
  - Add Missing Item button: Autocomplete search bar allowing users to add an item the camera missed.
  - Action Footer: Primary button: *"Confirm & Log Meal"* (saves snapshot to database and updates diary).

---

### Screen 6: Nutrition Diary
- **Date Navigator:** Calendar strip showing the current week with day selector pills and completion dots under logged days.
- **Meal Blocks:** Expandable sections for Breakfast, Lunch, Snacks, Dinner.
- **Item Row:**
  - Dish name, portion size, calories, protein, carbs, fat, and source badge (`Scanned` or `Manual`).
  - Action menu: Edit portion, Swap item, Delete item.
- **Target vs. Actual Progress Bar:** Displays planned nutrient goals alongside actual logged quantities with percentage difference.

---

### Screen 7: Personalized Diet Planner
- **View Options:** `[Today's Plan]` and `[Full 7-Day Schedule]`.
- **Meal Cards:** Clean editorial cards featuring recipe title, prep time, serving size, macro breakdown, and key ingredients.
- **Interactivity:**
  - "Swap Meal" button triggers a modal showing 3 curated alternatives matching the exact calorie/macro envelope and honoring all allergen exclusions.
  - "Lock Meal" icon prevents meal replacement during batch re-planning.
- **Action Bar:** "Export to Grocery List" with date range picker (Next 3 Days / Entire Week).

---

### Screen 8: Grocery List
- **Layout:** High-productivity checklist categorized by department:
  - 🥬 Fresh Produce
  - 🌾 Grains, Pulses & Flours
  - 🥛 Dairy & Alternatives
  - 🧂 Spices & Condiments
  - 🥜 Nuts & Seeds
- **Interactions:**
  - Tap checkbox: Strikes through item and smoothly slides it to the "Purchased" bucket with opacity fade.
  - Add custom item modal with quantity and unit dropdown.
  - Clear all completed items button.

---

### Screen 9: Exercise Studio
- **Setup State:**
  - Instructions card: Camera positioning guide (e.g. "Step back 2-3 meters until your head and feet are visible").
  - Audio switch: Voice Coaching `[ON / OFF]`.
  - Exercise selector: Squats or Push-ups.
- **Live Workout HUD (Head-Up Display):**
  - Full-screen camera canvas with dark ambient gradient overlay around edges.
  - Live Pose Wireframe: Emerald lines connecting joint landmarks; dynamically shifts to Gold when joint angles reach target depth.
  - Giant Rep Counter: Top-center large typography with animated bounce upon completed rep.
  - Real-Time Form Status Pill:
    - 🟢 *Good Depth & Alignment*
    - 🟡 *Keep Knees Aligned With Toes*
    - 🔴 *Straighten Back Before Next Rep*
  - Joint Angle Callout: Small floating gauge near key joint (e.g., Knee: 88°).
  - Floating Control Bar: Pause Workout, Toggle Audio, End Session.
- **Post-Workout Summary Modal:**
  - Celebratory entrance animation.
  - Summary stats: Total Reps Completed, Form Consistency Score (%), Active Session Duration, Calories Expended Estimate.
  - Save to Workout History button.

---

### Screen 10: Health Pattern Intelligence & Insights
- **Baseline Overview:** Visual representation of the user's personal baseline (e.g. 14-day rolling average of daily active minutes and protein intake).
- **Discovered Patterns Feed:** Card stream sorted by confidence score:
  - Pattern Title & Category badge (`Consistency`, `Nutrition Shift`, `Activity Correlation`).
  - Plain-language explanation.
  - Interactive "View Evidence" expander showing the exact dates, logged values, and baseline comparison.
  - Feedback buttons: "Helpful 👍" / "Not Relevant 👎".
- **Weekly Health Story:**
  - Editorial weekly digest presenting a four-part narrative:
    1. *Highlights:* What went exceptionally well.
    2. *Shifts:* What differed from the previous week.
    3. *Observed Patterns:* Emerging behavioral links.
    4. *Next Focus:* One tangible, non-demanding focus for the upcoming week.

---

### Screen 11: Context-Aware AI Personal Health Coach
- **Interface Structure:**
  - Clean conversational messaging stream with conversational avatars.
  - Top Context Ribbon: Displays current data grounding indicators (e.g., `Profile Active` • `7-Day Nutrition Loaded` • `Recent Workouts Synced`).
- **Coach Message Bubble:**
  - Warm Ivory card with deep forest text and emerald accent line.
  - Clickable citation pills when referencing user data (e.g. `[Based on 85g avg protein]`).
  - Follow-up prompt suggestion chips below the response.
- **Safety Badge:** Permanent subtle footer notice: *"HEALTH PLUS Coach provides lifestyle and wellness guidance. It does not provide medical diagnoses, treatment plans, or prescriptions."*

---

### Screen 12: Progress Reports & Analytics
- **Date Selector:** 7 Days | 30 Days | 90 Days | All Time.
- **Interactive Visualizations:**
  - Caloric Balance: Stacked bar chart showing daily intake vs. estimated expenditure.
  - Macronutrient Distribution: Streamlined multi-line trend showing protein, carbs, and fat stability over time.
  - Exercise Volume & Rep Progression: Grouped bar chart tracking squats and push-up volume by week.
  - Habit Consistency Heatmap: 30-day GitHub-style contribution grid displaying daily wellness tracking completeness.

---

### Screen 13: Settings & Privacy Management
- **Sections:**
  - *Personal Profile:* Edit physical metrics, goal, and dietary preferences.
  - *Allergies & Dietary Restrictions:* Strict exclusion management.
  - *Consent & AI Permissions:* Explicit toggles for Camera Access, AI Context Grounding, and Audio Synthesis.
  - *Notification Preferences:* Timers for meal logging reminders and weekly digest alerts.
  - *Data Sovereignty:* "Download My Complete Data" (JSON export), "Request Account & Data Deletion" (Irreversible deletion modal).

---

## 4. Interaction States: Loading, Empty, and Error States

### 4.1 Loading States
- **Skeleton Screens:** High-polish pulsing sage skeletons (`bg-sage/40 animate-pulse rounded-lg`) matching the exact layout of destination cards to prevent layout shift (CLS = 0).
- **Scanning State:** Camera viewfinder displays a smooth bidirectional emerald scanning sweep with floating particle sparkles.

### 4.2 Empty States
- **Design Rule:** Never show a blank card with "No data". Always display a welcoming custom illustration, an encouraging explanation, and a primary action trigger.
- **Example (Diary Empty State):** Clean plate illustration with fork and spoon + *"Your nutrition diary is ready for today. Scan a meal or search our database to log breakfast."* + `[Scan Food]` button.

### 4.3 Error States
- **Camera Denied:** Friendly modal explaining why camera access is needed for posture tracking, with step-by-step browser permission reset instructions.
- **Low Confidence Food Scan:** Reassuring prompt: *"We couldn't clearly identify this dish. Tap here to search by name or enter ingredients manually."*
- **Offline / Server Disconnect:** Non-intrusive top banner: *"Connection interrupted. Changes will sync once back online."*

