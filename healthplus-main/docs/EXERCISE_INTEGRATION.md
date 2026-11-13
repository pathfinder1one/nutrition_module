# HEALTH PLUS — Exercise Studio Integration Specification & Contract

> **Document Version:** 1.0.0  
> **Status:** Review Draft for Exercise Specialists  
> **Integration Team:** CASA Vital Exercise Engineering & Platform Architecture  

---

## 1. Architectural Boundary & Philosophy

Two engineering team members are independently developing the camera-based posture detection and real-time voice coaching sub-system. 

### 1.1 Preserved Boundaries & Invariants
1. **No Overwrites:** Platform engineers must never overwrite, modify, or refactor the teammates' internal computer vision models, landmark mathematics, or exercise heuristic scripts without prior approval.
2. **Component Isolation:** The exercise system is integrated as a self-contained, typed React component or modular iframe/WebWorker bundle.
3. **Structured Telemetry Only:** The main platform **never** receives or handles raw camera video frames. It consumes solely structured kinematic events and final session summaries.
4. **Independent Testability:** The exercise module must be runnable and testable in standalone mock mode (using recorded landmark fixture data or synthetic rep counters) without requiring a live camera or live backend server.

---

## 2. Structured Data Contract

### 2.1 Proposed Live Event Contract (Real-Time HUD Feedback)
Emitted by the exercise engine to the main platform UI on every evaluated video frame or completed repetition:

```typescript
export interface ExerciseLiveEvent {
  eventType: 'FRAME_EVALUATION' | 'REP_COMPLETED' | 'FORM_WARNING' | 'UNCERTAINTY';
  timestamp: number; // Unix epoch ms
  currentRepCount: number;
  activeExercise: 'squat' | 'pushup';
  
  // Real-time biomechanical feedback
  currentJointAngleDegrees?: number; // e.g., Knee flexion angle
  formStatus: 'optimal' | 'good' | 'needs_work' | 'uncertain';
  instantFeedbackCue?: string; // e.g., "Knees caving inwards", "Depth reached"
  
  // Model confidence & camera state
  landmarkVisibilityScore: number; // 0.0 - 1.0 (Average confidence across key joints)
  isUserInFrame: boolean;
  cameraStatus: 'active' | 'permission_denied' | 'low_light' | 'frame_rate_drop';
}
```

### 2.2 Proposed Final Session Payload (Saved to Backend)
Emitted when the user completes or pauses their workout session:

```typescript
export interface ExerciseSessionSummary {
  exerciseId: 'squat' | 'pushup';
  sessionStatus: 'completed' | 'abandoned' | 'paused';
  startedAt: string; // ISO 8601 string
  endedAt: string;   // ISO 8601 string
  durationSeconds: number;
  
  repsCompleted: number;
  averageFormScore: number; // 0 - 100 scale
  overallFormStatus: 'optimal' | 'good' | 'needs_work' | 'uncertain';
  
  // Aggregated biomechanical feedback
  formFeedbackSummary: string[]; // e.g. ["Optimal depth on 80% reps", "Knee cave observed on final 3 reps"]
  repBreakdown?: {
    repNumber: number;
    durationSeconds: number;
    maxJointAngle: number;
    formScore: number;
  }[];
  
  estimatedCaloriesBurned?: number;
}
```

---

## 3. Frontend Component Mounting Interface

The exercise module will be mounted inside the Exercise Studio page via a clean TypeScript wrapper:

```tsx
export interface ExerciseStudioProps {
  exerciseType: 'squat' | 'pushup';
  targetReps?: number;
  voiceCoachEnabled: boolean;
  onLiveEvent?: (event: ExerciseLiveEvent) => void;
  onSessionComplete: (summary: ExerciseSessionSummary) => Promise<void>;
  onExitSession: () => void;
  isMockMode?: boolean; // For automated testing without camera
}

export const ExerciseCameraCanvas: React.FC<ExerciseStudioProps> = (props) => {
  // Teammates' internal pose estimation engine attaches here
  // ...
};
```

---

## 4. Handling Posture Uncertainty & Safety Boundaries

1. **Low Lighting or Partial Body View:** If `landmarkVisibilityScore < 0.65`, the exercise engine must flag `formStatus: 'uncertain'` and suppress false rep counting or incorrect form criticism.
2. **Medical Disclaimer Notice:** The UI permanently displays:
   > *"Posture tracking is a computer-vision estimation to support exercise form. It is not a clinical orthopedic evaluation or medical diagnosis."*

---

## 5. Review Questions for Exercise Team Specialists

To ensure a seamless integration, the following 6 questions are submitted for confirmation with the exercise teammates:

1. **Tech Stack & Pose Model:** Are you utilizing MediaPipe Pose (WebAssembly in browser), PoseNet, MoveNet, or an OpenCV/Python backend stream?
2. **Execution Location:** Is your pose estimation running 100% client-side in the browser, or does it stream images to an external Python microservice? (Client-side WebAssembly is strongly recommended for latency and privacy).
3. **Landmark Normalization:** Are landmark coordinates normalized to `[0.0, 1.0]` relative to canvas dimensions, and does your engine handle video mirroring (selfie mode)?
4. **Voice Cue Engine:** Are voice coaching prompts handled directly inside your component using Web SpeechSynthesis, or would you prefer the main platform to handle audio dispatch upon receiving `instantFeedbackCue`?
5. **Additional Exercises:** Beyond Squats and Push-ups, do you plan to support Lunges, Planks, or Jumping Jacks in later phases?
6. **Mock Testing Fixtures:** Can you provide a JSON recorded trajectory of a sample 10-rep squat session for automated UI unit testing?

