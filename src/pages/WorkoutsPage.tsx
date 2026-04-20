import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { fetchAllWorkouts, fetchWorkoutsByGymType, type WorkoutPlan } from '../api/workouts.ts'
import { useAuth } from '../hooks/useAuth.ts'

const TABS = [
  { key: 'all' as const, label: 'All' },
  { key: 'bodybuilding', label: 'Bodybuilding' },
  { key: 'crossfit', label: 'CrossFit' },
  { key: 'yoga', label: 'Yoga' },
  { key: 'home', label: 'Home' },
  { key: 'calisthenics', label: 'Calisthenics' },
]

function hashHue(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h % 360
}

function muscleSummary(exercises: WorkoutPlan['exercises'], max = 4): string {
  const groups = [...new Set(exercises.map((e) => e.muscle_group.replace(/_/g, ' ')))].filter(Boolean)
  if (groups.length === 0) return 'Full body'
  const shown = groups.slice(0, max)
  const more = groups.length > max ? ` +${groups.length - max}` : ''
  return `${shown.join(' · ')}${more}`
}

function difficultyStyles(d: string) {
  const x = d.toLowerCase()
  if (x.includes('begin')) return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
  if (x.includes('adv')) return 'border-rose-500/40 bg-rose-500/15 text-rose-300'
  return 'border-amber-500/40 bg-amber-500/15 text-amber-200'
}

export default function WorkoutsPage() {
  const { user, loading: authLoading } = useAuth()
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('all')
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const data =
        tab === 'all' ? await fetchAllWorkouts() : await fetchWorkoutsByGymType(tab)
      setWorkouts(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load workouts')
    } finally {
      setLoading(false)
    }
  }, [user, tab])

  useEffect(() => {
    if (!authLoading && user) void load()
  }, [authLoading, user, load])

  const sorted = useMemo(
    () => [...workouts].sort((a, b) => a.name.localeCompare(b.name)),
    [workouts],
  )

  if (authLoading) {
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
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400/90">Train</p>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Workouts</h1>
        <p className="text-sm text-slate-400">Pick a style, open a plan, and move.</p>
      </header>

      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        {TABS.map(({ key, label }) => {
          const active = tab === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-900/30'
                  : 'border border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-600 hover:text-white'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-900/50 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">
          {error}
          <button
            type="button"
            className="ml-3 font-semibold text-white underline"
            onClick={() => void load()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60"
            />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-8 text-center text-slate-400">
          No plans for this filter yet.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {sorted.map((w) => {
            const hue = hashHue(w.id)
            const from = `hsla(${hue}, 72%, 42%, 0.95)`
            const to = `hsla(${(hue + 48) % 360}, 65%, 28%, 0.9)`
            return (
              <li key={w.id}>
                <Link
                  to={`/workouts/${w.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/40 shadow-lg shadow-black/30 transition hover:border-orange-500/40 hover:shadow-orange-900/20"
                >
                  <div
                    className="relative h-28 w-full overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
                    <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${difficultyStyles(w.difficulty)}`}
                      >
                        {w.difficulty}
                      </span>
                      <span className="rounded-lg bg-black/30 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        {w.duration_minutes} min
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h2 className="text-lg font-bold leading-snug text-white group-hover:text-orange-100">
                      {w.name}
                    </h2>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      {w.gym_type}
                    </p>
                    <p className="line-clamp-2 text-sm text-slate-400">{muscleSummary(w.exercises)}</p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
