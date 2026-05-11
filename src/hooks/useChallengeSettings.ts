import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface ChallengeSettings {
  startDate: string | null
  targetWeight: number | null
  startWeight: number | null
  manualDay: number | null
  manualGarbageCount: number | null
  totalDays: number | null
  garbageGoal: number | null
  bmr: number | null
}

const STORAGE_KEY = 'trashquest_challenge_v1'

const DEFAULTS: ChallengeSettings = {
  startDate: null, targetWeight: null, startWeight: null,
  manualDay: null, manualGarbageCount: null, totalDays: null, garbageGoal: null,
  bmr: null,
}

function loadLocal(): ChallengeSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

function rowToSettings(row: Record<string, unknown>): ChallengeSettings {
  return {
    startDate: (row.start_date as string) || null,
    startWeight: (row.start_weight as number) || null,
    targetWeight: (row.target_weight as number) || null,
    totalDays: (row.total_days as number) || null,
    manualDay: (row.manual_day as number) || null,
    manualGarbageCount: (row.manual_garbage_count as number) || null,
    garbageGoal: (row.garbage_goal as number) || null,
    bmr: (row.bmr as number) || null,
  }
}

export function useChallengeSettings() {
  const [settings, setSettings] = useState<ChallengeSettings>(loadLocal)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const fetchSettings = async (userId: string) => {
      const { data: row } = await supabase
        .from('challenge_settings')
        .select('*')
        .eq('user_id', userId)
        .single()
      if (row) {
        const mapped = rowToSettings(row as Record<string, unknown>)
        setSettings(mapped)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped))
      }
    }

    // 既存セッションをストレージから即時取得（他デバイス対応）
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchSettings(session.user.id)
    })

    // ログイン/ログアウト時の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchSettings(session.user.id)
      } else {
        setSettings(loadLocal())
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const updateSettings = async (updates: Partial<ChallengeSettings>) => {
    const next = { ...settings, ...updates }
    setSettings(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))

    if (!isSupabaseConfigured) return
    const { data } = await supabase.auth.getUser()
    if (!data.user) return
    await supabase.from('challenge_settings').upsert({
      user_id: data.user.id,
      start_date: next.startDate,
      start_weight: next.startWeight,
      target_weight: next.targetWeight,
      total_days: next.totalDays,
      manual_day: next.manualDay,
      manual_garbage_count: next.manualGarbageCount,
      garbage_goal: next.garbageGoal,
      bmr: next.bmr,
      updated_at: new Date().toISOString(),
    })
  }

  const dayNumber = settings.startDate
    ? Math.max(1, Math.floor((Date.now() - new Date(settings.startDate).getTime()) / 86400000) + 1)
    : null

  const isActive = !!settings.startDate && dayNumber !== null && dayNumber <= (settings.totalDays ?? Infinity)

  return { settings, updateSettings, dayNumber, isActive }
}
