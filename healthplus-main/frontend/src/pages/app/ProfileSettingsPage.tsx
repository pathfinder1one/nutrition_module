import React, { useState } from 'react';
import {
  User,
  Shield,
  Save,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import {
  ALLERGEN_LABELS,
  INDIAN_CUISINE_OPTIONS,
  SPICE_TOLERANCE_OPTIONS,
} from '@/engine/nutritionCatalog';
import type {
  AllergenKey,
  DietaryPattern,
  ExerciseEnvironmentPreference,
  ExerciseExperienceLevel,
  IndianCuisineRegion,
  PrimaryGoal,
  SpiceTolerance,
} from '@/types/wellness';

export interface ProfileSettingsPageProps {
  onNavigate?: (path: string) => void;
  initialTab?: 'profile' | 'settings';
}

export const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({
  onNavigate = () => {},
  initialTab = 'profile',
}) => {
  const { theme, setTheme } = useTheme();
  const { state, activeSafetyBanners, updateProfile, resetAllData, resetFoodFeedbackFilters } =
    useApp();

  const profile = state.profile;
  const targets = state.targets;

  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>(initialTab);
  const [savedNotice, setSavedNotice] = useState(false);

  const [name, setName] = useState(profile?.basic.name ?? '');
  const [age, setAge] = useState(String(profile?.basic.age ?? 28));
  const [heightCm, setHeightCm] = useState(String(profile?.basic.heightCm ?? 170));
  const [weightKg, setWeightKg] = useState(String(profile?.basic.weightKg ?? 68));
  const [goal, setGoal] = useState<PrimaryGoal>(profile?.goals.primaryGoal ?? 'steady_energy');
  const [diet, setDiet] = useState<DietaryPattern>(
    profile?.foodPreferences.dietaryPattern ?? 'vegetarian'
  );
  const [prepLimit, setPrepLimit] = useState(
    String(profile?.foodPreferences.cookingTimeLimitMins ?? 25)
  );
  const [cuisinePrefs, setCuisinePrefs] = useState<IndianCuisineRegion[]>(
    profile?.foodPreferences.cuisinePreferences ?? ['homestyle_pan_indian']
  );
  const [spiceTolerance, setSpiceTolerance] = useState<SpiceTolerance>(
    profile?.foodPreferences.spiceTolerance ?? 'medium'
  );
  const [expLevel, setExpLevel] = useState<ExerciseExperienceLevel>(
    profile?.exercisePreferences?.experienceLevel ?? 'beginner'
  );
  const [moveEnv, setMoveEnv] = useState<ExerciseEnvironmentPreference>(
    profile?.exercisePreferences?.preferredEnvironment ?? 'home_bodyweight'
  );
  const [allergies, setAllergies] = useState<AllergenKey[]>(profile?.safety.allergies ?? []);
  const [celiac, setCeliac] = useState(Boolean(profile?.safety.celiacOrGlutenFree));
  const [diabetes, setDiabetes] = useState(Boolean(profile?.safety.diabetesOrSugarConcern));
  const [hypertension, setHypertension] = useState(
    Boolean(profile?.safety.hypertensionOrBpConcern)
  );

  if (!profile || !targets) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card variant="elevated" className="p-6 text-center space-y-4">
          <p className="text-sm text-forest dark:text-white font-semibold">
            No personal wellness profile has been configured yet.
          </p>
          <Button onClick={() => onNavigate('/onboarding')}>Complete Onboarding Interview</Button>
        </Card>
      </div>
    );
  }

  const toggleAllergen = (a: AllergenKey) => {
    setAllergies((prev) => (prev.includes(a) ? prev.filter((item) => item !== a) : [...prev, a]));
  };

  const toggleCuisine = (c: IndianCuisineRegion) => {
    setCuisinePrefs((prev) =>
      prev.includes(c) ? (prev.length > 1 ? prev.filter((i) => i !== c) : prev) : [...prev, c]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile((prev) => ({
      ...prev,
      basic: {
        ...prev.basic,
        name: name.trim() || prev.basic.name,
        age: Math.max(15, Number(age) || prev.basic.age),
        heightCm: Math.max(120, Number(heightCm) || prev.basic.heightCm),
        weightKg: Math.max(35, Number(weightKg) || prev.basic.weightKg),
      },
      goals: {
        ...prev.goals,
        primaryGoal: goal,
      },
      foodPreferences: {
        ...prev.foodPreferences,
        dietaryPattern: diet,
        cuisinePreferences: cuisinePrefs,
        spiceTolerance,
        cookingTimeLimitMins: Math.max(10, Number(prepLimit) || 25),
      },
      exercisePreferences: {
        ...(prev.exercisePreferences ?? {
          availableEquipment: ['none'],
          preferredSessionMins: 20,
        }),
        experienceLevel: expLevel,
        preferredEnvironment: moveEnv,
      },
      safety: {
        ...prev.safety,
        allergies,
        celiacOrGlutenFree: celiac,
        diabetesOrSugarConcern: diabetes,
        hypertensionOrBpConcern: hypertension,
      },
    }));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      platform: 'HEALTH PLUS by CASA Vital (Local Sovereign Export)',
      profile,
      computedTargets: targets,
      mealsLogged: state.mealsLogged,
      workoutsLogged: state.workoutsLogged,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-plus-${profile.basic.name.toLowerCase().replace(/\s+/g, '-')}-data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestartOnboarding = () => {
    resetAllData();
    onNavigate('/onboarding');
  };

  return (
    <div className="space-y-6 pb-20 text-left animate-fadeIn max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={profile.basic.name} size="lg" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading font-extrabold text-2xl text-forest dark:text-white">
                {profile.basic.name}
              </h1>
              <Badge variant="emerald" size="sm">
                {profile.goals.primaryGoal.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-xs text-forest/70 dark:text-ivory/70 mt-0.5">
              Calculated Rhythm: ~{targets.calorieTarget} kcal · {targets.proteinTargetG}g protein ·{' '}
              {targets.sodiumLimitMg}mg sodium ceiling
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'profile' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('profile')}
            leftIcon={<User className="w-3.5 h-3.5" />}
          >
            Profile &amp; Safety
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('settings')}
            leftIcon={<Shield className="w-3.5 h-3.5" />}
          >
            Theme &amp; Data
          </Button>
        </div>
      </div>

      {activeSafetyBanners.length > 0 && (
        <div className="space-y-2">
          {activeSafetyBanners.map((b, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3 text-xs text-forest dark:text-ivory"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-gold shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">{b.title}: </span>
                <span>{b.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {savedNotice && (
        <div className="p-3 rounded-xl bg-emerald/15 border border-emerald/30 text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald" />
          Profile saved and daily targets recalculated across Today, Food, Move, and AI Coach.
        </div>
      )}

      {activeTab === 'profile' ? (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="elevated" className="p-5 sm:p-6">
            <h2 className="font-heading font-bold text-base text-forest dark:text-white mb-4">
              Personal Baseline &amp; Goal
            </h2>
            <div className="space-y-4">
              <Input
                label="Display Name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                required
              />
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Age"
                  type="number"
                  value={age}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAge(e.target.value)}
                />
                <Input
                  label="Height (cm)"
                  type="number"
                  value={heightCm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHeightCm(e.target.value)}
                />
                <Input
                  label="Weight (kg)"
                  type="number"
                  value={weightKg}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeightKg(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest dark:text-ivory mb-1.5">
                  Primary Wellness Goal
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as PrimaryGoal)}
                  className="w-full rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-[#0A1E17] px-3 py-2 text-xs text-forest dark:text-white"
                >
                  <option value="fat_loss">Sustainable Fat Loss</option>
                  <option value="muscle_gain">Strength &amp; Lean Muscle</option>
                  <option value="steady_energy">Steady Daily Energy</option>
                  <option value="metabolic_health">Metabolic &amp; Sugar Balance</option>
                  <option value="consistency">Build Daily Routine Consistency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-forest dark:text-ivory mb-1.5">
                  Dietary Pattern
                </label>
                <select
                  value={diet}
                  onChange={(e) => setDiet(e.target.value as DietaryPattern)}
                  className="w-full rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-[#0A1E17] px-3 py-2 text-xs text-forest dark:text-white"
                >
                  <option value="vegetarian">Vegetarian</option>
                  <option value="eggetarian">Eggetarian</option>
                  <option value="non_vegetarian">Non-Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="jain">Jain</option>
                </select>
              </div>

              <Input
                label="Preferred Max Cooking Time (mins)"
                type="number"
                value={prepLimit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrepLimit(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-forest dark:text-ivory mb-1.5">
                  Regional Home Styles
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {INDIAN_CUISINE_OPTIONS.map((c) => {
                    const active = cuisinePrefs.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCuisine(c.id)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-colors ${
                          active
                            ? 'bg-emerald text-white border-emerald'
                            : 'bg-forest/5 dark:bg-white/5 text-forest dark:text-ivory/80 border-forest/10 dark:border-white/10'
                        }`}
                      >
                        {c.label.split(' (')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-forest dark:text-ivory mb-1">
                    Spice Level
                  </label>
                  <select
                    value={spiceTolerance}
                    onChange={(e) => setSpiceTolerance(e.target.value as SpiceTolerance)}
                    className="w-full rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-[#0A1E17] px-2.5 py-2 text-xs text-forest dark:text-white"
                  >
                    {SPICE_TOLERANCE_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-forest dark:text-ivory mb-1">
                    Move Level
                  </label>
                  <select
                    value={expLevel}
                    onChange={(e) => setExpLevel(e.target.value as ExerciseExperienceLevel)}
                    className="w-full rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-[#0A1E17] px-2.5 py-2 text-xs text-forest dark:text-white"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Consistent</option>
                    <option value="accustomed">Accustomed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-forest dark:text-ivory mb-1">
                    Workout Mode
                  </label>
                  <select
                    value={moveEnv}
                    onChange={(e) => setMoveEnv(e.target.value as ExerciseEnvironmentPreference)}
                    className="w-full rounded-xl border border-forest/15 dark:border-white/15 bg-white dark:bg-[#0A1E17] px-2.5 py-2 text-xs text-forest dark:text-white"
                  >
                    <option value="home_bodyweight">Home Bodyweight</option>
                    <option value="home_light_equipment">Home Equipment</option>
                    <option value="gym">Gym</option>
                    <option value="outdoor_walk">Outdoor Walk</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          <Card variant="elevated" className="p-5 sm:p-6">
            <h2 className="font-heading font-bold text-base text-forest dark:text-white mb-4">
              Allergies &amp; Safety Guardrails
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-forest dark:text-ivory mb-2">
                  Hard Ingredient Exclusions (Allergies)
                </p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(ALLERGEN_LABELS) as AllergenKey[]).map((key) => {
                    const active = allergies.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleAllergen(key)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors ${
                          active
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-forest/5 dark:bg-white/5 text-forest dark:text-ivory/80 border-forest/10 dark:border-white/10'
                        }`}
                      >
                        {ALLERGEN_LABELS[key]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-forest/10 dark:border-white/10">
                <label className="flex items-center gap-2.5 text-xs text-forest dark:text-ivory cursor-pointer">
                  <input
                    type="checkbox"
                    checked={celiac}
                    onChange={(e) => setCeliac(e.target.checked)}
                    className="rounded text-emerald"
                  />
                  <span>Strict Gluten-Free / Celiac Guard</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-forest dark:text-ivory cursor-pointer">
                  <input
                    type="checkbox"
                    checked={diabetes}
                    onChange={(e) => setDiabetes(e.target.checked)}
                    className="rounded text-emerald"
                  />
                  <span>Blood Sugar / Diabetes Context (Prioritize Low-GI)</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-forest dark:text-ivory cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hypertension}
                    onChange={(e) => setHypertension(e.target.checked)}
                    className="rounded text-emerald"
                  />
                  <span>Blood Pressure Concern (1,500 mg Sodium Guard)</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button type="submit" leftIcon={<Save className="w-4 h-4" />}>
                  Save &amp; Recalculate
                </Button>
              </div>
            </div>
          </Card>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="elevated" className="p-5 sm:p-6">
            <h2 className="font-heading font-bold text-base text-forest dark:text-white mb-4">
              Appearance &amp; Filters
            </h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Button
                  variant={theme === 'light' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                >
                  Warm Botanical Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                >
                  Forest Obsidian Dark
                </Button>
              </div>
              <div className="pt-3 border-t border-forest/10 dark:border-white/10 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-forest dark:text-white">
                    Reset Meal Rejection &amp; Availability Filters
                  </p>
                  <p className="text-[11px] text-forest/65 dark:text-ivory/65">
                    Clears temporary &ldquo;don&apos;t have&rdquo; or &ldquo;faster/cheaper&rdquo; session locks.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFoodFeedbackFilters}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </Card>

          <Card variant="elevated" className="p-5 sm:p-6">
            <h2 className="font-heading font-bold text-base text-forest dark:text-white mb-4">
              Local Data Sovereignty
            </h2>
            <div className="space-y-4">
              <p className="text-xs text-forest/75 dark:text-ivory/75 leading-relaxed">
                Your profile, ingredient memory, meals, and workouts live locally in your browser.
                Export everything or restart fresh anytime.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportJson}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Export My JSON ({state.mealsLogged.length} meals, {state.workoutsLogged.length} sessions)
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleRestartOnboarding}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Reset All &amp; Re-run Onboarding
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
