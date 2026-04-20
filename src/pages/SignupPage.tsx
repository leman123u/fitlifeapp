import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'
import { getAuthErrorMessage } from '../lib/authErrors.ts'
import { navigateAfterAuth } from '../lib/postAuthRedirect.ts'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function LogoMark() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-emerald-600 shadow-lg shadow-orange-500/25 ring-1 ring-white/10">
      <svg
        className="h-8 w-8 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M4 12h16M8 8v8M16 8v8M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />
        <path d="M12 4v16" opacity="0.5" />
      </svg>
    </div>
  )
}

export default function SignupPage() {
  const { user, loading: authLoading, firebaseReady, signup, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
    confirm?: string
  }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState<'email' | 'google' | null>(null)

  useEffect(() => {
    if (!authLoading && user) {
      void navigateAfterAuth(navigate)
    }
  }, [authLoading, user, navigate])

  function validateForm(): boolean {
    const next: typeof fieldErrors = {}
    if (!email.trim()) next.email = 'Email is required.'
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Password is required.'
    else if (password.length < 8) next.password = 'Use at least 8 characters.'
    if (password !== confirm) next.confirm = 'Passwords do not match.'
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!validateForm()) return
    setPending('email')
    try {
      await signup(email.trim(), password)
      await navigateAfterAuth(navigate)
    } catch (err) {
      setFormError(getAuthErrorMessage(err))
    } finally {
      setPending(null)
    }
  }

  async function handleGoogle() {
    setFormError(null)
    setPending('google')
    try {
      await loginWithGoogle()
      await navigateAfterAuth(navigate)
    } catch (err) {
      setFormError(getAuthErrorMessage(err))
    } finally {
      setPending(null)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent"
          role="status"
          aria-label="Loading"
        />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(249,115,22,0.18),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,rgba(16,185,129,0.12),transparent)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mb-10 text-center">
          <div className="mb-5 flex justify-center">
            <LogoMark />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Join <span className="text-orange-400">FitLife Pro</span>
          </h1>
          <p className="mt-3 text-lg font-medium text-emerald-400/90">
            Transform Your Body, Transform Your Life
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
          {!firebaseReady && (
            <div
              className="mb-4 rounded-lg border border-amber-500/50 bg-amber-950/50 px-4 py-3 text-sm text-amber-100"
              role="status"
            >
              Firebase is not configured. Add <code className="rounded bg-slate-800 px-1">VITE_FIREBASE_*</code> to{' '}
              <code className="rounded bg-slate-800 px-1">.env</code> and restart <code className="rounded bg-slate-800 px-1">npm run dev</code>.
            </div>
          )}

          {formError && (
            <div
              className="mb-4 rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              {formError}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5" noValidate>
            <div>
              <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }))
                }}
                className="w-full rounded-xl border border-slate-600 bg-slate-950/80 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                placeholder="you@example.com"
              />
              {fieldErrors.email && (
                <p className="mt-1.5 text-sm text-red-400" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }))
                }}
                className="w-full rounded-xl border border-slate-600 bg-slate-950/80 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                placeholder="At least 8 characters"
              />
              {fieldErrors.password && (
                <p className="mt-1.5 text-sm text-red-400" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="signup-confirm" className="mb-1.5 block text-sm font-medium text-slate-300">
                Confirm password
              </label>
              <input
                id="signup-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value)
                  if (fieldErrors.confirm) setFieldErrors((f) => ({ ...f, confirm: undefined }))
                }}
                className="w-full rounded-xl border border-slate-600 bg-slate-950/80 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                placeholder="Repeat password"
              />
              {fieldErrors.confirm && (
                <p className="mt-1.5 text-sm text-red-400" role="alert">
                  {fieldErrors.confirm}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={pending !== null}
              className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-500 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending === 'email' && (
                <span
                  className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-hidden
                />
              )}
              {pending === 'email' ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-slate-900/90 px-3 text-slate-500">or sign up with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={pending !== null}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-600 bg-slate-800/80 px-4 py-3.5 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending === 'google' ? (
              <span
                className="h-5 w-5 animate-spin rounded-full border-2 border-orange-400 border-t-transparent"
                aria-hidden
              />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {pending === 'google' ? 'Opening Google…' : 'Sign up with Google'}
          </button>

          <p className="mt-8 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-orange-400 transition hover:text-orange-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
