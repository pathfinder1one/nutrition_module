import type { ActiveSafetyBanner, AllergenKey, HealthSafetyScreening, UserProfile } from '@/types/wellness';

/**
 * Transparent boundary and reference provenance disclosed everywhere targets,
 * food composition estimates, or guided exercise cues appear.
 */
export const PROVENANCE_REGISTRY = {
  energyModel: {
    name: 'Mifflin-St Jeor (1990) + Conservative Physical Activity Factors',
    status: 'implemented_deterministic' as const,
    note: 'Resting energy is calculated using Mifflin-St Jeor; clinical metabolic testing is out of scope for browser-side guidance.',
  },
  nutritionCatalog: {
    name: 'Ingredient-Computed Indian Kitchen Reference Subset',
    status: 'prototype_estimate' as const,
    note: 'Recipe macros and sodium are calculated programmatically from ingredient gram portions against reference composition tables (prototype subset; bulk IFCT 2017 / USDA table import pending backend integration).',
  },
  exerciseGuidance: {
    name: 'Guided Biomechanical Tempo Demo + Optional Private Camera Mirror',
    status: 'guided_demo_simulation' as const,
    note: '3D mannequin shows form cues and tempo cleanly. Browser webcam preview stays strictly on-device; automated joint landmark scoring connects externally via ExerciseStudioProps.',
  },
  clinicalScope: {
    name: 'Personal Wellness Companion (Non-Diagnostic)',
    status: 'non_medical_boundary' as const,
    note: 'HEALTH PLUS does not diagnose disease, prescribe therapeutic renal/diabetic diets, or replace your physician or registered dietitian.',
  },
} as const;

export const CLINICAL_CALORIE_FLOORS = {
  femaleMinKcal: 1200,
  maleMinKcal: 1500,
  neutralMinKcal: 1350,
} as const;

export interface ConditionSafetyRule {
  id: keyof Pick<
    HealthSafetyScreening,
    | 'celiacOrGlutenFree'
    | 'diabetesOrSugarConcern'
    | 'hypertensionOrBpConcern'
    | 'kidneyOrRenalConcern'
    | 'pregnancyOrPostpartum'
    | 'underMedicalSupervision'
    | 'eatingDisorderHistory'
  >;
  title: string;
  level: ActiveSafetyBanner['level'];
  referenceBasis: string;
  excludeGluten?: boolean;
  excludeHighGlycemic?: boolean;
  excludeHighSodium?: boolean;
  excludeKidneyStrain?: boolean;
  softPenalizeModerateSodium?: boolean;
  softPenalizeMediumGlycemic?: boolean;
  sodiumLimitOverrideMg?: number;
  proteinMaxGPerKg?: number;
  blockCalorieDeficit?: boolean;
  message: string;
  aiGuidanceCue: string;
}

/**
 * Configurable safety rules controlling calorie floors, recipe filtering,
 * sodium ceilings, protein bounds, and clinician-referral banners.
 */
export const CONDITION_SAFETY_RULES: ConditionSafetyRule[] = [
  {
    id: 'eatingDisorderHistory',
    title: 'Gentle Weight-Neutral Mode Active',
    level: 'medical_referral',
    referenceBasis: 'Weight-neutral nourishment protection (no aggressive deficit targets)',
    blockCalorieDeficit: true,
    message:
      'Calorie-deficit targets are locked off to prioritize gentle, consistent nourishment. Care team support is recommended alongside app tracking.',
    aiGuidanceCue: 'Focus on regular nourishing meals and calm habits; never push deficit or strict calorie restriction.',
  },
  {
    id: 'pregnancyOrPostpartum',
    title: 'Pregnancy / Postpartum Physician Oversight Required',
    level: 'medical_referral',
    referenceBasis: 'Obstetric nutrition energy & micronutrient safety margin',
    blockCalorieDeficit: true,
    message:
      'Aggressive deficits are disabled. Confirm calorie, iron, folate, calcium, and movement routines directly with your OB-GYN or registered dietitian.',
    aiGuidanceCue: 'Keep meals nourishing without calorie restriction and defer clinical dosing or vigorous exercise to their doctor.',
  },
  {
    id: 'kidneyOrRenalConcern',
    title: 'Renal Caution — Conservative Protein Bounds',
    level: 'medical_referral',
    referenceBasis: 'Conservative non-dialysis protein ceiling (~0.85 g/kg body weight)',
    excludeKidneyStrain: true,
    softPenalizeModerateSodium: true,
    excludeHighSodium: true,
    sodiumLimitOverrideMg: 1700,
    proteinMaxGPerKg: 0.85,
    message:
      'Protein targets are conservatively capped (~0.85 g/kg) and higher-potassium/sodium outliers require caution. Verify renal lab parameters with your nephrologist before high-protein meals.',
    aiGuidanceCue: 'Respect conservative protein limits and remind user gently to verify potassium/sodium limits with their nephrologist.',
  },
  {
    id: 'underMedicalSupervision',
    title: 'Physician Guidance Boundary Active',
    level: 'caution',
    referenceBasis: 'Adjunct daily routine support alongside prescribed treatment',
    message:
      'Recommendations support everyday home meals and light activity only; follow medication and clinical nutrition instructions from your treating clinician.',
    aiGuidanceCue: 'Acknowledge medical supervision and keep changes mild and non-prescriptive.',
  },
  {
    id: 'diabetesOrSugarConcern',
    title: 'Steady Glycemic Balance Priority',
    level: 'caution',
    referenceBasis: 'High-fiber, balanced dal/vegetable pairing & lower glycemic load filter',
    excludeHighGlycemic: true,
    softPenalizeMediumGlycemic: true,
    message:
      'High glycemic-load recipes are filtered out; meals emphasize lentil, whole-millet, vegetable, and protein pairing to support steadier glucose.',
    aiGuidanceCue: 'Prioritize low glycemic-load combinations and fiber pairing; never replace blood-glucose clinical advice.',
  },
  {
    id: 'hypertensionOrBpConcern',
    title: 'Sodium-Aware Filtering (~1,500 mg/day Ceiling)',
    level: 'caution',
    referenceBasis: 'DASH-aligned conservative lower daily sodium target',
    excludeHighSodium: true,
    softPenalizeModerateSodium: true,
    sodiumLimitOverrideMg: 1500,
    message:
      'High-sodium dishes are excluded and moderate-salt recipes carry seasoning cues to help stay within ~1,500 mg/day.',
    aiGuidanceCue: 'Suggest lemon, roasted jeera, ginger, or minimal table salt to keep sodium gentle.',
  },
  {
    id: 'celiacOrGlutenFree',
    title: 'Strict Gluten Exclusion',
    level: 'caution',
    referenceBasis: 'Exclusion of wheat, atta, suji/semolina, and gluten-containing flatbreads',
    excludeGluten: true,
    message:
      'All wheat roti, atta, and suji dishes are excluded cleanly. Recipes use rice, millets (ragi), besan, or pulses.',
    aiGuidanceCue: 'Strictly avoid atta, wheat roti, and suji; highlight rice, ragi, moong, and besan options.',
  },
];

export interface EvaluatedSafetyProfile {
  activeRules: ConditionSafetyRule[];
  banners: ActiveSafetyBanner[];
  excludeGluten: boolean;
  excludeHighGlycemic: boolean;
  excludeHighSodium: boolean;
  excludeKidneyStrain: boolean;
  softPenalizeModerateSodium: boolean;
  softPenalizeMediumGlycemic: boolean;
  blockCalorieDeficit: boolean;
  sodiumLimitMg: number;
  proteinMaxGPerKg: number | null;
  allergies: AllergenKey[];
  medicalReferralRequired: boolean;
  aiGuidanceCues: string[];
}

export function evaluateProfileSafety(profile: UserProfile): EvaluatedSafetyProfile {
  const { safety } = profile;
  const activeRules = CONDITION_SAFETY_RULES.filter((rule) => Boolean(safety[rule.id]));

  const banners: ActiveSafetyBanner[] = activeRules.map((rule) => ({
    level: rule.level,
    title: rule.title,
    message: `${rule.message} [${rule.referenceBasis}]`,
  }));

  if (safety.disclosureStatus === 'prefer_not_to_disclose') {
    banners.push({
      level: 'info',
      title: 'Medical History Unknown (General Wellness Mode)',
      message:
        'Because specific conditions were left undisclosed, Health Plus avoids specialized medical nutrition claims and keeps general calorie/protein rhythms conservative. Please follow your physician if you manage any diagnosed condition.',
    });
  }

  if (safety.allergies.length > 0) {
    banners.push({
      level: 'caution',
      title: 'Allergen Hard Exclusion Active',
      message: `Recipes and assistant suggestions strictly exclude: ${safety.allergies.join(', ').replace(/_/g, ' ')}. Cross-check packaged kitchen labels before cooking.`,
    });
  }

  let sodiumLimitMg = 2100;
  let proteinMaxGPerKg: number | null = null;
  for (const rule of activeRules) {
    if (rule.sodiumLimitOverrideMg !== undefined) {
      sodiumLimitMg = Math.min(sodiumLimitMg, rule.sodiumLimitOverrideMg);
    }
    if (rule.proteinMaxGPerKg !== undefined) {
      proteinMaxGPerKg =
        proteinMaxGPerKg === null
          ? rule.proteinMaxGPerKg
          : Math.min(proteinMaxGPerKg, rule.proteinMaxGPerKg);
    }
  }

  return {
    activeRules,
    banners,
    excludeGluten: activeRules.some((r) => r.excludeGluten) || safety.allergies.includes('gluten'),
    excludeHighGlycemic: activeRules.some((r) => r.excludeHighGlycemic),
    excludeHighSodium: activeRules.some((r) => r.excludeHighSodium),
    excludeKidneyStrain: activeRules.some((r) => r.excludeKidneyStrain),
    softPenalizeModerateSodium: activeRules.some((r) => r.softPenalizeModerateSodium),
    softPenalizeMediumGlycemic: activeRules.some((r) => r.softPenalizeMediumGlycemic),
    blockCalorieDeficit: activeRules.some((r) => r.blockCalorieDeficit),
    sodiumLimitMg,
    proteinMaxGPerKg,
    allergies: safety.allergies,
    medicalReferralRequired: activeRules.some((r) => r.level === 'medical_referral'),
    aiGuidanceCues: activeRules.map((r) => r.aiGuidanceCue),
  };
}
