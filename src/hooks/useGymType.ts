import { useEffect, useState } from 'react'

const STORAGE_KEY = 'fitlife_gym_type'

export function useGymType(defaultType = 'Bodybuilding') {
  const [gymType, setGymType] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? defaultType
    } catch {
      return defaultType
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, gymType)
    } catch {
      /* ignore quota / private mode */
    }
  }, [gymType])

  return [gymType, setGymType] as const
}
