import { getBearerAuthHeaders } from './axiosConfig.js'
import { apiFetch } from './client.ts'

export type ProgressEntry = {
  id: string
  user_id: string
  date: string
  weight: number | null
  calories_eaten: number
  workout_completed: boolean
  notes: string | null
}

export type ProgressSummary = {
  user_id: string
  window_days: number
  total_workouts_completed: number
  avg_daily_calories: number | null
  weight_change_kg: number | null
  weekly_avg_weight_kg: number | null
  workout_consistency_pct: number
  calories_trend: {
    recent_7d_avg_kcal: number | null
    prior_7d_avg_kcal: number | null
    change_kcal: number | null
    trend_label: string
  }
  deficit_surplus_hint: {
    target_calories: number
    avg_intake_7d_kcal: number | null
    estimated_daily_balance_kcal: number | null
  }
}

export type StreakInfo = {
  user_id: string
  current_streak_days: number
  last_workout_date: string | null
}

/** UTC calendar date YYYY-MM-DD */
export function utcTodayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function fetchProgressSummary(
  userId: string,
  windowDays = 30,
  targetCalories = 2000,
): Promise<ProgressSummary> {
  const h = await getBearerAuthHeaders()
  const q = new URLSearchParams({
    window_days: String(windowDays),
    target_calories: String(targetCalories),
  })
  return apiFetch<ProgressSummary>(`/api/progress/${encodeURIComponent(userId)}/summary?${q}`, {
    headers: h,
  })
}

export async function fetchProgressHistory(userId: string): Promise<ProgressEntry[]> {
  const h = await getBearerAuthHeaders()
  return apiFetch<ProgressEntry[]>(`/api/progress/${encodeURIComponent(userId)}`, { headers: h })
}

export async function fetchWorkoutStreak(userId: string): Promise<StreakInfo> {
  const h = await getBearerAuthHeaders()
  return apiFetch<StreakInfo>(`/api/progress/${encodeURIComponent(userId)}/streak`, { headers: h })
}

export type UpsertProgressBody = {
  date?: string
  weight?: number | null
  calories_eaten?: number
  workout_completed?: boolean
  notes?: string | null
}

export async function upsertProgress(body: UpsertProgressBody): Promise<ProgressEntry> {
  const h = await getBearerAuthHeaders()
  return apiFetch<ProgressEntry>('/api/progress', {
    method: 'POST',
    headers: h,
    body: JSON.stringify(body),
  })
}
