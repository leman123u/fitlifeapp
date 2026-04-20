import type { NavigateFunction } from 'react-router-dom'
import { fetchProfile } from '../api/profile.ts'

/** After Firebase sign-in, send user to onboarding or dashboard based on MongoDB profile. */
export async function navigateAfterAuth(navigate: NavigateFunction): Promise<void> {
  try {
    const p = await fetchProfile()
    navigate(p.onboarding_completed ? '/dashboard' : '/onboarding', { replace: true })
  } catch {
    navigate('/dashboard', { replace: true })
  }
}
