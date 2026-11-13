import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Camera,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Plus,
  Sparkles,
  Shield,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AnatomicalAthleteVisual } from '@/components/3d/AnatomicalAthleteVisual';
import { useApp } from '@/context/AppContext';
import type { ExerciseTypeId } from '@/types/wellness';
import type {
  ExerciseLiveEvent,
  ExerciseSessionSummary,
  ExerciseStudioProps,
} from '@/types/exerciseIntegration';

export type { ExerciseLiveEvent, ExerciseSessionSummary, ExerciseStudioProps };

export interface MoveStudioPageProps {
  onNavigate?: (path: string) => void;
}

interface ExerciseMeta {
  id: ExerciseTypeId;
  label: string;
  targetReps: number;
  kcalPerRep: number;
  cuesEn: string[];
  cuesHinglish: string[];
  cuesHi: string[];
  muscles: string;
}

const EXERCISES: Record<ExerciseTypeId, ExerciseMeta> = {
  squat: {
    id: 'squat',
    label: 'Bodyweight Squat',
    targetReps: 12,
    kcalPerRep: 0.45,
    muscles: 'Quadriceps · Glutes · Core',
    cuesEn: [
      'Feet shoulder-width apart, toes gently turned out',
      'Hips move back first, knees track cleanly over toes',
      'Control 2 seconds down, drive smoothly up through mid-foot',
    ],
    cuesHinglish: [
      'Paon shoulder-width rakhein aur chest up rakhein',
      'Pehle hips peeche le jayein, knees ko andar girne na dein',
      '2 second slow neeche jayein aur saans chhodte hue upar aayein',
    ],
    cuesHi: [
      'दोनों पैर कंधों की चौड़ाई के बराबर रखें और छाती सीधी रखें',
      'कूल्हों को हल्का पीछे ले जाते हुए नियंत्रित नीचे जाएँ',
      'ऊपर आते समय साँस बाहर छोड़ें',
    ],
  },
  pushup: {
    id: 'pushup',
    label: 'Push-Up (Wall / Knee / Full)',
    targetReps: 10,
    kcalPerRep: 0.55,
    muscles: 'Chest · Triceps · Anterior Core',
    cuesEn: [
      'Hands directly under shoulders, body in one neutral plank line',
      'Tuck elbows gently (~45° angle) instead of flaring wide',
      'Use wall or knee incline anytime to keep crisp spinal posture',
    ],
    cuesHinglish: [
      'Haath shoulders ke neeche rakhein aur kamar bilkul seedhi rakhein',
      'Elbows ko ~45 degree par rakh kar neeche jayein',
      'Zaroorat ho toh wall ya knee push-up karein — form sabse zaroori hai',
    ],
    cuesHi: [
      'हाथ कंधों के ठीक नीचे रखें और शरीर एक सीधी रेखा में रखें',
      'कोहनियाँ लगभग 45 डिग्री पर मोड़ते हुए नीचे जाएँ',
      'आराम से दीवार या घुटनों के सहारे भी अभ्यास कर सकते हैं',
    ],
  },
  glute_bridge: {
    id: 'glute_bridge',
    label: 'Floor Glute Bridge',
    targetReps: 15,
    kcalPerRep: 0.35,
    muscles: 'Glutes · Hamstrings · Lower Back Support',
    cuesEn: [
      'Heels planted comfortably close to hips, lower ribs relaxed',
      'Press through heels to lift hips without arching lower back',
      'Pause 1 second cleanly at top before lowering slowly',
    ],
    cuesHinglish: [
      'Heels ko mat par jamayein aur pet gently brace karein',
      'Hips upar uthate waqt lower back par jhatka na dein',
      'Top par 1 second ruk kar aaram se wapas neeche laayein',
    ],
    cuesHi: [
      'एड़ियों को मैट पर स्थिर रखें और कोर को हल्का सख्त रखें',
      'एड़ियों से दबाव देते हुए कूल्हों को धीरे ऊपर उठाएँ',
      'ऊपर एक सेकंड रुकें और नियंत्रण से नीचे लाएँ',
    ],
  },
};

export const MoveStudioPage: React.FC<MoveStudioPageProps> = ({ onNavigate = () => {} }) => {
  const { state, workoutsToday, adjustHydration, logWorkout } = useApp();

  const [selectedExercise, setSelectedExercise] = useState<ExerciseTypeId>('squat');
  const [isRunning, setIsRunning] = useState(false);
  const [reps, setReps] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [cameraMode, setCameraMode] = useState<'guided' | 'camera'>('guided');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const repsRef = useRef<number>(0);

  const meta = EXERCISES[selectedExercise];
  const preferredLang = state.profile?.lifestyle.preferredLanguage ?? 'auto';
  const activeLang =
    preferredLang === 'auto' ? state.conversationMemory.detectedLanguage : preferredLang;

  const activeCues =
    activeLang === 'hi'
      ? meta.cuesHi
      : activeLang === 'hinglish'
        ? meta.cuesHinglish
        : meta.cuesEn;

  const speakCue = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = activeLang === 'en' ? 'en-IN' : 'hi-IN';
      utterance.rate = 0.98;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech fallback silently
    }
  };

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRunning]);

  // Clean up camera stream on unmount or mode switch
  useEffect(() => {
    if (cameraMode !== 'camera') {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    let cancelled = false;
    const startCamera = async () => {
      setCameraError(null);
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraError('Browser camera access is not available on this environment.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        if (!cancelled) {
          setCameraError(
            'Camera permission declined or no webcam detected. Guided Demo works fully without a camera.'
          );
        }
      }
    };

    startCamera();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [cameraMode]);

  const handleToggleRun = () => {
    if (!isRunning) {
      setIsRunning(true);
      speakCue(activeCues[0]);
    } else {
      setIsRunning(false);
    }
  };

  const handleAddRep = (delta: number = 1) => {
    const next = repsRef.current + delta;
    repsRef.current = next;
    setReps(next);
    if (next % 5 === 0) {
      speakCue(
        activeLang === 'hinglish'
          ? `Badhiya pace, ${next} reps complete!`
          : activeLang === 'hi'
            ? `बहुत बढ़िया, ${next} रेप्स पूरे हुए!`
            : `Steady control — ${next} reps completed!`
      );
    }
  };

  const handleStopAndSave = () => {
    setIsRunning(false);
    const finalReps = Math.max(repsRef.current, reps, 1);
    const duration = Math.max(seconds, 15);
    const kcal = Math.round(finalReps * meta.kcalPerRep);
    logWorkout({
      exerciseType: selectedExercise,
      exerciseLabel: meta.label,
      repsCompleted: finalReps,
      targetReps: meta.targetReps,
      durationSeconds: duration,
      estimatedKcal: kcal,
      mode: cameraMode === 'camera' && !cameraError ? 'camera_preview' : 'guided_demo',
      formNotes: [activeCues[0]],
    });
    adjustHydration(0.25);
    setSavedNotice(
      `Saved ${finalReps} ${meta.label} reps (~${kcal} kcal est.) to Today & Progress!`
    );
    repsRef.current = 0;
    setReps(0);
    setSeconds(0);
    setTimeout(() => setSavedNotice(null), 4000);
  };

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalRepsToday = workoutsToday.reduce((sum, w) => sum + w.repsCompleted, 0);

  return (
    <div className="space-y-5 pb-20 text-left animate-fadeIn max-w-5xl mx-auto">
      {/* Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="emerald" size="sm">
              Guided Human Movement
            </Badge>
            <span className="text-xs text-forest/65 dark:text-ivory/65">
              Logged today: <strong>{totalRepsToday} reps</strong>
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-forest dark:text-white mt-1">
            Move Studio
          </h1>
        </div>

        {/* Simple Mode & Audio Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCameraMode(cameraMode === 'guided' ? 'camera' : 'guided')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
              cameraMode === 'camera'
                ? 'bg-emerald text-white border-emerald'
                : 'bg-white/80 dark:bg-white/5 border-forest/15 dark:border-white/15 text-forest dark:text-ivory'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{cameraMode === 'camera' ? 'Camera Mirror On' : 'Use Local Camera Mirror'}</span>
          </button>

          <button
            type="button"
            onClick={() => setVoiceEnabled((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-forest/15 dark:border-white/15 bg-white/80 dark:bg-white/5 text-xs font-semibold text-forest dark:text-ivory"
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{voiceEnabled ? 'Voice On' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {/* Honest Camera & Prototype CV Boundary Notice */}
      <div className="p-3 rounded-2xl bg-forest/5 dark:bg-white/5 border border-forest/10 dark:border-white/10 text-[11px] text-forest/75 dark:text-ivory/75">
        <strong>Honest Tracking Scope:</strong> Local camera preview stays strictly on your device (`getUserMedia`, never uploaded). Real-time automated CV pose detection is reserved via{' '}
        <code className="font-mono">exerciseIntegration.ts</code> — in this prototype, follow the 3D human tempo and use <strong>+1 Rep</strong> / <strong>Stop &amp; Save</strong> to record completed reps accurately.
      </div>

      {/* Exercise Picker */}
      <div className="flex flex-wrap gap-2">
        {(Object.values(EXERCISES) as ExerciseMeta[]).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setSelectedExercise(item.id);
              setIsRunning(false);
            }}
            className={`px-4 py-2 rounded-xl border text-xs font-bold transition-colors ${
              selectedExercise === item.id
                ? 'bg-forest text-white dark:bg-emerald border-forest dark:border-emerald shadow-sm'
                : 'bg-white/75 dark:bg-white/5 border-forest/10 dark:border-white/10 text-forest/80 dark:text-ivory/80'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {savedNotice && (
        <div className="p-3 rounded-xl bg-emerald/15 border border-emerald/35 text-xs font-semibold text-forest dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Main Focal Area: Visual Guide + Clean Controls */}
      <Card variant="elevated" className="p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-6 items-center">
          {/* Left: Solid Anatomical Human Visual OR Local Camera Mirror */}
          <div className="relative rounded-3xl bg-gradient-to-br from-emerald-50/90 via-ivory to-sage/40 dark:from-[#092019] dark:via-[#061812] dark:to-[#0A251C] border border-forest/10 dark:border-white/10 p-3.5 sm:p-4 flex flex-col justify-between min-h-[310px]">
            <div className="flex items-center justify-start pb-1.5 z-10">
              <Badge variant={cameraMode === 'camera' && !cameraError ? 'gold' : 'sage'} size="sm">
                {cameraMode === 'camera' && !cameraError
                  ? 'Local Mirror Stream (Private)'
                  : 'Guided Human Form Demo'}
              </Badge>
            </div>

            {cameraMode === 'camera' ? (
              cameraError ? (
                <div className="text-center space-y-3 p-4">
                  <p className="text-xs font-semibold text-amber-700 dark:text-gold max-w-xs mx-auto">
                    {cameraError}
                  </p>
                  <AnatomicalAthleteVisual exerciseType={selectedExercise} isActive={isRunning} />
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-2">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-[250px] rounded-2xl object-cover scale-x-[-1] border border-white/15"
                  />
                  <p className="text-[10px] text-forest/65 dark:text-ivory/65">
                    On-device mirror preview only — video never leaves your browser. Automated live pose landmark models connect externally via the Exercise Studio contract.
                  </p>
                </div>
              )
            ) : (
              <AnatomicalAthleteVisual exerciseType={selectedExercise} isActive={isRunning} />
            )}
          </div>

          {/* Right: Uncluttered Rep Counter, Form Cues & Start/Pause/Stop */}
          <div className="space-y-5">
            <div className="flex items-baseline justify-between border-b border-forest/10 dark:border-white/10 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald dark:text-emerald-400">
                  {meta.muscles}
                </p>
                <h2 className="font-heading font-extrabold text-xl text-forest dark:text-white mt-0.5">
                  {meta.label}
                </h2>
              </div>
              <div className="text-right">
                <div className="text-3xl font-heading font-black text-forest dark:text-white tabular-nums">
                  {reps} <span className="text-xs font-semibold opacity-60">/ {meta.targetReps} reps</span>
                </div>
                <div className="text-xs font-semibold text-forest/60 dark:text-ivory/60 tabular-nums">
                  {formatTimer(seconds)}
                </div>
              </div>
            </div>

            {/* 3 Clear Form Cues */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-forest dark:text-white">Simple Form Focus:</p>
              <ul className="space-y-1.5 text-xs text-forest/80 dark:text-ivory/80">
                {activeCues.map((cue, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald/15 text-emerald dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {idx + 1}
                    </span>
                    <span>{cue}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Clean Action Controls */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Button
                variant="primary"
                size="md"
                onClick={handleToggleRun}
                leftIcon={isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              >
                {isRunning ? 'Pause' : 'Start Session'}
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => handleAddRep(1)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                +1 Rep
              </Button>

              <Button
                variant="gold"
                size="md"
                onClick={handleStopAndSave}
                leftIcon={<Square className="w-3.5 h-3.5" />}
              >
                Stop &amp; Save
              </Button>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => setShowDetailsDrawer((d) => !d)}
                className="inline-flex items-center gap-1 font-semibold text-forest/70 dark:text-ivory/70 hover:text-forest dark:hover:text-white"
              >
                {showDetailsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{showDetailsDrawer ? 'Hide details' : 'Session history & privacy details'}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/coach')}
                className="inline-flex items-center gap-1 font-semibold text-emerald dark:text-emerald-400 hover:underline"
              >
                <Sparkles className="w-3 h-3" />
                Ask Coach for modifications
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Collapsible Secondary Drawer */}
      {showDetailsDrawer && (
        <Card variant="surface" className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-forest dark:text-white">
            <Shield className="w-4 h-4 text-emerald" />
            <span>On-Device Movement &amp; Recent Log Details</span>
          </div>
          <p className="text-xs text-forest/75 dark:text-ivory/75">
            In Guided Demo mode, reps are counted when you tap <strong>+1 Rep</strong> or save a completed set while following the anatomical tempo animation. No fake camera joint scores are fabricated.
          </p>
          {workoutsToday.length > 0 ? (
            <div className="space-y-2 pt-2">
              {workoutsToday.map((w) => (
                <div
                  key={w.id}
                  className="p-2.5 rounded-xl bg-forest/5 dark:bg-white/5 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-forest dark:text-white">
                    {w.exerciseLabel} — {w.repsCompleted} reps
                  </span>
                  <span className="text-forest/65 dark:text-ivory/65">
                    {w.timeLabel} · {w.durationSeconds}s
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-forest/60 dark:text-ivory/60">
              No movement sessions saved yet today.
            </p>
          )}
        </Card>
      )}
    </div>
  );
};
