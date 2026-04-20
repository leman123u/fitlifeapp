import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth } from '../firebase.js'

/** @typedef {import('firebase/auth').User} FirebaseUser */

const AuthContext = createContext(null)

function requireAuth() {
  if (!auth) {
    const err = new Error(
      'Firebase Authentication is not configured. Add VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID to `.env` (see `.env.example`) and restart `npm run dev`.',
    )
    return Promise.reject(err)
  }
  return auth
}

/**
 * Provides Firebase Auth state and actions to the React tree.
 */
export function AuthProvider({ children }) {
  /** @type {[FirebaseUser | null, import('react').Dispatch<FirebaseUser | null>]} */
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const login = useCallback((email, password) => {
    const a = auth
    if (!a) return requireAuth()
    return signInWithEmailAndPassword(a, email, password)
  }, [])

  const signup = useCallback((email, password) => {
    const a = auth
    if (!a) return requireAuth()
    return createUserWithEmailAndPassword(a, email, password)
  }, [])

  const loginWithGoogle = useCallback(async () => {
    const a = auth
    if (!a) {
      await requireAuth()
      return
    }
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    await signInWithPopup(a, provider)
  }, [])

  const logout = useCallback(() => {
    const a = auth
    if (!a) return requireAuth()
    return signOut(a)
  }, [])

  const resetPassword = useCallback((email) => {
    const a = auth
    if (!a) return requireAuth()
    return sendPasswordResetEmail(a, email)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      /** False when Firebase env is missing and `auth` was never created */
      firebaseReady: !!auth,
      login,
      signup,
      loginWithGoogle,
      logout,
      resetPassword,
    }),
    [user, loading, login, signup, loginWithGoogle, logout, resetPassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Access auth state and methods from any component under `<AuthProvider>`.
 * @returns {{
 *   user: FirebaseUser | null,
 *   loading: boolean,
 *   firebaseReady: boolean,
 *   login: (email: string, password: string) => Promise<import('firebase/auth').UserCredential>,
 *   signup: (email: string, password: string) => Promise<import('firebase/auth').UserCredential>,
 *   loginWithGoogle: () => Promise<void>,
 *   logout: () => Promise<void>,
 *   resetPassword: (email: string) => Promise<void>,
 * }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx == null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
