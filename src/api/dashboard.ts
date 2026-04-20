import { getBearerAuthHeaders } from './axiosConfig.js'
import { apiFetch } from './client.ts'

export type ExercisePreview = {
  name: string
  sets: number
  reps: number
}

export type TodayWorkoutCard = {
  id: string | null
  name: string
  gym_type: string
  duration_minutes: number
  exercises_preview: ExercisePreview[]
}

export type MacroGrams = {
  protein: number
  carbs: number
  fat: number
}

export type DietSummary = {
  calorie_goal: number
  calories_consumed: number
  calories_remaining: number
  target_macros: MacroGrams
  consumed_macros_estimate: MacroGrams
}

export type DashboardSummary = {
  display_name: string
  gym_type: string
  today_workout: TodayWorkoutCard | null
  diet: DietSummary
  streak: {
    current_days: number
    last_workout_date: string | null
  }
  water_glasses: number
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const h = await getBearerAuthHeaders()
  return apiFetch<DashboardSummary>('/api/dashboard/summary', { headers: h })
}

export async function tapWaterGlass(): Promise<{ date: string; glasses: number; ok: boolean }> {
  const h = await getBearerAuthHeaders()
  return apiFetch('/api/dashboard/water/tap', { method: 'POST', headers: h })
}
