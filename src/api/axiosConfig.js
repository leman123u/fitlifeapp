/**
 * Central auth for API calls (same idea as an axios request interceptor).
 * Uses fetch everywhere — import getBearerAuthHeaders() and merge into apiFetch options.
 */
import { auth } from '../firebase.js'

/** FastAPI backend origin (override with VITE_API_URL in `.env`). */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

/**
 * @returns {Promise<Record<string, string>>} Authorization header with a freshly minted ID token
 */
export async function getBearerAuthHeaders() {
  if (!auth) {
    throw new Error(
      'Firebase is not configured. Set VITE_FIREBASE_* in `.env` and restart the dev server.',
    )
  }
  const user = auth.currentUser
  if (!user) {
    throw new Error('Not signed in')
  }
  const token = await user.getIdToken(true)
  return { Authorization: `Bearer ${token}` }
}
