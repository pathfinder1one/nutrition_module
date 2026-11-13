import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  Flame,
  Utensils,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  fetchMealHistory,
  type MealHistoryResponse,
  type StoredMealRecord,
  type ConfirmedMealItem,
} from '@/services/nutritionBackendService';

export interface MealHistoryViewProps {
  userId?: string;
  refreshTrigger?: number;
}

export const MealHistoryView: React.FC<MealHistoryViewProps> = ({
  userId = 'default_user',
  refreshTrigger = 0,
}) => {
  const [historyData, setHistoryData] = useState<MealHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysFilter, setDaysFilter] = useState<number>(7);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMealHistory({
        userId,
        days: daysFilter,
        page,
        perPage: pageSize,
      });
      setHistoryData(data);
    } catch (err: unknown) {
      console.warn('Could not fetch meal history from backend:', err);
      setError(err instanceof Error ? err.message : 'Backend server is offline or unreachable.');
    } finally {
      setLoading(false);
    }
  }, [userId, daysFilter, page]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, refreshTrigger]);

  const toggleExpand = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const totalPages = historyData ? Math.ceil(historyData.total / pageSize) : 0;
  const hasMore = historyData ? page < totalPages : false;

  return (
    <Card variant="elevated" className="p-5 sm:p-6 space-y-4">
      {/* Header with Title and Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-forest/10 dark:border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald/10 text-emerald flex items-center justify-center font-bold">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm sm:text-base text-forest dark:text-white">
              Meal Logs History
            </h3>
            <p className="text-[11px] text-forest/65 dark:text-ivory/65">
              Verified records with AI calorie & anomaly detection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <div className="inline-flex rounded-xl bg-forest/5 dark:bg-white/5 p-1 border border-forest/10 dark:border-white/10">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => {
                  setDaysFilter(days);
                  setPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  daysFilter === days
                    ? 'bg-emerald text-white shadow-sm'
                    : 'text-forest/70 dark:text-ivory/70 hover:text-forest dark:hover:text-white'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>

          <button
            onClick={() => loadHistory()}
            disabled={loading}
            className="p-1.5 rounded-xl border border-forest/10 dark:border-white/10 hover:bg-forest/5 dark:hover:bg-white/5 text-forest/70 dark:text-ivory/70 transition-colors"
            title="Refresh history"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-forest dark:text-ivory/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{error}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => loadHistory()}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !historyData && (
        <div className="space-y-2 py-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-2xl bg-forest/5 dark:bg-white/5 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && historyData && historyData.meals.length === 0 && (
        <div className="py-8 text-center rounded-2xl bg-forest/4 dark:bg-white/5 border border-dashed border-forest/15 dark:border-white/15">
          <Utensils className="w-8 h-8 text-forest/30 dark:text-ivory/30 mx-auto mb-2" />
          <p className="text-xs font-semibold text-forest dark:text-white">
            No meal records found for the past {daysFilter} days.
          </p>
          <p className="text-[11px] text-forest/60 dark:text-ivory/60 mt-0.5">
            Use the AI plate scanner or text logger above to log your first Indian meal!
          </p>
        </div>
      )}

      {/* Logs List */}
      {historyData && historyData.meals.length > 0 && (
        <div className="space-y-2.5">
          {historyData.meals.map((log: StoredMealRecord) => {
            const isExpanded = expandedLogId === log.id;
            const isAnomaly = log.is_anomaly;

            return (
              <div
                key={log.id}
                className={`rounded-2xl border transition-all ${
                  isAnomaly
                    ? 'border-amber-400/40 bg-amber-500/5'
                    : 'border-forest/10 dark:border-white/10 bg-white/60 dark:bg-white/5'
                }`}
              >
                {/* Summary row */}
                <button
                  type="button"
                  onClick={() => toggleExpand(log.id)}
                  className="w-full p-3.5 text-left flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-forest/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4 text-emerald" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-forest dark:text-white capitalize">
                          {log.meal_type}
                        </span>
                        {isAnomaly && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Macro Anomaly
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-forest/65 dark:text-ivory/65 truncate">
                        {log.confirmed_items && log.confirmed_items.length > 0
                          ? log.confirmed_items
                              .map((i: ConfirmedMealItem) => `${i.quantity}x ${i.item}`)
                              .join(', ')
                          : formatDate(log.logged_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-black text-emerald dark:text-emerald-400">
                        {Math.round(log.total_calories)} kcal
                      </span>
                      <p className="text-[10px] text-forest/60 dark:text-ivory/60">
                        {Math.round(log.total_protein)}g P · {Math.round(log.total_carbs)}g C
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-forest/50 dark:text-ivory/50" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-forest/50 dark:text-ivory/50" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-1 border-t border-forest/10 dark:border-white/10 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-forest/60 dark:text-ivory/60">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(log.logged_at)}
                      </span>
                      <span>Total Fats: {Math.round(log.total_fats)}g</span>
                    </div>

                    {/* Bot feedback if present */}
                    {log.bot_feedback && (
                      <div className="p-2.5 rounded-xl bg-emerald/10 border border-emerald/20 flex items-start gap-2 text-[11px] text-forest dark:text-ivory">
                        <Sparkles className="w-3.5 h-3.5 text-emerald shrink-0 mt-0.5" />
                        <p>{log.bot_feedback}</p>
                      </div>
                    )}

                    {/* Breakdown per dish item */}
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-bold text-forest/70 dark:text-ivory/70 uppercase tracking-wider">
                        Dishes in this meal:
                      </p>
                      {log.confirmed_items?.map((it: ConfirmedMealItem, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-forest/4 dark:bg-white/5 text-[11px]"
                        >
                          <span className="font-medium text-forest dark:text-white">
                            {it.item}{' '}
                            <span className="text-forest/60 dark:text-ivory/60">
                              ({it.quantity} {it.serving_unit || 'serving'})
                            </span>
                          </span>
                          <span className="font-semibold text-emerald dark:text-emerald-400">
                            {Math.round(it.calories)} kcal · {Math.round(it.protein_g)}g P
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-forest/60 dark:text-ivory/60">
              Showing {(page - 1) * pageSize + 1}–
              {Math.min(historyData.total, page * pageSize)} of {historyData.total}
            </span>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={!hasMore || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
