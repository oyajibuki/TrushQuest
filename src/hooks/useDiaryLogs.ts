import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { WeightLog, MealLog, ExerciseLog } from '@/types'

export function useDiaryLogs(userId?: string) {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([])
  const [mealLogs, setMealLogs] = useState<MealLog[]>([])
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([])
  const [loading, setLoading] = useState(false)

  const sinceDate = new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0]

  const fetchAll = useCallback(async () => {
    if (!isSupabaseConfigured || !userId) return
    setLoading(true)
    try {
      const [wRes, mRes, eRes] = await Promise.all([
        supabase.from('weight_logs').select('*').eq('user_id', userId)
          .gte('date', sinceDate).order('date', { ascending: true }),
        supabase.from('meal_logs').select('*').eq('user_id', userId)
          .gte('date', sinceDate).order('created_at', { ascending: false }),
        supabase.from('exercise_logs').select('*').eq('user_id', userId)
          .gte('date', sinceDate).order('date', { ascending: false }),
      ])
      if (wRes.data) setWeightLogs(wRes.data)
      if (mRes.data) setMealLogs(mRes.data)
      if (eRes.data) setExerciseLogs(eRes.data)
    } catch { /* Supabaseエラーは無視 */ }
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const addWeight = async (date: string, weight_kg: number): Promise<boolean> => {
    if (!isSupabaseConfigured || !userId) return false
    const { error } = await supabase.from('weight_logs')
      .upsert({ user_id: userId, date, weight_kg }, { onConflict: 'user_id,date' })
    if (!error) await fetchAll()
    return !error
  }

  const deleteWeight = async (id: string) => {
    if (!isSupabaseConfigured) return
    await supabase.from('weight_logs').delete().eq('id', id)
    await fetchAll()
  }

  const addMeal = async (date: string, meal_type: string, calories?: number, memo?: string): Promise<boolean> => {
    if (!isSupabaseConfigured || !userId) return false
    const { error } = await supabase.from('meal_logs').insert({
      user_id: userId, date, meal_type,
      calories: calories || null,
      memo: memo || null,
    })
    if (!error) await fetchAll()
    return !error
  }

  const deleteMeal = async (id: string) => {
    if (!isSupabaseConfigured) return
    await supabase.from('meal_logs').delete().eq('id', id)
    await fetchAll()
  }

  const addExercise = async (date: string, exercise_type: string, duration_minutes: number, notes?: string): Promise<boolean> => {
    if (!isSupabaseConfigured || !userId) return false
    const { error } = await supabase.from('exercise_logs').insert({
      user_id: userId, date, exercise_type, duration_minutes,
      notes: notes || null,
    })
    if (!error) await fetchAll()
    return !error
  }

  const deleteExercise = async (id: string) => {
    if (!isSupabaseConfigured) return
    await supabase.from('exercise_logs').delete().eq('id', id)
    await fetchAll()
  }

  return {
    weightLogs, mealLogs, exerciseLogs, loading,
    addWeight, deleteWeight,
    addMeal, deleteMeal,
    addExercise, deleteExercise,
    refetch: fetchAll,
  }
}
