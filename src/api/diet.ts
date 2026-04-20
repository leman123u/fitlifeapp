import { getBearerAuthHeaders } from './axiosConfig.js'
import { apiFetch } from './client.ts'

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack_1' | 'snack_2'

export type MealLogEntry = {
  meal_slot: MealSlot
  description: string
  calories: number | null
  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null
}

export type TodayMealLog = {
  date: string
  entries: MealLogEntry[]
  notes: string
}

export type PlannedMeal = {
  title: string
  prep_minutes: number
  ingredients: string[]
  notes: string
}

export type DietPlan = {
  id: string
  name: string
  calorie_goal: number
  goal_type: 'weight_loss' | 'muscle_gain' | 'maintenance'
  meals: {
    breakfast: PlannedMeal
    lunch: PlannedMeal
    dinner: PlannedMeal
    snack_1: PlannedMeal
    snack_2: PlannedMeal
  }
  macros: {
    protein: number
    carbs: number
    fat: number
  }
}

export type DietLogResult = {
  ok: boolean
  date: string
  entry_count: number
  message?: string | null
}

/** GET /api/diet/{calorie_goal} — plans near this calorie target */
export async function fetchDietPlansByCalorieGoal(calorieGoal: number): Promise<DietPlan[]> {
  const h = await getBearerAuthHeaders()
  return apiFetch<DietPlan[]>(`/api/diet/${calorieGoal}`, { headers: h })
}

export async function fetchTodayMealLog(): Promise<TodayMealLog> {
  const h = await getBearerAuthHeaders()
  return apiFetch<TodayMealLog>('/api/diet/log/today', { headers: h })
}

export async function saveMealLog(entries: MealLogEntry[], notes = ''): Promise<DietLogResult> {
  const h = await getBearerAuthHeaders()
  return apiFetch<DietLogResult>('/api/diet/log', {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ entries, notes }),
  })
}
