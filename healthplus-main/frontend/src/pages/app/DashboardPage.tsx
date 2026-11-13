import React from 'react';
import {
  ArrowRight,
  Utensils,
  Activity,
  TrendingUp,
  Droplets,
  Bot,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useApp } from '@/context/AppContext';

export interface DashboardPageProps {
  onNavigate?: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate = () => {} }) => {
  const [hour] = React.useState(() => new Date().getHours());
  const {
    state,
    mealsToday,
    workoutsToday,
    caloriesConsumedToday,
    proteinConsumedToday,
    streakDays,
    activeSafetyBanners,
    activeMealSlot,
    recommendationBundle,
    adjustHydration,
  } = useApp();

  const profile = state.profile;
  const targets = state.targets;

  if (!profile || !targets) return null;

  const timeGreeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const topMeal = recommendationBundle?.recommendations[0];
  const repsToday = workoutsToday.reduce((sum, w) => sum + w.repsCompleted, 0);

  // 1 Short AI Companion Summary grounded in real state
  const aiSummaryLine =
    mealsToday.length === 0 && workoutsToday.length === 0
      ? `Welcome to a fresh day, ${profile.basic.name}. Your kitchen and safety rules are set — start gently with your ${activeMealSlot} choice or a 5-minute movement check-in.`
      : `You've logged ${mealsToday.length} meal(s) (~${caloriesConsumedToday} kcal, ${proteinConsumedToday}g protein) and ${repsToday} guided reps today — steady rhythm toward your ${profile.goals.primaryGoal.replace('_', ' ')} focus.`;

  // Determine the 1 clearest Next Important Action
  const nextAction =
    mealsToday.length === 0
      ? {
          badge: `Next Meal · ${activeMealSlot}`,
          title: topMeal
            ? `Consider: ${topMeal.recipe.name}`
            : 'Update what’s in your kitchen today',
          desc: topMeal
            ? `${topMeal.recipe.prepMins} min · ~${topMeal.recipe.macros.calories} kcal, ${topMeal.recipe.macros.proteinG}g protein (${topMeal.matchReasons[0]}).`
            : 'Tell Food Hub what ingredients you have at home for an exact match.',
          cta: topMeal ? 'View Recipe & Options' : 'Open Kitchen',
          route: '/food',
        }
      : workoutsToday.length === 0
        ? {
            badge: 'Light Movement Check-in',
            title: 'Take 5 minutes in Move Studio',
            desc: `A quick set of guided squats or glute bridges moves you toward your ${targets.dailyMovementMinutes}-min daily pace.`,
            cta: 'Open Move Studio',
            route: '/move',
          }
        : {
            badge: 'Evening Reflection',
            title: 'Chat with your AI Companion',
            desc: 'Adjust dinner around your pantry, ask a nutrition question, or review today in Hinglish/English/Hindi.',
            cta: 'Talk to AI Coach',
            route: '/coach',
          };

  const progressInsight =
    state.mealsLogged.length === 0 && state.workoutsLogged.length === 0
      ? 'No history recorded yet — log just 1 meal or movement set today to start building your personal baseline.'
      : streakDays > 1
        ? `${streakDays}-day consistency streak active with ${state.mealsLogged.length} logged meals and ${state.workoutsLogged.length} workouts.`
        : `You have ${state.mealsLogged.length} meal(s) and ${state.workoutsLogged.length} session(s) recorded cleanly on this device.`;

  return (
    <div className="space-y-6 pb-28 sm:pb-20 text-left animate-fadeIn max-w-4xl mx-auto">
      {/* Calm Greeting + 1 Short AI Summary */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald dark:text-emerald-400">
              Today&apos;s Companion View
            </p>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-forest dark:text-white mt-0.5">
              {timeGreeting}, {profile.basic.name}
            </h1>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('/coach')}
            leftIcon={<Bot className="w-4 h-4 text-emerald" />}
          >
            Ask AI Coach
          </Button>
        </div>

        <div className="p-4 rounded-2xl bg-sage/35 dark:bg-emerald-950/45 border border-emerald/20 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-emerald dark:text-gold shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-forest dark:text-ivory leading-relaxed">
            {aiSummaryLine}
          </p>
        </div>

        {activeSafetyBanners.some((b) => b.level === 'medical_referral') && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-forest dark:text-ivory">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-gold shrink-0" />
            <span>
              Clinical safety boundary active — Health Plus prioritizes gentle guidance only.
            </span>
          </div>
        )}
      </div>

      {/* ONLY THE 4 FOCUSED ITEMS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Next Important Action */}
        <Card variant="elevated" className="p-5 sm:p-6 border-emerald/25 bg-white dark:bg-[#0B221A]">
          <div className="flex flex-col justify-between h-full gap-4">
            <div className="space-y-2">
              <Badge variant="emerald" size="sm">
                1. {nextAction.badge}
              </Badge>
              <h2 className="font-heading font-bold text-lg text-forest dark:text-white leading-snug">
                {nextAction.title}
              </h2>
              <p className="text-xs text-forest/75 dark:text-ivory/75 leading-relaxed">
                {nextAction.desc}
              </p>
            </div>
            <div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate(nextAction.route)}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                {nextAction.cta}
              </Button>
            </div>
          </div>
        </Card>

        {/* 2. Food Summary */}
        <Card variant="elevated" className="p-5 sm:p-6">
          <div className="flex flex-col justify-between h-full gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-forest dark:text-white">
                  <Utensils className="w-4 h-4 text-emerald" />
                  <span>2. Food Summary</span>
                </div>
                <span className="text-[11px] font-semibold text-forest/65 dark:text-ivory/65">
                  {mealsToday.length} logged
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-forest/80 dark:text-ivory/80">
                    {caloriesConsumedToday.toLocaleString()} / {targets.calorieTarget.toLocaleString()} kcal
                  </span>
                  <span className="font-bold text-emerald dark:text-emerald-400">
                    {proteinConsumedToday}g / {targets.proteinTargetG}g Protein
                  </span>
                </div>
                <ProgressBar
                  progress={Math.min(
                    100,
                    Math.round((caloriesConsumedToday / targets.calorieTarget) * 100)
                  )}
                  variant="emerald"
                  size="sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => onNavigate('/food')}
                className="text-xs font-bold text-emerald dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                Open Food &amp; Kitchen <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </Card>

        {/* 3. Movement & Hydration Summary */}
        <Card variant="elevated" className="p-5 sm:p-6">
          <div className="flex flex-col justify-between h-full gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-forest dark:text-white">
                  <Activity className="w-4 h-4 text-emerald" />
                  <span>3. Movement Summary</span>
                </div>
                <span className="text-[11px] font-semibold text-forest/65 dark:text-ivory/65">
                  {workoutsToday.length} session(s)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2.5">
                <div>
                  <span className="text-2xl font-heading font-extrabold text-forest dark:text-white">
                    {repsToday}
                  </span>
                  <span className="text-xs text-forest/65 dark:text-ivory/65 ml-1.5">
                    reps guided today
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => adjustHydration(0.25)}
                  className="self-start sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-500/12 text-sky-700 dark:text-sky-300 text-[11px] font-bold hover:bg-sky-500/20"
                >
                  <Droplets className="w-3 h-3" />
                  {state.hydrationLiters.toFixed(2)}L / {targets.hydrationTargetLiters}L (+250ml)
                </button>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => onNavigate('/move')}
                className="text-xs font-bold text-emerald dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                Go to Move Studio <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </Card>

        {/* 4. Small Progress Insight */}
        <Card variant="elevated" className="p-5 sm:p-6">
          <div className="flex flex-col justify-between h-full gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-forest dark:text-white">
                  <TrendingUp className="w-4 h-4 text-amber-600 dark:text-gold" />
                  <span>4. Progress Insight</span>
                </div>
                <Badge variant="gold" size="sm">
                  {streakDays}d streak
                </Badge>
              </div>
              <p className="text-xs text-forest/80 dark:text-ivory/80 leading-relaxed pt-1">
                {progressInsight}
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={() => onNavigate('/progress')}
                className="text-xs font-bold text-emerald dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                Read Full Health Story <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
