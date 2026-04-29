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

function getLocalVideo(w: WorkoutPlan): string | null {
  const name = w.name?.toLowerCase() ?? ''

  // Bodybuilding
  if (name.includes('leg') || name.includes('squat'))
    return 'https://cdnl.iconscout.com/lottie/premium/preview-watermark/man-doing-barbell-back-squat-exercise-for-legs-animation-gif-download-8971908.mp4'

  if (name.includes('back') && name.includes('bicep'))
    return 'https://cdnl.iconscout.com/lottie/premium/preview-watermark/man-doing-bicep-curls-exercise-animation-gif-download-12270512.mp4'

  if (name.includes('push') || name.includes('chest') || name.includes('hypertrophy'))
    return 'https://cdnl.iconscout.com/lottie/premium/preview-watermark/man-doing-resistance-band-chest-press-exercise-for-chest-animation-gif-download-10108816.mp4'

  // CrossFit
  if (name.includes('metcon'))
    return 'https://cdnl.iconscout.com/lottie/premium/preview-watermark/man-doing-barbell-bent-over-row-exercise-for-back-animation-gif-download-8971883.mp4'

  if (name.includes('chipper'))
    return 'https://cdnl.iconscout.com/lottie/premium/preview-watermark/man-doing-barbell-deadlift-exercise-for-legs-and-back-animation-gif-download-8971933.mp4'

  if (name.includes('olympic'))
    return 'https://cdnl.iconscout.com/lottie/premium/preview-watermark/man-doing-barbell-front-squat-exercise-for-legs-animation-gif-download-8971909.mp4'

  // Yoga
  if (name.includes('hatha'))
    return 'https://cdnl.iconscout.com/lottie/premium/preview-watermark/girl-doing-king-warrior-yoga-pose-animation-gif-download-4562551.mp4'

  if (name.includes('vinyasa'))
    return 'https://cdnl.iconscout.com/lottie/premium/preview-watermark/girl-doing-warrior-yoga-pose-animation-gif-download-4562555.mp4'

  if (name.includes('yin'))
    return 'https://cdnl.iconscout.com/lottie/premium/preview-watermark/woman-doing-cat-yoga-pose-animation-gif-download-4562554.mp4'

  // Home
  if (name.includes('band') || name.includes('core burn'))
    return 'https://cdnl.iconscout.com/lottie/premium/preview-watermark/man-doing-resistance-band-dead-bug-leg-lowering-exercise-for-abs-and-core-animation-gif-download-10108746.mp4'

  if (name.includes('dumbbell') || name.includes('full body'))
    return 'https://cdnl.iconscout.com/lottie/premium/preview-watermark/man-doing-dumbbell-overhead-squat-exercise-for-legs-animation-gif-download-8798314.mp4'

  // Calisthenics
  if (name.includes('hiit') || name.includes('bodyweight'))
    return 'https://cdnl.iconscout.com/lottie/premium/preview-watermark/man-doing-burpee-cardio-exercise-animation-gif-download-10469952.mp4'

  if (name.includes('pull'))
    return 'https://cdnl.iconscout.com/lottie/premium/preview-watermark/man-doing-assisted-pull-up-exercise-for-back-animation-gif-download-9729906.mp4'

  // Swimming
  if (name.includes('freestyle') || name.includes('aerobic'))
    return 'yt:xQ0-bM6FKTk'

  if (name.includes('sprint') || name.includes('power'))
    return 'yt:f1xZSIaGTJY'

  if (name.includes('im technique') || name.includes('technique') || name.includes('drill'))
    return 'yt:4vgtfijXiEg'

  return null
}

function WorkoutCard({ w }: { w: WorkoutPlan }) {
  const hue = hashHue(w.id)
  const from = `hsla(${hue}, 72%, 42%, 0.95)`
  const to = `hsla(${(hue + 48) % 360}, 65%, 28%, 0.9)`
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  useEffect(() => {
    const local = getLocalVideo(w)
    if (local) setVideoUrl(local)
  }, [w])

  const isYoutube = videoUrl?.startsWith('yt:')
  const ytId = isYoutube ? videoUrl!.slice(3) : null

  return (
    <li>
      <Link
        to={`/workouts/${w.id}`}
        className="group flex flex-col overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/40 shadow-lg shadow-black/30 transition hover:border-orange-500/40 hover:shadow-orange-900/20"
      >
        <div
          className="relative h-40 w-full overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          {isYoutube && ytId ? (
            <img
              src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`}
              alt={w.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : videoUrl ? (
            <video
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-contain bg-white"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
          )}
          <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2 z-10">
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

  if (!user) return <Navigate to="/login" replace />

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
          <button type="button" className="ml-3 font-semibold text-white underline" onClick={() => void load()}>
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-8 text-center text-slate-400">
          No plans for this filter yet.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {sorted.map((w) => (
            <WorkoutCard key={w.id} w={w} />
          ))}
        </ul>
      )}
    </div>
  )
}
