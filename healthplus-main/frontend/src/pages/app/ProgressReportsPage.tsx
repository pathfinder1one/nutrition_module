import React from 'react';
import {
  Utensils,
  Activity,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useApp } from '@/context/AppContext';

export interface ProgressReportsPageProps {
  onNavigate?: (path: string) => void;
}

export const ProgressReportsPage: React.FC<ProgressReportsPageProps> = ({
  onNavigate = () => {},
}) => {
  const {
    state,
    mealsToday,
    workoutsToday,
    caloriesConsumedToday,
    proteinConsumedToday,
    streakDays,
  } = useApp();

  const profile = state.profile;
  const targets = state.targets;
  if (!profile || !targets) return null;

  const hasAnyLogs = state.mealsLogged.length > 0 || state.workoutsLogged.length > 0;
  const totalRepsAllTime = state.workoutsLogged.reduce((s, w) => s + w.repsCompleted, 0);

  return (
    <div className="space-y-6 pb-20 text-left animate-fadeIn max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Badge variant="gold" size="sm">
            Real Personal Baseline
          </Badge>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-forest dark:text-white mt-1">
            Progress &amp; Pattern Story
          </h1>
          <p className="text-xs text-forest/70 dark:text-ivory/70">
            Strictly computed from meals and sessions you log — zero synthetic averages.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('/profile')}
        >
          Manage Baseline &amp; Export
        </Button>
      </div>

      {/* Live Metrics Trio */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="surface" className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-forest/65 dark:text-ivory/65">
            <Calendar className="w-4 h-4 text-emerald" />
            Active Consistency
          </div>
          <p className="text-2xl font-heading font-extrabold text-forest dark:text-white mt-1">
            {streakDays} {streakDays === 1 ? 'Day' : 'Days'}
          </p>
        </Card>
        <Card variant="surface" className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-forest/65 dark:text-ivory/65">
            <Utensils className="w-4 h-4 text-emerald" />
            Meals Logged
          </div>
          <p className="text-2xl font-heading font-extrabold text-forest dark:text-white mt-1">
            {state.mealsLogged.length}
          </p>
        </Card>
        <Card variant="surface" className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-forest/65 dark:text-ivory/65">
            <Activity className="w-4 h-4 text-amber-600 dark:text-gold" />
            Guided Movement Reps
          </div>
          <p className="text-2xl font-heading font-extrabold text-forest dark:text-white mt-1">
            {totalRepsAllTime}
          </p>
        </Card>
      </div>

      {/* Narrative Story */}
      <Card variant="elevated" className="p-5 sm:p-6">
        <h2 className="font-heading font-bold text-base text-forest dark:text-white flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-gold" />
          <span>What HEALTH PLUS Observes So Far</span>
        </h2>
        <div className="space-y-4 text-xs sm:text-sm text-forest/80 dark:text-ivory/80 leading-relaxed">
          {!hasAnyLogs ? (
            <div className="space-y-4">
              <p>
                Your profile baseline ({targets.calorieTarget} kcal, {targets.proteinTargetG}g protein target) is ready, and you have <strong>0 fabricated records</strong>.
              </p>
              <p>
                Once you log your first home meal or complete one short guided movement session, this page reflects genuine nutrition patterns, protein steadiness, and weekly movement rhythm.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => onNavigate('/food')} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Pick &amp; Log First Meal
                </Button>
                <Button size="sm" variant="outline" onClick={() => onNavigate('/move')}>
                  Start 5-Min Move Session
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p>
                Today you&apos;ve recorded <strong>{mealsToday.length} meal(s)</strong> totaling{' '}
                <strong>{caloriesConsumedToday} kcal</strong> ({proteinConsumedToday}g protein against your {targets.proteinTargetG}g goal) and{' '}
                <strong>{workoutsToday.length} movement session(s)</strong>.
              </p>
              {(() => {
                const activeMealDays = Math.max(
                  1,
                  new Set(state.mealsLogged.map((m) => m.dateISO)).size
                );
                const totalLoggedKcal = state.mealsLogged.reduce(
                  (sum, m) => sum + m.calories,
                  0
                );
                const totalLoggedProtein = state.mealsLogged.reduce(
                  (sum, m) => sum + m.proteinG,
                  0
                );
                const totalLoggedReps = state.workoutsLogged.reduce(
                  (sum, w) => sum + w.repsCompleted,
                  0
                );
                return (
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <div className="p-2.5 rounded-xl bg-forest/5 dark:bg-white/5 border border-forest/10 dark:border-white/10">
                      <p className="text-[10px] uppercase tracking-wider text-forest/60 dark:text-ivory/60">
                        Avg Recorded kcal
                      </p>
                      <p className="text-sm font-extrabold text-forest dark:text-white">
                        {state.mealsLogged.length > 0
                          ? `${Math.round(totalLoggedKcal / activeMealDays)} / day`
                          : '0 / day'}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-forest/5 dark:bg-white/5 border border-forest/10 dark:border-white/10">
                      <p className="text-[10px] uppercase tracking-wider text-forest/60 dark:text-ivory/60">
                        Avg Recorded Protein
                      </p>
                      <p className="text-sm font-extrabold text-emerald dark:text-emerald-300">
                        {state.mealsLogged.length > 0
                          ? `${Math.round(totalLoggedProtein / activeMealDays)}g / day`
                          : '0g / day'}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-forest/5 dark:bg-white/5 border border-forest/10 dark:border-white/10">
                      <p className="text-[10px] uppercase tracking-wider text-forest/60 dark:text-ivory/60">
                        Total Recorded Reps
                      </p>
                      <p className="text-sm font-extrabold text-amber-600 dark:text-gold">
                        {totalLoggedReps} reps
                      </p>
                    </div>
                  </div>
                );
              })()}
              <div className="p-3 rounded-2xl bg-emerald/10 border border-emerald/20 flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
                <span>
                  Kitchen Constraints Active: {profile.foodAvailability.unavailableIngredients.length > 0
                    ? `Remembering you don't have ${profile.foodAvailability.unavailableIngredients.join(', ')} right now.`
                    : 'All logged preferences synced with Food Hub & AI Coach.'}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Recorded Timeline */}
      {hasAnyLogs && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card variant="elevated" className="p-5 sm:p-6">
            <h2 className="font-heading font-bold text-base text-forest dark:text-white mb-4">
              Recent Meals Recorded
            </h2>
            <div className="space-y-2.5">
              {state.mealsLogged.slice(0, 8).map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-2xl bg-forest/4 dark:bg-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-forest dark:text-white">{m.name}</p>
                    <p className="text-[11px] text-forest/65 dark:text-ivory/65 capitalize">
                      {m.dateISO} · {m.mealSlot} · {m.timeLabel}
                    </p>
                  </div>
                  <span className="font-extrabold text-emerald dark:text-emerald-400">
                    {m.calories} kcal
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="elevated" className="p-5 sm:p-6">
            <h2 className="font-heading font-bold text-base text-forest dark:text-white mb-4">
              Recent Movement Sessions
            </h2>
            <div className="space-y-2.5">
              {state.workoutsLogged.length === 0 ? (
                <p className="text-xs text-forest/65 dark:text-ivory/65">
                  No movement sessions logged yet.
                </p>
              ) : (
                state.workoutsLogged.slice(0, 8).map((w) => (
                  <div
                    key={w.id}
                    className="p-3 rounded-2xl bg-forest/4 dark:bg-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-forest dark:text-white">{w.exerciseLabel}</p>
                      <p className="text-[11px] text-forest/65 dark:text-ivory/65">
                        {w.dateISO} · {w.timeLabel} · {w.durationSeconds}s
                      </p>
                    </div>
                    <span className="font-extrabold text-amber-600 dark:text-gold">
                      {w.repsCompleted} reps
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
