# HEALTH PLUS — Team Responsibilities & RACI Matrix

> **Document Version:** 1.0.0  
> **Team:** CASA Vital  
> **Status:** Production Standard  

---

## 1. Team Organization & Roles

| Role Title | Primary Scope & Specialization | Team Member / Lead |
| :--- | :--- | :--- |
| **Product Architect & Lead** | Systems architecture, master PRD, roadmap, security invariants, end-to-end integration. | Senior Product Architect |
| **UI/UX Designer & Frontend Architect** | Design system, token hierarchy, animations (Motion, GSAP, Three.js), responsive layouts. | Frontend Lead |
| **Backend & Data Engineer** | FastAPI orchestrator, Supabase PostgreSQL schema, RLS policies, REST API contracts. | Backend Lead |
| **AI/ML Engineer (Vision & Patterns)** | Indian food classification, feature extraction, rolling baseline algorithms, LLM RAG safety. | AI/ML Specialist |
| **Exercise & Pose Specialist A** | Computer vision pose estimation (MediaPipe/OpenCV), joint angle kinematics, rep counting. | Exercise Team Specialist A |
| **Exercise & Pose Specialist B** | Biomechanical form feedback heuristics, posture uncertainty detection, voice coach triggers. | Exercise Team Specialist B |

---

## 2. RACI Matrix Across Product Modules

> **R** = Responsible (builds it)  
> **A** = Accountable (approves architecture & quality)  
> **C** = Consulted (provides inputs)  
> **I** = Informed (receives updates)

| Module | Product Architect | Frontend Architect | Backend Engineer | AI/ML Engineer | Exercise Specialist A | Exercise Specialist B |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Landing Website** | A | R | C | I | I | I |
| **2. Auth & Session Handling** | A | R | R | I | I | I |
| **3. Onboarding & Profile** | A | R | R | C | I | I |
| **4. Main Dashboard** | A | R | R | C | I | I |
| **5. AI Indian Food Scanner** | A | R | R | R | I | I |
| **6. Nutrition Diary** | A | R | R | I | I | I |
| **7. Diet Planner** | A | R | R | C | I | I |
| **8. Grocery List** | A | R | R | I | I | I |
| **9. Exercise Studio** | A | R (Container) | R (API) | C | **R (Pose Engine)** | **R (Kinematics)** |
| **10. Voice Fitness Coach** | A | R (Speech Web) | I | C | C | **R (Cues & Rules)** |
| **11. Health Pattern Intelligence** | A | R (UI Cards) | R (Aggregates) | **R (Algorithms)** | I | I |
| **12. Context-Aware AI Coach** | A | R (Chat UI) | R (Context API) | **R (Prompt & Guard)** | I | I |
| **13. Progress Reports** | A | R | R | C | I | I |
| **14. Notifications & Settings** | A | R | R | I | I | I |

---

## 3. Codebase Ownership & Directory Boundaries

To guarantee that team members never overwrite or conflict with each other's code:

```text
health-plus/
├── frontend/
│   ├── src/
│   │   ├── features/exercise/
│   │   │   ├── components/ExerciseStudio.tsx       <-- Main Platform Wrapper
│   │   │   ├── internal/                            <-- PROTECTED: Owned by Exercise Specialists A & B
│   │   │   │   ├── pose_engine/                    <-- Landmark detection & joint angle logic
│   │   │   │   ├── heuristics/                     <-- Rep counting & posture validation
│   │   │   │   └── audio/                          <-- Deterministic voice prompts
│   │   │   └── types/exerciseContract.ts           <-- Shared Integration Contract
│   │   └── ...                                     <-- Owned by Frontend Architect
├── backend/
│   ├── app/
│   │   ├── ml/                                     <-- Owned by AI/ML Engineer
│   │   ├── api/                                    <-- Owned by Backend Engineer
│   │   └── ...
```

---

## 4. Branching & Pull Request Protocols

1. **Main Branch Protection:** `main` is protected; direct commits are prohibited.
2. **Feature Branch Convention:**
   - `feature/exercise-pose-engine` (Exercise Team)
   - `feature/food-vision-service` (AI Team)
   - `feature/landing-design-system` (Frontend Team)
   - `feature/backend-api-core` (Backend Team)
3. **Pull Request Rules:**
   - Any PR touching `features/exercise/internal/` requires approval from at least one Exercise Specialist.
   - Any PR modifying database migrations or schema requires Backend Lead approval.
   - Any PR altering design tokens or motion parameters requires Frontend Lead approval.

