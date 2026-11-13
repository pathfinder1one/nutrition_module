import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  ActiveSafetyBanner,
  AiBackendProviderMode,
  AppState,
  ChatMessage,
  ConversationMemory,
  FoodFeedbackType,
  IngredientKey,
  LoggedMeal,
  MealSlot,
  PersistenceBackendMode,
  RecommendationBundle,
  UserProfile,
  WorkoutSession,
} from '@/types/wellness';
import { NUTRITION_RECIPES, getIngredientLabel } from '@/engine/nutritionCatalog';
import { computePersonalizedTargets, getActiveSafetyBanners } from '@/engine/safetyAndTargets';
import { getDefaultMealSlotByHour, recommendMeals } from '@/engine/recommendationEngine';
import {
  clearAllLocalPersistence,
  getClientPersistenceStatus,
  loadActiveSessionRaw,
  loadUserVaultByEmail,
  saveUserVault,
} from '@/services/persistenceService';
import {
  executeConnectedAiTurn,
  fetchBackendHealth,
  type BackendHealthStatus,
} from '@/services/aiGateway';
import {
  loginWithBackendOrLocalAuth,
  signupWithBackendOrLocalAuth,
} from '@/services/authService';
import { buildDemoInitialState, isDemoEmail } from '@/services/demoAccounts';

const DEFAULT_MEMORY: ConversationMemory = {
  lastSuggestedRecipeIds: [],
  lastSuggestedMealSlot: null,
  rejectedRecipeIds: [],
  unavailableIngredients: [],
  awaitingAvailableIngredients: false,
  awaitingRejectionReasonForRecipeId: null,
  awaitingMovementContext: false,
  unavailableMovementVenue: null,
  lastMovementMinutes: null,
  activeTopic: 'general',
  detectedLanguage: 'en',
};

const EMPTY_INITIAL_STATE: AppState = {
  auth: null,
  onboardingCompleted: false,
  onboardingStep: 0,
  profile: null,
  targets: null,
  mealsLogged: [],
  workoutsLogged: [],
  hydrationLiters: 0,
  foodFeedbackMemory: {
    rejectedRecipeIds: [],
    preferFaster: false,
    preferCheaper: false,
  },
  conversationMemory: DEFAULT_MEMORY,
  chatMessages: [],
};

function hydrateProfileDefaults(rawProfile: UserProfile | null | undefined): UserProfile | null {
  if (!rawProfile || typeof rawProfile !== 'object') return null;
  const legacyFood = rawProfile.foodPreferences as Partial<UserProfile['foodPreferences']> | undefined;
  const legacyEx = rawProfile.exercisePreferences as Partial<UserProfile['exercisePreferences']> | undefined;
  return {
    ...rawProfile,
    foodPreferences: {
      ...rawProfile.foodPreferences,
      cuisinePreferences: legacyFood?.cuisinePreferences ?? ['homestyle_pan_indian'],
      spiceTolerance: legacyFood?.spiceTolerance ?? 'medium',
    },
    exercisePreferences: {
      experienceLevel: legacyEx?.experienceLevel ?? 'beginner',
      preferredEnvironment: legacyEx?.preferredEnvironment ?? 'home_bodyweight',
      availableEquipment: legacyEx?.availableEquipment ?? ['none'],
      preferredSessionMins: legacyEx?.preferredSessionMins ?? 20,
    },
  };
}

function hydrateStateFromVault(
  raw: Partial<AppState>,
  authOverride?: AppState['auth']
): AppState {
  const hydratedProfile = hydrateProfileDefaults(raw.profile);
  return {
    ...EMPTY_INITIAL_STATE,
    ...raw,
    auth: authOverride ?? raw.auth ?? null,
    profile: hydratedProfile,
    targets: hydratedProfile
      ? computePersonalizedTargets(hydratedProfile)
      : raw.targets ?? null,
    foodFeedbackMemory: {
      ...EMPTY_INITIAL_STATE.foodFeedbackMemory,
      ...(raw.foodFeedbackMemory ?? {}),
    },
    conversationMemory: {
      ...DEFAULT_MEMORY,
      awaitingMovementContext: false,
      awaitingRejectionReasonForRecipeId: null,
      unavailableMovementVenue: null,
      lastMovementMinutes: null,
      ...(raw.conversationMemory ?? {}),
    },
    mealsLogged: Array.isArray(raw.mealsLogged) ? raw.mealsLogged : [],
    workoutsLogged: Array.isArray(raw.workoutsLogged) ? raw.workoutsLogged : [],
    chatMessages: Array.isArray(raw.chatMessages) ? raw.chatMessages : [],
  };
}

function loadInitialState(): AppState {
  try {
    const parsed = loadActiveSessionRaw();
    if (!parsed || typeof parsed !== 'object') return EMPTY_INITIAL_STATE;
    return hydrateStateFromVault(parsed);
  } catch {
    return EMPTY_INITIAL_STATE;
  }
}

export interface AuthActionResponse {
  ok: boolean;
  error?: string;
  needsOnboarding?: boolean;
}

export interface AppContextValue {
  state: AppState;
  todayISO: string;
  mealsToday: LoggedMeal[];
  workoutsToday: WorkoutSession[];
  caloriesConsumedToday: number;
  proteinConsumedToday: number;
  sodiumConsumedToday: number;
  fiberConsumedToday: number;
  streakDays: number;
  activeSafetyBanners: ActiveSafetyBanner[];
  activeMealSlot: MealSlot;
  setActiveMealSlot: (slot: MealSlot) => void;
  recommendationBundle: RecommendationBundle | null;
  loginWithPassword: (params: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => Promise<AuthActionResponse>;
  registerAccount: (params: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
  }) => Promise<AuthActionResponse>;
  completeOnboarding: (profile: UserProfile) => void;
  updateProfile: (updater: (prev: UserProfile) => UserProfile) => void;
  updateFoodAvailability: (
    available: IngredientKey[],
    unavailable?: IngredientKey[]
  ) => void;
  submitFoodFeedback: (
    recipeId: string,
    feedback: FoodFeedbackType,
    specificUnavailableIngredient?: IngredientKey
  ) => void;
  resetFoodFeedbackFilters: () => void;
  logMeal: (meal: Omit<LoggedMeal, 'id' | 'dateISO' | 'timeLabel'>) => void;
  logWorkout: (workout: Omit<WorkoutSession, 'id' | 'dateISO' | 'timeLabel'>) => void;
  adjustHydration: (deltaLiters: number) => void;
  sendUserMessage: (text: string, file?: File | null) => Promise<ChatMessage>;
  backendHealth: BackendHealthStatus | null;
  aiProviderMode: AiBackendProviderMode;
  aiProviderLabel: string;
  persistenceMode: PersistenceBackendMode;
  signOut: () => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function computeStreakDays(meals: LoggedMeal[], workouts: WorkoutSession[]): number {
  const activeDates = new Set<string>();
  for (const m of meals) activeDates.add(m.dateISO);
  for (const w of workouts) activeDates.add(w.dateISO);
  if (activeDates.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 60; i++) {
    const iso = cursor.toISOString().slice(0, 10);
    if (activeDates.has(iso)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      // Allow yesterday's streak to still count if user hasn't logged today yet
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => loadInitialState());
  const stateRef = useRef<AppState>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [activeMealSlot, setActiveMealSlot] = useState<MealSlot>(() =>
    getDefaultMealSlotByHour()
  );
  const [backendHealth, setBackendHealth] = useState<BackendHealthStatus | null>(null);
  const [aiProviderMode, setAiProviderMode] = useState<AiBackendProviderMode>('checking');
  const [aiProviderLabel, setAiProviderLabel] = useState<string>(
    'Checking AI gateway...'
  );
  const clientPersistence = useMemo(() => getClientPersistenceStatus(), []);

  useEffect(() => {
    let active = true;
    fetchBackendHealth().then((health) => {
      if (!active) return;
      setBackendHealth(health);
      setAiProviderMode(health.aiGateway.mode);
      setAiProviderLabel(
        health.aiGateway.configured && health.aiGateway.provider
          ? `Connected LLM Gateway (${health.aiGateway.provider})`
          : 'Grounded Rules Fallback (No Server LLM Key Configured)'
      );
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (state.auth) {
      saveUserVault(state);
    }
  }, [state]);

  const [todayISO] = useState(() => new Date().toISOString().slice(0, 10));

  const mealsToday = useMemo(
    () => state.mealsLogged.filter((m) => m.dateISO === todayISO),
    [state.mealsLogged, todayISO]
  );

  const workoutsToday = useMemo(
    () => state.workoutsLogged.filter((w) => w.dateISO === todayISO),
    [state.workoutsLogged, todayISO]
  );

  const caloriesConsumedToday = useMemo(
    () => mealsToday.reduce((sum, m) => sum + m.calories, 0),
    [mealsToday]
  );
  const proteinConsumedToday = useMemo(
    () => mealsToday.reduce((sum, m) => sum + m.proteinG, 0),
    [mealsToday]
  );
  const sodiumConsumedToday = useMemo(
    () => mealsToday.reduce((sum, m) => sum + m.sodiumMg, 0),
    [mealsToday]
  );
  const fiberConsumedToday = useMemo(
    () => mealsToday.reduce((sum, m) => sum + m.fiberG, 0),
    [mealsToday]
  );

  const streakDays = useMemo(
    () => computeStreakDays(state.mealsLogged, state.workoutsLogged),
    [state.mealsLogged, state.workoutsLogged]
  );

  const activeSafetyBanners = useMemo(() => {
    if (!state.profile || !state.onboardingCompleted) return [];
    return getActiveSafetyBanners(state.profile);
  }, [state.profile, state.onboardingCompleted]);

  const recommendationBundle = useMemo<RecommendationBundle | null>(() => {
    if (!state.profile || !state.onboardingCompleted) return null;

    const mergedUnavailable = Array.from(
      new Set<IngredientKey>([
        ...state.profile.foodAvailability.unavailableIngredients,
        ...state.conversationMemory.unavailableIngredients,
      ])
    );

    const maxPrepMins = state.foodFeedbackMemory.preferFaster
      ? Math.min(state.profile.foodPreferences.cookingTimeLimitMins, 15)
      : state.profile.foodPreferences.cookingTimeLimitMins;

    return recommendMeals(
      state.profile,
      {
        mealSlot: activeMealSlot,
        rejectedRecipeIds: Array.from(
          new Set([
            ...state.foodFeedbackMemory.rejectedRecipeIds,
            ...state.conversationMemory.rejectedRecipeIds,
          ])
        ),
        unavailableIngredients: mergedUnavailable,
        availableIngredients: state.profile.foodAvailability.availableIngredients,
        maxPrepMins,
        budgetPriority:
          state.foodFeedbackMemory.preferCheaper ||
          state.profile.foodPreferences.budgetTier === 'budget',
        antiRepeatIds: [],
        strictAvailabilityOnly: false,
      },
      state.mealsLogged,
      4
    );
  }, [
    state.profile,
    state.onboardingCompleted,
    state.foodFeedbackMemory,
    state.conversationMemory.rejectedRecipeIds,
    state.conversationMemory.unavailableIngredients,
    activeMealSlot,
    state.mealsLogged,
  ]);

  const loginWithPassword = async ({
    email,
    password,
    rememberMe = true,
  }: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<AuthActionResponse> => {
    const authResult = await loginWithBackendOrLocalAuth({
      email,
      password,
      rememberMe,
    });
    if (!authResult.ok) {
      return { ok: false, error: authResult.error };
    }

    const authenticatedUser = {
      ...authResult.user,
      rememberMe,
    };

    const existingVault = loadUserVaultByEmail(authenticatedUser.email);
    if (
      existingVault &&
      existingVault.auth?.email?.trim().toLowerCase() ===
        authenticatedUser.email.toLowerCase()
    ) {
      const nextRestoredState = hydrateStateFromVault(existingVault, authenticatedUser);
      setState(nextRestoredState);
      saveUserVault(nextRestoredState);
      return {
        ok: true,
        needsOnboarding: !(
          nextRestoredState.onboardingCompleted && nextRestoredState.profile
        ),
      };
    }

    if (authenticatedUser.isDemoAccount || isDemoEmail(authenticatedUser.email)) {
      const demoState = buildDemoInitialState(authenticatedUser.email, rememberMe);
      if (demoState) {
        const syncedDemoState: AppState = {
          ...demoState,
          auth: {
            ...demoState.auth!,
            ...authenticatedUser,
            isDemoAccount: true,
            rememberMe,
          },
        };
        setState(syncedDemoState);
        saveUserVault(syncedDemoState);
        return { ok: true, needsOnboarding: false };
      }
    }

    const freshUserState: AppState = {
      ...EMPTY_INITIAL_STATE,
      auth: authenticatedUser,
    };
    setState(freshUserState);
    saveUserVault(freshUserState);
    return { ok: true, needsOnboarding: true };
  };

  const registerAccount = async ({
    name,
    email,
    password,
    confirmPassword,
    acceptTerms,
  }: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
  }): Promise<AuthActionResponse> => {
    const signupResult = await signupWithBackendOrLocalAuth({
      name,
      email,
      password,
      confirmPassword,
      acceptTerms,
    });
    if (!signupResult.ok) {
      return { ok: false, error: signupResult.error };
    }

    // Strict isolation: newly created accounts start completely fresh (never inheriting demo or prior user state)
    const freshUserState: AppState = {
      ...EMPTY_INITIAL_STATE,
      auth: {
        ...signupResult.user,
        isDemoAccount: false,
        rememberMe: true,
      },
      onboardingCompleted: false,
      onboardingStep: 0,
      profile: null,
      targets: null,
      mealsLogged: [],
      workoutsLogged: [],
      hydrationLiters: 0,
      chatMessages: [],
    };
    setState(freshUserState);
    saveUserVault(freshUserState);
    return { ok: true, needsOnboarding: true };
  };

  const completeOnboarding = (profile: UserProfile) => {
    const computedTargets = computePersonalizedTargets(profile);
    const initialBundle = recommendMeals(
      profile,
      {
        mealSlot: getDefaultMealSlotByHour(),
        rejectedRecipeIds: [],
        unavailableIngredients: profile.foodAvailability.unavailableIngredients,
        availableIngredients: profile.foodAvailability.availableIngredients,
        maxPrepMins: profile.foodPreferences.cookingTimeLimitMins,
        budgetPriority: profile.foodPreferences.budgetTier === 'budget',
        antiRepeatIds: [],
        strictAvailabilityOnly: false,
      },
      [],
      2
    );

    const topRec = initialBundle.recommendations[0];
    const lang =
      profile.lifestyle.preferredLanguage === 'auto'
        ? 'en'
        : profile.lifestyle.preferredLanguage;

    const welcomeContent =
      lang === 'hi'
        ? `नमस्ते ${profile.basic.name}! आपका पर्सनल प्लान तैयार है: रोज़ाना ~${computedTargets.calorieTarget} kcal (${computedTargets.proteinTargetG}g प्रोटीन) और ~${computedTargets.dailyMovementMinutes} मिनट मूवमेंट। आपकी सुरक्षा और रसोई के हिसाब से पहला सुझाव: **${topRec?.recipe.hindiName ?? 'हल्का घर का भोजन'}**।`
        : lang === 'hinglish'
          ? `Welcome ${profile.basic.name}! Aapka personalized wellness baseline ready hai: daily ~${computedTargets.calorieTarget} kcal (${computedTargets.proteinTargetG}g protein) aur ~${computedTargets.dailyMovementMinutes} min movement.\n\nAapki kitchen aur safety preferences ke hisaab se next suggestion: **${topRec?.recipe.hinglishName ?? 'Home-style balanced meal'}**. Kuch bhi badalna ho toh bas bolein!`
          : `Welcome ${profile.basic.name}! Your personal profile and baseline are ready: ~${computedTargets.calorieTarget} kcal (${computedTargets.proteinTargetG}g protein) and ~${computedTargets.dailyMovementMinutes} min daily movement.\n\nBased on your kitchen setup and safety profile, a great next meal idea is **${topRec?.recipe.name ?? 'Balanced homestyle dal & sabzi'}**. Tell me anytime if you want an alternative or what ingredients are in your kitchen.`;

    const welcomeMessage: ChatMessage = {
      id: `ai-welcome-${Date.now()}`,
      role: 'assistant',
      content: welcomeContent,
      language: lang,
      timestamp: new Date().toISOString(),
      recommendedRecipes: initialBundle.recommendations,
      actionChips: [
        {
          id: 'welcome-cant-eat',
          label: "Don't have / change meal",
          promptText: 'I cannot eat that tonight',
          actionType: 'ask_prompt',
        },
        {
          id: 'welcome-food',
          label: 'Explore Food Hub',
          promptText: 'Open Food Hub',
          actionType: 'navigate_food',
        },
      ],
    };

    setState((prev) => ({
      ...prev,
      auth: prev.auth ?? {
        id: `usr-${Date.now()}`,
        name: profile.basic.name,
        email: '',
        signedInAt: new Date().toISOString(),
      },
      onboardingCompleted: true,
      profile,
      targets: computedTargets,
      conversationMemory: {
        ...DEFAULT_MEMORY,
        lastSuggestedRecipeIds: initialBundle.recommendations.map((r) => r.recipe.id),
        lastSuggestedMealSlot: getDefaultMealSlotByHour(),
        unavailableIngredients: profile.foodAvailability.unavailableIngredients,
        detectedLanguage: lang,
      },
      chatMessages: [welcomeMessage],
    }));
  };

  const updateProfile = (updater: (prev: UserProfile) => UserProfile) => {
    setState((prev) => {
      if (!prev.profile) return prev;
      const nextProfile = updater(prev.profile);
      return {
        ...prev,
        profile: nextProfile,
        targets: computePersonalizedTargets(nextProfile),
        auth: prev.auth
          ? { ...prev.auth, name: nextProfile.basic.name }
          : prev.auth,
      };
    });
  };

  const updateFoodAvailability = (
    available: IngredientKey[],
    unavailable: IngredientKey[] = []
  ) => {
    setState((prev) => {
      if (!prev.profile) return prev;
      const availSet = new Set(available);
      const nextUnavailable = unavailable.filter((item) => !availSet.has(item));
      return {
        ...prev,
        profile: {
          ...prev.profile,
          foodAvailability: {
            availableIngredients: available,
            unavailableIngredients: nextUnavailable,
            lastUpdatedDate: todayISO,
          },
        },
        conversationMemory: {
          ...prev.conversationMemory,
          unavailableIngredients: nextUnavailable,
        },
      };
    });
  };

  const submitFoodFeedback = (
    recipeId: string,
    feedback: FoodFeedbackType,
    specificUnavailableIngredient?: IngredientKey
  ) => {
    setState((prev) => {
      if (!prev.profile) return prev;
      const targetRecipe = NUTRITION_RECIPES.find((r) => r.id === recipeId);

      const nextRejected = Array.from(
        new Set([...prev.foodFeedbackMemory.rejectedRecipeIds, recipeId])
      );

      let nextUnavailable = [...prev.profile.foodAvailability.unavailableIngredients];
      let nextAvailable = [...prev.profile.foodAvailability.availableIngredients];

      if (feedback === 'dont_have') {
        const missingIng =
          specificUnavailableIngredient ?? targetRecipe?.requiredIngredients[0];
        if (missingIng) {
          nextUnavailable = Array.from(new Set([...nextUnavailable, missingIng]));
          nextAvailable = nextAvailable.filter((item) => item !== missingIng);
        }
      }

      const feedbackNote: ChatMessage | null =
        feedback === 'dont_have' && targetRecipe
          ? {
              id: `ai-fb-${Date.now()}`,
              role: 'assistant',
              content: `Noted — I removed **${targetRecipe.name}** and marked **${getIngredientLabel(
                specificUnavailableIngredient ?? targetRecipe.requiredIngredients[0]
              ).split(' / ')[0]}** unavailable at home. Recommendations have been updated.`,
              language: prev.conversationMemory.detectedLanguage,
              timestamp: new Date().toISOString(),
            }
          : null;

      return {
        ...prev,
        profile: {
          ...prev.profile,
          foodAvailability: {
            ...prev.profile.foodAvailability,
            availableIngredients: nextAvailable,
            unavailableIngredients: nextUnavailable,
            lastUpdatedDate: todayISO,
          },
        },
        foodFeedbackMemory: {
          rejectedRecipeIds:
            feedback === 'faster' || feedback === 'cheaper'
              ? prev.foodFeedbackMemory.rejectedRecipeIds
              : nextRejected,
          preferFaster:
            feedback === 'faster' ? true : prev.foodFeedbackMemory.preferFaster,
          preferCheaper:
            feedback === 'cheaper' ? true : prev.foodFeedbackMemory.preferCheaper,
        },
        conversationMemory: {
          ...prev.conversationMemory,
          rejectedRecipeIds: Array.from(
            new Set([
              ...prev.conversationMemory.rejectedRecipeIds,
              ...(feedback === 'faster' || feedback === 'cheaper' ? [] : [recipeId]),
            ])
          ),
          unavailableIngredients: nextUnavailable,
        },
        chatMessages: feedbackNote
          ? [...prev.chatMessages, feedbackNote]
          : prev.chatMessages,
      };
    });
  };

  const resetFoodFeedbackFilters = () => {
    setState((prev) => ({
      ...prev,
      foodFeedbackMemory: {
        rejectedRecipeIds: [],
        preferFaster: false,
        preferCheaper: false,
      },
      profile: prev.profile
        ? {
            ...prev.profile,
            foodAvailability: {
              ...prev.profile.foodAvailability,
              unavailableIngredients: [],
            },
          }
        : null,
      conversationMemory: {
        ...prev.conversationMemory,
        rejectedRecipeIds: [],
        unavailableIngredients: [],
      },
    }));
  };

  const logMeal = (meal: Omit<LoggedMeal, 'id' | 'dateISO' | 'timeLabel'>) => {
    const now = new Date();
    const entry: LoggedMeal = {
      ...meal,
      id: `meal-${Date.now()}`,
      dateISO: now.toISOString().slice(0, 10),
      timeLabel: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setState((prev) => ({
      ...prev,
      mealsLogged: [entry, ...prev.mealsLogged],
    }));
  };

  const logWorkout = (
    workout: Omit<WorkoutSession, 'id' | 'dateISO' | 'timeLabel'>
  ) => {
    const now = new Date();
    const entry: WorkoutSession = {
      ...workout,
      id: `wrk-${Date.now()}`,
      dateISO: now.toISOString().slice(0, 10),
      timeLabel: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setState((prev) => ({
      ...prev,
      workoutsLogged: [entry, ...prev.workoutsLogged],
    }));
  };

  const adjustHydration = (deltaLiters: number) => {
    setState((prev) => ({
      ...prev,
      hydrationLiters: Math.max(
        0,
        Math.min(8, Number((prev.hydrationLiters + deltaLiters).toFixed(2)))
      ),
    }));
  };

  const sendUserMessage = async (
    text: string,
    file?: File | null
  ): Promise<ChatMessage> => {
    const clean = text.trim() || (file ? 'Analyzed food plate photo' : '');
    const snapshot = stateRef.current;
    const result = await executeConnectedAiTurn(clean, snapshot, file);
    const turnResult = result.turn;

    setAiProviderMode(result.providerMode);
    setAiProviderLabel(result.providerLabel);

    let userImageUrl: string | undefined = undefined;
    if (file) {
      try {
        userImageUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      } catch {
        userImageUrl = URL.createObjectURL(file);
      }
    }

    const nowISO = new Date().toISOString();
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: clean,
      imageUrl: userImageUrl,
      language: turnResult.assistantMessage.language,
      timestamp: nowISO,
    };

    const annotatedAssistant: ChatMessage = {
      ...turnResult.assistantMessage,
      providerMode: result.providerMode,
      pipelineTrace: turnResult.assistantMessage.pipelineTrace
        ? {
            ...turnResult.assistantMessage.pipelineTrace,
            providerMode: result.providerMode,
            providerLabel: result.providerLabel,
          }
        : undefined,
    };

    const mealEntry: LoggedMeal | null = result.loggedMeal
      ? {
          ...result.loggedMeal,
          id: `meal-${Date.now()}`,
          dateISO: nowISO.slice(0, 10),
          timeLabel: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }
      : null;

    setState((prev) => {
      let nextProfile = prev.profile;
      if (nextProfile) {
        const nextUnavailable = turnResult.updatedMemory.unavailableIngredients;
        const nextAvailable = turnResult.newlyAvailableIngredients
          ? Array.from(
              new Set([
                ...nextProfile.foodAvailability.availableIngredients.filter(
                  (i) => !nextUnavailable.includes(i)
                ),
                ...turnResult.newlyAvailableIngredients,
              ])
            )
          : nextProfile.foodAvailability.availableIngredients.filter(
              (i) => !nextUnavailable.includes(i)
            );

        nextProfile = {
          ...nextProfile,
          foodAvailability: {
            availableIngredients: nextAvailable,
            unavailableIngredients: nextUnavailable,
            lastUpdatedDate: todayISO,
          },
        };
      }

      return {
        ...prev,
        profile: nextProfile,
        foodFeedbackMemory: {
          rejectedRecipeIds: Array.from(
            new Set([
              ...prev.foodFeedbackMemory.rejectedRecipeIds,
              ...turnResult.newlyRejectedRecipeIds,
            ])
          ),
          preferFaster: turnResult.preferFaster ?? prev.foodFeedbackMemory.preferFaster,
          preferCheaper:
            turnResult.preferCheaper ?? prev.foodFeedbackMemory.preferCheaper,
        },
        conversationMemory: turnResult.updatedMemory,
        mealsLogged: mealEntry ? [mealEntry, ...prev.mealsLogged] : prev.mealsLogged,
        chatMessages: [...prev.chatMessages, userMsg, annotatedAssistant],
      };
    });

    return annotatedAssistant;
  };

  const signOut = () => {
    if (stateRef.current.auth?.email) {
      saveUserVault(stateRef.current);
    }
    clearAllLocalPersistence();
    setState(EMPTY_INITIAL_STATE);
  };

  const resetAllData = () => {
    clearAllLocalPersistence(stateRef.current.auth?.email);
    setState(EMPTY_INITIAL_STATE);
  };

  const persistenceMode: PersistenceBackendMode =
    backendHealth?.persistence.supabaseConfigured || clientPersistence.supabaseConfigured
      ? 'supabase_connected'
      : 'local_browser_vault_only';

  const value: AppContextValue = {
    state,
    todayISO,
    mealsToday,
    workoutsToday,
    caloriesConsumedToday,
    proteinConsumedToday,
    sodiumConsumedToday,
    fiberConsumedToday,
    streakDays,
    activeSafetyBanners,
    activeMealSlot,
    setActiveMealSlot,
    recommendationBundle,
    loginWithPassword,
    registerAccount,
    completeOnboarding,
    updateProfile,
    updateFoodAvailability,
    submitFoodFeedback,
    resetFoodFeedbackFilters,
    logMeal,
    logWorkout,
    adjustHydration,
    sendUserMessage,
    backendHealth,
    aiProviderMode,
    aiProviderLabel,
    persistenceMode,
    signOut,
    resetAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}

export const useAppContext = useApp;
