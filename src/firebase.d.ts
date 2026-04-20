import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Analytics } from 'firebase/analytics'

/** Null when env is missing/invalid or initializeApp threw. */
export declare const auth: Auth | null

/** Set asynchronously when GA4 is supported; may stay null in tests or if Analytics fails. */
export declare let analytics: Analytics | null

declare const app: FirebaseApp | null
export default app
