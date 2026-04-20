"""Aggregations for progress summary, streaks, and trends."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone


def utc_today() -> date:
    return datetime.now(timezone.utc).date()


def parse_entry_date(raw: object) -> date:
    if isinstance(raw, datetime):
        return raw.date()
    if isinstance(raw, date):
        return raw
    if isinstance(raw, str):
        return date.fromisoformat(raw[:10])
    raise TypeError(f"Unsupported date type: {type(raw)}")


def compute_workout_streak(docs: list[dict]) -> tuple[int, date | None]:
    """
    Consecutive calendar days with workout_completed=True, counting back from
    the most recent such day (does not require an entry for today).
    """
    dates_with = {
        parse_entry_date(d["date"])
        for d in docs
        if d.get("workout_completed")
    }
    if not dates_with:
        return 0, None
    anchor = max(dates_with)
    streak = 0
    d = anchor
    while d in dates_with:
        streak += 1
        d -= timedelta(days=1)
    return streak, anchor


def mean_non_null(values: list[float]) -> float | None:
    if not values:
        return None
    return sum(values) / len(values)


def weekly_avg_weight(docs: list[dict], end: date, days: int = 7) -> float | None:
    start = end - timedelta(days=days - 1)
    weights: list[float] = []
    for d in docs:
        dt = parse_entry_date(d["date"])
        if start <= dt <= end and d.get("weight") is not None:
            weights.append(float(d["weight"]))
    return mean_non_null(weights)


def workout_consistency_pct(window_days: int, workout_days: int) -> float:
    if window_days <= 0:
        return 0.0
    return round(100.0 * workout_days / window_days, 1)


def calories_two_week_trend(docs: list[dict], today: date) -> tuple[float | None, float | None, float | None]:
    """Returns (recent_7d_avg, prior_7d_avg, change)."""
    recent_start = today - timedelta(days=6)
    prior_end = recent_start - timedelta(days=1)
    prior_start = prior_end - timedelta(days=6)

    def window_avg(start: date, end: date) -> float | None:
        cals: list[int] = []
        for d in docs:
            dt = parse_entry_date(d["date"])
            if start <= dt <= end:
                cals.append(int(d.get("calories_eaten") or 0))
        return mean_non_null([float(x) for x in cals]) if cals else None

    r = window_avg(recent_start, today)
    p = window_avg(prior_start, prior_end)
    if r is None or p is None:
        return r, p, None
    return r, p, r - p


def trend_label(change: float | None) -> str:
    if change is None:
        return "insufficient_data"
    if abs(change) < 50:
        return "stable"
    return "up" if change > 0 else "down"


def weight_change_in_window(docs: list[dict], start: date, end: date) -> float | None:
    """Difference last weight - first weight (chronological) with both non-null in window."""
    in_win = [
        (parse_entry_date(d["date"]), float(d["weight"]))
        for d in docs
        if d.get("weight") is not None and start <= parse_entry_date(d["date"]) <= end
    ]
    if len(in_win) < 2:
        return None
    in_win.sort(key=lambda x: x[0])
    return round(in_win[-1][1] - in_win[0][1], 2)
