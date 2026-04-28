import type { AuthError } from 'firebase/auth'

/** User-facing copy for Firebase Auth error codes. */
export function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as AuthError).code
    const map: Record<string, string> = {
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Try again.',
      'auth/invalid-credential':
        'Wrong email or password, or there is no password account for this email yet. Use Create an account, try Google sign-in, or reset your password.',
      'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
      'auth/email-already-in-use': 'An account already exists with this email.',
      'auth/weak-password': 'Password should be at least 6 characters (we recommend 8+).',
      'auth/popup-closed-by-user': 'Sign-in was cancelled.',
      'auth/network-request-failed': 'Network error. Check your connection.',
      'auth/operation-not-allowed': 'This sign-in method is not enabled in Firebase Console.',
    }
    if (code && map[code]) return map[code]
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return 'Something went wrong. Please try again.'
}
