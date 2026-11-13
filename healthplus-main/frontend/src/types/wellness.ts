export type AppRoute =
  | '/'
  | '/login'
  | '/signup'
  | '/forgot-password'
  | '/reset-password'
  | '/onboarding'
  | '/design-system'
  | '/today'
  | '/food'
  | '/move'
  | '/coach'
  | '/progress'
  | '/profile'
  | '/settings';

export type DemoCategory =
  | 'general_wellness'
  | 'fitness_goal'
  | 'dietary_restrictions';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  signedInAt: string;
  isDemoAccount?: boolean;
  demoCategory?: DemoCategory;
  rememberMe?: boolean;
};

export type GenderOption = 'male' | 'female' | 'other';

export type PrimaryGoal =
  | 'fat_loss'
  | 'muscle_gain'
  | 'steady_energy'
  | 'metabolic_health'
  | 'consistency';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';

export type WorkSchedule =
  | 'desk_9_to_6'
  | 'shift_work'
  | 'flexible_home'
  | 'student';

export type StressLevel = 'low' | 'moderate' | 'high';

export type DietaryPattern =
  | 'vegetarian'
  | 'eggetarian'
  | 'non_vegetarian'
  | 'vegan'
  | 'jain';

export type BudgetTier = 'budget' | 'moderate' | 'flexible';

export type KitchenSetup = 'basic_stove' | 'full_kitchen' | 'pg_hostel_kettle';

export type IndianCuisineRegion =
  | 'homestyle_pan_indian'
  | 'north_indian'
  | 'south_indian'
  | 'west_gujarati_marathi'
  | 'east_bengali';

export type SpiceTolerance = 'mild' | 'medium' | 'bold';

export type ExerciseExperienceLevel = 'beginner' | 'intermediate' | 'accustomed';

export type ExerciseEnvironmentPreference =
  | 'home_bodyweight'
  | 'home_light_equipment'
  | 'gym'
  | 'outdoor_walk';

export type ConversationLanguage = 'en' | 'hinglish' | 'hi';

export type LanguagePreference = 'auto' | ConversationLanguage;

export type AllergenKey =
  | 'dairy'
  | 'peanuts'
  | 'tree_nuts'
  | 'gluten'
  | 'eggs'
  | 'soy'
  | 'shellfish'
  | 'sesame';

export type IngredientKey =
  | 'dal'
  | 'moong_dal'
  | 'rice'
  | 'roti_atta'
  | 'oats'
  | 'poha'
  | 'suji'
  | 'besan'
  | 'ragi'
  | 'paneer'
  | 'curd'
  | 'milk'
  | 'eggs'
  | 'chicken'
  | 'soya_chunks'
  | 'tofu'
  | 'chana'
  | 'rajma'
  | 'mixed_veg'
  | 'spinach'
  | 'tomato_onion'
  | 'banana'
  | 'peanuts'
  | 'ghee_oil'
  | (string & {});

export interface UserBasicProfile {
  name: string;
  age: number;
  gender: GenderOption;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
}

export interface UserGoals {
  primaryGoal: PrimaryGoal;
  weeklyWorkoutDays: number;
  dailyStepGoal: number;
}

export interface UserLifestyle {
  activityLevel: ActivityLevel;
  workSchedule: WorkSchedule;
  sleepHours: number;
  stressLevel: StressLevel;
  preferredLanguage: LanguagePreference;
}

export interface UserFoodPreferences {
  dietaryPattern: DietaryPattern;
  cuisinePreferences: IndianCuisineRegion[];
  spiceTolerance: SpiceTolerance;
  dislikedFoods: string[];
  cookingTimeLimitMins: number;
  budgetTier: BudgetTier;
  kitchenSetup: KitchenSetup;
}

export interface UserExercisePreferences {
  experienceLevel: ExerciseExperienceLevel;
  preferredEnvironment: ExerciseEnvironmentPreference;
  availableEquipment: ('none' | 'dumbbells_bands' | 'mat' | 'full_gym')[];
  preferredSessionMins: number;
}

export interface DailyFoodAvailability {
  availableIngredients: IngredientKey[];
  unavailableIngredients: IngredientKey[];
  lastUpdatedDate: string | null;
}

export type HealthConditionDisclosure =
  | 'disclosed'
  | 'none_reported'
  | 'prefer_not_to_disclose';

export interface HealthSafetyScreening {
  disclosureStatus?: HealthConditionDisclosure;
  diabetesContext?: 'diet_only' | 'medical_supervision' | 'unknown';
  allergies: AllergenKey[];
  celiacOrGlutenFree: boolean;
  diabetesOrSugarConcern: boolean;
  hypertensionOrBpConcern: boolean;
  kidneyOrRenalConcern: boolean;
  pregnancyOrPostpartum: boolean;
  underMedicalSupervision: boolean;
  eatingDisorderHistory: boolean;
  otherConditionsNote: string;
}

export interface UserProfile {
  basic: UserBasicProfile;
  goals: UserGoals;
  lifestyle: UserLifestyle;
  foodPreferences: UserFoodPreferences;
  exercisePreferences: UserExercisePreferences;
  foodAvailability: DailyFoodAvailability;
  safety: HealthSafetyScreening;
}

export interface ComputedTargets {
  bmr: number;
  tdee: number;
  calorieTarget: number;
  calorieFloorApplied: boolean;
  proteinTargetG: number;
  carbsTargetG: number;
  fatTargetG: number;
  fiberTargetG: number;
  sodiumLimitMg: number;
  hydrationTargetLiters: number;
  dailyMovementMinutes: number;
}

export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export type RecipeVisualTheme =
  | 'dal_bowl'
  | 'paneer_skillet'
  | 'poha_plate'
  | 'chilla_platter'
  | 'khichdi_pot'
  | 'egg_bhurji'
  | 'soya_stir'
  | 'oats_bowl'
  | 'curd_rice'
  | 'sprouts_chaat'
  | 'chicken_bowl'
  | 'ragi_dosa'
  | 'tofu_stir'
  | 'roti_sabzi';

export interface MacroBreakdown {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sodiumMg: number;
}

export interface RecipeIngredientPortion {
  key: IngredientKey;
  amountLabel: string;
  gramsApprox: number;
}

export interface NutritionRecipe {
  id: string;
  name: string;
  hinglishName: string;
  hindiName: string;
  mealSlot: MealSlot;
  dietTypes: DietaryPattern[];
  cuisineTags: IndianCuisineRegion[];
  spiceLevel: SpiceTolerance;
  requiredIngredients: IngredientKey[];
  optionalIngredients: IngredientKey[];
  ingredientAmounts: RecipeIngredientPortion[];
  allergens: AllergenKey[];
  containsGluten: boolean;
  glycemicLoad: 'low' | 'medium' | 'high';
  sodiumLevel: 'low' | 'moderate' | 'high';
  kidneyStrainFlag: boolean;
  prepMins: number;
  difficulty: 'Quick 10m' | 'Easy' | 'Moderate';
  budgetTier: 'budget' | 'moderate';
  equipment: KitchenSetup[];
  macros: MacroBreakdown;
  dataProvenance: 'prototype_kitchen_estimate' | 'reference_ingredient_computed_prototype';
  referenceItems: string[];
  provenanceNote: string;
  summary: string;
  whyItFits: string;
  steps: string[];
  visualTheme: RecipeVisualTheme;
  swaps: string[];
}

export type FoodFeedbackType =
  | 'dont_have'
  | 'dont_like'
  | 'faster'
  | 'cheaper'
  | 'something_else';

export interface LoggedMeal {
  id: string;
  recipeId?: string;
  name: string;
  mealSlot: MealSlot;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sodiumMg: number;
  dateISO: string;
  timeLabel: string;
  source:
    | 'recommended_recipe'
    | 'quick_estimate'
    | 'photo_prototype_estimate'
    | 'ai_plate_scanner'
    | 'ai_chatbot_backend';
  provenanceLabel: string;
}

export type ExerciseTypeId = 'squat' | 'pushup' | 'glute_bridge';

export interface WorkoutSession {
  id: string;
  exerciseType: ExerciseTypeId;
  exerciseLabel: string;
  repsCompleted: number;
  targetReps: number;
  durationSeconds: number;
  estimatedKcal: number;
  mode: 'guided_demo' | 'camera_preview';
  dateISO: string;
  timeLabel: string;
  formNotes: string[];
}

export interface RecommendationConstraints {
  mealSlot?: MealSlot;
  rejectedRecipeIds: string[];
  unavailableIngredients: IngredientKey[];
  availableIngredients: IngredientKey[];
  maxPrepMins: number;
  budgetPriority: boolean;
  antiRepeatIds: string[];
  strictAvailabilityOnly: boolean;
}

export interface ScoredRecipe {
  recipe: NutritionRecipe;
  score: number;
  matchReasons: string[];
  safetyNotes: string[];
  missingIngredients: IngredientKey[];
}

export interface RecommendationBundle {
  recommendations: ScoredRecipe[];
  excludedCount: number;
  blockedReasons: string[];
  safetyAdvisory: string | null;
  needsIngredientPrompt: boolean;
}

export interface ConversationMemory {
  lastSuggestedRecipeIds: string[];
  lastSuggestedMealSlot: MealSlot | null;
  rejectedRecipeIds: string[];
  unavailableIngredients: IngredientKey[];
  awaitingAvailableIngredients: boolean;
  awaitingRejectionReasonForRecipeId?: string | null;
  awaitingMovementContext?: boolean;
  unavailableMovementVenue?: 'gym' | null;
  lastMovementMinutes?: number | null;
  activeTopic: 'general' | 'food' | 'move' | 'progress' | 'safety';
  detectedLanguage: ConversationLanguage;
}

export type AiBackendProviderMode =
  | 'live_llm_gateway'
  | 'grounded_fallback_unconfigured'
  | 'checking';

export type PersistenceBackendMode =
  | 'local_browser_vault_only'
  | 'supabase_connected';

export interface AiPipelineTrace {
  intent: string;
  detectedLanguage: ConversationLanguage;
  constraintsApplied: string[];
  safetyChecksPassed: string[];
  provenanceNote: string;
  providerMode?: AiBackendProviderMode;
  providerLabel?: string;
}

export interface ChatActionChip {
  id: string;
  label: string;
  promptText: string;
  actionType?: 'ask_prompt' | 'update_availability' | 'navigate_food' | 'navigate_move';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language: ConversationLanguage;
  timestamp: string;
  providerMode?: AiBackendProviderMode;
  safetyNotice?: string;
  recommendedRecipes?: ScoredRecipe[];
  actionChips?: ChatActionChip[];
  pipelineTrace?: AiPipelineTrace;
  imageUrl?: string;
  preprocessedImageUrl?: string;
}

export interface ActiveSafetyBanner {
  level: 'info' | 'caution' | 'medical_referral';
  title: string;
  message: string;
}

export interface AppState {
  auth: AuthUser | null;
  onboardingCompleted: boolean;
  onboardingStep: number;
  profile: UserProfile | null;
  targets: ComputedTargets | null;
  mealsLogged: LoggedMeal[];
  workoutsLogged: WorkoutSession[];
  hydrationLiters: number;
  foodFeedbackMemory: {
    rejectedRecipeIds: string[];
    preferFaster: boolean;
    preferCheaper: boolean;
  };
  conversationMemory: ConversationMemory;
  chatMessages: ChatMessage[];
}
