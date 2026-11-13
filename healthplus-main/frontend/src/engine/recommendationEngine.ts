import type {
  IngredientKey,
  LoggedMeal,
  MealSlot,
  NutritionRecipe,
  RecommendationBundle,
  RecommendationConstraints,
  ScoredRecipe,
  UserProfile,
} from '@/types/wellness';
import { NUTRITION_RECIPES, getIngredientLabel } from './nutritionCatalog';
import { evaluateProfileSafety } from './safetyConfig';

function isDislikedByKeyword(recipe: NutritionRecipe, dislikedFoods: string[]): boolean {
  if (dislikedFoods.length === 0) return false;
  const haystack = `${recipe.name} ${recipe.hinglishName} ${recipe.requiredIngredients.join(' ')}`.toLowerCase();
  return dislikedFoods.some((term) => {
    const clean = term.trim().toLowerCase();
    return clean.length >= 2 && haystack.includes(clean);
  });
}

function isMealSlotCompatible(requested: MealSlot | undefined, candidate: MealSlot): boolean {
  if (!requested) return true;
  if (requested === candidate) return true;
  // Cooked warm lunch and dinner staples can interchange cleanly when alternatives are needed
  if (
    (requested === 'dinner' && candidate === 'lunch') ||
    (requested === 'lunch' && candidate === 'dinner')
  ) {
    return true;
  }
  return false;
}

export function getDefaultMealSlotByHour(hour: number = new Date().getHours()): MealSlot {
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 19) return 'snack';
  return 'dinner';
}

export function recommendMeals(
  profile: UserProfile,
  constraints: RecommendationConstraints,
  mealsLoggedHistory: LoggedMeal[] = [],
  limit: number = 3
): RecommendationBundle {
  const { foodPreferences, safety, goals } = profile;
  const safetyEval = evaluateProfileSafety(profile);
  const blockedReasonsSet = new Set<string>();
  let excludedCount = 0;

  const combinedUnavailable = new Set<IngredientKey>([
    ...profile.foodAvailability.unavailableIngredients,
    ...constraints.unavailableIngredients,
  ]);

  const effectiveAvailable = new Set<IngredientKey>(
    constraints.availableIngredients.length > 0
      ? constraints.availableIngredients
      : profile.foodAvailability.availableIngredients
  );

  const todayISO = new Date().toISOString().slice(0, 10);
  const loggedTodayIds = new Set(
    mealsLoggedHistory
      .filter((m) => m.dateISO === todayISO)
      .map((m) => m.recipeId)
      .filter((id): id is string => Boolean(id))
  );

  // Recent multi-day variety tracking (exclude repeats within 48-72h when other choices exist)
  const recentMealCounts = new Map<string, number>();
  for (const meal of mealsLoggedHistory) {
    if (meal.recipeId) {
      recentMealCounts.set(meal.recipeId, (recentMealCounts.get(meal.recipeId) ?? 0) + 1);
    }
  }

  const candidates: ScoredRecipe[] = [];

  for (const recipe of NUTRITION_RECIPES) {
    // 1. Hard Diet Pattern Guard
    if (!recipe.dietTypes.includes(foodPreferences.dietaryPattern)) {
      excludedCount++;
      continue;
    }

    // 2. Hard Allergen & Gluten Guard from Safety Config
    const offendingAllergen = recipe.allergens.find((a) => safetyEval.allergies.includes(a));
    if (offendingAllergen) {
      excludedCount++;
      blockedReasonsSet.add(`Excluded allergen: ${offendingAllergen}`);
      continue;
    }
    if (safetyEval.excludeGluten && recipe.containsGluten) {
      excludedCount++;
      blockedReasonsSet.add('Excluded gluten-containing dishes');
      continue;
    }

    // 3. Hard Condition Safety Guards (Renal / Glycemic / Sodium)
    if (safetyEval.excludeKidneyStrain && recipe.kidneyStrainFlag) {
      excludedCount++;
      blockedReasonsSet.add('Excluded higher renal-load items');
      continue;
    }
    if (safetyEval.excludeHighSodium && recipe.sodiumLevel === 'high') {
      excludedCount++;
      blockedReasonsSet.add('Excluded high-sodium recipes');
      continue;
    }
    if (safetyEval.excludeHighGlycemic && recipe.glycemicLoad === 'high') {
      excludedCount++;
      blockedReasonsSet.add('Excluded high glycemic-load dishes');
      continue;
    }

    // 4. Hard Unavailable Ingredient Exclusion (e.g. "I don't have paneer")
    const missingDueToUnavailable = recipe.requiredIngredients.find((req) =>
      combinedUnavailable.has(req)
    );
    if (missingDueToUnavailable) {
      excludedCount++;
      blockedReasonsSet.add(
        `Unavailable at home: ${getIngredientLabel(missingDueToUnavailable)}`
      );
      continue;
    }

    // 5. Hard Rejected Recipe or Keyword Dislike Exclusion
    if (
      constraints.rejectedRecipeIds.includes(recipe.id) ||
      isDislikedByKeyword(recipe, foodPreferences.dislikedFoods)
    ) {
      excludedCount++;
      blockedReasonsSet.add('Hidden per your taste/dislike feedback');
      continue;
    }

    // 6. Kitchen Equipment Guard
    if (!recipe.equipment.includes(foodPreferences.kitchenSetup)) {
      excludedCount++;
      blockedReasonsSet.add('Excluded incompatible kitchen setup');
      continue;
    }

    // 7. Required Pantry Availability Check
    const missingIngredients = recipe.requiredIngredients.filter(
      (req) => effectiveAvailable.size > 0 && !effectiveAvailable.has(req)
    );

    if (constraints.strictAvailabilityOnly && missingIngredients.length > 0) {
      excludedCount++;
      continue;
    }

    // --- Deterministic Explainable Scoring ---
    let score = 50;
    const matchReasons: string[] = [];
    const safetyNotes: string[] = [];

    // Meal slot match
    if (constraints.mealSlot) {
      if (recipe.mealSlot === constraints.mealSlot) {
        score += 32;
      } else if (isMealSlotCompatible(constraints.mealSlot, recipe.mealSlot)) {
        score += 12;
      } else {
        score -= 22;
      }
    }

    // Kitchen availability boost
    if (effectiveAvailable.size > 0) {
      if (missingIngredients.length === 0) {
        score += 55;
        const matchedLabels = recipe.requiredIngredients
          .map((k) => getIngredientLabel(k).split(' / ')[0])
          .join(' + ');
        matchReasons.push(`Can cook now (${matchedLabels})`);
      } else {
        score -= missingIngredients.length * 24;
      }
    }

    // Indian cuisine & spice taste fit
    const userCuisines = foodPreferences.cuisinePreferences ?? ['homestyle_pan_indian'];
    if (recipe.cuisineTags.some((tag) => userCuisines.includes(tag))) {
      score += 14;
      matchReasons.push('Matches your regional home taste');
    }
    if (recipe.spiceLevel === (foodPreferences.spiceTolerance ?? 'medium')) {
      score += 6;
    } else if (foodPreferences.spiceTolerance === 'mild' && recipe.spiceLevel === 'bold') {
      score -= 10;
    }

    // Prep time match
    if (recipe.prepMins <= constraints.maxPrepMins) {
      score += 18;
      if (recipe.prepMins <= 12) {
        matchReasons.push(`Ready in ${recipe.prepMins} min`);
      }
    } else {
      score -= (recipe.prepMins - constraints.maxPrepMins) * 2;
    }

    // Budget preference
    if (
      (constraints.budgetPriority || foodPreferences.budgetTier === 'budget') &&
      recipe.budgetTier === 'budget'
    ) {
      score += 16;
      matchReasons.push('Budget-friendly staples');
    }

    // Goal & condition scoring
    if (goals.primaryGoal === 'muscle_gain' || goals.primaryGoal === 'fat_loss') {
      if (recipe.macros.proteinG >= 18) {
        score += 18;
        matchReasons.push(`~${recipe.macros.proteinG}g est. protein supports your goal`);
      }
    }
    if (safety.diabetesOrSugarConcern) {
      if (recipe.glycemicLoad === 'low') {
        score += 22;
        safetyNotes.push('Low glycemic load pairing');
      } else if (safetyEval.softPenalizeMediumGlycemic && recipe.glycemicLoad === 'medium') {
        score -= 10;
      }
    }
    if (safety.hypertensionOrBpConcern) {
      if (recipe.sodiumLevel === 'low') {
        score += 18;
        safetyNotes.push(`Low sodium (~${recipe.macros.sodiumMg}mg est.)`);
      } else if (safetyEval.softPenalizeModerateSodium && recipe.sodiumLevel === 'moderate') {
        score -= 8;
        safetyNotes.push('Season lightly with lemon/jeera to keep sodium moderate');
      }
    }
    if (safetyEval.medicalReferralRequired) {
      safetyNotes.push('Gentle home meal idea — align clinical targets with your doctor');
    }

    // Variety / Anti-repeat scoring
    if (loggedTodayIds.has(recipe.id)) {
      score -= 40;
    } else {
      const recentCount = recentMealCounts.get(recipe.id) ?? 0;
      if (recentCount > 0) {
        score -= Math.min(24, recentCount * 10);
      } else if (mealsLoggedHistory.length > 0) {
        score += 8;
      }
    }
    if (constraints.antiRepeatIds.includes(recipe.id)) {
      score -= 90;
    }
    // Dynamic variety entropy so dishes alternate smoothly across turns
    score += Math.random() * 12;

    if (matchReasons.length === 0) {
      matchReasons.push(recipe.whyItFits);
    }

    candidates.push({
      recipe,
      score,
      matchReasons,
      safetyNotes,
      missingIngredients,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  const top = candidates.slice(0, limit);

  const safetyAdvisory = safetyEval.medicalReferralRequired
    ? 'Clinical boundary: Please verify portion sizes, electrolytes, and medical limits against advice from your doctor or dietitian.'
    : null;

  return {
    recommendations: top,
    excludedCount,
    blockedReasons: Array.from(blockedReasonsSet),
    safetyAdvisory,
    needsIngredientPrompt: top.length === 0,
  };
}
