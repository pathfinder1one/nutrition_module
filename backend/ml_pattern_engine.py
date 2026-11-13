"""
Dietary Pattern Intelligence Engine (scikit-learn + pandas/numpy).

  * personal_baseline()   rolling 7-day averages (calories, protein, carbs, fats, meal timing)
  * detect_anomaly()      IsolationForest(contamination=0.15) on [calories, protein, carbs, meal_hour]
                          with a Z-score fallback while the user has < 7 days of logs
  * cluster_days()        KMeans (k<=3) over daily behaviour -> labelled behavioural clusters
  * generate_insights()   dashboard payload combining all of the above
"""
import os
from datetime import datetime
from typing import Any, Optional

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

LOCAL_TZ = os.getenv("APP_TIMEZONE", "Asia/Kolkata")
MIN_DAYS_FOR_IFOREST = 7
MIN_MEALS_FOR_IFOREST = 14
MIN_MEALS_FOR_ZSCORE = 3
LATE_HOUR = 21.0
FEATURES = ["calories", "protein", "carbs", "meal_hour"]


# --------------------------------------------------------------------------- data prep
def logs_to_df(logs: list[dict]) -> pd.DataFrame:
    """meal_logs rows -> tidy DataFrame in the user's local timezone."""
    cols = ["logged_at", "date", "meal_type", "calories", "protein", "carbs", "fats", "meal_hour"]
    if not logs:
        return pd.DataFrame(columns=cols)
    df = pd.DataFrame(logs)
    ts = pd.to_datetime(df["logged_at"], utc=True).dt.tz_convert(LOCAL_TZ)
    out = pd.DataFrame({
        "logged_at": ts,
        "date": ts.dt.date,
        "meal_type": df["meal_type"],
        "calories": df["total_calories"].astype(float),
        "protein": df["total_protein"].astype(float),
        "carbs": df["total_carbs"].astype(float),
        "fats": df["total_fats"].astype(float),
        "meal_hour": ts.dt.hour + ts.dt.minute / 60.0,
    })
    return out.sort_values("logged_at").reset_index(drop=True)


def _local_now(now: Optional[datetime] = None) -> pd.Timestamp:
    ts = pd.Timestamp(now) if now is not None else pd.Timestamp.utcnow()
    if ts.tzinfo is None:
        ts = ts.tz_localize("UTC")
    return ts.tz_convert(LOCAL_TZ)


def daily_totals(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=["date", "calories", "protein", "carbs", "fats", "meals"])
    g = df.groupby("date").agg(
        calories=("calories", "sum"), protein=("protein", "sum"),
        carbs=("carbs", "sum"), fats=("fats", "sum"), meals=("calories", "size"),
    ).reset_index()
    return g


def todays_intake(df: pd.DataFrame, now: Optional[datetime] = None) -> dict:
    today = _local_now(now).date()
    t = df[df["date"] == today]
    return {
        "calories": round(float(t["calories"].sum()), 1),
        "protein_g": round(float(t["protein"].sum()), 1),
        "carbs_g": round(float(t["carbs"].sum()), 1),
        "fats_g": round(float(t["fats"].sum()), 1),
        "meals_logged": int(len(t)),
    }


# --------------------------------------------------------------------------- baseline
def personal_baseline(df: pd.DataFrame, window_days: int = 7, now: Optional[datetime] = None) -> dict:
    """Rolling baseline over the last `window_days` local days that contain logs (today excluded
    from averages only if it is the sole day, to avoid a partial-day skew)."""
    today = _local_now(now).date()
    start = today - pd.Timedelta(days=window_days)
    recent = df[(df["date"] > start) & (df["date"] <= today)]
    daily = daily_totals(recent)

    # exclude today's partial total from the averages when earlier days exist
    full_days = daily[daily["date"] < today]
    basis = full_days if len(full_days) >= 1 else daily

    if basis.empty:
        return {"days_logged": 0, "window_days": window_days, "available": False}

    timing = (
        recent.groupby("meal_type")["meal_hour"].mean().round(1).to_dict() if not recent.empty else {}
    )
    return {
        "available": True,
        "window_days": window_days,
        "days_logged": int(len(basis)),
        "avg_daily_calories": round(float(basis["calories"].mean()), 1),
        "avg_daily_protein_g": round(float(basis["protein"].mean()), 1),
        "avg_daily_carbs_g": round(float(basis["carbs"].mean()), 1),
        "avg_daily_fats_g": round(float(basis["fats"].mean()), 1),
        "avg_meals_per_day": round(float(basis["meals"].mean()), 1),
        "avg_meal_hour": timing,   # {"breakfast": 9.1, "dinner": 21.4, ...}
    }


# --------------------------------------------------------------------------- anomaly detection
def _safe_std(series: pd.Series) -> float:
    mean = abs(float(series.mean()))
    return max(float(series.std(ddof=0)), 0.1 * mean, 1.0)


def _zscores(hist: pd.DataFrame, cur: dict) -> dict:
    return {
        "calories": float((cur["calories"] - hist["calories"].mean()) / _safe_std(hist["calories"])),
        "protein": float((cur["protein"] - hist["protein"].mean()) / _safe_std(hist["protein"])),
        "carbs": float((cur["carbs"] - hist["carbs"].mean()) / _safe_std(hist["carbs"])),
    }


def _reasons(z: dict, cur: dict, hist: pd.DataFrame, thr: float) -> list[str]:
    reasons = []
    if z["calories"] > thr:
        reasons.append("calorie_spike")
    if z["carbs"] > thr:
        reasons.append("carb_spike")
    if z["protein"] < -thr:
        reasons.append("protein_drop")
    late_share = float((hist["meal_hour"] >= LATE_HOUR).mean()) if len(hist) else 0.0
    if cur["meal_hour"] >= 22.0 and late_share < 0.10:
        reasons.append("late_night_meal")
    return reasons


def detect_anomaly(history: pd.DataFrame, current: dict) -> dict:
    """
    current: {"calories","protein","carbs","meal_hour","meal_type"}
    Isolation Forest once >= 7 days / 14 meals of history exist; otherwise Z-score vs personal history.
    A meal is flagged only if it is a statistical outlier AND in a harmful direction
    (calorie/carb spike, protein drop, unusually late).
    """
    n_days = int(history["date"].nunique()) if not history.empty else 0
    n_meals = int(len(history))

    if n_days >= MIN_DAYS_FOR_IFOREST and n_meals >= MIN_MEALS_FOR_IFOREST:
        X = history[FEATURES].to_numpy(dtype=float)
        scaler = StandardScaler().fit(X)
        model = IsolationForest(n_estimators=200, contamination=0.15, random_state=42).fit(scaler.transform(X))
        x = scaler.transform(np.array([[current[f] for f in FEATURES]], dtype=float))
        outlier = int(model.predict(x)[0]) == -1
        score = float(model.decision_function(x)[0])   # < 0 => more anomalous

        z = _zscores(history, current)
        reasons = _reasons(z, current, history, thr=1.5)
        return {
            "is_anomaly": bool(outlier and reasons),
            "method": "isolation_forest",
            "score": round(score, 3),
            "reasons": reasons if outlier else [],
            "z": {k: round(v, 2) for k, v in z.items()},
            "history_days": n_days,
        }

    # ---- fallback: Z-score vs personal history (same meal type preferred)
    same = history[history["meal_type"] == current.get("meal_type")]
    ref = same if len(same) >= MIN_MEALS_FOR_ZSCORE else history
    if len(ref) < MIN_MEALS_FOR_ZSCORE:
        return {"is_anomaly": False, "method": "insufficient_data", "score": None,
                "reasons": [], "z": {}, "history_days": n_days}

    z = _zscores(ref, current)
    reasons = _reasons(z, current, history, thr=2.0)
    return {
        "is_anomaly": bool(reasons),
        "method": "zscore_fallback",
        "score": None,
        "reasons": reasons,
        "z": {k: round(v, 2) for k, v in z.items()},
        "history_days": n_days,
    }


# --------------------------------------------------------------------------- k-means
def _day_features(df: pd.DataFrame) -> pd.DataFrame:
    d = daily_totals(df)
    if d.empty:
        return d
    late = df[df["meal_hour"] >= LATE_HOUR].groupby("date")["calories"].sum()
    d["late_ratio"] = d["date"].map(late).fillna(0.0) / d["calories"].clip(lower=1.0)
    d["carb_share"] = (d["carbs"] * 4.0) / d["calories"].clip(lower=1.0)
    d["protein_share"] = (d["protein"] * 4.0) / d["calories"].clip(lower=1.0)
    return d


def cluster_days(df: pd.DataFrame, target_protein_g: Optional[float] = None) -> dict:
    """KMeans over [calories, protein, carb_share, late_ratio] -> labelled behavioural clusters."""
    days = _day_features(df)
    if len(days) < 3:
        return {"available": False, "reason": "Need at least 3 logged days", "days_logged": int(len(days))}

    k = min(3, len(days))
    X = StandardScaler().fit_transform(days[["calories", "protein", "carb_share", "late_ratio"]].to_numpy(float))
    km = KMeans(n_clusters=k, n_init=10, random_state=42).fit(X)
    days["cluster"] = km.labels_

    prof = days.groupby("cluster").agg(
        n=("date", "size"), calories=("calories", "mean"), protein=("protein", "mean"),
        carb_share=("carb_share", "mean"), late_ratio=("late_ratio", "mean"),
        protein_share=("protein_share", "mean"),
    )

    labels: dict[int, str] = {}
    remaining = list(prof.index)

    if k >= 2:
        low_p = prof.loc[remaining, "protein_share"].idxmin()
        # judge against the user's own protein target when known; typical Indian diets sit at
        # 12-15% of calories from protein, so the absolute fallback is deliberately low
        if target_protein_g:
            deficient = bool(prof.loc[low_p, "protein"] < 0.8 * target_protein_g)
        else:
            deficient = bool(prof.loc[low_p, "protein_share"] < 0.12)
        if deficient:
            labels[low_p] = "Low-Protein Deficit"
            remaining.remove(low_p)
    if len(remaining) >= 2:
        score = prof.loc[remaining, "carb_share"] + 2.0 * prof.loc[remaining, "late_ratio"]
        hi = score.idxmax()
        if prof.loc[hi, "carb_share"] > 0.55 or prof.loc[hi, "late_ratio"] > 0.25:
            labels[hi] = "High-Carb / Late-Night Eating"
            remaining.remove(hi)
    bal = sorted(remaining, key=lambda c: prof.loc[c, "calories"])
    for i, c in enumerate(bal):
        if len(bal) == 1:
            labels[c] = "Balanced Baseline"
        else:
            labels[c] = "Balanced Baseline" + (" - lighter days" if i == 0 else " - heavier days" if i == len(bal) - 1 else "")

    descriptions = {
        "Low-Protein Deficit": "Protein share of calories is low on these days.",
        "High-Carb / Late-Night Eating": "Carb-heavy days, often with calories eaten after 9 PM.",
    }
    clusters = [
        {
            "id": int(c),
            "label": labels[c],
            "days": int(prof.loc[c, "n"]),
            "avg_calories": round(float(prof.loc[c, "calories"]), 0),
            "avg_protein_g": round(float(prof.loc[c, "protein"]), 1),
            "carb_share_pct": round(float(prof.loc[c, "carb_share"]) * 100, 0),
            "late_calorie_pct": round(float(prof.loc[c, "late_ratio"]) * 100, 0),
            "description": descriptions.get(labels[c], "Days close to your typical eating pattern."),
        }
        for c in prof.index
    ]
    assignments = [
        {"date": str(r.date), "cluster": int(r.cluster), "label": labels[int(r.cluster)]}
        for r in days.itertuples()
    ]
    return {
        "available": True,
        "k": int(k),
        "days_logged": int(len(days)),
        "clusters": clusters,
        "day_assignments": assignments,
        "latest_day": assignments[-1],
    }


# --------------------------------------------------------------------------- dashboard payload
def generate_insights(logs: list[dict], user: dict, now: Optional[datetime] = None) -> dict[str, Any]:
    df = logs_to_df(logs)
    baseline = personal_baseline(df, 7, now)
    today = todays_intake(df, now)
    clusters = cluster_days(df, user.get("target_protein_g"))

    target_cal = user.get("target_calories")
    target_pro = user.get("target_protein_g")

    patterns: list[dict] = []
    if not df.empty:
        local_today = _local_now(now).date()
        wk = df[df["date"] > local_today - pd.Timedelta(days=7)]
        wk_days = daily_totals(wk)

        if target_pro and len(wk_days) >= 3:
            low = int((wk_days["protein"] < 0.8 * target_pro).sum())
            if low >= max(2, len(wk_days) // 2):
                patterns.append({
                    "type": "low_protein", "severity": "warning",
                    "message": f"Protein was under 80% of target on {low} of your last {len(wk_days)} logged days.",
                })
        late_meals = int((wk["meal_hour"] >= LATE_HOUR).sum())
        if late_meals >= 2:
            patterns.append({
                "type": "late_night", "severity": "warning",
                "message": f"{late_meals} meals logged after 9 PM this week.",
            })
        if target_cal and len(wk_days) >= 3:
            over = int((wk_days["calories"] > 1.15 * target_cal).sum())
            if over >= 2:
                patterns.append({
                    "type": "calorie_overshoot", "severity": "warning",
                    "message": f"Calories exceeded target by 15%+ on {over} days this week.",
                })
        if not patterns and len(wk_days) >= 3:
            patterns.append({"type": "steady", "severity": "info",
                             "message": "Your intake has been consistent this week. Keep it up."})

    if clusters.get("available"):
        lbl = clusters["latest_day"]["label"]
        patterns.append({"type": "cluster", "severity": "info",
                         "message": f"Your most recent logged day looks like: {lbl}."})

    return {
        "baseline": baseline,
        "today": today,
        "targets": {"calories": target_cal, "protein_g": target_pro},
        "clusters": clusters,
        "patterns": patterns,
        "generated_at": _local_now(now).isoformat(),
    }
