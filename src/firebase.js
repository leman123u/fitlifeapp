/**
 * Firebase client (modular v9+ API).
 * Web app config from Firebase Console → Project settings → Your apps → Web.
 *
 * Core init (`initializeApp`, `getAuth`) is wrapped in try/catch so a bad config does not crash the shell.
 * Analytics loads asynchronously and never throws to the caller.
 *
 * @see https://firebase.google.com/docs/web/setup
 */
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDGMyRRKStK_-LgXmjPkECM1tChgDQ88Kc",
  authDomain: "farnesyl-c181f.firebaseapp.com",
  projectId: "farnesyl-c181f",
  storageBucket: "farnesyl-c181f.firebasestorage.app",
  messagingSenderId: "379448208224",
  appId: "1:379448208224:web:1d7b324dff4264f9938c05",
  measurementId: "G-D9QX51FLT0",
}

/** @type {import('firebase/app').FirebaseApp | null} */
let app = null

/** @type {import('firebase/auth').Auth | null} */
let auth = null

/** @type {import('firebase/analytics').Analytics | null} */
export let analytics = null

try {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)

  const measurementId = firebaseConfig.measurementId
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

export { auth }
export default app
