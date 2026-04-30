import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { completeWorkoutToday, fetchWorkoutById, type WorkoutPlan } from '../api/workouts.ts'
import { useAuth } from '../hooks/useAuth.ts'

function formatClock(total: number) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function hashHue(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h % 360
}

function getLocalVideo(w: WorkoutPlan): string | null {
  const name = w.name?.toLowerCase() ?? ''
  const gymType = (w.gym_type ?? '').toLowerCase()

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
  if (gymType.includes('swim') || name.includes('swim')) {
    if (name.includes('freestyle') || name.includes('aerobic'))
      return 'yt:xQ0-bM6FKTk'
    if (name.includes('sprint') || name.includes('power'))
      return 'yt:f1xZSIaGTJY'
    return 'yt:4vgtfijXiEg'
  }

  return null
}

export default function WorkoutDetailPage() {
  const { workoutId } = useParams<{ workoutId: string }>()
  const { user, loading: authLoading } = useAuth()
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  const [sessionOn, setSessionOn] = useState(false)
  const [restIdx, setRestIdx] = useState(0)
  const [restLeft, setRestLeft] = useState<number | null>(null)
  const [completeBusy, setCompleteBusy] = useState(false)
  const [completeMsg, setCompleteMsg] = useState<string | null>(null)
  const restZeroHandled = useRef<string | null>(null)

  const load = useCallback(async () => {
    if (!workoutId || !user) return
    setLoading(true)
    setLoadError(null)
    try {
      const w = await fetchWorkoutById(workoutId)
      setWorkout(w)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load workout')
    } finally {
      setLoading(false)
    }
  }, [workoutId, user])

  useEffect(() => {
    if (!authLoading && user && workoutId) void load()
  }, [authLoading, user, workoutId, load])

  useEffect(() => {
    if (!workout) return
    const local = getLocalVideo(workout)
    if (local) setVideoUrl(local)
  }, [workout])

  useEffect(() => {
    if (restLeft === null || restLeft <= 0) return
    const id = window.setInterval(() => {
      setRestLeft((x) => (x === null || x <= 0 ? 0 : x - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [restLeft])

  const exercises = workout?.exercises ?? []
  const currentExercise = exercises[restIdx]

  useEffect(() => {
    if (restLeft !== 0) return
    if (!sessionOn) return
    if (exercises.length === 0) return
    const dedupeKey = `${restIdx}-rest0`
    if (restZeroHandled.current === dedupeKey) return
    restZeroHandled.current = dedupeKey
    const next = restIdx + 1
    if (next < exercises.length) {
      setRestIdx(next)
      setRestLeft(Math.max(1, exercises[next].rest_seconds))
    } else {
      setSessionOn(false)
      setRestLeft(null)
    }
  }, [restLeft, sessionOn, restIdx, exercises])

  const overview = useMemo(() => {
    if (!workout) return ''
    if (workout.description?.trim()) return workout.description.trim()
    return `${workout.duration_minutes} minute session · ${workout.difficulty} · ${workout.gym_type.replace(/_/g, ' ')}`
  }, [workout])

  const startWorkout = () => {
    if (!exercises.length) return
    restZeroHandled.current = null
    setSessionOn(true)
    setRestIdx(0)
    setRestLeft(Math.max(1, exercises[0].rest_seconds))
    setCompleteMsg(null)
  }

  const skipRest = () => setRestLeft(0)

  const completeWorkout = async () => {
    if (!workoutId || completeBusy) return
    setCompleteBusy(true)
    setCompleteMsg(null)
    try {
      const r = await completeWorkoutToday(workoutId)
      setCompleteMsg(r.message ?? 'Workout logged for today (UTC).')
    } catch (e) {
      setCompleteMsg(e instanceof Error ? e.message : 'Could not complete workout')
    } finally {
      setCompleteBusy(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" aria-label="Loading" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!workoutId) return <Navigate to="/workouts" replace />

  if (loading && !workout) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" aria-label="Loading" />
      </div>
    )
  }

  if (loadError || !workout) {
    return (
      <div className="space-y-4">
        <Link to="/workouts" className="text-sm font-semibold text-orange-400 hover:text-orange-300">
          ← Back to workouts
        </Link>
        <p className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-6 text-slate-300">
          {loadError ?? 'Workout not found.'}
        </p>
      </div>
    )
  }

  const hue = hashHue(workout.id)
  const heroFrom = `hsla(${hue}, 72%, 42%, 0.95)`
  const heroTo = `hsla(${(hue + 48) % 360}, 65%, 28%, 0.9)`

  return (
    <div className="space-y-6 pb-8">
      <Link to="/workouts" className="inline-flex text-sm font-semibold text-orange-400 hover:text-orange-300">
        ← Workouts
      </Link>

      <div
        className="overflow-hidden rounded-2xl border border-slate-800/80 shadow-xl shadow-black/40"
        style={{ background: `linear-gradient(145deg, ${heroFrom}, ${heroTo})` }}
      >
        <div className="bg-[radial-gradient(ellipse_at_20%_0%,rgba(255,255,255,0.2),transparent_55%)] px-5 pb-6 pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">{workout.gym_type}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{workout.name}</h1>
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-white/85">{overview}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {workout.difficulty}
            </span>
            <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              {workout.duration_minutes} min
            </span>
          </div>
        </div>
      </div>

      <div className="relative rounded-2xl border border-slate-800 bg-black overflow-hidden">
        {videoUrl?.startsWith('yt:') ? (
          <div className="aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${videoUrl.slice(3)}?autoplay=0&rel=0&modestbranding=1`}
              title="Workout video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full rounded-2xl"
            />
          </div>
        ) : videoUrl ? (
          <video
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full object-contain rounded-2xl"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-2xl">
            <div
              className="absolute inset-0 opacity-40 rounded-2xl"
              style={{
                background: `conic-gradient(from 180deg at 50% 50%, hsla(${hue},80%,50%,0.3), transparent, hsla(${(hue + 60) % 360},70%,40%,0.25))`,
                animation: 'spin 12s linear infinite',
              }}
            />
            <div className="relative z-10 flex flex-col items-center gap-2 text-center">
              <span className="text-5xl" aria-hidden>🏋️</span>
              <p className="text-sm font-medium text-slate-300">Video mövcud deyil</p>
            </div>
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-orange-400/90">Session</h2>
        {sessionOn && restLeft !== null && restLeft > 0 && currentExercise ? (
          <div className="mt-4 flex flex-col items-center gap-3">
            <p className="text-center text-sm text-slate-400">
              Rest · Round {restIdx + 1} of {exercises.length}
            </p>
            <p className="text-center text-lg font-semibold text-white">{currentExercise.name}</p>
            <div
              className="relative flex h-36 w-36 items-center justify-center rounded-full border-4 border-orange-500/40 bg-slate-950/80 shadow-inner shadow-black/50"
              style={{ boxShadow: `0 0 40px hsla(${hue}, 80%, 50%, 0.15)` }}
            >
              <span className="font-mono text-4xl font-bold tabular-nums text-orange-300">
                {formatClock(restLeft)}
              </span>
              <div className="pointer-events-none absolute inset-2 animate-pulse rounded-full border border-emerald-500/20" />
            </div>
            <button
              type="button"
              onClick={skipRest}
              className="text-sm font-semibold text-slate-400 underline hover:text-white"
            >
              Skip rest
            </button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            {sessionOn
              ? 'Rest periods finished — start again anytime.'
              : 'Start a guided rest timer between exercise blocks.'}
          </p>
        )}
        <button
          type="button"
          onClick={startWorkout}
          disabled={!exercises.length}
          className="mt-5 w-full rounded-2xl bg-orange-500 py-4 text-center text-sm font-bold text-slate-950 shadow-lg shadow-orange-900/40 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start Workout
        </button>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-white">Exercises</h2>
        <ol className="space-y-3">
          {exercises.map((ex, i) => (
            <li
              key={`${ex.name}-${i}`}
              className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-xs font-bold text-slate-500">{i + 1}.</span>
                <h3 className="flex-1 text-base font-semibold text-white">{ex.name}</h3>
                <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300">
                  {ex.muscle_group.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                {ex.sets} sets × {ex.reps} reps · rest {formatClock(ex.rest_seconds)}
              </p>
              {ex.description ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{ex.description}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
      <button
        type="button"
        onClick={() => void completeWorkout()}
        disabled={completeBusy}
        className="w-full rounded-2xl border border-emerald-500/50 bg-emerald-500/10 py-4 text-sm font-bold text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50"
      >
        {completeBusy ? 'Saving…' : 'Complete Workout'}
      </button>
      {completeMsg ? (
        <p className="text-center text-sm text-emerald-400/90">{completeMsg}</p>
      ) : null}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
