import { getBearerAuthHeaders } from './axiosConfig.js'
import { apiFetch } from './client.ts'

export type FitnessGoal = 'lose_weight' | 'build_muscle' | 'maintain'
export type DietType = 'standard' | 'vegetarian' | 'high_protein' | 'keto'

export type UserProfile = {
  id: string
  email: string
  name: string
  age: number
  weight: number
  height: number
  goal: FitnessGoal
  gym_type: string
  calorie_goal: number
  diet_type: string
  onboarding_completed: boolean
  created_at: string
}

export type OnboardingPayload = {
  name: string
  age: number
  weight: number
  height: number
  goal: FitnessGoal
  gym_type: string
  calorie_goal: number
  diet_type: DietType
}

export async function fetchProfile(): Promise<UserProfile> {
  const h = await getBearerAuthHeaders()
  return apiFetch<UserProfile>('/api/auth/me', { headers: h })
}

export async function saveOnboarding(payload: OnboardingPayload): Promise<UserProfile> {
  const h = await getBearerAuthHeaders()
  return apiFetch<UserProfile>('/api/auth/onboarding', {
    method: 'PUT',
    headers: h,
    body: JSON.stringify(payload),
  })
}
