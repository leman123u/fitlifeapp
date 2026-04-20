/**
 * Firebase client (modular v9+ API).
 * Vite only exposes env vars prefixed with VITE_. Set them in `.env` at the project root and restart `npm run dev`.
 *
 * Core init (`initializeApp`, `getAuth`) is wrapped in try/catch so a bad config does not crash the shell.
 * Analytics loads asynchronously and never throws to the caller.
 *
 * @see https://firebase.google.com/docs/web/setup
 */
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

/**
 * Read and trim a Vite env string. Empty / missing → ''.
 * @param {string} key
 */
function env(key) {
  const raw = import.meta.env[key]
  if (raw == null || raw === '') return ''
  return String(raw).trim()
}

/** Typical Firebase web API keys start with "AIza". */
function looksLikeFirebaseApiKey(value) {
  if (!value || value.length < 30) return false
  return value.startsWith('AIza')
}

/** Obvious tutorial placeholders — treat as "not configured". */
function looksLikePlaceholder(value) {
  if (!value) return true
  const v = value.toLowerCase()
  return (
    v.includes('your-') ||
    v.includes('changeme') ||
    v.includes('replace') ||
    v.includes('xxx') ||
    v === 'undefined' ||
    v === 'null'
  )
}

/** @type {import('firebase/app').FirebaseApp | null} */
let app = null

/** @type {import('firebase/auth').Auth | null} */
let auth = null

/** @type {import('firebase/analytics').Analytics | null} */
export let analytics = null

const apiKey = env('VITE_FIREBASE_API_KEY')
const authDomain = env('VITE_FIREBASE_AUTH_DOMAIN')
const projectId = env('VITE_FIREBASE_PROJECT_ID')

const canInit =
  apiKey &&
  authDomain &&
  projectId &&
  !looksLikePlaceholder(apiKey) &&
  !looksLikePlaceholder(authDomain) &&
  !looksLikePlaceholder(projectId)

if (canInit && !looksLikeFirebaseApiKey(apiKey)) {
  console.warn(
    '[FitLife Pro] VITE_FIREBASE_API_KEY does not look like a Firebase web API key (usually starts with "AIza"). Double-check `.env`.',
  )
}

if (!canInit) {
  console.warn(
    '[FitLife Pro] Firebase not initialized: missing or placeholder VITE_FIREBASE_API_KEY / VITE_FIREBASE_AUTH_DOMAIN / VITE_FIREBASE_PROJECT_ID. Add real values from Firebase Console → Project settings → Your apps → Web. See `.env.example`.',
  )
} else {
  try {
    const firebaseConfig = {
      apiKey,
      authDomain,
      projectId,
    }

    const appId = env('VITE_FIREBASE_APP_ID')
    if (appId) firebaseConfig.appId = appId

    const storageBucket = env('VITE_FIREBASE_STORAGE_BUCKET')
    if (storageBucket) firebaseConfig.storageBucket = storageBucket

    const messagingSenderId = env('VITE_FIREBASE_MESSAGING_SENDER_ID')
    if (messagingSenderId) firebaseConfig.messagingSenderId = messagingSenderId

    const measurementId = env('VITE_FIREBASE_MEASUREMENT_ID')
    if (measurementId) firebaseConfig.measurementId = measurementId

    app = initializeApp(firebaseConfig)
    auth = getAuth(app)

    // GA4 — dynamic import so Node/Vitest don't load analytics; wrapped so failures don't break Auth
    if (typeof window !== 'undefined' && measurementId && app) {
      try {
        import('firebase/analytics')
          .then(({ getAnalytics, isSupported }) =>
            isSupported().then((supported) => {
              if (!supported || !app) return
              try {
                analytics = getAnalytics(app)
              } catch (analyticsErr) {
                console.warn('[FitLife Pro] getAnalytics failed:', analyticsErr)
              }
            }),
          )
          .catch((err) => {
            console.warn('[FitLife Pro] Firebase Analytics module failed to load:', err)
          })
      } catch (analyticsImportErr) {
        console.warn('[FitLife Pro] Firebase Analytics import error:', analyticsImportErr)
      }
    }
  } catch (error) {
    console.error('[FitLife Pro] Firebase init failed:', error)
    app = null
    auth = null
    analytics = null
  }
}

export { auth }
export default app
