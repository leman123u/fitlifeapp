import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'

export default function ProfilePage() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" aria-label="Loading" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400/90">Profile</p>
        <h1 className="text-2xl font-bold text-white">Account</h1>
      </header>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Signed in as</p>
        <p className="mt-1 break-all text-lg font-medium text-slate-100">{user.email ?? user.uid}</p>
      </div>

      <button
        type="button"
        onClick={() => void logout()}
        className="w-full rounded-2xl border border-slate-700 bg-slate-800/80 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
      >
        Sign out
      </button>
    </div>
  )
}
