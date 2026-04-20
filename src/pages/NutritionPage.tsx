import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  fetchDietPlansByCalorieGoal,
  fetchTodayMealLog,
  saveMealLog,
  type DietPlan,
  type MealLogEntry,
  type MealSlot,
} from '../api/diet.ts'
import { fetchDashboardSummary, tapWaterGlass, type MacroGrams } from '../api/dashboard.ts'
import { fetchProfile } from '../api/profile.ts'
import { FoodAddModal } from '../components/FoodAddModal.tsx'
import { useAuth } from '../hooks/useAuth.ts'

type EntryRow = MealLogEntry & { _key: string }

const GLASS_TARGET = 8

function estimateEntryMacros(
  entry: MealLogEntry,
  calorieGoal: number,
  targets: MacroGrams,
): { p: number; c: number; f: number; estimated: boolean } {
  const has =
    entry.protein_g != null && entry.carbs_g != null && entry.fat_g != null
  if (has) {
    return {
      p: entry.protein_g ?? 0,
      c: entry.carbs_g ?? 0,
      f: entry.fat_g ?? 0,
      estimated: false,
    }
  }
  const cal = entry.calories ?? 0
  if (cal <= 0 || calorieGoal <= 0) return { p: 0, c: 0, f: 0, estimated: true }
  const r = cal / calorieGoal
  return {
    p: targets.protein * r,
    c: targets.carbs * r,
    f: targets.fat * r,
    estimated: true,
  }
}

function aggregateTotals(rows: EntryRow[], calorieGoal: number, targets: MacroGrams) {
  let cal = 0
  let p = 0
  let c = 0
  let f = 0
  for (const e of rows) {
    cal += e.calories ?? 0
    const m = estimateEntryMacros(e, calorieGoal, targets)
    p += m.p
    c += m.c
    f += m.f
  }
  return { calories: cal, protein: p, carbs: c, fat: f }
}

function goalLabel(g: DietPlan['goal_type']) {
  if (g === 'weight_loss') return 'Weight loss'
  if (g === 'muscle_gain') return 'Muscle gain'
  return 'Maintenance'
}

export default function NutritionPage() {
  const { user, loading: authLoading } = useAuth()
  const [rows, setRows] = useState<EntryRow[]>([])
  const [notes] = useState('')
  const [calorieGoal, setCalorieGoal] = useState(2000)
  const [targets, setTargets] = useState<MacroGrams>({ protein: 150, carbs: 200, fat: 65 })
  const [waterGlasses, setWaterGlasses] = useState(0)
  const [plans, setPlans] = useState<DietPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSlot, setModalSlot] = useState<MealSlot>('breakfast')
  /** Bumps when opening the modal so FoodAddModal remounts with a fresh form (avoids setState-in-effect). */
  const [modalKey, setModalKey] = useState(0)
  const [persistBusy, setPersistBusy] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const profile = await fetchProfile()
      setCalorieGoal(profile.calorie_goal)
      const [log, dash, dietPlans] = await Promise.all([
        fetchTodayMealLog(),
        fetchDashboardSummary(),
        fetchDietPlansByCalorieGoal(profile.calorie_goal),
      ])
      setRows(log.entries.map((e) => ({ ...e, _key: crypto.randomUUID() })))
      setTargets(dash.diet.target_macros)
      setWaterGlasses(dash.water_glasses)
      setPlans(dietPlans)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load nutrition data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && user) void load()
  }, [authLoading, user, load])

  const persist = async (next: EntryRow[]) => {
    if (!user) return
    setPersistBusy(true)
    setSaveError(null)
    try {
      const entries: MealLogEntry[] = next.map((row: EntryRow) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- client-only key omitted from API body
        const { _key, ...rest } = row
        return rest
      })
      await saveMealLog(entries, notes)
      setRows(next)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setPersistBusy(false)
    }
  }

  const totals = useMemo(
    () => aggregateTotals(rows, calorieGoal, targets),
    [rows, calorieGoal, targets],
  )

  const macroChartData = useMemo(
    () => [
      { name: 'Protein', g: Math.round(totals.protein * 10) / 10, fill: '#fb923c' },
      { name: 'Carbs', g: Math.round(totals.carbs * 10) / 10, fill: '#34d399' },
      { name: 'Fat', g: Math.round(totals.fat * 10) / 10, fill: '#fbbf24' },
    ],
    [totals],
  )

  const calPct = calorieGoal > 0 ? Math.min(100, (totals.calories / calorieGoal) * 100) : 0

  const addEntry = (entry: MealLogEntry) => {
    const next: EntryRow[] = [...rows, { ...entry, _key: crypto.randomUUID() }]
    void persist(next)
  }

  const removeEntry = (key: string) => {
    const next = rows.filter((r) => r._key !== key)
    void persist(next)
  }

  const onWaterTap = async () => {
    try {
      const out = await tapWaterGlass()
      setWaterGlasses(out.glasses)
    } catch {
      setSaveError('Could not update water')
    }
  }

  const grouped = useMemo(() => {
    const breakfast = rows.filter((r) => r.meal_slot === 'breakfast')
    const lunch = rows.filter((r) => r.meal_slot === 'lunch')
    const dinner = rows.filter((r) => r.meal_slot === 'dinner')
    const snacks = rows.filter((r) => r.meal_slot === 'snack_1' || r.meal_slot === 'snack_2')
    return [
      { section: 'Breakfast' as const, items: breakfast },
      { section: 'Lunch' as const, items: lunch },
      { section: 'Dinner' as const, items: dinner },
      { section: 'Snacks' as const, items: snacks },
    ]
  }, [rows])

  const openAdd = (slot: MealSlot) => {
    setModalSlot(slot)
    setModalKey((k) => k + 1)
    setModalOpen(true)
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

  if (loading && rows.length === 0 && !error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" aria-label="Loading" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/90">Nutrition</p>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Diet & fuel</h1>
        <p className="text-sm text-slate-400">Today · UTC · {calorieGoal} kcal goal</p>
      </header>

      {error ? (
        <p className="rounded-xl border border-amber-900/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
          {error}
        </p>
      ) : null}
      {saveError ? (
        <p className="rounded-xl border border-rose-900/50 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
          {saveError}
        </p>
      ) : null}

      {/* Calorie progress */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white">Daily calories</h2>
            <p className="text-xs text-slate-500">Eaten vs goal</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums text-white">{totals.calories}</p>
            <p className="text-xs text-slate-500">/ {calorieGoal} kcal</p>
          </div>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-orange-500 transition-all duration-500"
            style={{ width: `${calPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {Math.max(0, calorieGoal - totals.calories)} kcal remaining
          {persistBusy ? ' · Saving…' : ''}
        </p>
      </section>

      {/* Macro bar chart */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">Macro breakdown (g)</h2>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={macroChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#475569' }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#475569' }} />
              <Tooltip
                formatter={(v) => [`${Number(v ?? 0)} g`, '']}
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#f8fafc',
                }}
              />
              <Bar dataKey="g" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {macroChartData.map((d) => (
                  <Cell key={d.name} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          Targets ~ P {Math.round(targets.protein)} · C {Math.round(targets.carbs)} · F {Math.round(targets.fat)} g
        </p>
      </section>

      {/* Meal sections */}
      <section className="space-y-6">
        <h2 className="text-lg font-bold text-white">Meals</h2>
        {grouped.map(({ section, items }) => {
          const slotForButton: MealSlot =
            section === 'Breakfast'
              ? 'breakfast'
              : section === 'Lunch'
                ? 'lunch'
                : section === 'Dinner'
                  ? 'dinner'
                  : 'snack_1'
          return (
            <div key={section} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-white">{section}</h3>
                <button
                  type="button"
                  onClick={() => openAdd(slotForButton)}
                  className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-emerald-300 hover:bg-emerald-500/20"
                >
                  Add food
                </button>
              </div>
              {items.length === 0 ? (
                <p className="text-sm text-slate-500">Nothing logged yet.</p>
              ) : (
                <ul className="space-y-3">
                  {items.map((row) => {
                    const m = estimateEntryMacros(row, calorieGoal, targets)
                    return (
                      <li
                        key={row._key}
                        className="flex flex-col gap-1 rounded-xl border border-slate-800/80 bg-slate-900/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-slate-100">{row.description}</p>
                          <p className="text-xs text-slate-500">
                            P {m.p.toFixed(1)} · C {m.c.toFixed(1)} · F {m.f.toFixed(1)} g
                            {m.estimated ? ' · est.' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold tabular-nums text-orange-300">
                            {row.calories ?? '—'} kcal
                          </span>
                          <button
                            type="button"
                            onClick={() => removeEntry(row._key)}
                            className="text-xs font-medium text-rose-400 hover:text-rose-300"
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </section>

      {/* Suggestions */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-white">Meal plan ideas</h2>
        <p className="mb-4 text-sm text-slate-500">From your calorie goal ({calorieGoal} kcal)</p>
        <div className="space-y-3">
          {plans.slice(0, 4).map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-bold text-white">{p.name}</h3>
                <span className="rounded-full border border-slate-600 px-2 py-0.5 text-xs text-slate-400">
                  {goalLabel(p.goal_type)}
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm text-slate-400">
                <li>
                  <span className="text-emerald-500/90">B</span> {p.meals.breakfast.title}
                </li>
                <li>
                  <span className="text-orange-400/90">L</span> {p.meals.lunch.title}
                </li>
                <li>
                  <span className="text-amber-400/90">D</span> {p.meals.dinner.title}
                </li>
                <li>
                  <span className="text-slate-500">S1</span> {p.meals.snack_1.title} ·{' '}
                  <span className="text-slate-500">S2</span> {p.meals.snack_2.title}
                </li>
              </ul>
            </div>
          ))}
          {plans.length === 0 ? (
            <p className="text-sm text-slate-500">No plans loaded — check API connection.</p>
          ) : null}
        </div>
      </section>

      {/* Water */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white">Water</h2>
            <p className="text-xs text-slate-500">{waterGlasses} glasses today · goal {GLASS_TARGET}</p>
          </div>
          <button
            type="button"
            onClick={() => void onWaterTap()}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20"
          >
            Add glass
          </button>
        </div>
        <div className="flex justify-center gap-2">
          {Array.from({ length: GLASS_TARGET }, (_, i) => {
            const filled = i < Math.min(waterGlasses, GLASS_TARGET)
            return (
              <button
                key={i}
                type="button"
                onClick={() => void onWaterTap()}
                className={`flex h-12 w-10 flex-col items-center justify-end rounded-lg border-2 transition ${
                  filled
                    ? 'border-cyan-400/70 bg-cyan-500/25 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                    : 'border-slate-700 bg-slate-900/80 hover:border-slate-600'
                }`}
                aria-label={filled ? `Glass ${i + 1} filled` : `Glass ${i + 1} empty`}
              >
                <span className="mb-1 text-lg opacity-90">{filled ? '◼' : '▢'}</span>
              </button>
            )
          })}
        </div>
        {waterGlasses > GLASS_TARGET ? (
          <p className="mt-3 text-center text-xs text-cyan-400/90">+{waterGlasses - GLASS_TARGET} more today</p>
        ) : null}
      </section>

      <FoodAddModal
        key={modalKey}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultSlot={modalSlot}
        onAdd={(entry) => addEntry(entry)}
      />
    </div>
  )
}
