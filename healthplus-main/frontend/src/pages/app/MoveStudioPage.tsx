import React, { useEffect, useRef, useState, useMemo } from 'react';
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
  Monitor,
  RotateCcw,
  FlipHorizontal,
  Search,
  Dumbbell,
  X,
  Maximize2,
  Minimize2,
  Mic,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { AnatomicalAthleteVisual } from '@/components/3d/AnatomicalAthleteVisual';
import { RealTimeVoiceAssistantModal } from '@/components/ai/RealTimeVoiceAssistantModal';
import { useApp } from '@/context/AppContext';
import exercisesData from '@/data/exercisesData.json';
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
  muscles: string;
  cameraHint: string;
  gifUrl: string;
  category: string;
  usesTimer?: boolean;
  cuesEn: string[];
  cuesHinglish: string[];
  cuesHi: string[];
}

const CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,7],[0,4],[4,5],[5,6],[6,8],[9,10],
  [11,12],[11,13],[13,15],[15,17],[15,19],[15,21],[17,19],
  [12,14],[14,16],[16,18],[16,20],[16,22],[18,20],
  [11,23],[12,24],[23,24],[23,25],[25,27],[27,29],[29,31],[31,27],
  [24,26],[26,28],[28,30],[30,32],[32,28]
];

const EXERCISES: Record<ExerciseTypeId, ExerciseMeta> = {
  squat: {
    id: 'squat',
    label: 'Bodyweight Squat',
    targetReps: 12,
    kcalPerRep: 0.45,
    muscles: 'Quadriceps · Glutes · Core',
    cameraHint: 'Front or side view · both feet visible',
    gifUrl: '/previews/squat.gif',
    category: 'Lower Body',
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
    cameraHint: 'Side view · camera low',
    gifUrl: '/previews/push-up.gif',
    category: 'Upper Body',
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
  jumping_jack: {
    id: 'jumping_jack',
    label: 'Jumping Jack',
    targetReps: 20,
    kcalPerRep: 0.20,
    muscles: 'Cardio · Calves · Shoulders',
    cameraHint: 'Front view · full body visible',
    gifUrl: '/previews/jumping-jacks.gif',
    category: 'Cardio & Agility',
    cuesEn: [
      'Land softly on the balls of your feet',
      'Full overhead reach with both arms',
      'Maintain steady breathing rhythm',
    ],
    cuesHinglish: [
      'Paanv ke agle hisse par soft landing karein',
      'Haath poore upar tak le jayein',
      'Lambi saans ke sath continuous pace rakhein',
    ],
    cuesHi: [
      'पैरों के पंजों पर आराम से लैंड करें',
      'हाथ सिर के ऊपर पूरा उठाएँ',
      'लयबद्ध साँस लेते रहें',
    ],
  },
  lunge: {
    id: 'lunge',
    label: 'Forward Lunge',
    targetReps: 10,
    kcalPerRep: 0.40,
    muscles: 'Glutes · Quads · Hamstrings',
    cameraHint: 'Side view · both feet visible',
    gifUrl: '/previews/lunges.gif',
    category: 'Lower Body',
    cuesEn: [
      'Torso upright and chest proud',
      'Front knee stays behind front toes',
      'Lower back knee gently toward floor to 90°',
    ],
    cuesHinglish: [
      'Kamar bilkul seedhi aur chest up rakhein',
      'Aage wala knee aage mat nikaliye',
      'Peeche wala knee floor ki taraf 90 degree par le jayein',
    ],
    cuesHi: [
      'कमर सीधी रखें और छाती तनी रहे',
      'आगे का घुटना पैर के पंजों से आगे न जाए',
      'पीछे का घुटना जमीन के पास तक ले जाएँ',
    ],
  },
  bicep_curl: {
    id: 'bicep_curl',
    label: 'Standing Bicep Curl',
    targetReps: 12,
    kcalPerRep: 0.25,
    muscles: 'Biceps · Forearms',
    cameraHint: 'Front or 45° angle · arms visible',
    gifUrl: '/previews/biceps-curl.gif',
    category: 'Upper Body',
    cuesEn: [
      'Pin elbows firmly to your sides',
      'Zero torso swing or momentum',
      'Squeeze biceps at the top, 2s slow lowering',
    ],
    cuesHinglish: [
      'Elbows ko side me chipka kar rakhein',
      'Kamar ko hilaye bina sirf arms move karein',
      'Top par 1 second squeeze karein aur slow neeche layein',
    ],
    cuesHi: [
      'कोहनियाँ शरीर के पास स्थिर रखें',
      'शरीर को झटका दिए बिना अभ्यास करें',
      'ऊपर एक सेकंड रुकें और धीरे नीचे लाएँ',
    ],
  },
  high_knees: {
    id: 'high_knees',
    label: 'High Knees',
    targetReps: 24,
    kcalPerRep: 0.30,
    muscles: 'Hip Flexors · Abs · Cardio',
    cameraHint: 'Front view · full body and feet visible',
    gifUrl: '/previews/high-knees.gif',
    category: 'Cardio & Core',
    cuesEn: [
      'Drive each knee alternately to waist level (90° bend)',
      'Pump arms naturally in sync',
      'Stay bouncy on your toes',
    ],
    cuesHinglish: [
      'Knees ko kamar tak upar uthayein (90 degree)',
      'Haathon ko running style me rhythm me chalayein',
      'Paanv par light aur active rahein',
    ],
    cuesHi: [
      'घुटनों को कमर की ऊँचाई तक उठाएँ',
      'हाथों को दौड़ने की मुद्रा में चलाएँ',
      'हल्के पंजों पर सक्रिय रहें',
    ],
  },
  wall_sit: {
    id: 'wall_sit',
    label: 'Wall Sit (Hold)',
    targetReps: 45,
    kcalPerRep: 0.15,
    usesTimer: true,
    muscles: 'Quadriceps · Glutes · Calves',
    cameraHint: 'Side view · wall and full body visible',
    gifUrl: '/previews/wall-sit.gif',
    category: 'Lower Body',
    cuesEn: [
      'Back flat against the wall, head neutral',
      'Thighs parallel to floor (90° knee angle)',
      'Breathe deeply and hold steadily',
    ],
    cuesHinglish: [
      'Peeth wall ke sath flat chipka kar rakhein',
      'Thighs floor ke bilkul parallel rakhein (90 degree)',
      'Lambi saans lein aur position hold karein',
    ],
    cuesHi: [
      'पीठ दीवार से चिपका कर रखें',
      'जांघें फर्श के समानांतर हों',
      'गहरी साँस लेते हुए मुद्रा बनाए रखें',
    ],
  },
  glute_bridge: {
    id: 'glute_bridge',
    label: 'Floor Glute Bridge',
    targetReps: 15,
    kcalPerRep: 0.35,
    muscles: 'Glutes · Hamstrings · Core',
    cameraHint: 'Mat view · hips and knees visible',
    gifUrl: '/previews/glute-bridge.gif',
    category: 'Lower Body',
    cuesEn: [
      'Heels planted comfortably close to hips, ribs relaxed',
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
  const [goodReps, setGoodReps] = useState(0);
  const [badReps, setBadReps] = useState(0);
  const [counterText, setCounterText] = useState('REPS 0');
  const [statusLabel, setStatusLabel] = useState('READY TO START');
  const [isBadForm, setIsBadForm] = useState(false);
  const [primaryMetric, setPrimaryMetric] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [cameraMode, setCameraMode] = useState<'guided' | 'camera'>('guided');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [desktopLaunching, setDesktopLaunching] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);
  const [exerciseCategoryFilter, setExerciseCategoryFilter] = useState<'all' | 'Lower Body' | 'Upper Body' | 'Cardio & Core'>('all');
  const [avatarModel, setAvatarModel] = useState<'man-athletic' | 'woman-casual' | 'mannequin'>('man-athletic');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRealtimeVoice, setShowRealtimeVoice] = useState(false);
  const arenaCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (arenaCardRef.current?.requestFullscreen) {
        arenaCardRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const getExerciseGif = (id: string, fallbackUrl?: string) => {
    if (avatarModel === 'mannequin') {
      return fallbackUrl || `/previews/${id}.gif`;
    }
    const mapping: Record<string, string> = {
      'squat': 'squat.gif',
      'pushup': 'push-up.gif',
      'jumping_jack': 'jumping-jacks.gif',
      'lunge': 'lunges.gif',
      'bicep_curl': 'biceps-curl.gif',
      'high_knees': 'high-knees.gif',
      'wall_sit': 'wall-sit.gif',
      'glute_bridge': 'glute-bridge.gif',
    };
    const filename = mapping[id] || (id.endsWith('.gif') ? id : `${id}.gif`);
    return `/previews/${avatarModel}/${filename}`;
  };

  // Full 443+ Exercises Library State
  const [catalogTab, setCatalogTab] = useState<'ai' | 'all'>('ai');
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryCategory, setLibraryCategory] = useState('all');
  const [libraryLimit, setLibraryLimit] = useState(24);
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<{
    id: string;
    en: string;
    amount_en?: string;
    steps_en?: string[];
    category: string;
    duration?: number;
  } | null>(null);

  const AI_TRACKED_MAP: Record<string, ExerciseTypeId> = {
    'squat': 'squat',
    'push-up': 'pushup',
    'jumping-jacks': 'jumping_jack',
    'lunges': 'lunge',
    'biceps-curl': 'bicep_curl',
    'high-knees': 'high_knees',
    'wall-sit': 'wall_sit',
    'glute-bridge': 'glute_bridge',
  };

  const filteredLibrary = useMemo(() => {
    const list = (exercisesData.exercises || []) as Array<{
      id: string;
      en: string;
      amount_en?: string;
      steps_en?: string[];
      category: string;
      duration?: number;
    }>;
    const q = librarySearch.trim().toLowerCase();
    return list.filter((ex) => {
      const matchCat = libraryCategory === 'all' || ex.category === libraryCategory;
      const matchSearch =
        !q ||
        ex.en.toLowerCase().includes(q) ||
        ex.id.toLowerCase().includes(q) ||
        ex.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [librarySearch, libraryCategory]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const lastSpokenCueRef = useRef<string>('');
  const lastSpokenTimeRef = useRef<number>(0);
  const repsRef = useRef<number>(0);

  const [activeCustomExercise, setActiveCustomExercise] = useState<{
    id: string;
    en: string;
    amount_en?: string;
    steps_en?: string[];
    category: string;
    duration?: number;
  } | null>(null);

  const meta = useMemo(() => {
    if (activeCustomExercise) {
      const isSec = Boolean(activeCustomExercise.amount_en?.toLowerCase().includes('sec'));
      const numMatch = activeCustomExercise.amount_en?.match(/\d+/);
      const parsedReps = numMatch ? parseInt(numMatch[0], 10) : 10;
      const cleanSteps =
        activeCustomExercise.steps_en && activeCustomExercise.steps_en.length > 0
          ? activeCustomExercise.steps_en
          : ['Maintain controlled posture and steady breathing throughout.'];

      return {
        id: activeCustomExercise.id as any,
        label: activeCustomExercise.en,
        category: activeCustomExercise.category,
        muscles: activeCustomExercise.category.replace(/-/g, ' ').toUpperCase(),
        targetReps: parsedReps,
        usesTimer: isSec,
        kcalPerRep: 0.35,
        gifUrl: getExerciseGif(activeCustomExercise.id),
        cameraHint: activeCustomExercise.amount_en || 'Follow the athletic 3D movement',
        cuesEn: cleanSteps,
        cuesHi: cleanSteps,
        cuesHinglish: cleanSteps,
        isCustom: true,
      };
    }
    return {
      ...(EXERCISES[selectedExercise] || EXERCISES.squat),
      isCustom: false,
    };
  }, [activeCustomExercise, selectedExercise, avatarModel]);

  const preferredLang = state.profile?.lifestyle.preferredLanguage ?? 'auto';
  const activeLang =
    preferredLang === 'auto' ? state.conversationMemory.detectedLanguage : preferredLang;

  const activeCues = useMemo(() => {
    if (activeCustomExercise && activeCustomExercise.steps_en && activeCustomExercise.steps_en.length > 0) {
      return activeCustomExercise.steps_en;
    }
    return activeLang === 'hi'
      ? meta.cuesHi
      : activeLang === 'hinglish'
        ? meta.cuesHinglish
        : meta.cuesEn;
  }, [activeCustomExercise, activeLang, meta]);

  const speakCue = (text: string, force: boolean = false) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const now = Date.now();
    if (!force && lastSpokenCueRef.current === text && now - lastSpokenTimeRef.current < 3500) {
      return;
    }
    lastSpokenCueRef.current = text;
    lastSpokenTimeRef.current = now;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = activeLang === 'en' ? 'en-IN' : 'hi-IN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech fallback
    }
  };

  // Timer loop
  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRunning]);

  // Clean up and initialize camera
  useEffect(() => {
    if (cameraMode !== 'camera') {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (frameIntervalRef.current) {
        window.clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
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
        setCameraError('Browser camera access is not available in this environment.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
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
            'Camera permission declined or no webcam detected. Guided 3D Demo works fully without a camera.'
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
      if (frameIntervalRef.current) {
        window.clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    };
  }, [cameraMode]);

  // Real-time Pose Detection Frame Loop (MediaPipe CV integration from repetition-counter--main)
  useEffect(() => {
    if (cameraMode !== 'camera' || !isRunning || cameraError) {
      if (frameIntervalRef.current) {
        window.clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      return;
    }

    let isProcessing = false;
    const processLoop = async () => {
      if (isProcessing) return;
      const video = videoRef.current;
      const overlay = overlayCanvasRef.current;
      if (!video || video.readyState < 2 || !overlay) return;

      if (!captureCanvasRef.current) {
        captureCanvasRef.current = document.createElement('canvas');
      }
      const captureCanvas = captureCanvasRef.current;
      captureCanvas.width = 480;
      captureCanvas.height = 360;
      const ctx = captureCanvas.getContext('2d');
      if (!ctx) return;

      // Draw direct standard video frame to capture canvas (1:1 MediaPipe tracking)
      ctx.drawImage(video, 0, 0, 480, 360);

      const base64Data = captureCanvas.toDataURL('image/jpeg', 0.65);

      isProcessing = true;
      try {
        const resp = await fetch('/api/workout/process-frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exercise_id: selectedExercise,
            image_base64: base64Data,
            session_id: 'web_session_main',
            reset: false,
            draw_overlay: false,
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data.ok) {
            setReps(data.reps || 0);
            repsRef.current = data.reps || 0;
            setGoodReps(data.good_reps || 0);
            setBadReps(data.bad_reps || 0);
            setCounterText(data.counter_text || `REPS ${data.reps || 0}`);
            setStatusLabel(data.status_label || 'READY');
            setIsBadForm(Boolean(data.is_bad_form || data.sustained_bad));

            if (data.primary_metric !== null && data.primary_metric !== undefined) {
              setPrimaryMetric(`${data.primary_name || 'Angle'}: ${Math.round(data.primary_metric)}°`);
            } else {
              setPrimaryMetric(null);
            }

            // Draw Skeleton on Overlay Canvas (in 1:1 direct pixel alignment)
            const overlayCtx = overlay.getContext('2d');
            if (overlayCtx) {
              overlay.width = video.clientWidth || 640;
              overlay.height = video.clientHeight || 480;
              overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

              if (data.landmarks && Array.isArray(data.landmarks) && data.landmarks.length > 0) {
                const w = overlay.width;
                const h = overlay.height;
                const strokeColor = data.is_bad_form || data.sustained_bad
                  ? '#ff8175'
                  : data.is_good_form
                    ? '#37d264'
                    : '#f1ba5b';

                overlayCtx.lineWidth = 3;
                overlayCtx.strokeStyle = strokeColor;
                overlayCtx.fillStyle = strokeColor;

                // Draw bones
                for (const [start, end] of CONNECTIONS) {
                  const p1 = data.landmarks[start];
                  const p2 = data.landmarks[end];
                  if (p1 && p2 && (p1.visibility ?? 1) > 0.4 && (p2.visibility ?? 1) > 0.4) {
                    const x1 = p1.x * w;
                    const y1 = p1.y * h;
                    const x2 = p2.x * w;
                    const y2 = p2.y * h;
                    overlayCtx.beginPath();
                    overlayCtx.moveTo(x1, y1);
                    overlayCtx.lineTo(x2, y2);
                    overlayCtx.stroke();
                  }
                }

                // Draw joints
                for (const p of data.landmarks) {
                  if ((p.visibility ?? 1) > 0.4) {
                    const x = p.x * w;
                    const y = p.y * h;
                    overlayCtx.beginPath();
                    overlayCtx.arc(x, y, 4, 0, 2 * Math.PI);
                    overlayCtx.fill();
                  }
                }
              }
            }

            // Adaptive Voice Coaching (Slide 5)
            if (data.voice_cue) {
              speakCue(data.voice_cue, true);
            } else if (data.reps > 0 && data.reps % 5 === 0 && data.reps !== repsRef.current) {
              speakCue(
                activeLang === 'hinglish'
                  ? `Shabash! ${data.reps} reps poore hue!`
                  : activeLang === 'hi'
                    ? `बहुत बढ़िया! ${data.reps} रेप्स पूरे हुए!`
                    : `Solid work! ${data.reps} reps completed!`
              );
            }
          }
        }
      } catch {
        // Frame drop tolerance
      } finally {
        isProcessing = false;
      }
    };

    frameIntervalRef.current = window.setInterval(processLoop, 120);
    return () => {
      if (frameIntervalRef.current) {
        window.clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
    };
  }, [cameraMode, isRunning, selectedExercise, cameraError, activeLang]);

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
    setCounterText(`REPS ${next}`);
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

  const handleResetSession = async () => {
    repsRef.current = 0;
    setReps(0);
    setGoodReps(0);
    setBadReps(0);
    setSeconds(0);
    setCounterText('REPS 0');
    setStatusLabel('READY TO START');
    try {
      await fetch('/api/workout/process-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: selectedExercise,
          image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
          session_id: 'web_session_main',
          reset: true,
        }),
      });
    } catch {
      // Ignored
    }
  };

  const handleLaunchDesktop = async () => {
    setDesktopLaunching(true);
    try {
      const resp = await fetch('/api/workout/launch-desktop', {
        method: 'POST',
      });
      const data = await resp.json();
      if (data.ok) {
        setSavedNotice('Formwise Desktop App launched in a dedicated high-performance window!');
        setTimeout(() => setSavedNotice(null), 5000);
      }
    } catch {
      setSavedNotice('Could not launch desktop window. Running via web browser mode instead.');
      setTimeout(() => setSavedNotice(null), 4000);
    } finally {
      setDesktopLaunching(false);
    }
  };

  const handleStopAndSave = async () => {
    setIsRunning(false);
    const finalReps = Math.max(repsRef.current, reps, 1);
    const duration = Math.max(seconds, 15);
    const kcal = Math.round(finalReps * meta.kcalPerRep);
    const totalRecorded = goodReps + badReps;
    const accuracy = totalRecorded > 0 ? Math.round((goodReps / totalRecorded) * 100) : 92;

    // Log locally in AppContext (updates Dashboard rings & AI Coach context)
    logWorkout({
      exerciseType: selectedExercise,
      exerciseLabel: meta.label,
      repsCompleted: finalReps,
      targetReps: meta.targetReps,
      durationSeconds: duration,
      estimatedKcal: kcal,
      mode: cameraMode === 'camera' && !cameraError ? 'camera_preview' : 'guided_demo',
      formNotes: [statusLabel, `${accuracy}% form consistency`],
    });

    // Also persist to backend API
    try {
      await fetch('/api/workout/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_type: selectedExercise,
          exercise_label: meta.label,
          reps_completed: finalReps,
          target_reps: meta.targetReps,
          good_reps: goodReps || finalReps,
          bad_reps: badReps || 0,
          duration_seconds: duration,
          calories_burned: kcal,
          form_accuracy: accuracy,
        }),
      });
    } catch {
      // Offline fallback
    }

    adjustHydration(0.25);
    setSavedNotice(
      `✓ Logged ${finalReps} ${meta.label} reps (~${kcal} kcal) to Today & Progress!`
    );
    handleResetSession();
    setTimeout(() => setSavedNotice(null), 4500);
  };

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalRepsToday = workoutsToday.reduce((sum, w) => sum + w.repsCompleted, 0);

  return (
    <div className="space-y-5 pb-20 text-left animate-fadeIn max-w-5xl mx-auto">
      {/* Clean Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="emerald" size="sm">
              AI Movement Tracker
            </Badge>
            <span className="text-xs text-forest/65 dark:text-ivory/65">
              Today: <strong>{totalRepsToday} reps</strong>
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-forest dark:text-white mt-1">
            Move Studio
          </h1>
        </div>

        {/* Clean, Non-Clustered Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Real-time Voice Talk Mode Button */}
          <button
            type="button"
            onClick={() => setShowRealtimeVoice(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs bg-gradient-to-r from-emerald-600 via-teal-600 to-forest hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/40"
            title="Start Real-Time Voice Talk Mode (Talk to AI Assistant)"
          >
            <Mic className="w-3.5 h-3.5 animate-pulse text-amber-300" />
            <span>Voice Talk Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setCameraMode(cameraMode === 'guided' ? 'camera' : 'guided')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
              cameraMode === 'camera'
                ? 'bg-emerald text-white border-emerald shadow-emerald/20'
                : 'bg-white/90 dark:bg-white/10 border-forest/15 dark:border-white/15 text-forest dark:text-ivory hover:border-emerald'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{cameraMode === 'camera' ? 'Camera Active' : 'Use AI Camera'}</span>
          </button>

          <button
            type="button"
            onClick={() => setVoiceEnabled((v) => !v)}
            className="p-2 rounded-xl border border-forest/15 dark:border-white/15 bg-white/90 dark:bg-white/10 text-forest dark:text-ivory hover:border-emerald/40 transition-colors"
            title={voiceEnabled ? 'Cues Voice: On' : 'Cues Voice: Muted'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4 text-emerald" /> : <VolumeX className="w-4 h-4 text-forest/40" />}
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl border border-forest/15 dark:border-white/15 bg-white/90 dark:bg-white/10 text-forest dark:text-ivory hover:border-emerald/40 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Exercise Picker Strip (Formwise 7 Exercises + Glute Bridge + Active Custom) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {activeCustomExercise && (
          <div className="flex items-center gap-1.5 shrink-0 animate-fadeIn">
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap bg-emerald text-white border-emerald shadow-sm flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span>{activeCustomExercise.en}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveCustomExercise(null);
                handleResetSession();
              }}
              className="p-1.5 rounded-xl bg-forest/10 hover:bg-forest/20 dark:bg-white/10 dark:hover:bg-white/20 text-forest/70 dark:text-ivory/70 transition-colors"
              title="Return to standard exercises"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {(Object.values(EXERCISES) as ExerciseMeta[]).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setActiveCustomExercise(null);
              setSelectedExercise(item.id);
              handleResetSession();
            }}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              !activeCustomExercise && selectedExercise === item.id
                ? 'bg-forest text-white dark:bg-emerald border-forest dark:border-emerald shadow-sm scale-[1.02]'
                : 'bg-white/75 dark:bg-white/5 border-forest/10 dark:border-white/10 text-forest/80 dark:text-ivory/80 hover:bg-forest/5'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {savedNotice && (
        <div className="p-3 rounded-xl bg-emerald/15 border border-emerald/35 text-xs font-semibold text-forest dark:text-emerald-200 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Main Studio Arena: Unified, Spacious, Uncluttered Arena */}
      <Card
        ref={arenaCardRef}
        variant="elevated"
        className={`p-4 sm:p-5 overflow-hidden transition-all ${
          isFullscreen
            ? 'fixed inset-0 z-50 w-screen h-screen rounded-none bg-black border-0 p-4 flex flex-col justify-between overflow-y-auto'
            : ''
        }`}
      >
        <div className="space-y-4">
          {/* Main Visual Arena (3D Athletic Model or AI Camera Feed) */}
          <div className="relative rounded-2xl bg-gradient-to-br from-emerald-50/80 via-ivory to-sage/30 dark:from-[#092019] dark:via-[#061812] dark:to-[#0A251C] border border-forest/10 dark:border-white/10 p-2 sm:p-3 flex flex-col justify-between min-h-[480px] sm:min-h-[540px] lg:min-h-[580px] overflow-hidden">
            {cameraMode === 'camera' ? (
              cameraError ? (
                <div className="text-center space-y-3 p-6 my-auto">
                  <p className="text-xs font-semibold text-amber-700 dark:text-gold max-w-xs mx-auto">
                    {cameraError}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setCameraMode('guided')}>
                    Switch to Guided 3D Mode
                  </Button>
                </div>
              ) : (
                <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[460px] sm:min-h-[520px] lg:min-h-[560px] rounded-xl overflow-hidden bg-black flex items-center justify-center border border-forest/20 shadow-inner">
                  {/* Flipped/Unflipped Viewport */}
                  <div
                    className="absolute inset-0 w-full h-full transition-transform duration-200"
                    style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain block mx-auto"
                    />
                    <canvas
                      ref={overlayCanvasRef}
                      className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    />
                  </div>

                  {/* Top-Left: Status Pill & Angle Metric */}
                  <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
                    <span
                      className={`px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm transition-colors ${
                        isBadForm
                          ? 'bg-rose-600/95 text-white'
                          : statusLabel.includes('GOOD FORM')
                            ? 'bg-emerald-600/95 text-white'
                            : 'bg-black/75 text-amber-300'
                      }`}
                    >
                      {statusLabel}
                    </span>
                    {primaryMetric && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-mono text-emerald-300 w-fit">
                        {primaryMetric}
                      </span>
                    )}
                  </div>

                  {/* Top-Right: Counter & Controls */}
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 pointer-events-auto">
                    <span className="px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md text-sm font-black font-mono text-white tracking-wider border border-white/20">
                      {counterText}
                    </span>
                    <span className="hidden sm:inline-block px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-xs font-mono text-emerald-400 border border-white/10">
                      ⏱ {formatTimer(seconds)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsMirrored((m) => !m)}
                      className="p-1.5 rounded-xl bg-black/75 backdrop-blur-md text-white hover:bg-forest/80 border border-white/20 transition-all"
                      title={isMirrored ? 'Mirror: On' : 'Orientation: Normal'}
                    >
                      <FlipHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleFullscreen}
                      className="p-1.5 rounded-xl bg-black/75 backdrop-blur-md text-white hover:bg-forest/80 border border-white/20 transition-all"
                      title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </button>
                  </div>

                  {/* Center Start Overlay (when stopped) */}
                  {!isRunning && (
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5 p-4 z-30 text-center">
                      <Button
                        size="md"
                        variant="gold"
                        onClick={handleToggleRun}
                        leftIcon={<Play className="w-4 h-4" />}
                        className="px-6 py-2.5 font-bold"
                      >
                        Start Tracking
                      </Button>
                      <p className="text-[11px] text-white/80 max-w-xs">
                        {meta.cameraHint} — step back so your full body is in view.
                      </p>
                    </div>
                  )}
                </div>
              )
            ) : avatarModel === 'mannequin' ? (
              <div className="min-h-[460px] sm:min-h-[520px] flex items-center justify-center">
                <AnatomicalAthleteVisual exerciseType={selectedExercise} isActive={true} />
              </div>
            ) : (
              <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] min-h-[460px] sm:min-h-[520px] lg:min-h-[560px] rounded-xl overflow-hidden bg-black/5 dark:bg-black/30 flex items-center justify-center p-3 border border-forest/10 dark:border-white/10">
                <img
                  src={
                    activeCustomExercise
                      ? getExerciseGif(activeCustomExercise.id)
                      : getExerciseGif(selectedExercise, meta.gifUrl)
                  }
                  alt={meta.label}
                  className="w-full h-full object-contain rounded-xl max-h-[520px] sm:max-h-[580px]"
                />
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-forest/85 dark:bg-black/80 text-[11px] font-bold text-emerald-300 backdrop-blur-sm shadow-sm">
                    {avatarModel === 'man-athletic' ? '🏃 3D Athletic Model' : '🧘 3D Casual Model'}
                  </span>
                  <span className="hidden sm:inline-block px-2.5 py-1 rounded-xl bg-forest/70 dark:bg-black/60 text-[10px] font-semibold text-white/90 backdrop-blur-sm">
                    {meta.muscles}
                  </span>
                </div>

                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 pointer-events-auto">
                  <span className="px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md text-sm font-black font-mono text-white tracking-wider border border-white/20">
                    {reps} / {meta.targetReps} reps
                  </span>
                  <span className="hidden sm:inline-block px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-xs font-mono text-emerald-400 border border-white/10">
                    ⏱ {formatTimer(seconds)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsMirrored((m) => !m)}
                    className="p-1.5 rounded-xl bg-black/75 backdrop-blur-md text-white hover:bg-forest/80 border border-white/20 transition-all"
                    title={isMirrored ? 'Mirror: On' : 'Orientation: Normal'}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleFullscreen}
                    className="p-1.5 rounded-xl bg-black/75 backdrop-blur-md text-white hover:bg-forest/80 border border-white/20 transition-all"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 px-1 flex items-center justify-between text-[11px] text-forest/65 dark:text-ivory/65">
              <span>{meta.cameraHint}</span>
              <span>Target: {meta.targetReps} {meta.usesTimer ? 'sec' : 'reps'} • Est: ~{Math.round(reps * meta.kcalPerRep)} kcal</span>
            </div>
          </div>

          {/* Form Guidance Cue Banner */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-forest/5 dark:bg-white/5 border border-forest/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald/15 text-emerald flex items-center justify-center font-bold text-xs shrink-0">
                💡
              </span>
              <span className="font-semibold text-forest dark:text-white">
                Form Tip: <span className="font-normal text-forest/80 dark:text-ivory/80">{activeCues[0]}</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-forest/65 dark:text-ivory/65 shrink-0">
              <span>Good reps: <strong className="text-forest dark:text-white">{goodReps || reps}</strong></span>
              <span>•</span>
              <span>Form checks: <strong className="text-forest dark:text-white">{badReps} flagged</strong></span>
            </div>
          </div>

          {/* Unified Action Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={isRunning ? 'danger' : 'primary'}
                size="md"
                onClick={handleToggleRun}
                leftIcon={isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                className="font-bold shadow-xs px-5"
              >
                {isRunning ? 'Pause Workout' : 'Start Workout'}
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => handleAddRep(1)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                +1 Rep
              </Button>

              <button
                type="button"
                onClick={handleResetSession}
                className="p-2.5 rounded-xl bg-forest/5 hover:bg-forest/10 dark:bg-white/5 dark:hover:bg-white/10 text-forest/70 dark:text-ivory/70 transition-colors"
                title="Reset Reps"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="gold"
                size="md"
                onClick={handleStopAndSave}
                leftIcon={<Square className="w-3.5 h-3.5" />}
                className="font-bold"
              >
                Finish &amp; Log Set
              </Button>

              <button
                type="button"
                onClick={() => setShowDetailsDrawer((d) => !d)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-forest/70 dark:text-ivory/70 hover:text-forest dark:hover:text-white border border-forest/10 dark:border-white/10 transition-colors"
              >
                {showDetailsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>Session Specs</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRealtimeVoice(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-xs transition-all"
                title="Talk in real-time with AI Coach"
              >
                <Mic className="w-3.5 h-3.5 animate-pulse text-amber-300" />
                <span>Voice Coach</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/coach')}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-forest/70 dark:text-ivory/70 hover:text-emerald border border-forest/10 dark:border-white/10 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Text Chat</span>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* EXERCISE CATALOG: 8 AI CAMERA TRACKED + 443+ FULL MOTION LIBRARY */}
      <div className="space-y-4 pt-4">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-forest/10 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-forest/5 dark:bg-white/5 border border-forest/10 dark:border-white/10 w-fit">
            <button
              type="button"
              onClick={() => setCatalogTab('ai')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                catalogTab === 'ai'
                  ? 'bg-emerald text-white shadow-sm'
                  : 'text-forest dark:text-ivory hover:text-emerald'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>AI Camera Tracked (8)</span>
            </button>
            <button
              type="button"
              onClick={() => setCatalogTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                catalogTab === 'all'
                  ? 'bg-emerald text-white shadow-sm'
                  : 'text-forest dark:text-ivory hover:text-emerald'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Full Exercise Library (443+)</span>
            </button>
          </div>

          {/* 3D Character Model Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-forest/5 dark:bg-white/5 border border-forest/10 dark:border-white/10 text-xs">
            <span className="text-[11px] font-bold text-forest/70 dark:text-ivory/70 px-1.5">3D Model:</span>
            <button
              type="button"
              onClick={() => setAvatarModel('man-athletic')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                avatarModel === 'man-athletic'
                  ? 'bg-forest text-white dark:bg-emerald dark:text-forest shadow-sm'
                  : 'text-forest/70 dark:text-ivory/70 hover:bg-forest/5'
              }`}
            >
              🏃 3D Athletic (Male)
            </button>
            <button
              type="button"
              onClick={() => setAvatarModel('woman-casual')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                avatarModel === 'woman-casual'
                  ? 'bg-forest text-white dark:bg-emerald dark:text-forest shadow-sm'
                  : 'text-forest/70 dark:text-ivory/70 hover:bg-forest/5'
              }`}
            >
              🧘 3D Casual (Female)
            </button>
            <button
              type="button"
              onClick={() => setAvatarModel('mannequin')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                avatarModel === 'mannequin'
                  ? 'bg-forest text-white dark:bg-emerald dark:text-forest shadow-sm'
                  : 'text-forest/70 dark:text-ivory/70 hover:bg-forest/5'
              }`}
            >
              🤖 Mannequin
            </button>
          </div>
        </div>

        {/* TAB 1: 8 AI FORMWISE CAMERA EXERCISES */}
        {catalogTab === 'ai' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-heading font-extrabold text-xl text-forest dark:text-white">
                  All Formwise AI Exercises
                </h2>
                <p className="text-xs text-forest/60 dark:text-ivory/60">
                  Full 33-point MediaPipe skeleton tracking with real-time audio guidance
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {(['all', 'Lower Body', 'Upper Body', 'Cardio & Core'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setExerciseCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      exerciseCategoryFilter === cat
                        ? 'bg-forest text-white dark:bg-emerald dark:text-forest shadow-sm'
                        : 'bg-white/75 dark:bg-white/5 text-forest/70 dark:text-ivory/70 hover:bg-forest/5'
                    }`}
                  >
                    {cat === 'all' ? 'All (8)' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 4-Column Grid of 8 Exercise Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(Object.values(EXERCISES) as ExerciseMeta[])
                .filter((item) =>
                  exerciseCategoryFilter === 'all'
                    ? true
                    : exerciseCategoryFilter === 'Cardio & Core'
                      ? item.category.includes('Cardio') || item.category.includes('Core')
                      : item.category.includes(exerciseCategoryFilter)
                )
                .map((item) => {
                  const isSelected = !activeCustomExercise && selectedExercise === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setActiveCustomExercise(null);
                        setSelectedExercise(item.id);
                        handleResetSession();
                        if (arenaCardRef.current) {
                          arenaCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        } else {
                          window.scrollTo({ top: 120, behavior: 'smooth' });
                        }
                      }}
                      className={`group relative rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/25 shadow-md scale-[1.01]'
                          : 'border-forest/10 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:border-emerald/40 hover:shadow-sm'
                      }`}
                    >
                      {/* Top Animated GIF Preview */}
                      <div className="relative w-full aspect-video rounded-xl bg-black/5 dark:bg-black/40 overflow-hidden mb-2.5 flex items-center justify-center p-1">
                        <img
                          src={getExerciseGif(item.id, item.gifUrl)}
                          alt={item.label}
                          className="w-full h-full object-contain rounded-lg"
                          loading="lazy"
                        />
                        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-forest/85 dark:bg-black/80 text-[9px] font-bold text-white backdrop-blur-sm">
                          {item.category}
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-emerald text-white text-[9px] font-bold shadow-sm">
                            Selected ✓
                          </div>
                        )}
                      </div>

                      {/* Body Content */}
                      <div className="space-y-1">
                        <h3 className="font-heading font-bold text-sm text-forest dark:text-white group-hover:text-emerald transition-colors">
                          {item.label}
                        </h3>
                        <p className="text-[11px] text-forest/70 dark:text-ivory/70 line-clamp-1">
                          {item.muscles}
                        </p>
                      </div>

                      {/* Bottom Stats & Action */}
                      <div className="mt-3 pt-2.5 border-t border-forest/8 dark:border-white/10 flex items-center justify-between text-[11px]">
                        <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                          {item.targetReps} {item.usesTimer ? 'sec' : 'reps'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            isSelected
                              ? 'bg-emerald text-white'
                              : 'bg-forest/5 dark:bg-white/10 text-forest dark:text-ivory group-hover:bg-emerald group-hover:text-white'
                          }`}
                        >
                          {isSelected ? 'Active' : 'Train Now →'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 2: FULL 443+ EXERCISES LIBRARY */}
        {catalogTab === 'all' && (
          <div className="space-y-4">
            {/* Search and Category Filters */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-forest/50 dark:text-ivory/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search 443+ exercises (e.g. plank, yoga, burpees, lunge)..."
                  value={librarySearch}
                  onChange={(e) => {
                    setLibrarySearch(e.target.value);
                    setLibraryLimit(24);
                  }}
                  className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-forest/5 dark:bg-white/5 border border-forest/15 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald/40 text-forest dark:text-white placeholder:text-forest/40"
                />
                {librarySearch && (
                  <button
                    onClick={() => setLibrarySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-forest/40 hover:text-forest dark:text-white/40"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {[
                  { id: 'all', label: 'All (443)' },
                  { id: 'hips-legs', label: 'Hips & Legs' },
                  { id: 'neck-shoulders-arms', label: 'Neck, Shoulders & Arms' },
                  { id: 'back-spine', label: 'Back & Spine' },
                  { id: 'aerobic', label: 'Aerobic' },
                  { id: 'holds', label: 'Holds' },
                  { id: 'balance', label: 'Balance' },
                  { id: 'cardio-low-impact', label: 'Low-Impact' },
                  { id: 'chair', label: 'Chair' },
                  { id: 'dance', label: 'Dance' },
                  { id: 'floor-seated', label: 'Floor Seated' },
                  { id: 'floor-lying', label: 'Floor Lying' },
                  { id: 'yoga', label: 'Yoga' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setLibraryCategory(c.id);
                      setLibraryLimit(24);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      libraryCategory === c.id
                        ? 'bg-forest text-white dark:bg-emerald dark:text-forest shadow-sm'
                        : 'bg-white/75 dark:bg-white/5 text-forest/70 dark:text-ivory/70 hover:bg-forest/5'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4-Column Grid of 443 Exercises */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredLibrary.slice(0, libraryLimit).map((ex) => {
                const isAiTracked = Boolean(AI_TRACKED_MAP[ex.id]);
                const aiKey = AI_TRACKED_MAP[ex.id];
                const isSelected = activeCustomExercise
                  ? activeCustomExercise.id === ex.id
                  : isAiTracked && selectedExercise === aiKey;

                return (
                  <div
                    key={ex.id}
                    onClick={() => {
                      if (isAiTracked && aiKey) {
                        setActiveCustomExercise(null);
                        setSelectedExercise(aiKey);
                      } else {
                        setActiveCustomExercise(ex);
                      }
                      handleResetSession();
                      setCameraMode('guided');
                      if (arenaCardRef.current) {
                        arenaCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      } else {
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }
                    }}
                    className={`group relative rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between overflow-hidden bg-white/80 dark:bg-white/5 hover:border-emerald/40 hover:shadow-sm ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm scale-[1.01]'
                        : 'border-forest/10 dark:border-white/10'
                    }`}
                  >
                    {/* Looping GIF preview */}
                    <div className="relative w-full aspect-video rounded-xl bg-black/5 dark:bg-black/40 overflow-hidden mb-2.5 flex items-center justify-center p-1">
                      <img
                        src={getExerciseGif(ex.id)}
                        alt={ex.en}
                        className="w-full h-full object-contain rounded-lg"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback to placeholder if GIF not present
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-forest/85 dark:bg-black/80 text-[9px] font-bold text-white backdrop-blur-sm">
                        {ex.category}
                      </div>
                      {isAiTracked && (
                        <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-emerald text-white text-[9px] font-black shadow-sm flex items-center gap-1">
                          <Camera className="w-2.5 h-2.5" />
                          AI Tracked
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <div className="space-y-1">
                      <h3 className="font-heading font-bold text-sm text-forest dark:text-white group-hover:text-emerald transition-colors line-clamp-1">
                        {ex.en}
                      </h3>
                      <p className="text-[11px] text-forest/70 dark:text-ivory/70 line-clamp-1">
                        {ex.amount_en || 'Full range repetitions'}
                      </p>
                    </div>

                    {/* Bottom Stats & Action */}
                    <div className="mt-3 pt-2.5 border-t border-forest/8 dark:border-white/10 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                        {ex.amount_en || 'Controlled tempo'}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          isSelected
                            ? 'bg-emerald text-white shadow-xs'
                            : 'bg-forest/5 dark:bg-white/10 text-forest dark:text-ivory group-hover:bg-emerald group-hover:text-white'
                        }`}
                      >
                        {isSelected ? '✓ In Big Arena' : 'Play in Big Arena →'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {filteredLibrary.length > libraryLimit && (
              <div className="pt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setLibraryLimit((prev) => prev + 24)}
                  className="font-bold"
                >
                  Load More Exercises ({filteredLibrary.length - libraryLimit} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SELECTED LIBRARY EXERCISE DETAILS MODAL */}
      <Modal
        isOpen={Boolean(selectedLibraryItem)}
        onClose={() => setSelectedLibraryItem(null)}
        title={selectedLibraryItem?.en || 'Exercise Details'}
      >
        {selectedLibraryItem && (
          <div className="space-y-4">
            {/* Animated GIF demonstration */}
            <div className="relative w-full aspect-video max-h-72 rounded-2xl bg-black/5 dark:bg-black/50 overflow-hidden flex items-center justify-center p-2 border border-forest/10 dark:border-white/10">
              <img
                src={getExerciseGif(selectedLibraryItem.id)}
                alt={selectedLibraryItem.en}
                className="w-full h-full object-contain rounded-xl"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-forest/80 text-white text-[11px] font-bold backdrop-blur-sm">
                Category: {selectedLibraryItem.category}
              </div>
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald text-white text-[11px] font-bold shadow-sm">
                Target: {selectedLibraryItem.amount_en || 'Controlled pace'}
              </div>
            </div>

            {/* Step by step execution instructions */}
            <div className="space-y-2">
              <h4 className="font-heading font-bold text-sm text-forest dark:text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald" />
                Biomechanical Step-by-Step Form Guide
              </h4>
              <div className="space-y-2">
                {selectedLibraryItem.steps_en && selectedLibraryItem.steps_en.length > 0 ? (
                  selectedLibraryItem.steps_en.map((step: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-forest/5 dark:bg-white/5 flex items-start gap-2.5 text-xs text-forest/85 dark:text-ivory/85"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step.replace(/^!/, 'Note: ')}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-forest/60 dark:text-ivory/60">
                    Maintain controlled eccentric and concentric phases with steady breathing throughout.
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-forest/10 dark:border-white/10">
              <Button variant="ghost" size="sm" onClick={() => setSelectedLibraryItem(null)}>
                Close
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveCustomExercise(selectedLibraryItem);
                  setSelectedLibraryItem(null);
                  handleResetSession();
                  setCameraMode('guided');
                  if (arenaCardRef.current) {
                    arenaCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  }
                }}
              >
                Play in Big Arena ↗
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  logWorkout({
                    exerciseType: 'squat',
                    exerciseLabel: selectedLibraryItem.en,
                    durationSeconds: (selectedLibraryItem.duration || 1) * 30,
                    repsCompleted: 12,
                    targetReps: 12,
                    estimatedKcal: 8,
                    mode: 'guided_demo',
                    formNotes: ['Completed guided set from full motion library'],
                  });
                  setSelectedLibraryItem(null);
                  setSavedNotice(`Logged 1 set of ${selectedLibraryItem.en} to your daily activity!`);
                  setTimeout(() => setSavedNotice(null), 4000);
                }}
              >
                Log 1 Set to Daily Rings
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Collapsible Architecture & Specs Drawer */}
      {showDetailsDrawer && (
        <Card variant="surface" className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-forest dark:text-white">
            <Shield className="w-4 h-4 text-emerald" />
            <span>Formwise MediaPipe Pose Landmarker Integration Specs</span>
          </div>
          <p className="text-xs text-forest/75 dark:text-ivory/75 leading-relaxed">
            Powered by Google MediaPipe Pose Landmarker (33 topological anatomical landmarks) and Formwise kinematic state machines. Evaluates joint angles across concentric and eccentric phases, detecting depth, spinal neutrality, and cadence. Rejects partial repetitions and camera jitter.
          </p>
          <div className="pt-2 flex items-center justify-between border-t border-forest/10 dark:border-white/10">
            <span className="text-[11px] text-forest/65 dark:text-ivory/65">
              Prefer running the standalone OpenCV Python desktop client?
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleLaunchDesktop}
              disabled={desktopLaunching}
              leftIcon={<Monitor className="w-3.5 h-3.5" />}
            >
              {desktopLaunching ? 'Launching…' : 'Launch Desktop App'}
            </Button>
          </div>
          {workoutsToday.length > 0 ? (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-forest dark:text-white">Today's Logged Sets:</p>
              {workoutsToday.map((w) => (
                <div
                  key={w.id}
                  className="p-2.5 rounded-xl bg-forest/5 dark:bg-white/5 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-forest dark:text-white">
                    {w.exerciseLabel} — {w.repsCompleted} reps
                  </span>
                  <span className="text-forest/65 dark:text-ivory/65">
                    {w.timeLabel} · {w.durationSeconds}s · ~{w.estimatedKcal} kcal
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-forest/60 dark:text-ivory/60">
              No movement sessions saved yet today. Start your first set above!
            </p>
          )}
        </Card>
      )}

      {/* REAL-TIME VOICE TALK ASSISTANT MODAL */}
      <RealTimeVoiceAssistantModal
        isOpen={showRealtimeVoice}
        onClose={() => setShowRealtimeVoice(false)}
        workoutContext={{
          exerciseLabel: meta.label,
          category: meta.category,
          currentReps: reps,
          targetReps: meta.targetReps,
          formStatus: statusLabel,
          caloriesBurned: Math.round(reps * meta.kcalPerRep),
        }}
      />
    </div>
  );
};
