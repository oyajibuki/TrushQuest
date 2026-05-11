import { useState } from 'react'

export interface ChallengeSettings {
  startDate: string | null
  targetWeight: number | null
  startWeight: number | null
  manualDay: number | null
  manualGarbageCount: number | null
  totalDays: number | null
}

const STORAGE_KEY = 'trashquest_challenge_v1'

function load(): ChallengeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const defaults: ChallengeSettings = { startDate: null, targetWeight: null, startWeight: null, manualDay: null, manualGarbageCount: null, totalDays: null }
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults
  } catch {
    return { startDate: null, targetWeight: null, startWeight: null, manualDay: null, manualGarbageCount: null, totalDays: null }
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

  const isActive = !!settings.startDate && dayNumber !== null && dayNumber <= (settings.totalDays ?? 50)

  return { settings, updateSettings, dayNumber, isActive }
}
