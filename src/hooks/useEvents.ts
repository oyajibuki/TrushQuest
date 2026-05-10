import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { AppEvent } from '@/types'

export function useEvents() {
  const [events, setEvents] = useState<AppEvent[]>([])

  const loadEvents = useCallback(async () => {
    if (!isSupabaseConfigured) return
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(5)
    if (data) setEvents(data)
  }, [])

  useEffect(() => { loadEvents() }, [loadEvents])

  const addEvent = async (event: Omit<AppEvent, 'id' | 'created_at'>): Promise<boolean> => {
    if (!isSupabaseConfigured) return false
    const { error } = await supabase.from('events').insert(event)
    if (!error) { await loadEvents(); return true }
    return false
  }

  const deleteEvent = async (id: string) => {
    if (!isSupabaseConfigured) return
    await supabase.from('events').delete().eq('id', id)
    await loadEvents()
  }

  return { events, addEvent, deleteEvent }
}
