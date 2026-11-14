import type { AppState, DemoCategory, UserProfile } from '@/types/wellness';
import { computePersonalizedTargets } from '@/engine/safetyAndTargets';

export interface DemoAccountPreset {
  id: string;
  email: string;
  password: string;
  buttonLabel: string;
  badgeLabel: string;
  displayName: string;
  goalSummary: string;
  demoCategory: DemoCategory;
  passwordHint: string;
}

export const DEMO_ACCOUNT_PRESETS: DemoAccountPreset[] = [
  {
    id: 'demo-wellness-001',
    email: 'demo@healthplus.app',
    password: 'Demo@12345',
    buttonLabel: 'Continue as General Wellness Demo',
    badgeLabel: 'General Wellness',
    displayName: 'Meera Nair (Demo)',
    goalSummary: 'Steady energy, balanced homestyle meals & daily mobility',
    demoCategory: 'general_wellness',
    passwordHint: 'Demo@12345',
  },
  {
    id: 'demo-fitness-002',
    email: 'fitness@healthplus.app',
    password: 'Fitness@123',
    buttonLabel: 'Continue as Fitness Demo',
    badgeLabel: 'Fitness & Strength',
    displayName: 'Rohan Verma (Demo)',
    goalSummary: 'Muscle gain, high-protein nutrition & strength workouts',
    demoCategory: 'fitness_goal',
    passwordHint: 'Fitness@123',
  },
  {
    id: 'demo-diet-003',
    email: 'diet@healthplus.app',
    password: 'Diet@12345',
    buttonLabel: 'Continue as Dietary Restrictions Demo',
    badgeLabel: 'Dietary Restrictions',
    displayName: 'Diya Kulkarni (Demo)',
    goalSummary: 'Pure Vegetarian + dairy-free & gluten-free safe meals',
    demoCategory: 'dietary_restrictions',
    passwordHint: 'Diet@12345',
  },
];

function getIsoDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export function isDemoEmail(email: string): boolean {
  const clean = email.trim().toLowerCase();
  return DEMO_ACCOUNT_PRESETS.some((p) => p.email.toLowerCase() === clean);
}

export function getDemoPresetByEmail(email: string): DemoAccountPreset | null {
  const clean = email.trim().toLowerCase();
  return DEMO_ACCOUNT_PRESETS.find((p) => p.email.toLowerCase() === clean) || null;
}

export function buildDemoInitialState(
  email: string,
  rememberMe = true
): AppState | null {
  const clean = email.trim().toLowerCase();
  const preset = getDemoPresetByEmail(clean);
  if (!preset) return null;

  const todayISO = getIsoDaysAgo(0);
  const yesterdayISO = getIsoDaysAgo(1);
  const twoDaysAgoISO = getIsoDaysAgo(2);

  if (preset.demoCategory === 'general_wellness') {
    const profile: UserProfile = {
      basic: {
        name: 'Meera Nair (Demo)',
        age: 29,
        gender: 'female',
        heightCm: 162,
        weightKg: 61,
        targetWeightKg: 59,
      },
      goals: {
        primaryGoal: 'steady_energy',
        weeklyWorkoutDays: 4,
        dailyStepGoal: 7500,
      },
      lifestyle: {
        activityLevel: 'light',
        workSchedule: 'desk_9_to_6',
        sleepHours: 7,
        stressLevel: 'moderate',
        preferredLanguage: 'auto',
      },
      foodPreferences: {
        dietaryPattern: 'vegetarian',
        cuisinePreferences: ['homestyle_pan_indian', 'south_indian'],
        spiceTolerance: 'medium',
        dislikedFoods: ['bitter gourd'],
        cookingTimeLimitMins: 25,
        budgetTier: 'moderate',
        kitchenSetup: 'full_kitchen',
      },
      exercisePreferences: {
        experienceLevel: 'beginner',
        preferredEnvironment: 'home_bodyweight',
        availableEquipment: ['mat'],
        preferredSessionMins: 20,
      },
      foodAvailability: {
        availableIngredients: [
          'moong_dal',
          'poha',
          'rice',
          'roti_atta',
          'curd',
          'paneer',
          'mixed_veg',
          'spinach',
          'tomato_onion',
          'peanuts',
          'ghee_oil',
        ],
        unavailableIngredients: [],
        lastUpdatedDate: todayISO,
      },
      safety: {
        disclosureStatus: 'none_reported',
        allergies: [],
        celiacOrGlutenFree: false,
        diabetesOrSugarConcern: false,
        hypertensionOrBpConcern: false,
        kidneyOrRenalConcern: false,
        pregnancyOrPostpartum: false,
        underMedicalSupervision: false,
        eatingDisorderHistory: false,
        otherConditionsNote: 'Demonstration Sample Profile — General Wellness baseline',
      },
    };

    const targets = computePersonalizedTargets(profile);
    return {
      auth: {
        id: preset.id,
        email: preset.email,
        name: preset.displayName,
        signedInAt: new Date().toISOString(),
        isDemoAccount: true,
        demoCategory: 'general_wellness',
        rememberMe,
      },
      onboardingCompleted: true,
      onboardingStep: 5,
      profile,
      targets,
      hydrationLiters: 1.8,
      mealsLogged: [
        {
          id: 'demo-gw-m1',
          name: 'Vegetable Poha with Roasted Peanuts (Sample)',
          mealSlot: 'breakfast',
          calories: 320,
          proteinG: 9,
          carbsG: 48,
          fatG: 10,
          fiberG: 5,
          sodiumMg: 340,
          dateISO: todayISO,
          timeLabel: '08:30 AM',
          source: 'recommended_recipe',
          provenanceLabel: 'Demonstration Sample Data · Estimated home portion',
        },
        {
          id: 'demo-gw-m2',
          name: 'Moong Dal Tadka, 2 Phulkas & Cucumber Curd (Sample)',
          mealSlot: 'lunch',
          calories: 485,
          proteinG: 20,
          carbsG: 66,
          fatG: 14,
          fiberG: 11,
          sodiumMg: 460,
          dateISO: todayISO,
          timeLabel: '01:15 PM',
          source: 'recommended_recipe',
          provenanceLabel: 'Demonstration Sample Data · Estimated home portion',
        },
        {
          id: 'demo-gw-m3',
          name: 'Palak Paneer with Jeera Rice (Sample)',
          mealSlot: 'dinner',
          calories: 560,
          proteinG: 23,
          carbsG: 58,
          fatG: 24,
          fiberG: 8,
          sodiumMg: 510,
          dateISO: yesterdayISO,
          timeLabel: '08:10 PM',
          source: 'recommended_recipe',
          provenanceLabel: 'Demonstration Sample Data · Previous day sample log',
        },
        {
          id: 'demo-gw-m4',
          name: 'Oats & Banana Bowl with Curd (Sample)',
          mealSlot: 'breakfast',
          calories: 340,
          proteinG: 13,
          carbsG: 52,
          fatG: 8,
          fiberG: 7,
          sodiumMg: 140,
          dateISO: twoDaysAgoISO,
          timeLabel: '08:45 AM',
          source: 'recommended_recipe',
          provenanceLabel: 'Demonstration Sample Data · 2 days ago sample log',
        },
      ],
      workoutsLogged: [
        {
          id: 'demo-gw-w1',
          exerciseType: 'glute_bridge',
          exerciseLabel: 'Glute Bridges (Demo Sample)',
          repsCompleted: 12,
          targetReps: 12,
          durationSeconds: 180,
          estimatedKcal: 36,
          mode: 'guided_demo',
          dateISO: todayISO,
          timeLabel: '07:15 AM',
          formNotes: ['Demonstration Sample Activity · Gentle posture & desk-break mobility'],
        },
        {
          id: 'demo-gw-w2',
          exerciseType: 'squat',
          exerciseLabel: 'Bodyweight Squats (Demo Sample)',
          repsCompleted: 15,
          targetReps: 15,
          durationSeconds: 240,
          estimatedKcal: 48,
          mode: 'guided_demo',
          dateISO: yesterdayISO,
          timeLabel: '06:30 PM',
          formNotes: ['Demonstration Sample Activity · Steady tempo check'],
        },
      ],
      foodFeedbackMemory: {
        rejectedRecipeIds: [],
        preferFaster: false,
        preferCheaper: false,
      },
      conversationMemory: {
        lastSuggestedRecipeIds: [],
        lastSuggestedMealSlot: 'dinner',
        rejectedRecipeIds: [],
        unavailableIngredients: [],
        awaitingAvailableIngredients: false,
        awaitingRejectionReasonForRecipeId: null,
        awaitingMovementContext: false,
        unavailableMovementVenue: null,
        lastMovementMinutes: null,
        activeTopic: 'general',
        detectedLanguage: 'en',
      },
      chatMessages: [
        {
          id: 'demo-gw-chat-1',
          role: 'assistant',
          language: 'en',
          timestamp: new Date().toISOString(),
          content:
            'Welcome to HEALTH PLUS (Demonstration Mode — General Wellness)! I have sample diary and activity records loaded for Meera Nair (Demo). Ask me for a light high-fiber dinner idea or a 10-minute evening stretch anytime.',
        },
      ],
    };
  }

  if (preset.demoCategory === 'fitness_goal') {
    const profile: UserProfile = {
      basic: {
        name: 'Rohan Verma (Demo)',
        age: 26,
        gender: 'male',
        heightCm: 176,
        weightKg: 71,
        targetWeightKg: 75,
      },
      goals: {
        primaryGoal: 'muscle_gain',
        weeklyWorkoutDays: 5,
        dailyStepGoal: 9000,
      },
      lifestyle: {
        activityLevel: 'moderate',
        workSchedule: 'flexible_home',
        sleepHours: 7.5,
        stressLevel: 'low',
        preferredLanguage: 'auto',
      },
      foodPreferences: {
        dietaryPattern: 'vegetarian',
        cuisinePreferences: ['homestyle_pan_indian', 'north_indian'],
        spiceTolerance: 'bold',
        dislikedFoods: [],
        cookingTimeLimitMins: 30,
        budgetTier: 'moderate',
        kitchenSetup: 'full_kitchen',
      },
      exercisePreferences: {
        experienceLevel: 'intermediate',
        preferredEnvironment: 'home_light_equipment',
        availableEquipment: ['dumbbells_bands', 'mat'],
        preferredSessionMins: 35,
      },
      foodAvailability: {
        availableIngredients: [
          'paneer',
          'soya_chunks',
          'dal',
          'oats',
          'rice',
          'roti_atta',
          'curd',
          'milk',
          'banana',
          'peanuts',
          'spinach',
          'tomato_onion',
          'ghee_oil',
        ],
        unavailableIngredients: ['eggs', 'chicken', 'mutton', 'fish'],
        lastUpdatedDate: todayISO,
      },
      safety: {
        disclosureStatus: 'none_reported',
        allergies: [],
        celiacOrGlutenFree: false,
        diabetesOrSugarConcern: false,
        hypertensionOrBpConcern: false,
        kidneyOrRenalConcern: false,
        pregnancyOrPostpartum: false,
        underMedicalSupervision: false,
        eatingDisorderHistory: false,
        otherConditionsNote: 'Demonstration Sample Profile — Strength & Hypertrophy focus',
      },
    };

    const targets = computePersonalizedTargets(profile);
    return {
      auth: {
        id: preset.id,
        email: preset.email,
        name: preset.displayName,
        signedInAt: new Date().toISOString(),
        isDemoAccount: true,
        demoCategory: 'fitness_goal',
        rememberMe,
      },
      onboardingCompleted: true,
      onboardingStep: 5,
      profile,
      targets,
      hydrationLiters: 2.4,
      mealsLogged: [
        {
          id: 'demo-fit-m1',
          name: '3-Egg Masala Bhurji + 2 Multigrain Rotis (Sample)',
          mealSlot: 'breakfast',
          calories: 495,
          proteinG: 28,
          carbsG: 42,
          fatG: 22,
          fiberG: 6,
          sodiumMg: 480,
          dateISO: todayISO,
          timeLabel: '08:15 AM',
          source: 'recommended_recipe',
          provenanceLabel: 'Demonstration Sample Data · Estimated high-protein portion',
        },
        {
          id: 'demo-fit-m2',
          name: 'Soya Chunks & Paneer Rice Bowl + Curd (Sample)',
          mealSlot: 'lunch',
          calories: 640,
          proteinG: 41,
          carbsG: 68,
          fatG: 20,
          fiberG: 9,
          sodiumMg: 530,
          dateISO: todayISO,
          timeLabel: '01:30 PM',
          source: 'recommended_recipe',
          provenanceLabel: 'Demonstration Sample Data · Estimated high-protein portion',
        },
        {
          id: 'demo-fit-m3',
          name: 'Roasted Chana & Peanut Butter Banana Oats (Sample)',
          mealSlot: 'snack',
          calories: 410,
          proteinG: 18,
          carbsG: 50,
          fatG: 15,
          fiberG: 8,
          sodiumMg: 120,
          dateISO: yesterdayISO,
          timeLabel: '05:15 PM',
          source: 'recommended_recipe',
          provenanceLabel: 'Demonstration Sample Data · Previous day sample log',
        },
      ],
      workoutsLogged: [
        {
          id: 'demo-fit-w1',
          exerciseType: 'squat',
          exerciseLabel: 'Bodyweight & Goblet Squats (Demo Sample)',
          repsCompleted: 24,
          targetReps: 20,
          durationSeconds: 420,
          estimatedKcal: 112,
          mode: 'guided_demo',
          dateISO: todayISO,
          timeLabel: '07:00 AM',
          formNotes: ['Demonstration Sample Activity · Strength block set 1-3'],
        },
        {
          id: 'demo-fit-w2',
          exerciseType: 'pushup',
          exerciseLabel: 'Incline & Standard Pushups (Demo Sample)',
          repsCompleted: 18,
          targetReps: 15,
          durationSeconds: 360,
          estimatedKcal: 95,
          mode: 'guided_demo',
          dateISO: yesterdayISO,
          timeLabel: '06:45 PM',
          formNotes: ['Demonstration Sample Activity · Upper body strength session'],
        },
      ],
      foodFeedbackMemory: {
        rejectedRecipeIds: [],
        preferFaster: false,
        preferCheaper: false,
      },
      conversationMemory: {
        lastSuggestedRecipeIds: [],
        lastSuggestedMealSlot: 'dinner',
        rejectedRecipeIds: [],
        unavailableIngredients: [],
        awaitingAvailableIngredients: false,
        awaitingRejectionReasonForRecipeId: null,
        awaitingMovementContext: false,
        unavailableMovementVenue: null,
        lastMovementMinutes: 30,
        activeTopic: 'move',
        detectedLanguage: 'en',
      },
      chatMessages: [
        {
          id: 'demo-fit-chat-1',
          role: 'assistant',
          language: 'en',
          timestamp: new Date().toISOString(),
          content:
            'Welcome to HEALTH PLUS (Demonstration Mode — Fitness & Strength)! Rohan (Demo) targets high protein intake alongside progressive bodyweight and dumbbell blocks. Ask for a post-workout dinner or lower-body strength adjustments.',
        },
      ],
    };
  }

  // dietary_restrictions demo user (Vegetarian + dairy-free + gluten-free safe filters)
  const profile: UserProfile = {
    basic: {
      name: 'Diya Kulkarni (Demo)',
      age: 34,
      gender: 'female',
      heightCm: 159,
      weightKg: 60,
      targetWeightKg: 58,
    },
    goals: {
      primaryGoal: 'metabolic_health',
      weeklyWorkoutDays: 4,
      dailyStepGoal: 7000,
    },
    lifestyle: {
      activityLevel: 'light',
      workSchedule: 'desk_9_to_6',
      sleepHours: 7,
      stressLevel: 'moderate',
      preferredLanguage: 'auto',
    },
    foodPreferences: {
      dietaryPattern: 'vegetarian',
      cuisinePreferences: ['south_indian', 'west_gujarati_marathi'],
      spiceTolerance: 'mild',
      dislikedFoods: ['mushrooms', 'brinjal'],
      cookingTimeLimitMins: 25,
      budgetTier: 'moderate',
      kitchenSetup: 'full_kitchen',
    },
    exercisePreferences: {
      experienceLevel: 'beginner',
      preferredEnvironment: 'home_bodyweight',
      availableEquipment: ['mat'],
      preferredSessionMins: 20,
    },
    foodAvailability: {
      availableIngredients: [
        'moong_dal',
        'dal',
        'rice',
        'oats',
        'poha',
        'besan',
        'ragi',
        'tofu',
        'chana',
        'rajma',
        'mixed_veg',
        'spinach',
        'tomato_onion',
        'peanuts',
        'ghee_oil',
      ],
      unavailableIngredients: ['paneer', 'curd', 'milk', 'roti_atta'],
      lastUpdatedDate: todayISO,
    },
    safety: {
      disclosureStatus: 'disclosed',
      allergies: ['dairy'],
      celiacOrGlutenFree: true,
      diabetesOrSugarConcern: false,
      hypertensionOrBpConcern: false,
      kidneyOrRenalConcern: false,
      pregnancyOrPostpartum: false,
      underMedicalSupervision: false,
      eatingDisorderHistory: false,
      otherConditionsNote:
        'Demonstration Sample Profile — Pure Vegetarian with dairy-free & gluten-free filters active',
    },
  };

  const targets = computePersonalizedTargets(profile);
  return {
    auth: {
      id: preset.id,
      email: preset.email,
      name: preset.displayName,
      signedInAt: new Date().toISOString(),
      isDemoAccount: true,
      demoCategory: 'dietary_restrictions',
      rememberMe,
    },
    onboardingCompleted: true,
    onboardingStep: 5,
    profile,
    targets,
    hydrationLiters: 2.0,
    mealsLogged: [
      {
        id: 'demo-diet-m1',
        name: 'Moong Dal Chilla with Mint Chutney (Dairy- & Gluten-Free Sample)',
        mealSlot: 'breakfast',
        calories: 310,
        proteinG: 16,
        carbsG: 39,
        fatG: 9,
        fiberG: 8,
        sodiumMg: 290,
        dateISO: todayISO,
        timeLabel: '08:40 AM',
        source: 'recommended_recipe',
        provenanceLabel: 'Demonstration Sample Data · Allergy-screened vegetarian portion',
      },
      {
        id: 'demo-diet-m2',
        name: 'Tofu, Spinach & Steamed Rice Homestyle Bowl (Dairy- & Gluten-Free Sample)',
        mealSlot: 'lunch',
        calories: 440,
        proteinG: 22,
        carbsG: 54,
        fatG: 14,
        fiberG: 9,
        sodiumMg: 360,
        dateISO: todayISO,
        timeLabel: '01:10 PM',
        source: 'recommended_recipe',
        provenanceLabel: 'Demonstration Sample Data · Allergy-screened vegetarian portion',
      },
      {
        id: 'demo-diet-m3',
        name: 'Ragi Dosa with Masoor Dal & Veggies (Dairy- & Gluten-Free Sample)',
        mealSlot: 'dinner',
        calories: 395,
        proteinG: 15,
        carbsG: 62,
        fatG: 9,
        fiberG: 10,
        sodiumMg: 330,
        dateISO: yesterdayISO,
        timeLabel: '07:50 PM',
        source: 'recommended_recipe',
        provenanceLabel: 'Demonstration Sample Data · Previous day safe log',
      },
    ],
    workoutsLogged: [
      {
        id: 'demo-diet-w1',
        exerciseType: 'glute_bridge',
        exerciseLabel: 'Glute Bridges & Core Stability (Demo Sample)',
        repsCompleted: 15,
        targetReps: 15,
        durationSeconds: 210,
        estimatedKcal: 42,
        mode: 'guided_demo',
        dateISO: todayISO,
        timeLabel: '07:30 AM',
        formNotes: ['Demonstration Sample Activity · Gentle morning mobility'],
      },
    ],
    foodFeedbackMemory: {
      rejectedRecipeIds: [],
      preferFaster: false,
      preferCheaper: false,
    },
    conversationMemory: {
      lastSuggestedRecipeIds: [],
      lastSuggestedMealSlot: 'snack',
      rejectedRecipeIds: [],
      unavailableIngredients: ['paneer', 'curd', 'milk', 'roti_atta'],
      awaitingAvailableIngredients: false,
      awaitingRejectionReasonForRecipeId: null,
      awaitingMovementContext: false,
      unavailableMovementVenue: null,
      lastMovementMinutes: null,
      activeTopic: 'food',
      detectedLanguage: 'en',
    },
    chatMessages: [
      {
        id: 'demo-diet-chat-1',
        role: 'assistant',
        language: 'en',
        timestamp: new Date().toISOString(),
        content:
          'Welcome to HEALTH PLUS (Demonstration Mode — Dietary Restrictions)! Vegetarian, Dairy-Free, and Gluten-Free safety filters are automatically enforced across Food Hub and Coach suggestions for Diya (Demo).',
      },
    ],
  };
}
