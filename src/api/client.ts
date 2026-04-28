import { API_BASE_URL } from './axiosConfig.js'
import { getAuth } from 'firebase/auth'

function resolveApiBase(raw: string): string {
  const u = raw.trim()
  if (!u) return API_BASE_URL
  if (u.startsWith('http://localhost:') || u === 'http://localhost') {
    return u.replace(/^http:\/\/localhost(?=:|\/|$)/, 'http://127.0.0.1')
  }
  return u
}

const API_BASE = resolveApiBase(
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() || API_BASE_URL,
)

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const auth = getAuth()
  const token = await auth.currentUser?.getIdToken()

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text || res.statusText}`)
  }
  return res.json() as Promise<T>
}