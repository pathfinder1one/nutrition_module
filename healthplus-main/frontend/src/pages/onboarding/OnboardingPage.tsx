import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  Mic,
  MicOff,
  ShieldAlert,
  Sparkles,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useApp } from '@/context/AppContext';
import { useVoiceCompanion } from '@/hooks/useVoiceCompanion';
import { computePersonalizedTargets } from '@/engine/safetyAndTargets';
import {
  ALLERGEN_LABELS,
  INDIAN_CUISINE_OPTIONS,
  INGREDIENT_CATALOG,
  SPICE_TOLERANCE_OPTIONS,
  extractIngredientsFromText,
} from '@/engine/nutritionCatalog';
import { evaluateProfileSafety } from '@/engine/safetyConfig';
import type {
  ActivityLevel,
  AllergenKey,
  BudgetTier,
  ConversationLanguage,
  DietaryPattern,
  ExerciseEnvironmentPreference,
  ExerciseExperienceLevel,
  GenderOption,
  HealthConditionDisclosure,
  IndianCuisineRegion,
  IngredientKey,
  KitchenSetup,
  LanguagePreference,
  PrimaryGoal,
  SpiceTolerance,
  UserProfile,
} from '@/types/wellness';

interface InterviewTurn {
  id: string;
  speaker: 'ai' | 'user';
  text: string;
  tag?: string;
}

type InterviewStage =
  | 'welcome_language'
  | 'body_baseline'
  | 'goal_rhythm'
  | 'health_safety'
  | 'diet_dislikes'
  | 'cuisine_kitchen'
  | 'pantry_check'
  | 'movement_prefs'
  | 'review_profile';

const STAGES: { id: InterviewStage; label: string }[] = [
  { id: 'welcome_language', label: 'Intro & Language' },
  { id: 'body_baseline', label: 'Body & Activity' },
  { id: 'goal_rhythm', label: 'Wellness Goal' },
  { id: 'health_safety', label: 'Safety Screening' },
  { id: 'diet_dislikes', label: 'Diet & Dislikes' },
  { id: 'cuisine_kitchen', label: 'Indian Taste & Kitchen' },
  { id: 'pantry_check', label: 'Home Pantry' },
  { id: 'movement_prefs', label: 'Movement Style' },
  { id: 'review_profile', label: 'Profile Review' },
];

export interface OnboardingPageProps {
  onNavigate?: (path: string) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onNavigate = () => {} }) => {
  const { state, completeOnboarding } = useApp();
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  const [stageIdx, setStageIdx] = useState(0);
  const currentStage = STAGES[stageIdx].id;

  // Language & Name (zero invented placeholder profile)
  const [preferredLanguage, setPreferredLanguage] = useState<LanguagePreference>('hinglish');
  const [name, setName] = useState(state.auth?.name ?? '');

  // Body & Activity — start intentionally empty so user enters real values (no silent fake profile)
  const [ageInput, setAgeInput] = useState('');
  const [gender, setGender] = useState<GenderOption>('female');
  const [heightInput, setHeightInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('light');

  // Goals
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>('steady_energy');
  const [targetWeightInput, setTargetWeightInput] = useState('');
  const [weeklyWorkoutDays, setWeeklyWorkoutDays] = useState(3);

  // Safety Screening
  const [disclosureStatus, setDisclosureStatus] =
    useState<HealthConditionDisclosure>('disclosed');
  const [allergies, setAllergies] = useState<AllergenKey[]>([]);
  const [celiacOrGlutenFree, setCeliacOrGlutenFree] = useState(false);
  const [diabetesOrSugarConcern, setDiabetesOrSugarConcern] = useState(false);
  const [diabetesContext, setDiabetesContext] = useState<
    'diet_only' | 'medical_supervision' | 'unknown'
  >('unknown');
  const [hypertensionOrBpConcern, setHypertensionOrBpConcern] = useState(false);
  const [kidneyOrRenalConcern, setKidneyOrRenalConcern] = useState(false);
  const [pregnancyOrPostpartum, setPregnancyOrPostpartum] = useState(false);
  const [underMedicalSupervision, setUnderMedicalSupervision] = useState(false);
  const [eatingDisorderHistory, setEatingDisorderHistory] = useState(false);
  const [otherConditionsNote, setOtherConditionsNote] = useState('');

  // Food & Indian Cuisine Preferences
  const [dietaryPattern, setDietaryPattern] = useState<DietaryPattern>('vegetarian');
  const [dislikedText, setDislikedText] = useState('');
  const [cuisinePreferences, setCuisinePreferences] = useState<IndianCuisineRegion[]>([
    'homestyle_pan_indian',
  ]);
  const [spiceTolerance, setSpiceTolerance] = useState<SpiceTolerance>('medium');
  const [cookingTimeLimitMins, setCookingTimeLimitMins] = useState(20);
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('budget');
  const [kitchenSetup, setKitchenSetup] = useState<KitchenSetup>('basic_stove');

  // Home Pantry
  const [availableIngredients, setAvailableIngredients] = useState<IngredientKey[]>([
    'dal',
    'moong_dal',
    'rice',
    'roti_atta',
    'tomato_onion',
    'mixed_veg',
  ]);
  const [pantryQuickText, setPantryQuickText] = useState('');

  // Exercise Experience & Home/Gym Preferences
  const [experienceLevel, setExperienceLevel] = useState<ExerciseExperienceLevel>('beginner');
  const [preferredEnvironment, setPreferredEnvironment] =
    useState<ExerciseEnvironmentPreference>('home_bodyweight');
  const [availableEquipment, setAvailableEquipment] = useState<
    ('none' | 'dumbbells_bands' | 'mat' | 'full_gym')[]
  >(['none']);
  const [preferredSessionMins, setPreferredSessionMins] = useState(20);

  // Natural typed/spoken interview input helper
  const [todayISO] = useState(() => new Date().toISOString().slice(0, 10));
  const [chatReplyInput, setChatReplyInput] = useState('');
  const [transcriptHistory, setTranscriptHistory] = useState<InterviewTurn[]>([]);

  const {
    voicePhase,
    transcript,
    setTranscript,
    speechError,
    voiceOutputEnabled,
    setVoiceOutputEnabled,
    startListening,
    speakText,
    stopAllVoice,
  } = useVoiceCompanion(preferredLanguage);

  const activeReplyValue = chatReplyInput || transcript;

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [transcriptHistory.length, stageIdx]);

  const activeLang: ConversationLanguage =
    preferredLanguage === 'auto' ? 'en' : preferredLanguage;

  const parsedAge = Number(ageInput);
  const parsedHeight = Number(heightInput);
  const parsedWeight = Number(weightInput);
  const parsedTargetWeight = Number(targetWeightInput) || parsedWeight || 62;

  const hasValidBodyBaseline =
    parsedAge >= 15 &&
    parsedAge <= 95 &&
    parsedHeight >= 120 &&
    parsedHeight <= 220 &&
    parsedWeight >= 35 &&
    parsedWeight <= 200;

  const draftProfile: UserProfile = useMemo(() => {
    const cleanDislikes = dislikedText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      basic: {
        name: name.trim() || 'Friend',
        age: hasValidBodyBaseline ? parsedAge : 28,
        gender,
        heightCm: hasValidBodyBaseline ? parsedHeight : 165,
        weightKg: hasValidBodyBaseline ? parsedWeight : 62,
        targetWeightKg: parsedTargetWeight,
      },
      goals: {
        primaryGoal,
        weeklyWorkoutDays,
        dailyStepGoal: activityLevel === 'sedentary' ? 6000 : 7500,
      },
      lifestyle: {
        activityLevel,
        workSchedule: 'desk_9_to_6',
        sleepHours: 7,
        stressLevel: 'moderate',
        preferredLanguage,
      },
      foodPreferences: {
        dietaryPattern,
        cuisinePreferences: cuisinePreferences.length
          ? cuisinePreferences
          : ['homestyle_pan_indian'],
        spiceTolerance,
        dislikedFoods: cleanDislikes,
        cookingTimeLimitMins,
        budgetTier,
        kitchenSetup,
      },
      exercisePreferences: {
        experienceLevel,
        preferredEnvironment,
        availableEquipment: availableEquipment.length ? availableEquipment : ['none'],
        preferredSessionMins,
      },
      foodAvailability: {
        availableIngredients,
        unavailableIngredients: [],
        lastUpdatedDate: todayISO,
      },
      safety: {
        disclosureStatus,
        diabetesContext:
          disclosureStatus === 'prefer_not_to_disclose'
            ? 'unknown'
            : diabetesOrSugarConcern
              ? diabetesContext
              : 'unknown',
        allergies,
        celiacOrGlutenFree:
          disclosureStatus === 'prefer_not_to_disclose' ? false : celiacOrGlutenFree,
        diabetesOrSugarConcern:
          disclosureStatus === 'prefer_not_to_disclose' ? false : diabetesOrSugarConcern,
        hypertensionOrBpConcern:
          disclosureStatus === 'prefer_not_to_disclose' ? false : hypertensionOrBpConcern,
        kidneyOrRenalConcern:
          disclosureStatus === 'prefer_not_to_disclose' ? false : kidneyOrRenalConcern,
        pregnancyOrPostpartum:
          disclosureStatus === 'prefer_not_to_disclose' ? false : pregnancyOrPostpartum,
        underMedicalSupervision:
          disclosureStatus === 'prefer_not_to_disclose'
            ? false
            : underMedicalSupervision ||
              (diabetesOrSugarConcern && diabetesContext === 'medical_supervision'),
        eatingDisorderHistory:
          disclosureStatus === 'prefer_not_to_disclose' ? false : eatingDisorderHistory,
        otherConditionsNote: otherConditionsNote.trim(),
      },
    };
  }, [
    name,
    hasValidBodyBaseline,
    parsedAge,
    gender,
    parsedHeight,
    parsedWeight,
    parsedTargetWeight,
    primaryGoal,
    weeklyWorkoutDays,
    activityLevel,
    preferredLanguage,
    dietaryPattern,
    cuisinePreferences,
    spiceTolerance,
    dislikedText,
    cookingTimeLimitMins,
    budgetTier,
    kitchenSetup,
    experienceLevel,
    preferredEnvironment,
    availableEquipment,
    preferredSessionMins,
    availableIngredients,
    todayISO,
    disclosureStatus,
    allergies,
    celiacOrGlutenFree,
    diabetesOrSugarConcern,
    diabetesContext,
    hypertensionOrBpConcern,
    kidneyOrRenalConcern,
    pregnancyOrPostpartum,
    underMedicalSupervision,
    eatingDisorderHistory,
    otherConditionsNote,
  ]);

  const previewTargets = useMemo(
    () => computePersonalizedTargets(draftProfile),
    [draftProfile]
  );

  const safetyEvaluation = useMemo(
    () => evaluateProfileSafety(draftProfile),
    [draftProfile]
  );

  // Adaptive prompt for the current conversational stage
  const currentAiPrompt = useMemo(() => {
    const cleanName = name.trim() || (activeLang === 'hinglish' ? 'dost' : 'there');

    switch (currentStage) {
      case 'welcome_language':
        return activeLang === 'hi'
          ? 'नमस्ते! मैं आपका HEALTH PLUS पर्सनल वेलनेस साथी हूँ। कोई लंबा फॉर्म नहीं भरना — मैं बस आपसे कुछ बातचीत करूँगा ताकि आपका सही भोजन, गतिविधि और सुरक्षा प्रोफ़ाइल बना सकूँ। किस भाषा में बात करना पसंद करेंगे, और मैं आपको किस नाम से बुलाऊँ?'
          : activeLang === 'hinglish'
            ? 'Namaste! Main aapka HEALTH PLUS personal wellness companion hoon. Koi boring form nahi — bas ek chhoti si baat-cheet karenge taaki main aapke ghar ke khane, routine aur health limits ko sahi tarah samajh sakun. Pehle batayein: aap kis language mein comfortable hain, aur main aapko kis naam se bulaun?'
            : 'Hi there! I am your HEALTH PLUS personal wellness companion. Instead of dropping random numbers or a static template, I want to understand how you actually eat, move, and live. Which language feels most natural to you, and what should I call you?';

      case 'body_baseline':
        return activeLang === 'hi'
          ? `मिलकर खुशी हुई, ${cleanName}! अपनी रोज़ाना की ऊर्जा का सही अनुमान लगाने के लिए आपकी उम्र, लंबाई (cm), वज़न (kg) और दिनभर की हलचल जानना मददगार होगा। (कोई अनुमानित या पूर्व-भरा नंबर नहीं उपयोग किया जाएगा।)`
          : activeLang === 'hinglish'
            ? `Bahut badhiya, ${cleanName}! Aapki daily energy aur protein range sahi rakhne ke liye apni age, height (cm), weight (kg) aur rozana ka activity level batayein.`
            : `Nice to meet you, ${cleanName}! To calibrate a realistic energy and movement baseline without guessing, share your age, height (cm), weight (kg), and typical daily activity rhythm.`;

      case 'goal_rhythm':
        return activeLang === 'hinglish'
          ? `${cleanName}, abhi aapka main wellness focus kya hai — steady energy, sustainable fat loss, strength gain, sugar/metabolic balance, ya bas ek simple routine build karna?`
          : `What matters most to you right now, ${cleanName} — steady energy, gradual fat loss, strength, sugar/metabolic steadiness, or building a simple routine?`;

      case 'health_safety':
        return activeLang === 'hinglish'
          ? 'Yeh sabse important step hai, taaki main koi unsafe suggestion na dun: kya aapko koi food allergy, celiac/gluten issue, blood sugar, high BP, kidney/renal care, pregnancy/postpartum, ya kisi medical condition ki dhyan rakhni hai?'
          : 'Before suggesting any food or exercise, safety comes first: do you have any food allergies, gluten sensitivity, blood sugar, BP, kidney/renal concerns, pregnancy/postpartum, or clinical guidance I should respect?';

      case 'diet_dislikes':
        return safetyEvaluation.allergies.length > 0 || dietaryPattern === 'vegan'
          ? activeLang === 'hinglish'
            ? `Samajh gaya — main aapke safety exclusions (${
                safetyEvaluation.allergies.join(', ') || dietaryPattern
              }) ko strictly protect karunga. Aap veg, eggetarian, non-veg, vegan ya Jain mein se kya follow karte hain, aur kaunse foods aap bilkul pasand nahi karte?`
            : `Noted — I will strictly enforce your exclusions (${
                safetyEvaluation.allergies.join(', ') || dietaryPattern
              }). Which eating style fits you, and are there specific foods you dislike?`
          : activeLang === 'hinglish'
            ? 'Aapki eating preference kya hai (Veg / Eggetarian / Non-Veg / Vegan / Jain), aur kaunsi sabzi ya food items aapko bilkul pasand nahi?'
            : 'How do you eat day to day (Vegetarian, Eggetarian, Non-Veg, Vegan, or Jain), and are there any foods you dislike eating?';

      case 'cuisine_kitchen':
        return activeLang === 'hinglish'
          ? 'Ghar par kis tarah ka Indian swaad aapko zyada pasand hai (North, South, West, East ya simple gharwala dal-chawal), spice level kaisa rakhte hain, aur khana banane mein aapke paas kitna time aur kitchen setup hota hai?'
          : 'Which regional Indian home styles do you enjoy most, how do you like your spice level, and how much time + kitchen setup do you typically have?';

      case 'pantry_check':
        return activeLang === 'hinglish'
          ? 'Aajkal aapki kitchen ya fridge mein aksar kaunsi cheezein ready rehti hain? (Ya type kar dein jaise "dal, chawal, curd, tomato, veggies" — taaki main sirf realistic meals dikhaun!)'
          : 'What staple ingredients are usually stocked in your kitchen? You can tap items or type naturally (e.g., "dal, rice, curd, veggies") so recommendations match real home cooking.';

      case 'movement_prefs':
        return safetyEvaluation.medicalReferralRequired
          ? activeLang === 'hinglish'
            ? `Kyunki aapne medical/clinical precaution share kiya hai, main aapki movement intensity bilkul gentle rakhunga. Batayein aapka exercise experience kaisa hai aur aap ghar par workout prefer karenge ya bahar walk/gym?`
            : `Because you noted clinical or recovery precautions, I'll keep movement suggestions gentle. What is your exercise familiarity, and where do you prefer moving (home bodyweight, mat, light dumbbells, or gym)?`
          : activeLang === 'hinglish'
            ? `Last question, ${cleanName}! Movement mein aapka experience kaisa hai (beginner ya regular), aur aap kahan workout karna pasand karte hain — ghar par bodyweight, light equipment ya gym?`
            : `Almost done, ${cleanName}! What's your movement experience right now, and do you prefer exercising at home (bodyweight or light equipment), outdoors, or at a gym?`;

      case 'review_profile':
        return activeLang === 'hinglish'
          ? `Sab kuch connect ho gaya hai, ${cleanName}! Neeche aapka personal safety & wellness profile summary hai — aaj bilkul 0 logged meals aur 0 workouts ke saath fresh start hoga. Agar sab sahi lage toh enter karein!`
          : `Everything is connected, ${cleanName}! Review your calibrated targets, safety boundaries, and kitchen setup below. Today starts fresh at 0 logged meals and 0 workouts — never any fake history.`;
    }
  }, [
    currentStage,
    name,
    activeLang,
    safetyEvaluation.allergies,
    safetyEvaluation.medicalReferralRequired,
    dietaryPattern,
  ]);

  const summarizeUserReplyForStage = (): string => {
    switch (currentStage) {
      case 'welcome_language':
        return `${name.trim() || 'Friend'} (${preferredLanguage})`;
      case 'body_baseline':
        return `${parsedAge} yrs, ${gender}, ${parsedHeight} cm, ${parsedWeight} kg, ${activityLevel} activity`;
      case 'goal_rhythm':
        return `Goal: ${primaryGoal.replace('_', ' ')} • ${weeklyWorkoutDays} active days/wk`;
      case 'health_safety': {
        const flags: string[] = [];
        if (allergies.length) flags.push(`Allergies: ${allergies.join(', ')}`);
        if (celiacOrGlutenFree) flags.push('Gluten-free');
        if (diabetesOrSugarConcern) flags.push('Sugar caution');
        if (hypertensionOrBpConcern) flags.push('BP/sodium caution');
        if (kidneyOrRenalConcern) flags.push('Renal caution');
        if (pregnancyOrPostpartum) flags.push('Pregnancy/postpartum');
        if (eatingDisorderHistory) flags.push('Weight-neutral care');
        if (underMedicalSupervision) flags.push('Medical supervision');
        return flags.length ? flags.join(' · ') : 'No special conditions or allergies disclosed';
      }
      case 'diet_dislikes':
        return `${dietaryPattern.replace('_', ' ')}${
          dislikedText.trim() ? ` · Avoids: ${dislikedText.trim()}` : ''
        }`;
      case 'cuisine_kitchen':
        return `${cuisinePreferences.map((c) => c.replace(/_/g, ' ')).join(', ')} · ${spiceTolerance} spice · ${cookingTimeLimitMins}m · ${kitchenSetup.replace(/_/g, ' ')}`;
      case 'pantry_check':
        return `${availableIngredients.length} staples stocked (${availableIngredients.slice(0, 5).join(', ')}${availableIngredients.length > 5 ? '…' : ''})`;
      case 'movement_prefs':
        return `${experienceLevel} · ${preferredEnvironment.replace(/_/g, ' ')} · ~${preferredSessionMins} min`;
      case 'review_profile':
        return 'Profile confirmed';
    }
  };

  const canAdvanceCurrentStage = (): boolean => {
    if (currentStage === 'welcome_language') return name.trim().length >= 1;
    if (currentStage === 'body_baseline') return hasValidBodyBaseline;
    return true;
  };

  const handleNextTurn = () => {
    if (!canAdvanceCurrentStage()) return;
    stopAllVoice();

    const aiTurn: InterviewTurn = {
      id: `ai-${currentStage}`,
      speaker: 'ai',
      text: currentAiPrompt,
      tag: STAGES[stageIdx].label,
    };
    const userTurn: InterviewTurn = {
      id: `usr-${currentStage}`,
      speaker: 'user',
      text: summarizeUserReplyForStage(),
    };

    // Adaptive adjustment: if user chose pregnancy/renal/eating-disorder + fat_loss, gently steer review goal awareness
    setTranscriptHistory((prev) => [
      ...prev.filter((t) => t.id !== aiTurn.id && t.id !== userTurn.id),
      aiTurn,
      userTurn,
    ]);

    const nextIdx = Math.min(STAGES.length - 1, stageIdx + 1);
    setStageIdx(nextIdx);
  };

  const handleNaturalReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = activeReplyValue.trim();
    if (!text) return;

    // Parse stage-relevant entities naturally from typed/spoken answer
    const lower = text.toLowerCase();
    if (/\b(hinglish)\b/i.test(lower)) setPreferredLanguage('hinglish');
    else if (/[\u0900-\u097F]|\bhindi\b/i.test(lower)) setPreferredLanguage('hi');

    if (currentStage === 'welcome_language' && !name.trim()) {
      const cleanCandidate = text.replace(/^(my name is|i am|i'm|naam)\s+/i, '').trim();
      if (cleanCandidate.length >= 2 && cleanCandidate.length <= 40) {
        setName(cleanCandidate);
      }
    }

    if (currentStage === 'body_baseline') {
      const ageM = lower.match(/\b(\d{2})\s*(yrs|years|yr|saal|age)?\b/);
      const cmM = lower.match(/\b(1[3-9]\d|2[0-1]\d)\s*(cm)?\b/);
      const kgM = lower.match(/\b(\d{2,3})\s*(kg|kilo)\b/);
      if (ageM && !ageInput) setAgeInput(ageM[1]);
      if (cmM && !heightInput) setHeightInput(cmM[1]);
      if (kgM && !weightInput) setWeightInput(kgM[1]);
      if (/\bmale\b/i.test(lower) && !/\bfemale\b/i.test(lower)) setGender('male');
      if (/\bfemale\b/i.test(lower)) setGender('female');
    }

    if (currentStage === 'pantry_check') {
      const parsed = extractIngredientsFromText(text);
      if (parsed.length > 0) {
        setAvailableIngredients((prev) => Array.from(new Set([...prev, ...parsed])));
      }
    }

    if (currentStage === 'diet_dislikes') {
      if (/\bveg\b|vegetarian/i.test(lower) && !/non/i.test(lower)) setDietaryPattern('vegetarian');
      else if (/egg/i.test(lower)) setDietaryPattern('eggetarian');
      else if (/non[-\s]?veg/i.test(lower)) setDietaryPattern('non_vegetarian');
      else if (/vegan/i.test(lower)) setDietaryPattern('vegan');
      else if (/jain/i.test(lower)) setDietaryPattern('jain');
    }

    setChatReplyInput('');
    setTranscript('');
  };

  const handleToggleAllergen = (key: AllergenKey) => {
    setAllergies((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const handleToggleCuisine = (key: IndianCuisineRegion) => {
    setCuisinePreferences((prev) => {
      if (prev.includes(key)) {
        return prev.length > 1 ? prev.filter((c) => c !== key) : prev;
      }
      return [...prev, key];
    });
  };

  const handleToggleIngredient = (key: IngredientKey) => {
    setAvailableIngredients((prev) =>
      prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]
    );
  };

  const handleToggleEquipment = (eq: 'none' | 'dumbbells_bands' | 'mat' | 'full_gym') => {
    setAvailableEquipment((prev) => {
      if (prev.includes(eq)) {
        return prev.length > 1 ? prev.filter((i) => i !== eq) : prev;
      }
      return [...prev, eq];
    });
  };

  const handlePantryAddText = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = extractIngredientsFromText(pantryQuickText);
    if (matched.length > 0) {
      setAvailableIngredients((prev) => Array.from(new Set([...prev, ...matched])));
      setPantryQuickText('');
    }
  };

  const handleFinish = () => {
    stopAllVoice();
    completeOnboarding(draftProfile);
    onNavigate('/today');
  };

  const progressPct = Math.round(((stageIdx + 1) / STAGES.length) * 100);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 flex flex-col items-center justify-center relative z-10">
      <div className="w-full max-w-3xl glass-panel-elevated rounded-3xl p-5 sm:p-8 space-y-5 shadow-2xl border border-forest/12 dark:border-white/15">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-forest/10 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald to-forest text-white flex items-center justify-center shadow-lg shadow-emerald/25">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald dark:text-emerald-400">
                  Conversational Wellness Interview
                </span>
                <Badge variant="sage" size="sm">
                  {stageIdx + 1}/{STAGES.length}
                </Badge>
              </div>
              <h1 className="font-heading font-extrabold text-base sm:text-lg text-forest dark:text-white">
                {STAGES[stageIdx].label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => speakText(currentAiPrompt, activeLang)}
              className="px-2.5 py-1.5 rounded-xl bg-emerald/12 text-emerald dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-emerald/20 transition-colors"
              title="Read current companion question aloud"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Listen</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setVoiceOutputEnabled(!voiceOutputEnabled);
                if (voiceOutputEnabled) stopAllVoice();
              }}
              aria-label="Toggle voice narration"
              className="p-2 rounded-xl border border-forest/10 dark:border-white/10 text-forest/70 dark:text-ivory/75 hover:bg-forest/5 dark:hover:bg-white/10"
            >
              {voiceOutputEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-forest/10 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald to-teal-400 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Conversational Thread History */}
        {transcriptHistory.length > 0 && (
          <div className="max-h-44 overflow-y-auto space-y-2.5 pr-1">
            {transcriptHistory.slice(-4).map((turn) => (
              <div
                key={turn.id}
                className={`flex items-start gap-2.5 text-xs ${
                  turn.speaker === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {turn.speaker === 'ai' && (
                  <span className="w-6 h-6 rounded-lg bg-emerald/15 text-emerald flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </span>
                )}
                <div
                  className={`px-3.5 py-2 rounded-2xl max-w-[82%] leading-relaxed ${
                    turn.speaker === 'user'
                      ? 'bg-emerald text-white rounded-tr-sm font-medium'
                      : 'bg-forest/5 dark:bg-white/6 text-forest/80 dark:text-ivory/80 rounded-tl-sm'
                  }`}
                >
                  {turn.text}
                </div>
                {turn.speaker === 'user' && (
                  <span className="w-6 h-6 rounded-lg bg-forest/15 dark:bg-white/15 text-forest dark:text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            ))}
            <div ref={scrollEndRef} />
          </div>
        )}

        {/* Active AI Companion Question Bubble */}
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald/10 dark:bg-emerald/15 border border-emerald/25 text-sm text-forest dark:text-ivory leading-relaxed">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald dark:text-emerald-300 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HEALTH PLUS Companion</span>
          </div>
          <p>{currentAiPrompt}</p>
        </div>

        {/* Stage Interactive Controls */}
        <div className="space-y-4">
          {currentStage === 'welcome_language' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-forest dark:text-ivory mb-2">
                  Choose Conversation Language
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'hinglish' as LanguagePreference, label: 'Hinglish' },
                    { id: 'en' as LanguagePreference, label: 'English' },
                    { id: 'hi' as LanguagePreference, label: 'हिन्दी (Hindi)' },
                    { id: 'auto' as LanguagePreference, label: 'Auto-Detect' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPreferredLanguage(opt.id)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        preferredLanguage === opt.id
                          ? 'bg-emerald text-white border-emerald shadow-md shadow-emerald/20'
                          : 'bg-white/60 dark:bg-white/5 border-forest/12 dark:border-white/12 text-forest dark:text-ivory hover:border-emerald/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest dark:text-ivory mb-1.5">
                  Your First Name or Nickname *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-white/5 px-3.5 py-2.5 text-sm text-forest dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald/40"
                />
              </div>
            </div>
          )}

          {currentStage === 'body_baseline' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-forest dark:text-ivory mb-1">
                    Age (15–95) *
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={95}
                    value={ageInput}
                    onChange={(e) => setAgeInput(e.target.value)}
                    placeholder="e.g. 26"
                    className="w-full rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2 text-sm text-forest dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest dark:text-ivory mb-1">
                    Sex for BMR Formula
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as GenderOption)}
                    className="w-full rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-[#0A1E17] px-3 py-2 text-sm text-forest dark:text-white"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Neutral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest dark:text-ivory mb-1">
                    Height (cm) *
                  </label>
                  <input
                    type="number"
                    min={120}
                    max={220}
                    value={heightInput}
                    onChange={(e) => setHeightInput(e.target.value)}
                    placeholder="e.g. 165"
                    className="w-full rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2 text-sm text-forest dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest dark:text-ivory mb-1">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    min={35}
                    max={200}
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    placeholder="e.g. 64"
                    className="w-full rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2 text-sm text-forest dark:text-white"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-forest dark:text-ivory mb-2">
                  Everyday Activity Level
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'sedentary' as ActivityLevel, title: 'Mostly Seated', desc: 'Desk/study day (<5k steps)' },
                    { id: 'light' as ActivityLevel, title: 'Lightly Active', desc: 'Regular chores or walks (5k–7.5k)' },
                    { id: 'moderate' as ActivityLevel, title: 'Moderately Active', desc: 'Deliberate movement 3–4x/wk' },
                    { id: 'active' as ActivityLevel, title: 'Very Active', desc: 'Daily physical routine / training' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActivityLevel(item.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        activityLevel === item.id
                          ? 'bg-emerald/15 border-emerald text-forest dark:text-white'
                          : 'bg-white/60 dark:bg-white/5 border-forest/12 dark:border-white/12 text-forest/80 dark:text-ivory/80'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.title}</div>
                      <div className="text-[11px] opacity-75">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              {!hasValidBodyBaseline && (
                <p className="text-[11px] text-amber-700 dark:text-gold font-medium">
                  Enter your age (15–95), height (120–220 cm), and weight (35–200 kg) to compute your personalized baseline.
                </p>
              )}
            </div>
          )}

          {currentStage === 'goal_rhythm' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'steady_energy' as PrimaryGoal, title: 'Steady Daily Energy', desc: 'Fix midday crashes & feel lighter' },
                  { id: 'fat_loss' as PrimaryGoal, title: 'Gradual Fat Loss', desc: 'Safe calorie balance without crash diets' },
                  { id: 'muscle_gain' as PrimaryGoal, title: 'Strength & Lean Muscle', desc: 'Higher protein + progressive movement' },
                  { id: 'metabolic_health' as PrimaryGoal, title: 'Metabolic & Sugar Balance', desc: 'Fiber-first meals & post-meal rhythm' },
                  { id: 'consistency' as PrimaryGoal, title: 'Build Simple Consistency', desc: 'Calm sustainable habits at home' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPrimaryGoal(opt.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      primaryGoal === opt.id
                        ? 'bg-emerald text-white border-emerald shadow-md shadow-emerald/20'
                        : 'bg-white/60 dark:bg-white/5 border-forest/12 dark:border-white/12 text-forest dark:text-ivory'
                    }`}
                  >
                    <div className="text-xs font-bold">{opt.title}</div>
                    <div className="text-[11px] opacity-80">{opt.desc}</div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-forest dark:text-ivory mb-1">
                    Weekly Movement Days ({weeklyWorkoutDays} days/week)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={7}
                    value={weeklyWorkoutDays}
                    onChange={(e) => setWeeklyWorkoutDays(Number(e.target.value))}
                    className="w-full accent-emerald"
                  />
                </div>
                {(primaryGoal === 'fat_loss' || primaryGoal === 'muscle_gain') && (
                  <div>
                    <label className="block text-xs font-semibold text-forest dark:text-ivory mb-1">
                      Target Weight (optional, kg)
                    </label>
                    <input
                      type="number"
                      value={targetWeightInput}
                      onChange={(e) => setTargetWeightInput(e.target.value)}
                      placeholder={weightInput || 'e.g. 60'}
                      className="w-full rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2 text-xs text-forest dark:text-white"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStage === 'health_safety' && (
            <div className="space-y-4">
              {/* Conditional Health Disclosure Selector */}
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    id: 'disclosed' as HealthConditionDisclosure,
                    label: 'Share Health & Safety Conditions',
                  },
                  {
                    id: 'none_reported' as HealthConditionDisclosure,
                    label: 'None Reported',
                  },
                  {
                    id: 'prefer_not_to_disclose' as HealthConditionDisclosure,
                    label: 'Prefer not to disclose (mark unknown)',
                  },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setDisclosureStatus(opt.id);
                      if (opt.id !== 'disclosed') {
                        setCeliacOrGlutenFree(false);
                        setDiabetesOrSugarConcern(false);
                        setHypertensionOrBpConcern(false);
                        setKidneyOrRenalConcern(false);
                        setPregnancyOrPostpartum(false);
                        setUnderMedicalSupervision(false);
                        setEatingDisorderHistory(false);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                      disclosureStatus === opt.id
                        ? 'bg-emerald text-white border-emerald'
                        : 'bg-white/60 dark:bg-white/5 border-forest/15 dark:border-white/15 text-forest dark:text-ivory'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold text-forest dark:text-ivory mb-2">
                  Food Allergies (strictly excluded everywhere)
                </p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(ALLERGEN_LABELS) as AllergenKey[]).map((key) => {
                    const active = allergies.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleToggleAllergen(key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                          active
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white/60 dark:bg-white/5 border-forest/12 dark:border-white/12 text-forest dark:text-ivory'
                        }`}
                      >
                        {ALLERGEN_LABELS[key]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {disclosureStatus === 'prefer_not_to_disclose' ? (
                <div className="p-3.5 rounded-2xl bg-amber-500/12 border border-amber-500/30 text-xs text-forest dark:text-ivory">
                  <strong>Conservative Wellness Mode (Unknown History):</strong> Your health conditions are marked <strong>unknown</strong>. We keep calorie targets gentle and emphasize consulting your doctor before starting intensive dietary or physical changes.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        checked: celiacOrGlutenFree,
                        toggle: () => {
                          setDisclosureStatus('disclosed');
                          setCeliacOrGlutenFree((v) => !v);
                        },
                        label: 'Celiac / Strict Gluten-Free (exclude wheat/atta)',
                      },
                      {
                        checked: diabetesOrSugarConcern,
                        toggle: () => {
                          setDisclosureStatus('disclosed');
                          setDiabetesOrSugarConcern((v) => !v);
                        },
                        label: 'Blood Sugar / Diabetes Management',
                      },
                      {
                        checked: hypertensionOrBpConcern,
                        toggle: () => {
                          setDisclosureStatus('disclosed');
                          setHypertensionOrBpConcern((v) => !v);
                        },
                        label: 'High BP / Sodium Restriction',
                      },
                      {
                        checked: kidneyOrRenalConcern,
                        toggle: () => {
                          setDisclosureStatus('disclosed');
                          setKidneyOrRenalConcern((v) => !v);
                        },
                        label: 'Kidney / Renal Care (doctor guidance)',
                      },
                      {
                        checked: pregnancyOrPostpartum,
                        toggle: () => {
                          setDisclosureStatus('disclosed');
                          setPregnancyOrPostpartum((v) => !v);
                        },
                        label: 'Pregnancy / Postpartum Support',
                      },
                      {
                        checked: eatingDisorderHistory,
                        toggle: () => {
                          setDisclosureStatus('disclosed');
                          setEatingDisorderHistory((v) => !v);
                        },
                        label: 'Keep weight-neutral / avoid deficit tracking',
                      },
                      {
                        checked: underMedicalSupervision,
                        toggle: () => {
                          setDisclosureStatus('disclosed');
                          setUnderMedicalSupervision((v) => !v);
                        },
                        label: 'Currently under active medical care',
                      },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={item.toggle}
                        className={`p-3 rounded-2xl border text-left text-xs font-medium flex items-center gap-2.5 transition-all ${
                          item.checked
                            ? 'bg-amber-500/15 border-amber-500 text-forest dark:text-white font-semibold'
                            : 'bg-white/60 dark:bg-white/5 border-forest/12 dark:border-white/12 text-forest/80 dark:text-ivory/80'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                            item.checked
                              ? 'bg-amber-600 border-amber-600 text-white'
                              : 'border-forest/30 dark:border-white/30'
                          }`}
                        >
                          {item.checked && <Check className="w-3 h-3" />}
                        </span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Adaptive Follow-Up for Diabetes / Blood Sugar Management */}
                  {diabetesOrSugarConcern && (
                    <div className="p-3.5 rounded-2xl bg-emerald/10 border border-emerald/25 space-y-2">
                      <p className="text-xs font-bold text-forest dark:text-white">
                        Blood Sugar Follow-Up: How is your blood sugar currently guided?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          {
                            id: 'diet_only' as const,
                            label: 'Food & lifestyle habits only (no sugar meds)',
                          },
                          {
                            id: 'medical_supervision' as const,
                            label: 'Doctor-prescribed meds / insulin monitoring',
                          },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setDiabetesContext(opt.id)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border ${
                              diabetesContext === opt.id
                                ? 'bg-forest text-white dark:bg-emerald border-forest dark:border-emerald'
                                : 'bg-white dark:bg-white/5 border-forest/15 dark:border-white/15 text-forest dark:text-ivory'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-forest/70 dark:text-ivory/70">
                        Note: We prioritize balanced fiber and steady meals — HEALTH PLUS never calculates medication or insulin doses.
                      </p>
                    </div>
                  )}
                </>
              )}

              <input
                type="text"
                value={otherConditionsNote}
                onChange={(e) => setOtherConditionsNote(e.target.value)}
                placeholder="Anything else your companion should keep in mind? (optional)"
                className="w-full rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-white/5 px-3.5 py-2 text-xs text-forest dark:text-white"
              />
            </div>
          )}

          {currentStage === 'diet_dislikes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'vegetarian' as DietaryPattern, label: 'Vegetarian (No Egg/Meat)' },
                  { id: 'eggetarian' as DietaryPattern, label: 'Eggetarian (Veg + Eggs)' },
                  { id: 'non_vegetarian' as DietaryPattern, label: 'Non-Vegetarian' },
                  { id: 'vegan' as DietaryPattern, label: 'Vegan (Plant-Only)' },
                  { id: 'jain' as DietaryPattern, label: 'Jain Vegetarian' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDietaryPattern(item.id)}
                    className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all ${
                      dietaryPattern === item.id
                        ? 'bg-emerald text-white border-emerald shadow-md shadow-emerald/20'
                        : 'bg-white/60 dark:bg-white/5 border-forest/12 dark:border-white/12 text-forest dark:text-ivory'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest dark:text-ivory mb-1.5">
                  Foods You Dislike or Prefer Never Seeing (comma-separated, optional)
                </label>
                <input
                  type="text"
                  value={dislikedText}
                  onChange={(e) => setDislikedText(e.target.value)}
                  placeholder="e.g. karela, mushrooms, oats"
                  className="w-full rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-white/5 px-3.5 py-2 text-xs text-forest dark:text-white"
                />
              </div>
            </div>
          )}

          {currentStage === 'cuisine_kitchen' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-forest dark:text-ivory mb-2">
                  Indian Regional Home Styles You Enjoy (select one or more)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INDIAN_CUISINE_OPTIONS.map((c) => {
                    const active = cuisinePreferences.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleToggleCuisine(c.id)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          active
                            ? 'bg-emerald/15 border-emerald text-forest dark:text-white'
                            : 'bg-white/60 dark:bg-white/5 border-forest/12 dark:border-white/12 text-forest/80 dark:text-ivory/80'
                        }`}
                      >
                        <div className="text-xs font-bold">{c.label}</div>
                        <div className="text-[11px] opacity-75">{c.hint}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-forest dark:text-ivory mb-1">
                    Spice Preference
                  </label>
                  <select
                    value={spiceTolerance}
                    onChange={(e) => setSpiceTolerance(e.target.value as SpiceTolerance)}
                    className="w-full rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-[#0A1E17] px-3 py-2 text-xs text-forest dark:text-white"
                  >
                    {SPICE_TOLERANCE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest dark:text-ivory mb-1">
                    Kitchen Setup
                  </label>
                  <select
                    value={kitchenSetup}
                    onChange={(e) => setKitchenSetup(e.target.value as KitchenSetup)}
                    className="w-full rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-[#0A1E17] px-3 py-2 text-xs text-forest dark:text-white"
                  >
                    <option value="basic_stove">Basic Gas / Tawa</option>
                    <option value="full_kitchen">Full Home Kitchen</option>
                    <option value="pg_hostel_kettle">PG / Hostel Kettle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest dark:text-ivory mb-1">
                    Grocery Budget &amp; Time ({cookingTimeLimitMins}m)
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={budgetTier}
                      onChange={(e) => setBudgetTier(e.target.value as BudgetTier)}
                      className="flex-1 rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-[#0A1E17] px-2.5 py-2 text-xs text-forest dark:text-white"
                    >
                      <option value="budget">Budget</option>
                      <option value="moderate">Moderate</option>
                      <option value="flexible">Flexible</option>
                    </select>
                    <select
                      value={cookingTimeLimitMins}
                      onChange={(e) => setCookingTimeLimitMins(Number(e.target.value))}
                      className="w-20 rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-[#0A1E17] px-2 py-2 text-xs text-forest dark:text-white"
                    >
                      <option value={12}>12m</option>
                      <option value={20}>20m</option>
                      <option value={30}>30m</option>
                      <option value={45}>45m</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStage === 'pantry_check' && (
            <div className="space-y-3">
              <form onSubmit={handlePantryAddText} className="flex gap-2">
                <input
                  type="text"
                  value={pantryQuickText}
                  onChange={(e) => setPantryQuickText(e.target.value)}
                  placeholder="Type items you have at home, e.g. 'dal, rice, curd, soya, eggs'"
                  className="flex-1 rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2 text-xs text-forest dark:text-white"
                />
                <Button type="submit" size="sm" variant="outline">
                  Add Staples
                </Button>
              </form>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                {INGREDIENT_CATALOG.filter((ing) => {
                  if (ing.allergen && allergies.includes(ing.allergen)) return false;
                  if (dietaryPattern === 'vegan' && ['paneer', 'curd', 'milk', 'eggs', 'chicken'].includes(ing.key))
                    return false;
                  if (dietaryPattern === 'vegetarian' && ['eggs', 'chicken'].includes(ing.key))
                    return false;
                  return true;
                }).map((ing) => {
                  const selected = availableIngredients.includes(ing.key);
                  return (
                    <button
                      key={ing.key}
                      type="button"
                      onClick={() => handleToggleIngredient(ing.key)}
                      className={`p-2 rounded-xl border text-left text-xs font-semibold transition-all ${
                        selected
                          ? 'bg-emerald/15 border-emerald text-forest dark:text-white'
                          : 'bg-white/60 dark:bg-white/5 border-forest/10 dark:border-white/10 text-forest/70 dark:text-ivory/70'
                      }`}
                    >
                      <div className="truncate">{ing.label.split(' / ')[0]}</div>
                      <div className="text-[10px] opacity-70">{ing.hindiLabel}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentStage === 'movement_prefs' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-forest dark:text-ivory mb-2">
                  Current Exercise Experience
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'beginner' as ExerciseExperienceLevel, label: 'Beginner / Restarting' },
                    { id: 'intermediate' as ExerciseExperienceLevel, label: 'Somewhat Consistent' },
                    { id: 'accustomed' as ExerciseExperienceLevel, label: 'Regular Mover' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setExperienceLevel(lvl.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        experienceLevel === lvl.id
                          ? 'bg-emerald text-white border-emerald'
                          : 'bg-white/60 dark:bg-white/5 border-forest/12 dark:border-white/12 text-forest dark:text-ivory'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-forest dark:text-ivory mb-1.5">
                    Preferred Workout Environment
                  </label>
                  <select
                    value={preferredEnvironment}
                    onChange={(e) =>
                      setPreferredEnvironment(e.target.value as ExerciseEnvironmentPreference)
                    }
                    className="w-full rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-[#0A1E17] px-3 py-2 text-xs text-forest dark:text-white"
                  >
                    <option value="home_bodyweight">At Home — Bodyweight Only</option>
                    <option value="home_light_equipment">At Home — Mat / Light Dumbbells</option>
                    <option value="gym">Gym</option>
                    <option value="outdoor_walk">Outdoor Walk / Park</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-forest dark:text-ivory mb-1.5">
                    Typical Session Length ({preferredSessionMins} min)
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={45}
                    step={5}
                    value={preferredSessionMins}
                    onChange={(e) => setPreferredSessionMins(Number(e.target.value))}
                    className="w-full accent-emerald"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-forest dark:text-ivory mb-2">
                  Equipment You Can Access Easily
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'none' as const, label: 'No Equipment (Floor only)' },
                    { id: 'mat' as const, label: 'Yoga Mat' },
                    { id: 'dumbbells_bands' as const, label: 'Dumbbells / Bands' },
                    { id: 'full_gym' as const, label: 'Gym Access' },
                  ].map((eq) => (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => handleToggleEquipment(eq.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        availableEquipment.includes(eq.id)
                          ? 'bg-emerald/15 border-emerald text-forest dark:text-white'
                          : 'bg-white/60 dark:bg-white/5 border-forest/12 dark:border-white/12 text-forest/75 dark:text-ivory/75'
                      }`}
                    >
                      {eq.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStage === 'review_profile' && (
            <div className="space-y-4">
              {safetyEvaluation.banners.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/12 border border-amber-500/30 flex items-start gap-2.5 text-xs text-forest dark:text-ivory">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-gold shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    {safetyEvaluation.banners.map((b, i) => (
                      <p key={i}>
                        <strong>{b.title}:</strong> {b.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-forest/5 dark:bg-white/5 border border-forest/10 dark:border-white/10">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-forest/60 dark:text-ivory/60">
                    Calculated Rhythm
                  </p>
                  <p className="text-xl font-heading font-extrabold text-forest dark:text-white mt-1">
                    ~{previewTargets.calorieTarget} kcal
                  </p>
                  <p className="text-[11px] text-forest/70 dark:text-ivory/70">
                    {previewTargets.proteinTargetG}g P · {previewTargets.sodiumLimitMg}mg Na ceiling
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-forest/5 dark:bg-white/5 border border-forest/10 dark:border-white/10">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-forest/60 dark:text-ivory/60">
                    Indian Kitchen &amp; Taste
                  </p>
                  <p className="text-sm font-bold text-forest dark:text-white mt-1 capitalize">
                    {dietaryPattern.replace('_', ' ')} ({spiceTolerance})
                  </p>
                  <p className="text-[11px] text-forest/70 dark:text-ivory/70">
                    {availableIngredients.length} staples · {allergies.length} allergen lock(s)
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-forest/5 dark:bg-white/5 border border-forest/10 dark:border-white/10">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-forest/60 dark:text-ivory/60">
                    Movement &amp; Hydration
                  </p>
                  <p className="text-xl font-heading font-extrabold text-forest dark:text-white mt-1">
                    ~{previewTargets.dailyMovementMinutes} min/day
                  </p>
                  <p className="text-[11px] text-forest/70 dark:text-ivory/70">
                    {experienceLevel} · {preferredEnvironment.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald/10 border border-emerald/25 text-xs text-forest dark:text-ivory space-y-1">
                <p>
                  <strong>Confirm Personal Health Profile Before Generating Plan:</strong> Review your baseline above ({parsedAge || '--'} yrs, {parsedHeight || '--'} cm, {parsedWeight || '--'} kg · Safety mode:{' '}
                  <span className="font-semibold">
                    {disclosureStatus === 'prefer_not_to_disclose'
                      ? 'Unknown / Conservative guardrails'
                      : disclosureStatus === 'none_reported'
                        ? 'No medical conditions reported'
                        : 'Disclosed screening active'}
                  </span>
                  ).
                </p>
                <p>
                  <strong>Clean Slate Guarantee:</strong> Today begins honestly at <strong>0 meals</strong> and <strong>0 workouts</strong> logged. Macro values across Food Hub are computed transparently from prototype ingredient weights.
                </p>
              </div>
            </div>
          )}

          {/* Optional Voice / Free-Text Conversational Helper on Non-Review Stages */}
          {currentStage !== 'review_profile' && (
            <form onSubmit={handleNaturalReplySubmit} className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={voicePhase === 'listening' ? stopAllVoice : startListening}
                className={`p-2 rounded-xl border text-xs transition-colors ${
                  voicePhase === 'listening'
                    ? 'bg-emerald text-white border-emerald'
                    : 'border-forest/15 dark:border-white/15 bg-white/50 dark:bg-white/5 text-forest/75 dark:text-ivory/75'
                }`}
                title="Speak or dictate your answer"
              >
                {voicePhase === 'listening' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <input
                type="text"
                value={activeReplyValue}
                onChange={(e) => {
                  setTranscript('');
                  setChatReplyInput(e.target.value);
                }}
                placeholder="Or reply conversationally here (e.g. '26, 165cm, 62kg' or 'dal, rice, curd')..."
                className="flex-1 rounded-xl border border-forest/12 dark:border-white/12 bg-white/60 dark:bg-white/5 px-3 py-1.5 text-xs text-forest dark:text-white"
              />
              {activeReplyValue.trim() && (
                <Button type="submit" size="sm" variant="outline">
                  Apply
                </Button>
              )}
            </form>
          )}
          {speechError && (
            <p className="text-[11px] text-amber-700 dark:text-gold">{speechError}</p>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="pt-4 border-t border-forest/10 dark:border-white/10 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={stageIdx === 0}
            onClick={() => setStageIdx((s) => Math.max(0, s - 1))}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>

          {currentStage !== 'review_profile' ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={!canAdvanceCurrentStage()}
              onClick={handleNextTurn}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {stageIdx === STAGES.length - 2 ? 'Review My Profile' : 'Continue'}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleFinish}
              rightIcon={<Sparkles className="w-4 h-4" />}
              className="shadow-lg shadow-emerald/25 font-bold"
            >
              Confirm &amp; Enter HEALTH PLUS Companion
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
