import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { WeatherState } from '@/types'

// WMOコードで悪天候を判定
function classifyWeather(code: number, windspeed: number): 'sunny' | 'rain' | 'typhoon' {
  if (windspeed > 50 || code >= 95) return 'typhoon'
  if (code >= 61 || (code >= 80 && code <= 82)) return 'rain'
  return 'sunny'
}

const STATUS_DESC: Record<string, string> = {
  sunny: '絶好のゴミ拾い日和です！',
  rain: '雨天のためクエストは中止されています',
  typhoon: '暴風雨のためクエストは中止されています',
}

// 湘南エリア代表座標（平塚海岸）
const SHONAN_COORDS = { lat: 35.3286, lon: 139.3495 }

export function useWeather() {
  const [weather, setWeather] = useState<WeatherState>({
    status: 'loading',
    description: '天気を確認中...',
  })

  const fetchWeather = useCallback(async () => {
    setWeather({ status: 'loading', description: '天気を確認中...' })

    try {
      // まず手動オーバーライドを確認
      if (isSupabaseConfigured) {
        const today = new Date().toISOString().split('T')[0]
        const { data: overrides } = await supabase
          .from('weather_overrides')
          .select('*')
          .eq('override_date', today)
          .is('quest_id', null)
          .order('created_at', { ascending: false })
          .limit(1)

        if (overrides && overrides.length > 0) {
          const ov = overrides[0]
          const status = ov.is_cancelled ? 'typhoon' : 'sunny'
          setWeather({
            status,
            description: ov.reason || STATUS_DESC[status],
            isManualOverride: true,
            overrideReason: ov.reason,
          })
          return
        }
      }

      // Open-Meteo API（無料・APIキー不要）
      const { lat, lon } = SHONAN_COORDS
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weathercode,windspeed_10m&timezone=Asia%2FTokyo`
      )
      if (!res.ok) throw new Error('Weather API error')
      const data = await res.json()

      const code: number = data.current?.weathercode ?? 0
      const windspeed: number = data.current?.windspeed_10m ?? 0
      const status = classifyWeather(code, windspeed)

      setWeather({
        status,
        description: STATUS_DESC[status],
        windspeed,
        code,
        isManualOverride: false,
      })
    } catch {
      // APIが失敗してもアプリを壊さない
      setWeather({
        status: 'sunny',
        description: '天気情報を取得できませんでした',
        isManualOverride: false,
      })
    }
  }, [])

  useEffect(() => {
    fetchWeather()
  }, [fetchWeather])

  return { weather, refetch: fetchWeather }
}
