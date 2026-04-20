import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'
import {
  fetchProfile,
  saveOnboarding,
  type DietType,
  type FitnessGoal,
  type OnboardingPayload,
} from '../api/profile.ts'

const GOALS: { value: FitnessGoal; label: string; hint: string }[] = [
  { value: 'lose_weight', label: 'Lose Weight', hint: 'Calorie-aware training & nutrition' },
  { value: 'build_muscle', label: 'Build Muscle', hint: 'Progressive overload & protein focus' },
  { value: 'maintain', label: 'Stay Fit', hint: 'Balance strength, health & consistency' },
]

const GYMS = [
  {
    id: 'bodybuilding',
    title: 'Bodybuilding Gym',
    subtitle: 'Machines, dumbbells & hypertrophy',
    Icon: IconDumbbells,
  },
  {
    id: 'crossfit',
    title: 'CrossFit Box',
    subtitle: 'Metcons, barbells & community',
    Icon: IconKettlebell,
  },
  {
    id: 'home',
    title: 'Home Gym',
    subtitle: 'Train on your schedule',
    Icon: IconHome,
  },
  {
    id: 'yoga',
    title: 'Yoga Studio',
    subtitle: 'Mobility, breath & flow',
    Icon: IconYoga,
  },
  {
    id: 'calisthenics',
    title: 'Calisthenics',
    subtitle: 'Rings, bars & bodyweight skills',
    Icon: IconBars,
  },
  {
    id: 'swimming',
    title: 'Swimming Pool',
    subtitle: 'Low-impact cardio & endurance',
    Icon: IconPool,
  },
]

const DIETS: { value: DietType; label: string; hint: string }[] = [
  { value: 'standard', label: 'Standard', hint: 'Balanced macros' },
  { value: 'vegetarian', label: 'Vegetarian', hint: 'Plant-forward, no meat' },
  { value: 'high_protein', label: 'High Protein', hint: 'Extra protein for recovery' },
  { value: 'keto', label: 'Keto', hint: 'Very low carb, higher fat' },
]

function IconDumbbells() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M6 10h12M9 7v10M15 7v10M4 14h2M18 14h2M4 10h2M18 10h2" strokeLinecap="round" />
    </svg>
  )
}
function IconKettlebell() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 4c-2 0-3.5 2-3.5 4.5V10h7v-1.5C15.5 6 14 4 12 4z" />
      <path d="M8.5 10v8a3.5 3.5 0 007 0v-8" strokeLinecap="round" />
    </svg>
  )
}
function IconHome() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" strokeLinejoin="round" />
    </svg>
  )
}
function IconYoga() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="5" r="2" />
      <path d="M8 22l4-7 4 7M10 15h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconBars() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M8 5v14M12 3v18M16 7v10" strokeLinecap="round" />
    </svg>
  )
}
function IconPool() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M2 12c2.5 2 5.5 2 8 0s5.5-2 8 0M2 17c2.5 2 5.5 2 8 0s5.5-2 8 0" strokeLinecap="round" />
      <path d="M4 8c1-2 3-3 5-3s4 1 5 3" />
    </svg>
  )
}

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [checking, setChecking] = useState(true)
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [goal, setGoal] = useState<FitnessGoal | null>(null)
  const [gymType, setGymType] = useState<string | null>(null)
  const [calorieGoal, setCalorieGoal] = useState(2200)
  const [dietType, setDietType] = useState<DietType | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const p = await fetchProfile()
        if (cancelled) return
        if (p.onboarding_completed) {
          navigate('/dashboard', { replace: true })
          return
        }
        if (p.name) setName(p.name)
      } catch {
        /* profile fetch failed; stay on page */
      } finally {
        if (!cancelled) setChecking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [authLoading, user, navigate])

  function validateStep1(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required.'
    const a = Number(age)
    if (!age || Number.isNaN(a) || a < 13 || a > 120) e.age = 'Enter a valid age (13–120).'
    const w = Number(weight)
    if (!weight || Number.isNaN(w) || w < 30 || w > 400) e.weight = 'Weight (kg) looks invalid.'
    const h = Number(height)
    if (!height || Number.isNaN(h) || h < 80 || h > 250) e.height = 'Height (cm) looks invalid.'
    if (!goal) e.goal = 'Choose a fitness goal.'
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  function validateStep2(): boolean {
    if (!gymType) {
      setFieldErrors({ gym: 'Pick where you train.' })
      return false
    }
    setFieldErrors({})
    return true
  }

  function validateStep3(): boolean {
    if (!dietType) {
      setFieldErrors({ diet: 'Choose a diet preference.' })
      return false
    }
    setFieldErrors({})
    return true
  }

  function nextStep() {
    setSubmitError(null)
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
  }

  function prevStep() {
    setSubmitError(null)
    setFieldErrors({})
    setStep((s) => Math.max(1, s - 1))
  }

  async function handleFinish(e: FormEvent) {
    e.preventDefault()
    if (!validateStep1() || !validateStep2() || !validateStep3()) return
    const payload: OnboardingPayload = {
      name: name.trim(),
      age: Number(age),
      weight: Number(weight),
      height: Number(height),
      goal: goal!,
      gym_type: gymType!,
      calorie_goal: calorieGoal,
      diet_type: dietType!,
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      await saveOnboarding(payload)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const progress = (step / 3) * 100

  if (authLoading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div
          className="h-12 w-12 animate-spin rounded-full border-2 border-orange-500 border-t-transparent"
          role="status"
          aria-label="Loading"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_-20%,rgba(249,115,22,0.12),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_0%,rgba(16,185,129,0.1),transparent)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-400/90">FitLife Pro</p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Let&apos;s personalize your plan</h1>
          <p className="mt-2 text-slate-400">Three quick steps — synced to your account.</p>
        </header>

        <div className="mb-8">
          <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
            <span>Step {step} of 3</span>
            <span>{step === 1 ? 'About you' : step === 2 ? 'Training style' : 'Nutrition'}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {submitError && (
            <div
              className="mb-6 rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              {submitError}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Personal info</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm text-slate-300" htmlFor="ob-name">
                    Full name
                  </label>
                  <input
                    id="ob-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-600 bg-slate-950/80 px-4 py-3 text-slate-100 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    placeholder="Alex Johnson"
                    autoComplete="name"
                  />
                  {fieldErrors.name && <p className="mt-1 text-sm text-red-400">{fieldErrors.name}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-slate-300" htmlFor="ob-age">
                    Age
                  </label>
                  <input
                    id="ob-age"
                    type="number"
                    min={13}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full rounded-xl border border-slate-600 bg-slate-950/80 px-4 py-3 text-slate-100 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    placeholder="28"
                  />
                  {fieldErrors.age && <p className="mt-1 text-sm text-red-400">{fieldErrors.age}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-slate-300" htmlFor="ob-weight">
                    Weight (kg)
                  </label>
                  <input
                    id="ob-weight"
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full rounded-xl border border-slate-600 bg-slate-950/80 px-4 py-3 text-slate-100 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    placeholder="72.5"
                  />
                  {fieldErrors.weight && <p className="mt-1 text-sm text-red-400">{fieldErrors.weight}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm text-slate-300" htmlFor="ob-height">
                    Height (cm)
                  </label>
                  <input
                    id="ob-height"
                    type="number"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full rounded-xl border border-slate-600 bg-slate-950/80 px-4 py-3 text-slate-100 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    placeholder="178"
                  />
                  {fieldErrors.height && <p className="mt-1 text-sm text-red-400">{fieldErrors.height}</p>}
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-slate-300">Fitness goal</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {GOALS.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => {
                        setGoal(g.value)
                        setFieldErrors((f) => ({ ...f, goal: '' }))
                      }}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        goal === g.value
                          ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/40'
                          : 'border-slate-600 bg-slate-950/50 hover:border-slate-500'
                      }`}
                    >
                      <span className="font-semibold text-white">{g.label}</span>
                      <p className="mt-1 text-xs text-slate-400">{g.hint}</p>
                    </button>
                  ))}
                </div>
                {fieldErrors.goal && <p className="mt-2 text-sm text-red-400">{fieldErrors.goal}</p>}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={nextStep}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:from-orange-400 hover:to-orange-500"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Where do you train?</h2>
              <p className="text-sm text-slate-400">Pick the option that best matches your main workout environment.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {GYMS.map(({ id, title, subtitle, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setGymType(id)
                      setFieldErrors({})
                    }}
                    className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition ${
                      gymType === id
                        ? 'border-emerald-500/80 bg-emerald-500/10 ring-2 ring-emerald-500/30'
                        : 'border-slate-600 bg-slate-950/40 hover:border-slate-500'
                    }`}
                  >
                    <span
                      className={`flex shrink-0 items-center justify-center rounded-xl p-2 ${
                        gymType === id ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      <Icon />
                    </span>
                    <span>
                      <span className="block font-semibold text-white">{title}</span>
                      <span className="mt-0.5 block text-xs text-slate-400">{subtitle}</span>
                    </span>
                  </button>
                ))}
              </div>
              {fieldErrors.gym && <p className="text-sm text-red-400">{fieldErrors.gym}</p>}
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={prevStep}
                  className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleFinish} className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Diet preference</h2>
              <div>
                <div className="mb-3 flex items-baseline justify-between">
                  <label className="text-sm font-medium text-slate-300" htmlFor="cal-slider">
                    Daily calorie goal
                  </label>
                  <span className="text-2xl font-bold tabular-nums text-orange-400">
                    {calorieGoal.toLocaleString()} <span className="text-sm font-normal text-slate-500">kcal</span>
                  </span>
                </div>
                <input
                  id="cal-slider"
                  type="range"
                  min={1200}
                  max={3500}
                  step={50}
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-orange-500"
                />
                <div className="mt-1 flex justify-between text-xs text-slate-500">
                  <span>1,200</span>
                  <span>3,500</span>
                </div>
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-slate-300">Diet type</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {DIETS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => {
                        setDietType(d.value)
                        setFieldErrors((f) => ({ ...f, diet: '' }))
                      }}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        dietType === d.value
                          ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/35'
                          : 'border-slate-600 bg-slate-950/50 hover:border-slate-500'
                      }`}
                    >
                      <span className="font-semibold text-white">{d.label}</span>
                      <p className="mt-0.5 text-xs text-slate-400">{d.hint}</p>
                    </button>
                  ))}
                </div>
                {fieldErrors.diet && <p className="mt-2 text-sm text-red-400">{fieldErrors.diet}</p>}
              </div>
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={prevStep}
                  className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-w-[10rem] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-60"
                >
                  {submitting && (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  {submitting ? 'Saving…' : 'Finish & go to app'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
