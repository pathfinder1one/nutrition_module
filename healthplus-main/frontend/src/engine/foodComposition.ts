import type { IngredientKey, MacroBreakdown, RecipeIngredientPortion } from '@/types/wellness';

/**
 * Ingredient-level per-100g reference nutrition prototype subset.
 * Values represent standard edible kitchen weights matching standard published nutrition references
 * (prototype subset pending formal licensed full IFCT 2017 / USDA FoodData Central table ingestion).
 */
export interface IngredientNutritionPer100g {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sodiumMg: number;
  referenceBasis: string;
}

export const INGREDIENT_COMPOSITION_PER_100G: Record<IngredientKey, IngredientNutritionPer100g> = {
  dal: {
    kcal: 343,
    proteinG: 22.3,
    carbsG: 57.6,
    fatG: 1.5,
    fiberG: 11.2,
    sodiumMg: 15,
    referenceBasis: 'Dry split toor/masoor lentil baseline per 100g dry weight',
  },
  moong_dal: {
    kcal: 347,
    proteinG: 23.9,
    carbsG: 62.6,
    fatG: 1.2,
    fiberG: 16.3,
    sodiumMg: 15,
    referenceBasis: 'Dry split yellow moong lentil baseline per 100g dry weight',
  },
  paneer: {
    kcal: 265,
    proteinG: 18.3,
    carbsG: 3.4,
    fatG: 20.8,
    fiberG: 0,
    sodiumMg: 22,
    referenceBasis: 'Fresh homemade cow/buffalo cottage cheese per 100g',
  },
  curd: {
    kcal: 60,
    proteinG: 3.5,
    carbsG: 4.7,
    fatG: 3.2,
    fiberG: 0,
    sodiumMg: 46,
    referenceBasis: 'Plain homemade whole-milk curd (dahi) per 100g',
  },
  milk: {
    kcal: 67,
    proteinG: 3.3,
    carbsG: 4.8,
    fatG: 3.9,
    fiberG: 0,
    sodiumMg: 44,
    referenceBasis: 'Standard pasteurized whole cow milk per 100ml/g',
  },
  eggs: {
    kcal: 143,
    proteinG: 12.6,
    carbsG: 0.7,
    fatG: 9.5,
    fiberG: 0,
    sodiumMg: 142,
    referenceBasis: 'Whole boiled/raw hen egg edible portion per 100g (~2 eggs)',
  },
  chicken: {
    kcal: 165,
    proteinG: 31.0,
    carbsG: 0,
    fatG: 3.6,
    fiberG: 0,
    sodiumMg: 74,
    referenceBasis: 'Skinless boneless chicken breast/lean cut per 100g',
  },
  soya_chunks: {
    kcal: 345,
    proteinG: 52.0,
    carbsG: 33.0,
    fatG: 0.5,
    fiberG: 13.0,
    sodiumMg: 12,
    referenceBasis: 'Textured defatted dry soy chunks per 100g dry weight',
  },
  tofu: {
    kcal: 94,
    proteinG: 10.2,
    carbsG: 2.3,
    fatG: 5.3,
    fiberG: 0.8,
    sodiumMg: 12,
    referenceBasis: 'Firm pressed soy curd (tofu) per 100g',
  },
  chana: {
    kcal: 164,
    proteinG: 8.9,
    carbsG: 27.4,
    fatG: 2.6,
    fiberG: 7.6,
    sodiumMg: 24,
    referenceBasis: 'Boiled / soaked kala or kabuli chana drained per 100g',
  },
  rajma: {
    kcal: 127,
    proteinG: 8.7,
    carbsG: 22.8,
    fatG: 0.5,
    fiberG: 6.4,
    sodiumMg: 12,
    referenceBasis: 'Cooked drained red kidney beans (rajma) per 100g',
  },
  roti_atta: {
    kcal: 340,
    proteinG: 12.1,
    carbsG: 71.2,
    fatG: 1.7,
    fiberG: 11.5,
    sodiumMg: 4,
    referenceBasis: 'Whole wheat chakki atta dry flour weight per 100g',
  },
  rice: {
    kcal: 356,
    proteinG: 7.1,
    carbsG: 78.2,
    fatG: 0.7,
    fiberG: 1.4,
    sodiumMg: 5,
    referenceBasis: 'Raw parboiled/basmati rice weight per 100g dry weight',
  },
  oats: {
    kcal: 379,
    proteinG: 13.2,
    carbsG: 67.7,
    fatG: 6.5,
    fiberG: 10.1,
    sodiumMg: 6,
    referenceBasis: 'Dry rolled oats per 100g',
  },
  poha: {
    kcal: 350,
    proteinG: 6.6,
    carbsG: 77.3,
    fatG: 1.2,
    fiberG: 2.2,
    sodiumMg: 10,
    referenceBasis: 'Dry medium flattened rice (poha) per 100g',
  },
  suji: {
    kcal: 360,
    proteinG: 12.7,
    carbsG: 72.8,
    fatG: 1.1,
    fiberG: 3.9,
    sodiumMg: 4,
    referenceBasis: 'Dry roasted durum/wheat semolina (suji) per 100g',
  },
  besan: {
    kcal: 387,
    proteinG: 22.4,
    carbsG: 57.8,
    fatG: 6.7,
    fiberG: 10.8,
    sodiumMg: 64,
    referenceBasis: 'Dry Bengal gram flour (besan) per 100g',
  },
  ragi: {
    kcal: 328,
    proteinG: 7.3,
    carbsG: 72.0,
    fatG: 1.3,
    fiberG: 11.5,
    sodiumMg: 11,
    referenceBasis: 'Finger millet flour (ragi) per 100g dry weight',
  },
  mixed_veg: {
    kcal: 38,
    proteinG: 2.0,
    carbsG: 7.4,
    fatG: 0.3,
    fiberG: 2.8,
    sodiumMg: 24,
    referenceBasis: 'Seasonal mixed Indian vegetables (carrots, peas, beans, gourd) per 100g',
  },
  spinach: {
    kcal: 23,
    proteinG: 2.9,
    carbsG: 3.6,
    fatG: 0.4,
    fiberG: 2.2,
    sodiumMg: 79,
    referenceBasis: 'Fresh washed palak (spinach) leaves per 100g',
  },
  tomato_onion: {
    kcal: 28,
    proteinG: 1.0,
    carbsG: 6.2,
    fatG: 0.2,
    fiberG: 1.5,
    sodiumMg: 5,
    referenceBasis: 'Fresh tomato, onion, ginger-garlic aromats blend per 100g',
  },
  banana: {
    kcal: 89,
    proteinG: 1.1,
    carbsG: 22.8,
    fatG: 0.3,
    fiberG: 2.6,
    sodiumMg: 1,
    referenceBasis: 'Ripe banana edible pulp per 100g',
  },
  peanuts: {
    kcal: 567,
    proteinG: 25.8,
    carbsG: 16.1,
    fatG: 49.2,
    fiberG: 8.5,
    sodiumMg: 18,
    referenceBasis: 'Dry roasted peanuts per 100g',
  },
  ghee_oil: {
    kcal: 895,
    proteinG: 0,
    carbsG: 0,
    fatG: 99.5,
    fiberG: 0,
    sodiumMg: 0,
    referenceBasis: 'Cooking oil / ghee pure fat per 100g',
  },
};

/**
 * Computes exact recipe nutrition programmatically from declared gram weights,
 * adding home-cooking pinch-of-salt sodium explicitly instead of arbitrary numbers.
 */
export function computeRecipeMacrosFromIngredients(
  portions: RecipeIngredientPortion[],
  seasoningSaltMg = 180
): MacroBreakdown {
  let calories = 0;
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;
  let fiberG = 0;
  let sodiumMg = seasoningSaltMg;

  for (const portion of portions) {
    const ref = INGREDIENT_COMPOSITION_PER_100G[portion.key];
    if (!ref) continue;
    const scale = portion.gramsApprox / 100;
    calories += ref.kcal * scale;
    proteinG += ref.proteinG * scale;
    carbsG += ref.carbsG * scale;
    fatG += ref.fatG * scale;
    fiberG += ref.fiberG * scale;
    sodiumMg += ref.sodiumMg * scale;
  }

  return {
    calories: Math.round(calories),
    proteinG: Number(proteinG.toFixed(1)),
    carbsG: Number(carbsG.toFixed(1)),
    fatG: Number(fatG.toFixed(1)),
    fiberG: Number(fiberG.toFixed(1)),
    sodiumMg: Math.round(sodiumMg),
  };
}
