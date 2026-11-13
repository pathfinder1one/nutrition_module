import type {
  ActiveSafetyBanner,
  ComputedTargets,
  UserProfile,
} from '@/types/wellness';
import { CLINICAL_CALORIE_FLOORS, evaluateProfileSafety } from './safetyConfig';

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
} as const;

export function computePersonalizedTargets(profile: UserProfile): ComputedTargets {
  const { basic, goals, lifestyle, safety } = profile;
  const safetyEval = evaluateProfileSafety(profile);

  const safeAge = Math.max(15, Math.min(95, basic.age || 28));
  const safeHeight = Math.max(120, Math.min(220, basic.heightCm || 168));
  const safeWeight = Math.max(35, Math.min(200, basic.weightKg || 68));

  // Mifflin-St Jeor (1990) resting energy calculation
  const genderOffset =
    basic.gender === 'male' ? 5 : basic.gender === 'female' ? -161 : -78;

  const bmr = Math.round(10 * safeWeight + 6.25 * safeHeight - 5 * safeAge + genderOffset);
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[lifestyle.activityLevel]);

  const avoidDeficitForSafety =
    safetyEval.blockCalorieDeficit || safety.kidneyOrRenalConcern;

  let rawTarget = tdee;
  if (!avoidDeficitForSafety) {
    if (goals.primaryGoal === 'fat_loss') rawTarget = tdee - 360;
    else if (goals.primaryGoal === 'muscle_gain') rawTarget = tdee + 260;
  }

  const clinicalFloor =
    basic.gender === 'male'
      ? CLINICAL_CALORIE_FLOORS.maleMinKcal
      : basic.gender === 'female'
        ? CLINICAL_CALORIE_FLOORS.femaleMinKcal
        : CLINICAL_CALORIE_FLOORS.neutralMinKcal;

  const calorieFloorApplied = rawTarget < clinicalFloor || avoidDeficitForSafety;
  const calorieTarget = Math.max(clinicalFloor, Math.round(rawTarget));

  // Conservative protein calibration aligned with safety rules
  const refWeight = Math.min(safeWeight, Math.max(45, basic.targetWeightKg || safeWeight));
  const rawProteinPerKg =
    goals.primaryGoal === 'muscle_gain' || goals.primaryGoal === 'fat_loss' ? 1.35 : 1.1;
  const boundedProteinPerKg =
    safetyEval.proteinMaxGPerKg !== null
      ? Math.min(rawProteinPerKg, safetyEval.proteinMaxGPerKg)
      : rawProteinPerKg;

  const proteinTargetG = Math.round(
    Math.max(42, Math.min(165, refWeight * boundedProteinPerKg))
  );
  const fatTargetG = Math.round((calorieTarget * 0.27) / 9);
  const remainingKcal = Math.max(300, calorieTarget - proteinTargetG * 4 - fatTargetG * 9);
  const carbsTargetG = Math.round(remainingKcal / 4);
  const fiberTargetG = safety.diabetesOrSugarConcern ? 32 : 28;
  const sodiumLimitMg = safetyEval.sodiumLimitMg;
  const hydrationTargetLiters = Math.max(2.2, Number((safeWeight * 0.035).toFixed(1)));
  const dailyMovementMinutes = Math.min(
    60,
    Math.max(20, Math.round((goals.weeklyWorkoutDays * 35) / 7) + 15)
  );

  return {
    bmr,
    tdee,
    calorieTarget,
    calorieFloorApplied,
    proteinTargetG,
    carbsTargetG,
    fatTargetG,
    fiberTargetG,
    sodiumLimitMg,
    hydrationTargetLiters,
    dailyMovementMinutes,
  };
}

export function getActiveSafetyBanners(profile: UserProfile): ActiveSafetyBanner[] {
  return evaluateProfileSafety(profile).banners;
}
