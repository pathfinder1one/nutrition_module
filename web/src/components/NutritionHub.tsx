import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";

/* ============================================================================
 * NutritionHub - HEALTH PLUS | Team CASA Vital
 * Drop-in module:  <NutritionHub userId={currentUserId} />
 * Env: VITE_API_BASE_URL (e.g. https://your-service.onrender.com)
 * Optional: getAccessToken() -> Supabase JWT, sent as Bearer for per-user auth.
 * ========================================================================== */

const API_BASE: string = (import.meta.env?.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

type MealType = "breakfast" | "lunch" | "snack" | "dinner";
const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "snack", "dinner"];
const MEAL_LABEL: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Evening Snack",
  dinner: "Dinner",
};

interface Macros { calories: number; protein_g: number; carbs_g: number; fats_g: number }
interface PlanItem extends Macros { item: string; quantity: number; serving_unit: string }
interface PlanMeal { label: string; items: PlanItem[]; totals: Macros }
interface PlanTargets {
  bmr: number; tdee: number; target_calories: number; target_protein_g: number;
  target_carbs_g: number; target_fats_g: number;
}
interface DietPlan {
  meals: Record<MealType, PlanMeal>;
  totals: Macros;
  targets: PlanTargets;
  excluded_foods: string[];
}
interface PlanChange { meal_type: MealType; from: string; to: string }

interface DraftItem { item: string; quantity: number; serving_unit: string; confidence?: number }
interface AnalyzeResponse {
  source: "image" | "text";
  suggested_meal_type: MealType;
  items: DraftItem[];
  unmatched: string[];
  notes: string;
  preprocessed_image?: string | null;
  preprocessing_info?: { pipeline: string[]; enhanced: boolean } | null;
}

interface Baseline {
  available: boolean; days_logged: number;
  avg_daily_calories?: number; avg_daily_protein_g?: number; avg_daily_carbs_g?: number;
  avg_meals_per_day?: number; avg_meal_hour?: Record<string, number>;
}
interface Cluster {
  id: number; label: string; days: number; avg_calories: number; avg_protein_g: number;
  carb_share_pct: number; late_calorie_pct: number; description: string;
}
interface Insights {
  baseline: Baseline;
  today: { calories: number; protein_g: number; carbs_g: number; fats_g: number; meals_logged: number };
  targets: { calories: number | null; protein_g: number | null };
  clusters: {
    available: boolean; reason?: string; days_logged?: number; clusters?: Cluster[];
    latest_day?: { date: string; label: string };
  };
  patterns: { type: string; severity: "info" | "warning"; message: string }[];
}
interface ConfirmResponse {
  feedback: string;
  anomaly: { is_anomaly: boolean; reasons: string[]; method: string };
  macros: { items: (Macros & { item: string; quantity: number; serving_unit: string })[]; unresolved: string[]; totals: Macros };
  insights: Insights;
}

interface MealLog {
  id: string;
  meal_type: MealType;
  confirmed_items: {
    item: string; quantity: number; serving_unit: string;
    calories: number; protein_g: number; carbs_g: number; fats_g: number;
  }[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  is_anomaly: boolean;
  bot_feedback: string | null;
  logged_at: string;
}

interface HistoryResponse {
  meals: MealLog[];
  total: number;
  page: number;
  per_page: number;
}

export interface NutritionHubProps {
  userId: string;
  apiBaseUrl?: string;
  getAccessToken?: () => Promise<string | null> | string | null;
  className?: string;
}

/* ------------------------------------------------------------------ API */
class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

function useApi(base: string, getAccessToken?: NutritionHubProps["getAccessToken"]) {
  return useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const headers = new Headers(init.headers);
      const token = getAccessToken ? await getAccessToken() : null;
      if (token) headers.set("Authorization", `Bearer ${token}`);
      if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      const res = await fetch(`${base}/api/nutrition${path}`, { ...init, headers });
      if (!res.ok) {
        let detail = `Request failed (${res.status})`;
        try {
          const body = await res.json();
          if (typeof body.detail === "string") detail = body.detail;
          else if (Array.isArray(body.detail)) detail = body.detail.map((d: { msg: string }) => d.msg).join("; ");
        } catch { /* non-JSON error body */ }
        throw new ApiError(detail, res.status);
      }
      return res.json() as Promise<T>;
    },
    [base, getAccessToken],
  );
}

/* ------------------------------------------------------------------ UI primitives */
const card = "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm";
const input =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100";
const btnPrimary =
  "inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50";
const btnGhost =
  "inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function ErrorBanner({ message, onClose }: { message: string; onClose?: () => void }) {
  return (
    <div role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <span>{message}</span>
      {onClose && <button onClick={onClose} className="text-red-400 hover:text-red-600" aria-label="Dismiss">✕</button>}
    </div>
  );
}

function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-gray-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600" />
      {label}
    </span>
  );
}

function ProgressBar({ label, value, target, unit, color = "bg-emerald-500" }: {
  label: string; value: number; target?: number | null; unit: string; color?: string;
}) {
  const pct = target ? Math.min((value / target) * 100, 100) : 0;
  const over = target ? value > target * 1.1 : false;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-gray-600">
        <span className="font-medium">{label}</span>
        <span>
          {Math.round(value)}{target ? ` / ${Math.round(target)}` : ""} {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full transition-all ${over ? "bg-amber-500" : color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DailyProgress({ today, targets }: {
  today: Insights["today"];
  targets: { calories?: number | null; protein_g?: number | null; carbs_g?: number | null; fats_g?: number | null };
}) {
  return (
    <div className="space-y-3">
      <ProgressBar label="Calories" value={today.calories} target={targets.calories} unit="kcal" />
      <ProgressBar label="Protein" value={today.protein_g} target={targets.protein_g} unit="g" color="bg-sky-500" />
      <ProgressBar label="Carbs" value={today.carbs_g} target={targets.carbs_g} unit="g" color="bg-amber-400" />
      <ProgressBar label="Fats" value={today.fats_g} target={targets.fats_g} unit="g" color="bg-rose-400" />
    </div>
  );
}

/* ------------------------------------------------------------------ Onboarding */
interface OnboardForm {
  name: string; age: string; gender: "male" | "female" | "other"; height_cm: string; weight_kg: string;
  dietary_preference: "veg" | "non-veg" | "vegan" | "jain";
  goal: "lose_weight" | "maintain" | "gain_muscle";
  activity_level: "sedentary" | "light" | "moderate" | "active";
  dislikes: string;
}

function OnboardingView({ userId, api, onDone }: {
  userId: string;
  api: ReturnType<typeof useApi>;
  onDone: (plan: DietPlan) => void;
}) {
  const [f, setF] = useState<OnboardForm>({
    name: "", age: "", gender: "male", height_cm: "", weight_kg: "",
    dietary_preference: "veg", goal: "maintain", activity_level: "light", dislikes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof OnboardForm>(k: K, v: OnboardForm[K]) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ plan: DietPlan }>("/onboard", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId, name: f.name.trim(), age: Number(f.age), gender: f.gender,
          height_cm: Number(f.height_cm), weight_kg: Number(f.weight_kg),
          dietary_preference: f.dietary_preference, goal: f.goal, activity_level: f.activity_level,
          dislikes: f.dislikes.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      onDone(res.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={`${card} mx-auto max-w-2xl space-y-5`}>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Set up your nutrition profile</h2>
        <p className="text-sm text-gray-500">We calculate your calorie and protein targets and build an Indian diet plan around them.</p>
      </div>
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name"><input className={input} required value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Age"><input className={input} type="number" min={10} max={100} required value={f.age} onChange={(e) => set("age", e.target.value)} /></Field>
        <Field label="Gender">
          <select className={input} value={f.gender} onChange={(e) => set("gender", e.target.value as OnboardForm["gender"])}>
            <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
          </select>
        </Field>
        <Field label="Activity level">
          <select className={input} value={f.activity_level} onChange={(e) => set("activity_level", e.target.value as OnboardForm["activity_level"])}>
            <option value="sedentary">Sedentary (desk job)</option>
            <option value="light">Light (1-3 workouts/week)</option>
            <option value="moderate">Moderate (3-5 workouts/week)</option>
            <option value="active">Very active (6-7/week)</option>
          </select>
        </Field>
        <Field label="Height (cm)"><input className={input} type="number" min={100} max={250} required value={f.height_cm} onChange={(e) => set("height_cm", e.target.value)} /></Field>
        <Field label="Weight (kg)"><input className={input} type="number" min={25} max={250} step="0.1" required value={f.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} /></Field>
        <Field label="Diet preference">
          <select className={input} value={f.dietary_preference} onChange={(e) => set("dietary_preference", e.target.value as OnboardForm["dietary_preference"])}>
            <option value="veg">Vegetarian</option><option value="non-veg">Non-vegetarian</option>
            <option value="vegan">Vegan</option><option value="jain">Jain</option>
          </select>
        </Field>
        <Field label="Goal">
          <select className={input} value={f.goal} onChange={(e) => set("goal", e.target.value as OnboardForm["goal"])}>
            <option value="lose_weight">Lose weight</option><option value="maintain">Maintain</option><option value="gain_muscle">Gain muscle</option>
          </select>
        </Field>
      </div>
      <Field label="Foods to avoid (comma separated, optional)">
        <input className={input} placeholder="e.g. oats, paneer" value={f.dislikes} onChange={(e) => set("dislikes", e.target.value)} />
      </Field>
      <div className="flex items-center gap-3">
        <button className={btnPrimary} disabled={busy}>Generate my plan</button>
        {busy && <Spinner label="Building your plan…" />}
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ Plan + swap bar */
function PlanView({ plan, userId, api, onPlanChange }: {
  plan: DietPlan; userId: string; api: ReturnType<typeof useApi>; onPlanChange: (p: DietPlan) => void;
}) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<PlanChange[]>([]);

  async function swap(e: FormEvent) {
    e.preventDefault();
    if (!msg.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ plan: DietPlan; changes: PlanChange[] }>("/plan/modify", {
        method: "PUT", body: JSON.stringify({ user_id: userId, message: msg.trim() }),
      });
      onPlanChange(res.plan);
      setChanges(res.changes);
      setMsg("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the plan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className={card}>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Your daily plan</h2>
          <p className="text-xs text-gray-500">
            Target {plan.targets.target_calories} kcal · {plan.targets.target_protein_g} g protein · plan total{" "}
            {Math.round(plan.totals.calories)} kcal
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {MEAL_TYPES.map((slot) => {
            const meal = plan.meals[slot];
            return (
              <div key={slot} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="font-medium text-gray-900">{MEAL_LABEL[slot]}</h3>
                  <span className="text-xs text-gray-500">{Math.round(meal.totals.calories)} kcal · {Math.round(meal.totals.protein_g)} g P</span>
                </div>
                <ul className="space-y-1.5 text-sm">
                  {meal.items.map((it, i) => (
                    <li key={`${it.item}-${i}`} className="flex justify-between gap-2">
                      <span className="text-gray-800">{it.item}
                        <span className="text-gray-400"> · {it.quantity} × {it.serving_unit}</span>
                      </span>
                      <span className="shrink-0 text-gray-500">{Math.round(it.calories)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        {plan.excluded_foods.length > 0 && (
          <p className="mt-3 text-xs text-gray-500">Avoiding: {plan.excluded_foods.join(", ")}</p>
        )}
      </div>

      <form onSubmit={swap} className={card}>
        <label className="mb-2 block text-sm font-medium text-gray-700">Want to change something?</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className={input} value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={400}
            placeholder={`"Mere yahan paneer nahi milta" or "I don't like oats in breakfast"`}
          />
          <button className={btnPrimary} disabled={busy || !msg.trim()}>{busy ? "Swapping…" : "Swap"}</button>
        </div>
        {error && <div className="mt-3"><ErrorBanner message={error} onClose={() => setError(null)} /></div>}
        {changes.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-gray-700">
            {changes.map((c, i) => (
              <li key={i}><span className="text-gray-500">{MEAL_LABEL[c.meal_type]}:</span> {c.from} → <span className="font-medium text-emerald-700">{c.to}</span></li>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ Confirmation modal (human-in-the-loop) */
function ConfirmModal({ draft, busy, error, onCancel, onConfirm }: {
  draft: AnalyzeResponse; busy: boolean; error: string | null;
  onCancel: () => void;
  onConfirm: (mealType: MealType, items: { item: string; quantity: number }[]) => void;
}) {
  const [items, setItems] = useState<DraftItem[]>(draft.items);
  const [mealType, setMealType] = useState<MealType>(draft.suggested_meal_type);
  const [newItem, setNewItem] = useState("");
  const [showEnhanced, setShowEnhanced] = useState(false);

  const update = (i: number, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const step = (i: number, d: number) => update(i, { quantity: Math.max(0.5, Math.min(20, items[i].quantity + d)) });
  const valid = items.length > 0 && items.every((it) => it.item.trim() && it.quantity > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">Confirm what you ate</h3>
        <p className="mb-4 text-sm text-gray-500">Edit names and portions before we calculate your nutrition.</p>

        {draft.preprocessed_image && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">✓</span>
                <span className="text-xs font-semibold text-emerald-900">Step 02: OpenCV Preprocessed</span>
              </div>
              <button
                type="button"
                onClick={() => setShowEnhanced((v) => !v)}
                className="text-xs font-medium text-emerald-700 underline hover:text-emerald-900"
              >
                {showEnhanced ? "Hide enhanced plate" : "View enhanced plate"}
              </button>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1 text-[11px] text-emerald-800">
              <span className="rounded border border-emerald-200 bg-white/90 px-1.5 py-0.5">Standardized 1024px</span>
              <span className="rounded border border-emerald-200 bg-white/90 px-1.5 py-0.5">Gaussian Denoised</span>
              <span className="rounded border border-emerald-200 bg-white/90 px-1.5 py-0.5">CLAHE in LAB space</span>
            </div>
            {showEnhanced && (
              <div className="mt-2.5 overflow-hidden rounded-lg border border-emerald-200 bg-black/5">
                <img
                  src={draft.preprocessed_image}
                  alt="OpenCV CLAHE Enhanced Plate"
                  className="max-h-52 w-full object-cover"
                />
                <p className="bg-emerald-100/80 px-2 py-1 text-center text-[11px] text-emerald-800">
                  Plate contrast enhanced in LAB space without shifting colors before AI perception.
                </p>
              </div>
            )}
          </div>
        )}

        {draft.unmatched.length > 0 && (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Couldn't match: {draft.unmatched.join(", ")}. Add them below by a common name if needed.
          </p>
        )}
        {draft.notes && <p className="mb-3 text-xs text-gray-500">{draft.notes}</p>}

        <Field label="Meal">
          <select className={input} value={mealType} onChange={(e) => setMealType(e.target.value as MealType)}>
            {MEAL_TYPES.map((m) => <option key={m} value={m}>{MEAL_LABEL[m]}</option>)}
          </select>
        </Field>

        <ul className="my-4 space-y-3">
          {items.map((it, i) => (
            <li key={i} className="rounded-xl border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <input className={`${input} font-medium`} value={it.item} onChange={(e) => update(i, { item: e.target.value })} aria-label="Food name" />
                <button onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))} className="px-2 text-gray-400 hover:text-red-500" aria-label={`Remove ${it.item}`}>✕</button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  1 serving = {it.serving_unit}
                  {it.confidence !== undefined && it.confidence < 0.6 && <span className="ml-2 text-amber-600">low confidence</span>}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => step(i, -0.5)} className="h-8 w-8 rounded-full border border-gray-300 text-lg leading-none text-gray-700 hover:bg-gray-50" aria-label="Decrease">−</button>
                  <span className="w-10 text-center text-sm font-semibold tabular-nums">{it.quantity}</span>
                  <button onClick={() => step(i, 0.5)} className="h-8 w-8 rounded-full border border-gray-300 text-lg leading-none text-gray-700 hover:bg-gray-50" aria-label="Increase">+</button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mb-4 flex gap-2">
          <input className={input} placeholder="Add another item (e.g. dahi)" value={newItem} onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newItem.trim()) {
                e.preventDefault();
                setItems((p) => [...p, { item: newItem.trim(), quantity: 1, serving_unit: "1 serving" }]);
                setNewItem("");
              }
            }} />
          <button className={btnGhost} onClick={() => {
            if (!newItem.trim()) return;
            setItems((p) => [...p, { item: newItem.trim(), quantity: 1, serving_unit: "1 serving" }]);
            setNewItem("");
          }}>Add</button>
        </div>

        {error && <div className="mb-3"><ErrorBanner message={error} /></div>}
        <div className="flex justify-end gap-2">
          <button className={btnGhost} onClick={onCancel} disabled={busy}>Cancel</button>
          <button className={btnPrimary} disabled={!valid || busy}
            onClick={() => onConfirm(mealType, items.map((it) => ({ item: it.item.trim(), quantity: it.quantity })))}>
            {busy ? "Calculating…" : "Confirm & log"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Dual logger */
function FoodLogger({ userId, api, plan, insights, onLogged }: {
  userId: string; api: ReturnType<typeof useApi>; plan: DietPlan; insights: Insights | null;
  onLogged: (r: ConfirmResponse) => void;
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<AnalyzeResponse | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [result, setResult] = useState<ConfirmResponse | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function analyze() {
    if (!file && !text.trim()) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("user_id", userId);
      if (file) fd.append("file", file);
      else fd.append("text", text.trim());
      setDraft(await api<AnalyzeResponse>("/analyze-meal", { method: "POST", body: fd }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }

  async function confirm(mealType: MealType, items: { item: string; quantity: number }[]) {
    setConfirming(true);
    setConfirmError(null);
    try {
      const res = await api<ConfirmResponse>("/confirm-meal", {
        method: "POST", body: JSON.stringify({ user_id: userId, meal_type: mealType, items }),
      });
      setResult(res);
      onLogged(res);
      setDraft(null);
      setFile(null);
      setText("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : "Could not log this meal");
    } finally {
      setConfirming(false);
    }
  }

  const today = result?.insights.today ?? insights?.today;
  const targets = {
    calories: plan.targets.target_calories, protein_g: plan.targets.target_protein_g,
    carbs_g: plan.targets.target_carbs_g, fats_g: plan.targets.target_fats_g,
  };

  return (
    <div className="space-y-4">
      <div className={card}>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Log a meal</h2>
        <p className="mb-4 text-sm text-gray-500">Snap your thali or just type what you ate, in English or Hinglish.</p>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); if (e.target.files?.[0]) setText(""); }} />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Meal preview" className="h-44 w-full rounded-xl object-cover" />
                <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs text-gray-700 shadow">Remove</button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="flex h-44 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 transition hover:border-emerald-400 hover:text-emerald-600">
                <span className="text-2xl">📷</span>
                <span className="text-sm font-medium">Scan with camera or upload</span>
              </button>
            )}
          </div>
          <div className="flex flex-col">
            <textarea className={`${input} h-44 resize-none`} value={text} disabled={!!file}
              onChange={(e) => setText(e.target.value)} maxLength={1000}
              placeholder={`"Maine 2 aloo paratha aur dahi khaya"`} />
          </div>
        </div>

        {error && <div className="mt-3"><ErrorBanner message={error} onClose={() => setError(null)} /></div>}
        <div className="mt-4 flex items-center gap-3">
          <button className={btnPrimary} disabled={analyzing || (!file && !text.trim())} onClick={analyze}>Analyze meal</button>
          {analyzing && <Spinner label={file ? "OpenCV enhancing & detecting items…" : "Parsing meal…"} />}
        </div>
      </div>

      {result && (
        <div className={card}>
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm">🥗</div>
            <div>
              <div className={`rounded-2xl rounded-tl-sm px-4 py-3 text-sm ${result.anomaly.is_anomaly ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-900"}`}>
                {result.feedback}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                This meal: {Math.round(result.macros.totals.calories)} kcal · {Math.round(result.macros.totals.protein_g)} g protein ·{" "}
                {Math.round(result.macros.totals.carbs_g)} g carbs · {Math.round(result.macros.totals.fats_g)} g fat
              </p>
            </div>
          </div>
        </div>
      )}

      {today && (
        <div className={card}>
          <div className="mb-3 flex justify-between">
            <h3 className="font-medium text-gray-900">Today so far</h3>
            <span className="text-xs text-gray-500">{today.meals_logged} meal{today.meals_logged === 1 ? "" : "s"} logged</span>
          </div>
          <DailyProgress today={today} targets={targets} />
        </div>
      )}

      {draft && (
        <ConfirmModal draft={draft} busy={confirming} error={confirmError}
          onCancel={() => { setDraft(null); setConfirmError(null); }} onConfirm={confirm} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Pattern intelligence widget */
function InsightsWidget({ insights, loading }: { insights: Insights | null; loading: boolean }) {
  const rows = useMemo(() => {
    if (!insights || !insights.baseline.available) return [];
    const { baseline, today } = insights;
    return [
      { label: "Calories", base: baseline.avg_daily_calories ?? 0, now: today.calories, unit: "kcal" },
      { label: "Protein", base: baseline.avg_daily_protein_g ?? 0, now: today.protein_g, unit: "g" },
      { label: "Carbs", base: baseline.avg_daily_carbs_g ?? 0, now: today.carbs_g, unit: "g" },
    ];
  }, [insights]);

  if (loading && !insights) return <div className={card}><Spinner label="Loading insights…" /></div>;
  if (!insights) return null;
  const { baseline, clusters, patterns } = insights;

  return (
    <div className="space-y-4">
      <div className={card}>
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Baseline vs today</h2>
        {baseline.available ? (
          <>
            <p className="mb-4 text-xs text-gray-500">Your 7-day personal average across {baseline.days_logged} logged day{baseline.days_logged === 1 ? "" : "s"}.</p>
            <div className="space-y-4">
              {rows.map((r) => {
                const max = Math.max(r.base, r.now, 1);
                return (
                  <div key={r.label}>
                    <div className="mb-1 flex justify-between text-xs text-gray-600">
                      <span className="font-medium">{r.label}</span>
                      <span>today {Math.round(r.now)} vs avg {Math.round(r.base)} {r.unit}</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-gray-100">
                      <div className="absolute h-2 rounded-full bg-emerald-500" style={{ width: `${(r.now / max) * 100}%` }} />
                      <div className="absolute -top-1 h-4 w-0.5 bg-gray-700" style={{ left: `${(r.base / max) * 100}%` }} title="Your average" />
                    </div>
                  </div>
                );
              })}
            </div>
            {baseline.avg_meal_hour && Object.keys(baseline.avg_meal_hour).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {MEAL_TYPES.filter((m) => baseline.avg_meal_hour?.[m] !== undefined).map((m) => {
                  const h = baseline.avg_meal_hour![m];
                  const hh = Math.floor(h); const mm = Math.round((h - hh) * 60);
                  const ap = hh >= 12 ? "PM" : "AM";
                  return (
                    <span key={m} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                      {MEAL_LABEL[m]} ~ {((hh + 11) % 12) + 1}:{String(mm).padStart(2, "0")} {ap}
                    </span>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">Log a few meals and your personal baseline will appear here.</p>
        )}
      </div>

      <div className={card}>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Pattern insights</h2>
        {patterns.length === 0 ? (
          <p className="text-sm text-gray-500">Patterns show up after a few days of logging.</p>
        ) : (
          <ul className="space-y-2">
            {patterns.map((p, i) => (
              <li key={i} className={`rounded-lg px-3 py-2 text-sm ${p.severity === "warning" ? "bg-amber-50 text-amber-900" : "bg-gray-50 text-gray-700"}`}>
                {p.message}
              </li>
            ))}
          </ul>
        )}
        {clusters.available && clusters.clusters && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {clusters.clusters.map((c) => (
              <div key={c.id} className="rounded-xl border border-gray-200 p-3">
                <p className="text-sm font-medium text-gray-900">{c.label}</p>
                <p className="mb-1 text-xs text-gray-500">{c.days} day{c.days === 1 ? "" : "s"}</p>
                <p className="text-xs text-gray-600">{Math.round(c.avg_calories)} kcal · {Math.round(c.avg_protein_g)} g protein</p>
                <p className="text-xs text-gray-600">{Math.round(c.carb_share_pct)}% carbs · {Math.round(c.late_calorie_pct)}% after 9 PM</p>
              </div>
            ))}
          </div>
        )}
        {!clusters.available && clusters.reason && <p className="mt-3 text-xs text-gray-400">{clusters.reason} to detect behavioural clusters.</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Meal History */
function MealHistory({ userId, api }: { userId: string; api: ReturnType<typeof useApi> }) {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 15;
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await api<HistoryResponse>(`/history/${userId}?days=${days}&page=${page}&per_page=${perPage}`);
        if (cancelled) return;
        setMeals(res.meals);
        setTotal(res.total);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load history");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [api, userId, days, page]);

  const grouped = useMemo(() => {
    const groups: Record<string, MealLog[]> = {};
    for (const m of meals) {
      const date = new Date(m.logged_at).toLocaleDateString("en-IN", {
        weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
      });
      (groups[date] ??= []).push(m);
    }
    return groups;
  }, [meals]);

  const toggle = (id: string) =>
    setExpanded((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const totalPages = Math.ceil(total / perPage);

  if (loading) return <div className={card}><Spinner label="Loading meal history…" /></div>;
  if (error) return <ErrorBanner message={error} />;
  if (meals.length === 0)
    return (
      <div className={card}>
        <p className="text-sm text-gray-500">No meals logged in the last {days} days. Start logging to build your history!</p>
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Meal History</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Show last</span>
            {[7, 30, 90].map((d) => (
              <button key={d} onClick={() => { setDays(d); setPage(1); }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  days === d ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>{d}d</button>
            ))}
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">{total} meal{total === 1 ? "" : "s"} logged</p>
      </div>

      {/* Grouped by date */}
      {Object.entries(grouped).map(([date, dayMeals]) => {
        const dayTotal = dayMeals.reduce((s, m) => s + m.total_calories, 0);
        const dayProtein = dayMeals.reduce((s, m) => s + m.total_protein, 0);
        return (
          <div key={date} className={card}>
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="font-medium text-gray-900">{date}</h3>
              <span className="text-xs text-gray-500">
                {Math.round(dayTotal)} kcal · {Math.round(dayProtein)} g protein · {dayMeals.length} meal{dayMeals.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="space-y-2">
              {dayMeals.map((m) => {
                const isOpen = expanded.has(m.id);
                const time = new Date(m.logged_at).toLocaleTimeString("en-IN", {
                  hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
                });
                return (
                  <div key={m.id} className={`rounded-xl border ${m.is_anomaly ? "border-amber-200 bg-amber-50/40" : "border-gray-100 bg-gray-50/60"} transition`}>
                    <button onClick={() => toggle(m.id)} className="flex w-full items-center justify-between px-4 py-3 text-left">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm ${m.is_anomaly ? "bg-amber-100" : "bg-emerald-100"}`}>
                          {m.meal_type === "breakfast" ? "🌅" : m.meal_type === "lunch" ? "☀️" : m.meal_type === "snack" ? "🍵" : "🌙"}
                        </span>
                        <div>
                          <span className="text-sm font-medium text-gray-900">{MEAL_LABEL[m.meal_type]}</span>
                          <span className="ml-2 text-xs text-gray-500">{time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">{Math.round(m.total_calories)} kcal</span>
                        <span className={`text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
                      </div>
                    </button>
                    {isOpen && (
                      <div className="border-t border-gray-200 px-4 py-3">
                        <div className="mb-3 flex flex-wrap gap-3 text-xs text-gray-600">
                          <span>🔥 {Math.round(m.total_calories)} kcal</span>
                          <span>💪 {Math.round(m.total_protein)} g protein</span>
                          <span>🍞 {Math.round(m.total_carbs)} g carbs</span>
                          <span>🧈 {Math.round(m.total_fats)} g fat</span>
                        </div>
                        <ul className="mb-3 space-y-1">
                          {m.confirmed_items.map((it, i) => (
                            <li key={i} className="flex justify-between text-sm">
                              <span className="text-gray-800">
                                {it.item} <span className="text-gray-400">· {it.quantity} × {it.serving_unit}</span>
                              </span>
                              <span className="text-gray-500">{Math.round(it.calories)} kcal</span>
                            </li>
                          ))}
                        </ul>
                        {m.bot_feedback && (
                          <div className={`rounded-lg px-3 py-2 text-xs ${m.is_anomaly ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>
                            {m.bot_feedback}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button className={btnGhost} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button className={btnGhost} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Root */
type Tab = "plan" | "log" | "insights" | "history";

export default function NutritionHub({ userId, apiBaseUrl, getAccessToken, className = "" }: NutritionHubProps) {
  const api = useApi(apiBaseUrl ?? API_BASE, getAccessToken);
  const [state, setState] = useState<"loading" | "onboarding" | "ready" | "error">("loading");
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("log");
  const [error, setError] = useState<string | null>(null);

  const loadInsights = useCallback(async () => {
    setInsightsLoading(true);
    try { setInsights(await api<Insights>(`/insights/${userId}`)); }
    catch { /* insights are non-critical; widget stays empty */ }
    finally { setInsightsLoading(false); }
  }, [api, userId]);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    (async () => {
      try {
        const res = await api<{ plan: DietPlan }>(`/plan/${userId}`);
        if (cancelled) return;
        setPlan(res.plan);
        setState("ready");
        loadInsights();
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) setState("onboarding");
        else { setError(err instanceof Error ? err.message : "Failed to load"); setState("error"); }
      }
    })();
    return () => { cancelled = true; };
  }, [api, userId, loadInsights]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "log", label: "Log meal" },
    { id: "history", label: "History" },
    { id: "plan", label: "Diet plan" },
    { id: "insights", label: "Insights" },
  ];

  return (
    <div className={`mx-auto w-full max-w-4xl bg-white p-4 text-gray-900 ${className}`}>
      <header className="mb-4">
        <h1 className="text-xl font-semibold">Nutrition</h1>
        <p className="text-sm text-gray-500">Indian food scanner, diet plan and pattern intelligence</p>
      </header>

      {state === "loading" && <Spinner label="Loading…" />}
      {state === "error" && error && <ErrorBanner message={error} />}
      {state === "onboarding" && (
        <OnboardingView userId={userId} api={api} onDone={(p) => { setPlan(p); setState("ready"); setTab("plan"); loadInsights(); }} />
      )}

      {state === "ready" && plan && (
        <>
          <nav className="mb-4 flex gap-1 rounded-xl bg-gray-100 p-1" role="tablist">
            {tabs.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${tab === t.id ? "bg-white text-emerald-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}>
                {t.label}
              </button>
            ))}
          </nav>
          {tab === "log" && (
            <FoodLogger userId={userId} api={api} plan={plan} insights={insights}
              onLogged={(r) => setInsights(r.insights)} />
          )}
          {tab === "history" && <MealHistory userId={userId} api={api} />}
          {tab === "plan" && <PlanView plan={plan} userId={userId} api={api} onPlanChange={setPlan} />}
          {tab === "insights" && <InsightsWidget insights={insights} loading={insightsLoading} />}
        </>
      )}
    </div>
  );
}
