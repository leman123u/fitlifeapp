import { getBearerAuthHeaders } from './axiosConfig.js'
import { apiFetch } from './client.ts'

export type WorkoutExercise = {
  name: string
  sets: number
  reps: number
  rest_seconds: number
  description: string
  muscle_group: string
}

export type WorkoutPlan = {
  id: string
  name: string
  gym_type: string
  difficulty: string
  duration_minutes: number
  description?: string
  exercises: WorkoutExercise[]
}

export type WorkoutCompleteResult = {
  ok: boolean
  date: string
  workout_id: string
  message?: string | null
}

/** All workouts (tab: All). Backend: GET /api/workouts */
export async function fetchAllWorkouts(): Promise<WorkoutPlan[]> {
  const h = await getBearerAuthHeaders()
  return apiFetch<WorkoutPlan[]>('/api/workouts', { headers: h })
}

/**
 * Filter by gym type. Backend: GET /api/workouts/gym/{gym_type}
 * (REST shape GET /workouts/{gym_type} is served here to avoid clashing with /workouts/{objectId}.)
 */
export async function fetchWorkoutsByGymType(gymType: string): Promise<WorkoutPlan[]> {
  const h = await getBearerAuthHeaders()
  const key = encodeURIComponent(gymType.toLowerCase())
  return apiFetch<WorkoutPlan[]>(`/api/workouts/gym/${key}`, { headers: h })
}

export async function fetchWorkoutById(id: string): Promise<WorkoutPlan> {
  const h = await getBearerAuthHeaders()
  return apiFetch<WorkoutPlan>(`/api/workouts/${encodeURIComponent(id)}`, { headers: h })
}

export async function completeWorkoutToday(workoutId: string): Promise<WorkoutCompleteResult> {
  const h = await getBearerAuthHeaders()
  return apiFetch<WorkoutCompleteResult>('/api/workouts/complete', {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ workout_id: workoutId }),
  })
}
