import { MapPin, Clock, Flame, ChevronRight, Sun, Wind, Cloud, AlertOctagon, RefreshCw, CalendarDays, Trash2 } from 'lucide-react'
import { useChallengeSettings } from '@/hooks/useChallengeSettings'
import type { Quest, UserStats, WeatherState, AppEvent } from '@/types'

interface Props {
  quests: Quest[]
  weather: WeatherState
  userStats: UserStats
  events: AppEvent[]
  onQuestSelect: (quest: Quest) => void
  onWeatherRefresh: () => void
}

function EventsBanner({ events }: { events: AppEvent[] }) {
  if (events.length === 0) return null
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  return (
    <div className="mb-4 space-y-2">
      {events.map(ev => {
        const isToday = ev.event_date === today
        const isTomorrow = ev.event_date === tomorrow
        const badge = isToday ? { label: '本日開催', cls: 'bg-red-500' }
          : isTomorrow ? { label: '明日開催', cls: 'bg-orange-400' }
          : null
        return (
          <div key={ev.id} className="bg-white/20 border border-white/30 rounded-2xl p-3 backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <CalendarDays size={16} className="text-white mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-white">{ev.title}</p>
                  {badge && (
                    <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
                {ev.location && <p className="text-[10px] text-blue-100 mt-0.5">{ev.location}</p>}
                {ev.description && <p className="text-[10px] text-white/70 mt-0.5">{ev.description}</p>}
                <p className="text-[10px] text-blue-100/60 mt-1">{ev.event_date}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function WeatherBanner({ weather, onRefresh }: { weather: WeatherState; onRefresh: () => void }) {
  const isCancelled = weather.status === 'rain' || weather.status === 'typhoon'
  const isLoading = weather.status === 'loading'

  const bgClass = isCancelled
    ? 'bg-red-500/80 border-red-400'
    : 'bg-white/20 border-white/30'

  const Icon = weather.status === 'typhoon' ? Wind : weather.status === 'rain' ? Cloud : Sun
  const iconClass =
    weather.status === 'typhoon'
      ? 'text-white animate-pulse'
      : weather.status === 'rain'
        ? 'text-blue-200'
        : 'text-yellow-300'

  const label =
    weather.status === 'typhoon'
      ? '現在の天候: 暴風雨'
      : weather.status === 'rain'
        ? '現在の天候: 雨'
        : weather.status === 'loading'
          ? '天気を確認中...'
          : '現在の天候: 晴れ'

  return (
    <div className={`mb-6 p-3 rounded-xl flex items-center justify-between border backdrop-blur-sm transition-colors ${bgClass}`}>
      <div className="flex items-center flex-1">
        {isLoading ? (
          <RefreshCw size={20} className="text-white mr-2 animate-spin" />
        ) : (
          <Icon size={20} className={`mr-2 ${iconClass}`} />
        )}
        <div>
          <p className="text-xs font-bold opacity-80 text-white">{label}</p>
          <p className="text-[10px] text-white/80">{weather.description}</p>
          {weather.isManualOverride && (
            <span className="text-[9px] bg-black/20 px-1.5 py-0.5 rounded text-white/90 mt-0.5 inline-block">
              手動設定中
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onRefresh}
        className="p-2 rounded-lg bg-black/10 hover:bg-black/20 transition-colors"
        title="天気を更新"
      >
        <RefreshCw size={14} className="text-white" />
      </button>
    </div>
  )
}

function ChallengeCard({ questCount }: { questCount: number }) {
  const { settings, dayNumber, isActive } = useChallengeSettings()
  if (!isActive || !dayNumber) return null

  const garbageCount = Math.min(questCount, 20)
  const garbagePct = (garbageCount / 20) * 100
  const dayPct = (dayNumber / 50) * 100
  const weightDelta = settings.startWeight && settings.targetWeight
    ? (settings.startWeight - settings.targetWeight).toFixed(1)
    : null

  return (
    <div className="mb-4 bg-white/15 border border-white/25 rounded-2xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-white/80 uppercase tracking-wider">🌊 50日チャレンジ</p>
        <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
          Day {dayNumber} / 50
        </span>
      </div>

      <div className="space-y-2.5">
        <div>
          <div className="flex justify-between text-[10px] text-blue-100 mb-1">
            <span>チャレンジ進捗</span>
            <span>{dayNumber} / 50日</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/80 rounded-full transition-all" style={{ width: `${dayPct}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-blue-100 mb-1">
            <span><Trash2 size={10} className="inline mr-0.5" />ゴミ拾い</span>
            <span>{garbageCount} / 20回</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-300 rounded-full transition-all" style={{ width: `${garbagePct}%` }} />
          </div>
        </div>
      </div>

      {weightDelta && (
        <p className="text-[10px] text-blue-100 mt-2 text-right">
          目標減量: <span className="font-bold text-white">-{weightDelta} kg</span>
        </p>
      )}
    </div>
  )
}

export default function HomeScreen({ quests, weather, userStats, events, onQuestSelect, onWeatherRefresh }: Props) {
  const isCancelled = weather.status === 'rain' || weather.status === 'typhoon'

  return (
    <div className="pb-20 animate-in fade-in duration-300">
      <header className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-6 rounded-b-[2rem] shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black tracking-tight">TrashQuest</h1>
        </div>
        <p className="text-blue-50 text-sm font-medium mb-4">地球を綺麗にしながら、自分も健康に。</p>

        <ChallengeCard questCount={userStats.totalQuests} />
        <WeatherBanner weather={weather} onRefresh={onWeatherRefresh} />
        <EventsBanner events={events} />

        <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20">
          <div>
            <p className="text-[10px] text-blue-100 uppercase tracking-wider mb-1">今月の消費カロリー</p>
            <p className="text-3xl font-black flex items-baseline">
              {userStats.totalCalories}
              <span className="text-sm font-medium ml-1 opacity-80">kcal</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-blue-100 uppercase tracking-wider mb-1">達成クエスト</p>
            <p className="text-3xl font-black flex items-baseline justify-end">
              {userStats.totalQuests}
              <span className="text-sm font-medium ml-1 opacity-80">回</span>
            </p>
          </div>
        </div>
      </header>

      <main className="p-5 mt-2">
        <h2 className="text-lg font-bold text-slate-800 mb-4">近くのクエスト</h2>
        <div className="space-y-5">
          {quests.map(quest => (
            <div
              key={quest.id}
              className={`bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative transition-all ${
                isCancelled ? 'opacity-70 grayscale-[30%]' : 'cursor-pointer active:scale-[0.98]'
              }`}
              onClick={() => { if (!isCancelled) onQuestSelect(quest) }}
            >
              {isCancelled && (
                <div className="absolute inset-0 bg-slate-900/20 z-20 flex items-center justify-center backdrop-blur-[2px]">
                  <div className="bg-red-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg flex items-center">
                    <AlertOctagon size={18} className="mr-2" />
                    {weather.status === 'typhoon' ? '暴風雨のため中止' : '雨天のため中止'}
                  </div>
                </div>
              )}
              <div className="h-40 w-full relative">
                <img src={quest.image} alt={quest.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-bold text-white text-lg mb-1">{quest.title}</h3>
                  <div className="flex items-center text-xs text-slate-200">
                    <MapPin size={12} className="mr-1 text-cyan-400" />
                    {quest.location}
                  </div>
                </div>
              </div>
              <div className="p-4 flex justify-between items-center bg-white">
                <div className="flex space-x-3">
                  <span className="flex items-center bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-lg text-xs font-medium">
                    <Clock size={14} className="mr-1.5 text-slate-400" /> {quest.duration}
                  </span>
                  <span className="flex items-center bg-orange-50 text-orange-600 px-2.5 py-1.5 rounded-lg text-xs font-bold">
                    <Flame size={14} className="mr-1.5" /> {quest.calories}kcal
                  </span>
                </div>
                <div className="w-8 h-8 bg-cyan-50 rounded-full flex items-center justify-center text-cyan-600">
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
