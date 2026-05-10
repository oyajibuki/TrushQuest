import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Quest, QuestSettingsRow } from '@/types'

const MAP_URL =
  'https://www.google.com/maps/d/viewer?mid=1pcVcNpvp8j8L1DeX2NvU_RoeWtvHOAo&ll=35.315751460313194%2C139.35926100365504&z=16'

export const DEFAULT_QUESTS: Quest[] = [
  {
    id: 1,
    title: '平塚海岸ビーチクリーン',
    location: '神奈川県 平塚市',
    city: '平塚市',
    duration: '40分',
    calories: 250,
    difficulty: 'Medium',
    lat: 35.3286,
    lon: 139.3495,
    bagPickup: {
      name: '湘南ベルマーレひらつかビーチパーク 管理棟前',
      image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=400&q=80',
      mapUrl: MAP_URL,
    },
    dropoff: {
      name: 'ボードウォーク南側 指定集積所',
      image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=400&q=80',
      mapUrl: MAP_URL,
    },
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    title: '茅ヶ崎サザンビーチ ウォーキング',
    location: '神奈川県 茅ヶ崎市',
    city: '茅ヶ崎市',
    duration: '30分',
    calories: 180,
    difficulty: 'Easy',
    lat: 35.3327,
    lon: 139.4065,
    bagPickup: {
      name: 'サザンビーチカフェ入口横 ボックス',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80',
      mapUrl: MAP_URL,
    },
    dropoff: {
      name: 'サザンCモニュメント裏 集積所',
      image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=400&q=80',
      mapUrl: MAP_URL,
    },
    image: 'https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
]

export const DEFAULT_QUEST_IDS = new Set(DEFAULT_QUESTS.map(q => q.id))

interface DbQuestRow {
  id: number
  title: string
  location: string
  city: string
  duration: string
  calories: number
  difficulty: string
  lat: number
  lon: number
  image: string
  bag_pickup_name: string
  bag_pickup_map_url: string
  bag_pickup_image: string
  dropoff_name: string
  dropoff_map_url: string
  dropoff_image: string
  is_active: boolean
}

function mapDbRow(row: DbQuestRow): Quest {
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    city: row.city,
    duration: row.duration,
    calories: row.calories,
    difficulty: row.difficulty,
    lat: row.lat,
    lon: row.lon,
    image: row.image,
    bagPickup: {
      name: row.bag_pickup_name,
      image: row.bag_pickup_image,
      mapUrl: row.bag_pickup_map_url,
    },
    dropoff: {
      name: row.dropoff_name,
      image: row.dropoff_image,
      mapUrl: row.dropoff_map_url,
    },
  }
}

export function useQuestSettings() {
  const [quests, setQuests] = useState<Quest[]>(DEFAULT_QUESTS)
  const [loading, setLoading] = useState(false)

  const fetchSettings = useCallback(async () => {
    if (!isSupabaseConfigured) return
    setLoading(true)
    try {
      const [settingsRes, dbQuestsRes] = await Promise.all([
        supabase.from('quest_settings').select('*'),
        supabase.from('quests').select('*').eq('is_active', true).order('id', { ascending: true }),
      ])

      const settings: QuestSettingsRow[] = settingsRes.data || []
      const dbRows: DbQuestRow[] = dbQuestsRes.data || []

      const updatedDefaults = DEFAULT_QUESTS.map(quest => {
        const s = settings.find(row => row.quest_id === quest.id)
        if (!s) return quest
        return {
          ...quest,
          bagPickup: {
            name: s.bag_pickup_name || quest.bagPickup.name,
            image: s.bag_pickup_image || quest.bagPickup.image,
            mapUrl: s.bag_pickup_map_url || quest.bagPickup.mapUrl,
          },
          dropoff: {
            name: s.dropoff_name || quest.dropoff.name,
            image: s.dropoff_image || quest.dropoff.image,
            mapUrl: s.dropoff_map_url || quest.dropoff.mapUrl,
          },
        }
      })

      const dbQuestObjects = dbRows.map(mapDbRow)
      setQuests([...updatedDefaults, ...dbQuestObjects])
    } catch {
      // DBエラー時はデフォルト値を使う
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateQuestSettings = async (questId: number, settings: Partial<QuestSettingsRow>) => {
    if (!isSupabaseConfigured) return false
    const { error } = await supabase
      .from('quest_settings')
      .upsert({ quest_id: questId, ...settings, updated_at: new Date().toISOString() })
    if (!error) await fetchSettings()
    return !error
  }

  const addQuest = async (quest: Omit<DbQuestRow, 'id' | 'is_active'>): Promise<boolean> => {
    if (!isSupabaseConfigured) return false
    const { error } = await supabase.from('quests').insert({ ...quest, is_active: true })
    if (!error) await fetchSettings()
    return !error
  }

  const deleteQuest = async (questId: number): Promise<boolean> => {
    if (!isSupabaseConfigured || DEFAULT_QUEST_IDS.has(questId)) return false
    const { error } = await supabase.from('quests').delete().eq('id', questId)
    if (!error) await fetchSettings()
    return !error
  }

  return { quests, loading, updateQuestSettings, addQuest, deleteQuest, refetch: fetchSettings }
}
