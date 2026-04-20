import { useEffect, useState } from 'react'
import { getHealth } from '../api/index.ts'
import { GymTypeSelector } from '../components/GymTypeSelector.tsx'
import { useGymType } from '../hooks/useGymType.ts'

export default function HomePage() {
  const [gymType, setGymType] = useGymType()
  const [apiStatus, setApiStatus] = useState<string>('checking…')

  useEffect(() => {
    let cancelled = false
    getHealth()
      .then((h) => {
        if (!cancelled) setApiStatus(h.status ?? 'ok')
      })
      .catch(() => {
        if (!cancelled) setApiStatus('offline (start FastAPI on :8000)')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="page">
      <h1>FitLife Pro</h1>
      <p className="lede">
        Training, nutrition, and progress — tailored to how you train.
      </p>
      <p className="muted">API health: {apiStatus}</p>

      <h2>Gym type</h2>
      <GymTypeSelector value={gymType} onChange={setGymType} />
      <p className="muted">
        Selected: <strong>{gymType}</strong>
      </p>
    </section>
  )
}
