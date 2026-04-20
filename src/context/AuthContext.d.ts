import type { ReactNode } from 'react'
import type { User, UserCredential } from 'firebase/auth'

export interface AuthContextValue {
  user: User | null
  loading: boolean
  /** False when Firebase env vars are missing and auth was not initialized */
  firebaseReady: boolean
  login: (email: string, password: string) => Promise<UserCredential>
  signup: (email: string, password: string) => Promise<UserCredential>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

export function AuthProvider(props: { children?: ReactNode }): React.ReactElement

export function useAuth(): AuthContextValue
