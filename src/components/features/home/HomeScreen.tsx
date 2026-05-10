import { MapPin, Clock, Flame, ChevronRight, Sun, Wind, Cloud, AlertOctagon, RefreshCw } from 'lucide-react'
import type { Quest, UserStats, WeatherState } from '@/types'

interface Props {
  quests: Quest[]
  weather: WeatherState
  userStats: UserStats
  onQuestSelect: (quest: Quest) => void
  onWeatherRefresh: () => void
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

export default function HomeScreen({ quests, weather, userStats, onQuestSelect, onWeatherRefresh }: Props) {
  const isCancelled = weather.status === 'rain' || weather.status === 'typhoon'

  return (
    <div className="pb-20 animate-in fade-in duration-300">
      <header className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-6 rounded-b-[2rem] shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black tracking-tight">TrashQuest</h1>
        </div>
        <p className="text-blue-50 text-sm font-medium mb-4">地球を綺麗にしながら、自分も健康に。</p>

        <WeatherBanner weather={weather} onRefresh={onWeatherRefresh} />

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
