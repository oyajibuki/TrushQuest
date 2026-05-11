import { useState } from 'react'

export interface ChallengeSettings {
  startDate: string | null
  targetWeight: number | null
  startWeight: number | null
}

const STORAGE_KEY = 'trashquest_challenge_v1'

function load(): ChallengeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { startDate: null, targetWeight: null, startWeight: null }
  } catch {
    return { startDate: null, targetWeight: null, startWeight: null }
  }
}

export function useChallengeSettings() {
  const [settings, setSettings] = useState<ChallengeSettings>(load)

  const updateSettings = (updates: Partial<ChallengeSettings>) => {
    const next = { ...settings, ...updates }
    setSettings(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const dayNumber = settings.startDate
    ? Math.max(1, Math.floor((Date.now() - new Date(settings.startDate).getTime()) / 86400000) + 1)
    : null

  const isActive = !!settings.startDate && dayNumber !== null && dayNumber <= 50

  return { settings, updateSettings, dayNumber, isActive }
}
