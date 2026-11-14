import type { ExerciseTypeId } from './wellness';

export interface ExerciseLiveEvent {
  eventType: 'FRAME_EVALUATION' | 'REP_COMPLETED' | 'FORM_WARNING' | 'UNCERTAINTY';
  timestamp: number;
  currentRepCount: number;
  activeExercise: ExerciseTypeId;
  currentJointAngleDegrees?: number;
  formStatus: 'optimal' | 'good' | 'needs_work' | 'uncertain';
  instantFeedbackCue?: string;
  landmarkVisibilityScore: number;
  isUserInFrame: boolean;
  cameraStatus: 'active' | 'permission_denied' | 'low_light' | 'frame_rate_drop';
}

export interface ExerciseSessionSummary {
  exerciseId: ExerciseTypeId;
  sessionStatus: 'completed' | 'abandoned' | 'paused';
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  repsCompleted: number;
  averageFormScore: number;
  overallFormStatus: 'optimal' | 'good' | 'needs_work' | 'uncertain';
  formFeedbackSummary: string[];
  repBreakdown?: {
    repNumber: number;
    durationSeconds: number;
    maxJointAngle: number;
    formScore: number;
  }[];
  estimatedCaloriesBurned?: number;
}

export interface ExerciseStudioProps {
  exerciseType: ExerciseTypeId;
  targetReps?: number;
  voiceCoachEnabled: boolean;
  onLiveEvent?: (event: ExerciseLiveEvent) => void;
  onSessionComplete: (summary: ExerciseSessionSummary) => Promise<void>;
  onExitSession: () => void;
  isMockMode?: boolean;
}
