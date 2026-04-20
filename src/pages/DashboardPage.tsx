import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { fetchDashboardSummary, tapWaterGlass, type DashboardSummary } from '../api/dashboard.ts'
import { useAuth } from '../hooks/useAuth.ts'

const MACRO_COLORS = {
  protein: '#fb923c',
  carbs: '#34d399',
  fat: '#fbbf24',
} as const

function MacroRing({ diet }: { diet: DashboardSummary['diet'] }) {
  const { consumed_macros_estimate: c, target_macros: t } = diet
  const data = useMemo(() => {
    const p = Math.max(c.protein, 0)
    const cr = Math.max(c.carbs, 0)
    const f = Math.max(c.fat, 0)
    const sum = p + cr + f
    if (sum <= 0) {
      return [
        { name: 'Protein', value: 1, fill: MACRO_COLORS.protein },
        { name: 'Carbs', value: 1, fill: MACRO_COLORS.carbs },
        { name: 'Fat', value: 1, fill: MACRO_COLORS.fat },
      ]
    }
    return [
      { name: 'Protein', value: p, fill: MACRO_COLORS.protein },
      { name: 'Carbs', value: cr, fill: MACRO_COLORS.carbs },
      { name: 'Fat', value: f, fill: MACRO_COLORS.fat },
    ]
  }, [c, t])

  const hasIntake = c.protein + c.carbs + c.fat > 0

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative h-52 w-full max-w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={78}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} fillOpacity={hasIntake ? 1 : 0.2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${Number(value ?? 0).toFixed(1)} g`, String(name ?? '')]}
              contentStyle={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '12px',
                color: '#f8fafc',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-2xl font-bold tabular-nums tracking-tight text-white">{diet.calories_remaining}</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">kcal left</p>
        </div>
      </div>
      <div className="w-full space-y-3 text-sm">
        {(['protein', 'carbs', 'fat'] as const).map((key) => {
          const consumed = key === 'protein' ? c.protein : key === 'carbs' ? c.carbs : c.fat
          const target = key === 'protein' ? t.protein : key === 'carbs' ? t.carbs : t.fat
          const pct = target > 0 ? Math.min(100, (consumed / target) * 100) : 0
          const color = MACRO_COLORS[key]
          return (
            <div key={key}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium capitalize text-slate-300">{key}</span>
                <span className="tabular-nums text-slate-500">
                  {consumed.toFixed(0)} / {target.toFixed(0)} g
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [waterBusy, setWaterBusy] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setLoadError(null)
    try {
      const s = await fetchDashboardSummary()
      setSummary(s)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load dashboard')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && user) void load()
    if (!authLoading && !user) {
      setLoading(false)
    }
  }, [authLoading, user, load])

  const onWaterTap = async () => {
    if (waterBusy || !user) return
    setWaterBusy(true)
    try {
      const out = await tapWaterGlass()
      setSummary((prev) => (prev ? { ...prev, water_glasses: out.glasses } : prev))
    } catch {
      setLoadError('Could not log water. Try again.')
    } finally {
      setWaterBusy(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" aria-label="Loading" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (loading && !summary) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" aria-label="Loading" />
      </div>
    )
  }

  if (loadError && !summary) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-center">
        <p className="text-slate-300">{loadError}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!summary) return null

  const w = summary.today_workout
  const diet = summary.diet

  return (
    <div className="space-y-6 pb-4">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400/90">FitLife Pro</p>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Welcome back, <span className="text-emerald-400">{summary.display_name}</span>
        </h1>
        <p className="text-sm text-slate-400">Let&apos;s crush today&apos;s plan.</p>
      </header>

      {loadError ? (
        <p className="rounded-xl border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-center text-sm text-amber-200/90">{loadError}</p>
      ) : null}

      {/* Streak */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900 to-slate-950 px-4 py-3 shadow-lg shadow-black/20">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Streak</p>
          <p className="text-lg font-bold text-white">
            {summary.streak.current_days} day{summary.streak.current_days === 1 ? '' : 's'}
          </p>
        </div>
        <span className="text-4xl" aria-hidden>
          🔥
        </span>
      </div>

      {/* Today's workout */}
      <section className="overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/30 p-5 shadow-xl shadow-black/25">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-400/90">Today&apos;s workout</p>
            <h2 className="mt-1 text-xl font-bold text-white">{w?.name ?? 'Rest or plan ahead'}</h2>
          </div>
          {w ? (
            <span className="shrink-0 rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300">
              {w.gym_type}
            </span>
          ) : null}
        </div>
        {w ? (
          <>
            <div className="mb-4 flex flex-wrap gap-3 text-sm text-slate-400">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-2.5 py-1 text-slate-200">
                <span className="text-orange-400">⏱</span> {w.duration_minutes} min
              </span>
            </div>
            <ul className="space-y-2">
              {w.exercises_preview.slice(0, 5).map((ex) => (
                <li
                  key={`${ex.name}-${ex.sets}-${ex.reps}`}
                  className="flex items-center justify-between rounded-xl bg-slate-950/50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-slate-200">{ex.name}</span>
                  <span className="tabular-nums text-slate-500">
                    {ex.sets}×{ex.reps}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-slate-500">No workout template yet — pick a plan in Workouts.</p>
        )}
      </section>

      {/* Diet */}
      <section className="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-5 shadow-lg">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">Today&apos;s fuel</p>
            <h2 className="text-lg font-bold text-white">Calories & macros</h2>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums text-white">{diet.calories_consumed}</p>
            <p className="text-xs text-slate-500">of {diet.calorie_goal} kcal</p>
          </div>
        </div>
        <MacroRing diet={diet} />
      </section>

      {/* Water */}
      <button
        type="button"
        onClick={() => void onWaterTap()}
        disabled={waterBusy}
        className="group w-full rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900 to-emerald-950/20 p-5 text-left transition hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-900/20 disabled:opacity-60"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">Hydration</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-white">{summary.water_glasses}</p>
            <p className="text-sm text-slate-500">glasses today · tap to add</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-2xl text-emerald-400 transition group-hover:bg-emerald-500/25">
            {waterBusy ? (
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
            ) : (
              '＋'
            )}
          </div>
        </div>
      </button>

      {/* Quick actions */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Quick actions</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            to="/workouts"
            className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-4 text-center text-sm font-semibold text-orange-200 transition hover:bg-orange-500/20"
          >
            Start Workout
          </Link>
          <Link
            to="/nutrition"
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-center text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
          >
            Log Meal
          </Link>
          <Link
            to="/progress"
            className="rounded-2xl border border-slate-700 bg-slate-800/50 px-4 py-4 text-center text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            Add Weight
          </Link>
        </div>
      </section>
    </div>
  )
}
