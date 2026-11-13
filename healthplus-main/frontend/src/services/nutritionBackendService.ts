/**
 * Nutrition Backend Service (HEALTH PLUS - CASA Vital)
 * Bridges the Health Plus frontend directly to the Python FastAPI Nutrition Module.
 * Endpoints:
 *   - /api/nutrition/analyze-meal  (OpenCV CLAHE preprocessing + CLIP / Multimodal vision + Hinglish NLP)
 *   - /api/nutrition/confirm-meal  (Macro calculations over 574+ items + IsolationForest anomaly detection)
 *   - /api/nutrition/history/{id}  (Historical meal logs with pagination and anomaly filters)
 *   - /api/nutrition/insights/{id} (KMeans behavioral clustering + 7-day baselines)
 */

export interface MacrosBreakdown {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
}

export interface DetectedFoodItem {
  item: string;
  quantity: number;
  serving_unit: string;
  confidence?: number;
  calories_per_serving?: number;
}

export interface AnalyzeMealResponse {
  source: 'image' | 'text';
  suggested_meal_type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  items: DetectedFoodItem[];
  unmatched: string[];
  notes: string;
  preprocessed_image?: string | null;
  preprocessing_info?: {
    pipeline: string[];
    enhanced: boolean;
  } | null;
}

export interface ConfirmedMealItem extends MacrosBreakdown {
  item: string;
  quantity: number;
  serving_unit: string;
  category?: string;
  diet_type?: string;
}

export interface AnomalyReport {
  is_anomaly: boolean;
  reasons: string[];
  method: string;
  score?: number | null;
}

export interface ConfirmMealResponse {
  log: {
    id: string;
    meal_type: string;
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fats: number;
    is_anomaly: boolean;
    bot_feedback?: string | null;
    logged_at: string;
  };
  macros: {
    items: ConfirmedMealItem[];
    unresolved: string[];
    totals: MacrosBreakdown;
  };
  anomaly: AnomalyReport;
  feedback: string;
  today: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
    meals_logged: number;
  };
  targets: {
    calories: number | null;
    protein_g: number | null;
  };
}

export interface StoredMealRecord {
  id: string;
  meal_type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  confirmed_items: ConfirmedMealItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  is_anomaly: boolean;
  bot_feedback?: string | null;
  logged_at: string;
}

export interface MealHistoryResponse {
  meals: StoredMealRecord[];
  total: number;
  page: number;
  per_page: number;
}

export interface PatternInsightItem {
  type: string;
  severity: 'info' | 'warning';
  message: string;
}

export interface BehavioralCluster {
  id: number;
  label: string;
  days: number;
  avg_calories: number;
  avg_protein_g: number;
  carb_share_pct: number;
  late_calorie_pct: number;
  description: string;
}

export interface NutritionInsightsResponse {
  baseline: {
    available: boolean;
    days_logged: number;
    avg_daily_calories?: number;
    avg_daily_protein_g?: number;
    avg_daily_carbs_g?: number;
    avg_meals_per_day?: number;
    avg_meal_hour?: Record<string, number>;
  };
  today: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
    meals_logged: number;
  };
  targets: {
    calories: number | null;
    protein_g: number | null;
  };
  clusters: {
    available: boolean;
    reason?: string;
    days_logged?: number;
    clusters?: BehavioralCluster[];
    latest_day?: { date: string; label: string };
  };
  patterns: PatternInsightItem[];
  generated_at: string;
}

const DEFAULT_USER_ID = 'dbdc55db-6602-4b29-99fa-744cf362735d';

export async function analyzePlateOrText(options: {
  file?: File | null;
  text?: string;
  userId?: string;
}): Promise<AnalyzeMealResponse> {
  const fd = new FormData();
  fd.append('user_id', options.userId || DEFAULT_USER_ID);
  if (options.file) {
    fd.append('file', options.file);
  } else if (options.text) {
    fd.append('text', options.text.trim());
  } else {
    throw new Error('Provide a plate photograph or describe your meal');
  }

  const res = await fetch('/api/nutrition/analyze-meal', {
    method: 'POST',
    body: fd,
  });

  if (!res.ok) {
    let err = 'Failed to analyze meal';
    try {
      const data = await res.json();
      err = data.detail || err;
    } catch {}
    throw new Error(err);
  }

  return (await res.json()) as AnalyzeMealResponse;
}

export async function confirmAndSaveMeal(payload: {
  userId?: string;
  mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  items: Array<{ item: string; quantity: number }>;
}): Promise<ConfirmMealResponse> {
  const res = await fetch('/api/nutrition/confirm-meal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: payload.userId || DEFAULT_USER_ID,
      meal_type: payload.mealType,
      items: payload.items,
    }),
  });

  if (!res.ok) {
    let err = 'Failed to save meal record';
    try {
      const data = await res.json();
      err = data.detail || err;
    } catch {}
    throw new Error(err);
  }

  return (await res.json()) as ConfirmMealResponse;
}

export async function fetchMealHistory(options: {
  userId?: string;
  days?: number;
  page?: number;
  perPage?: number;
}): Promise<MealHistoryResponse> {
  const uid = options.userId || DEFAULT_USER_ID;
  const days = options.days || 30;
  const page = options.page || 1;
  const perPage = options.perPage || 20;

  const res = await fetch(
    `/api/nutrition/history/${uid}?days=${days}&page=${page}&per_page=${perPage}`
  );

  if (!res.ok) {
    throw new Error(`Failed to load meal history (${res.status})`);
  }

  return (await res.json()) as MealHistoryResponse;
}

export async function fetchNutritionInsights(
  userId?: string
): Promise<NutritionInsightsResponse> {
  const uid = userId || DEFAULT_USER_ID;
  const res = await fetch(`/api/nutrition/insights/${uid}`);
  if (!res.ok) {
    throw new Error(`Failed to load nutrition insights (${res.status})`);
  }
  return (await res.json()) as NutritionInsightsResponse;
}

