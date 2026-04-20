import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchProfile } from '../api/profile.ts'
import {
  fetchProgressHistory,
  fetchProgressSummary,
  fetchWorkoutStreak,
  upsertProgress,
  utcTodayIso,
  type ProgressEntry,
  type ProgressSummary,
  type StreakInfo,
} from '../api/progress.ts'
import { useAuth } from '../hooks/useAuth.ts'

function getUtcMonday(ref = new Date()): Date {
  const x = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()))
  const dow = x.getUTCDay()
  const diff = (dow + 6) % 7
  x.setUTCDate(x.getUTCDate() - diff)
  return x
}

function mondayOfIso(iso: string): string {
  const d = new Date(iso + 'T12:00:00.000Z')
  const dow = d.getUTCDay()
  const diff = (dow + 6) % 7
  d.setUTCDate(d.getUTCDate() - diff)
  return d.toISOString().slice(0, 10)
}

function addDaysIso(iso: string, delta: number): string {
  const d = new Date(iso + 'T12:00:00.000Z')
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}

function shortDate(iso: string) {
  return new Date(iso + 'T12:00:00.000Z').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function buildWeeklyWorkoutData(history: ProgressEntry[], weekCount = 8) {
  const monday = getUtcMonday(new Date())
  const keys: string[] = []
  for (let w = weekCount - 1; w >= 0; w--) {
    const d = new Date(monday)
    d.setUTCDate(monday.getUTCDate() - w * 7)
    keys.push(d.toISOString().slice(0, 10))
  }
  const counts = new Map<string, number>()
  for (const k of keys) counts.set(k, 0)
  for (const e of history) {
    if (!e.workout_completed) continue
    const m = mondayOfIso(e.date)
    if (counts.has(m)) counts.set(m, (counts.get(m) ?? 0) + 1)
  }
  return keys.map((k) => ({
    week: shortDate(k),
    workouts: counts.get(k) ?? 0,
  }))
}

function weightSeriesLast30(history: ProgressEntry[]) {
  const end = utcTodayIso()
  const start = addDaysIso(end, -29)
  return history
    .filter((e) => e.weight != null && e.date >= start && e.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date: e.date,
      label: shortDate(e.date),
      weight: Number(e.weight),
    }))
}

function buildCalendarDays(year: number, monthIndex: number) {
  const first = new Date(Date.UTC(year, monthIndex, 1))
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const pad = (first.getUTCDay() + 6) % 7
  const cells: ({ iso: string; day: number } | null)[] = []
  for (let i = 0; i < pad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = new Date(Date.UTC(year, monthIndex, d)).toISOString().slice(0, 10)
    cells.push({ iso, day: d })
  }
  return cells
}

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth()
  const [userId, setUserId] = useState<string | null>(null)
  const [calorieGoal, setCalorieGoal] = useState(2000)
  const [summary, setSummary] = useState<ProgressSummary | null>(null)
  const [streak, setStreak] = useState<StreakInfo | null>(null)
  const [history, setHistory] = useState<ProgressEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [calYear, setCalYear] = useState(() => new Date().getUTCFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getUTCMonth())

  const [weightModal, setWeightModal] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [weightBusy, setWeightBusy] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const profile = await fetchProfile()
      setUserId(profile.id)
      setCalorieGoal(profile.calorie_goal)
      const [sum, str, hist] = await Promise.all([
        fetchProgressSummary(profile.id, 30, profile.calorie_goal),
        fetchWorkoutStreak(profile.id),
        fetchProgressHistory(profile.id),
      ])
      setSummary(sum)
      setStreak(str)
      setHistory(hist)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load progress')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && user) void load()
  }, [authLoading, user, load])

  const todayStr = utcTodayIso()

  const weightData = useMemo(() => weightSeriesLast30(history), [history])
  const weeklyData = useMemo(() => buildWeeklyWorkoutData(history, 8), [history])

  const workoutDays = useMemo(() => {
    const s = new Set<string>()
    for (const e of history) {
      if (e.workout_completed) s.add(e.date)
    }
    return s
  }, [history])

  const calendarCells = useMemo(() => buildCalendarDays(calYear, calMonth), [calYear, calMonth])

  const weightChangeLabel = useMemo(() => {
    const w = summary?.weight_change_kg
    if (w == null) return { text: '—', sub: 'Log weight to track' }
    if (w < 0) return { text: `${w.toFixed(1)} kg`, sub: 'Lost (30d window)' }
    if (w > 0) return { text: `+${w.toFixed(1)} kg`, sub: 'Gained (30d window)' }
    return { text: '0 kg', sub: 'Stable' }
  }, [summary])

  const saveWeight = async () => {
    if (!userId) return
    const v = parseFloat(weightInput.replace(',', '.'))
    if (Number.isNaN(v) || v <= 0) return
    setWeightBusy(true)
    try {
      const today = utcTodayIso()
      const existing = history.find((e) => e.date === today)
      await upsertProgress({
        date: today,
        weight: v,
        calories_eaten: existing?.calories_eaten ?? 0,
        workout_completed: existing?.workout_completed ?? false,
        notes: existing?.notes ?? undefined,
      })
      setWeightModal(false)
      setWeightInput('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save weight')
    } finally {
      setWeightBusy(false)
    }
  }

  const shiftMonth = (delta: number) => {
    const d = new Date(Date.UTC(calYear, calMonth + delta, 1))
    setCalYear(d.getUTCFullYear())
    setCalMonth(d.getUTCMonth())
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" aria-label="Loading" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (loading && !summary) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" aria-label="Loading" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/90">Insights</p>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Progress</h1>
        <p className="text-sm text-slate-400">Last 30 days · UTC · your journey</p>
      </header>

      {error ? (
        <p className="rounded-xl border border-amber-900/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">{error}</p>
      ) : null}

      {/* Stats */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800/90 bg-gradient-to-br from-slate-900 to-slate-950 p-4 shadow-lg shadow-black/30">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total workouts</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-white">{summary?.total_workouts_completed ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">in {summary?.window_days ?? 30}d window</p>
        </div>
        <div className="rounded-2xl border border-orange-500/25 bg-gradient-to-br from-orange-950/40 to-slate-950 p-4 shadow-lg shadow-orange-950/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-400/80">Current streak</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-orange-200">
            {streak?.current_streak_days ?? 0}
            <span className="ml-1 text-xl">🔥</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">consecutive workout days</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-slate-950 p-4 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/80">Weight change</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-200">{weightChangeLabel.text}</p>
          <p className="mt-1 text-xs text-slate-500">{weightChangeLabel.sub}</p>
        </div>
        <div className="rounded-2xl border border-slate-800/90 bg-gradient-to-br from-slate-900 to-slate-950 p-4 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg daily calories</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-white">
            {summary?.avg_daily_calories != null ? Math.round(summary.avg_daily_calories) : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500">logged days in window</p>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setWeightInput('')
            setWeightModal(true)
          }}
          className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-orange-900/30 transition hover:from-orange-400 hover:to-amber-400"
        >
          Add today&apos;s weight
        </button>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {/* Weight line chart */}
      <section className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-5 shadow-xl shadow-black/40">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white">Weight trend</h2>
            <p className="text-xs text-slate-500">Last 30 days (kg)</p>
          </div>
          {summary?.weekly_avg_weight_kg != null ? (
            <p className="text-xs text-slate-400">
              7d avg:{' '}
              <span className="font-semibold text-cyan-300">{summary.weekly_avg_weight_kg.toFixed(1)} kg</span>
            </p>
          ) : null}
        </div>
        <div className="h-72 w-full">
          {weightData.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-slate-500">
              No weight entries in the last 30 days.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#fb923c" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.9} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                  width={44}
                />
                <Tooltip
                  formatter={(v) => [`${Number(v ?? 0).toFixed(1)} kg`, 'Weight']}
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#f8fafc',
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="url(#weightStroke)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#fb923c', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#34d399' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Weekly workout frequency */}
      <section className="rounded-2xl border border-slate-800/90 bg-slate-950/60 p-5 shadow-xl shadow-black/40">
        <h2 className="mb-1 text-lg font-bold text-white">Workout frequency</h2>
        <p className="mb-4 text-xs text-slate-500">Workout days logged per week (UTC)</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#334155' }} />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                width={32}
              />
              <Tooltip
                formatter={(v) => [`${v} days`, 'Workouts']}
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                }}
              />
              <Bar dataKey="workouts" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {weeklyData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === weeklyData.length - 1 ? '#34d399' : `rgba(52, 211, 153, ${0.35 + (i / weeklyData.length) * 0.45})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          Consistency: {summary?.workout_consistency_pct ?? 0}% · target intake {calorieGoal} kcal
        </p>
      </section>

      {/* Calendar */}
      <section className="rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/80 to-slate-950 p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
            aria-label="Previous month"
          >
            ←
          </button>
          <h2 className="text-lg font-bold text-white">
            {new Date(Date.UTC(calYear, calMonth, 1)).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
            })}
          </h2>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
            aria-label="Next month"
          >
            →
          </button>
        </div>
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {calendarCells.map((cell, idx) => {
            if (cell === null) {
              return <div key={`pad-${idx}`} className="aspect-square" />
            }
            const { iso, day } = cell
            const isFuture = iso > todayStr
            const done = workoutDays.has(iso)
            const base =
              'flex aspect-square items-center justify-center rounded-xl border text-sm font-semibold transition '
            if (isFuture) {
              return (
                <div
                  key={iso}
                  className={
                    base +
                    'border-slate-800/50 bg-slate-900/30 text-slate-600'
                  }
                >
                  {day}
                </div>
              )
            }
            if (done) {
              return (
                <div
                  key={iso}
                  className={
                    base +
                    'border-emerald-500/50 bg-emerald-500/20 text-emerald-100 shadow-[0_0_12px_rgba(52,211,153,0.15)]'
                  }
                  title={`${iso}: workout done`}
                >
                  {day}
                </div>
              )
            }
            return (
              <div
                key={iso}
                className={base + 'border-slate-700 bg-slate-800/60 text-slate-400'}
                title={`${iso}: no workout logged`}
              >
                {day}
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded border border-emerald-500/50 bg-emerald-500/25" /> Done
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded border border-slate-600 bg-slate-800" /> Missed
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded border border-slate-800 bg-slate-900/40" /> Future
          </span>
        </div>
      </section>

      {weightModal ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal
          aria-labelledby="weight-modal-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h2 id="weight-modal-title" className="text-lg font-bold text-white">
              Today&apos;s weight
            </h2>
            <p className="mt-1 text-sm text-slate-500">Body weight (kg), UTC day</p>
            <input
              type="number"
              min={1}
              step={0.1}
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder="e.g. 72.5"
              className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-lg font-semibold text-white placeholder:text-slate-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
              autoFocus
            />
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setWeightModal(false)}
                className="flex-1 rounded-xl border border-slate-700 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={weightBusy}
                onClick={() => void saveWeight()}
                className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-bold text-slate-950 hover:bg-orange-400 disabled:opacity-50"
              >
                {weightBusy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
