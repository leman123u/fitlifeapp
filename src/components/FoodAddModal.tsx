import { useMemo, useState } from 'react'
import type { MealLogEntry, MealSlot } from '../api/diet.ts'
import { FOOD_PRESETS } from '../lib/foodSearchPresets.ts'

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack_1: 'Snack 1',
  snack_2: 'Snack 2',
}

type Props = {
  open: boolean
  onClose: () => void
  defaultSlot: MealSlot
  onAdd: (entry: MealLogEntry) => void
}

export function FoodAddModal({ open, onClose, defaultSlot, onAdd }: Props) {
  const [slot, setSlot] = useState<MealSlot>(defaultSlot)
  const [query, setQuery] = useState('')
  const [description, setDescription] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return FOOD_PRESETS.slice(0, 8)
    return FOOD_PRESETS.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 12)
  }, [query])

  if (!open) return null

  const applyPreset = (p: (typeof FOOD_PRESETS)[number]) => {
    setDescription(p.name)
    setCalories(String(p.calories))
    setProtein(String(p.protein_g))
    setCarbs(String(p.carbs_g))
    setFat(String(p.fat_g))
  }

  const submitManual = () => {
    const cal = calories.trim() === '' ? null : Math.max(0, parseInt(calories, 10) || 0)
    const desc = description.trim() || 'Food item'
    const pg = protein.trim() === '' ? null : Math.max(0, parseFloat(protein) || 0)
    const cg = carbs.trim() === '' ? null : Math.max(0, parseFloat(carbs) || 0)
    const fg = fat.trim() === '' ? null : Math.max(0, parseFloat(fat) || 0)
    onAdd({
      meal_slot: slot,
      description: desc,
      calories: cal,
      protein_g: pg,
      carbs_g: cg,
      fat_g: fg,
    })
    reset()
    onClose()
  }

  const reset = () => {
    setQuery('')
    setDescription('')
    setCalories('')
    setProtein('')
    setCarbs('')
    setFat('')
    setSlot(defaultSlot)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="food-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur">
          <h2 id="food-modal-title" className="text-lg font-bold text-white">
            Add food
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-2 py-1 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Meal</label>
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value as MealSlot)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
            >
              {(Object.keys(SLOT_LABEL) as MealSlot[]).map((s) => (
                <option key={s} value={s}>
                  {SLOT_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Search foods</label>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. chicken, oats…"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
            />
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/80 p-2">
              {filtered.map((p) => (
                <li key={p.name}>
                  <button
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="flex w-full flex-col rounded-lg px-2 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-slate-500">
                      {p.calories} kcal · P{p.protein_g} C{p.carbs_g} F{p.fat_g}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Or enter manually</p>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Food name"
              className="mb-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <input
                type="number"
                min={0}
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="kcal"
                className="rounded-xl border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white placeholder:text-slate-600"
              />
              <input
                type="number"
                min={0}
                step="0.1"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="P g"
                className="rounded-xl border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white placeholder:text-slate-600"
              />
              <input
                type="number"
                min={0}
                step="0.1"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="C g"
                className="rounded-xl border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white placeholder:text-slate-600"
              />
              <input
                type="number"
                min={0}
                step="0.1"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="F g"
                className="rounded-xl border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-white placeholder:text-slate-600"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={submitManual}
            className="w-full rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-900/30 hover:bg-emerald-400"
          >
            Add to log
          </button>
        </div>
      </div>
    </div>
  )
}
