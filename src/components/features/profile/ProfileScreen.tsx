import { useState } from 'react'
import { User, Cloud, Award, CalendarDays, CheckCircle2, Edit3, X, Flame, MapPin, Clock, Hash } from 'lucide-react'
import type { UserProfile, UserStats, Badge } from '@/types'

interface Props {
  userProfile: UserProfile
  userStats: UserStats
  isGuest: boolean
  onEdit: () => void
  onLogout: () => void
  onGoogleLogin: () => void
}

function generateCertHash(id: string | number, questId?: number, completedAt?: string): string {
  const data = `TrashQuest:${id}:${questId ?? ''}:${completedAt ?? ''}`
  let hash = 5381
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) + hash) ^ data.charCodeAt(i)
    hash = hash & hash
  }
  return `TQ-${Math.abs(hash).toString(16).padStart(8, '0').toUpperCase()}`
}

function parseDurationMinutes(duration?: string): number {
  if (!duration) return 30
  const m = duration.match(/(\d+)/)
  return m ? parseInt(m[1]) : 30
}

function getTimeRange(completedAt?: string, duration?: string): string {
  if (!completedAt) return '時刻不明'
  const end = new Date(completedAt)
  const minutes = parseDurationMinutes(duration)
  const start = new Date(end.getTime() - minutes * 60 * 1000)
  const fmt = (d: Date) =>
    `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  return `${fmt(start)} 〜 ${fmt(end)}`
}

function CertModal({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  const hash = generateCertHash(badge.id, badge.questId, badge.completedAt)
  const timeRange = getTimeRange(badge.completedAt, badge.duration)
  const dateStr = badge.completedAt
    ? new Date(badge.completedAt).toLocaleDateString('ja-JP', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
      })
    : badge.date

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
          >
            <X size={16} />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Award size={32} className="text-yellow-300" />
          </div>
          <p className="text-xs text-blue-100 uppercase tracking-widest mb-1">TrashQuest</p>
          <h3 className="text-lg font-black">清掃活動 証明書</h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center border-b border-dashed border-slate-200 pb-4">
            <p className="text-xs text-slate-400 mb-1">クエスト名</p>
            <p className="text-base font-black text-slate-800">{badge.name}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CalendarDays size={16} className="text-cyan-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">実施日</p>
                <p className="text-sm font-bold text-slate-700">{dateStr}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock size={16} className="text-cyan-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">活動時間</p>
                <p className="text-sm font-bold text-slate-700">{timeRange}</p>
              </div>
            </div>

            {badge.location && (
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-cyan-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">活動場所</p>
                  <p className="text-sm font-bold text-slate-700">{badge.location}</p>
                </div>
              </div>
            )}

            {badge.calories && (
              <div className="flex items-start gap-3">
                <Flame size={16} className="text-orange-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">消費カロリー</p>
                  <p className="text-sm font-bold text-slate-700">{badge.calories} kcal</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <Hash size={12} className="text-slate-400" />
              <p className="text-[10px] text-slate-400 font-bold uppercase">証明ハッシュ</p>
            </div>
            <p className="text-xs font-mono text-slate-600 tracking-wider">{hash}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfileScreen({ userProfile, userStats, isGuest, onEdit, onLogout, onGoogleLogin }: Props) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)

  const level = userStats.totalQuests > 0 ? Math.floor(userStats.totalQuests / 2) + 1 : 1

  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()

  const completedDays = new Set<number>()
  userStats.badges.forEach(badge => {
    const d = badge.completedAt
      ? new Date(badge.completedAt)
      : typeof badge.date === 'string' ? new Date(badge.date) : null
    if (d && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
      completedDays.add(d.getDate())
    }
  })

  return (
    <div className="pb-24 bg-slate-50 min-h-screen animate-in fade-in duration-300">
      {selectedBadge && (
        <CertModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
      )}

      <header className="bg-white p-6 border-b border-slate-100 pt-12 relative overflow-hidden">
        <div className="flex items-center relative z-10">
          <div className="w-20 h-20 bg-cyan-500 rounded-full flex items-center justify-center text-white mr-5 border-4 border-white shadow-sm shrink-0 overflow-hidden">
            {userProfile.avatarUrl ? (
              <img src={userProfile.avatarUrl} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <User size={36} />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-slate-800 break-words line-clamp-2">{userProfile.name}</h2>
            <div className="flex items-center mt-1 flex-wrap gap-1">
              <p className="text-[10px] text-cyan-600 font-bold bg-cyan-50 px-2 py-1 rounded-md">Lv. {level}</p>
              {!isGuest && (
                <span className="flex items-center text-[9px] text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                  <Cloud size={10} className="mr-1" /> クラウド保存ON
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 relative z-10">
          <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{userProfile.bio}</p>
        </div>
        <div className="absolute top-6 right-6 flex items-center space-x-4">
          <button onClick={onEdit} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <Edit3 size={16} />
          </button>
          <button onClick={onLogout} className="text-[10px] text-slate-400 font-bold hover:text-slate-600">
            ログアウト
          </button>
        </div>
      </header>

      <main className="p-5 mt-2">
        {isGuest && (
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-5 text-white mb-6 shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-1 flex items-center">
                <Cloud size={20} className="mr-2" /> 記録を保存しませんか？
              </h3>
              <p className="text-xs text-blue-50 mb-4 leading-relaxed">
                現在ゲストモードのため、アプリを閉じると記録が消えてしまいます。Googleアカウントでログインすると、記録をクラウドに保存できます。
              </p>
              <button
                onClick={onGoogleLogin}
                className="bg-white text-blue-600 text-sm font-bold py-2.5 px-4 rounded-xl shadow-sm hover:scale-[0.98] transition-transform flex items-center justify-center w-full"
              >
                Googleでログインして保存する
              </button>
            </div>
            <Award size={100} className="absolute -right-6 -bottom-6 text-white opacity-10" />
          </div>
        )}

        <h3 className="font-bold mb-3 text-sm text-slate-800">実績</h3>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 mb-1 font-bold">総消費カロリー</p>
            <p className="text-3xl font-black text-orange-500">
              {userStats.totalCalories}<span className="text-sm font-medium ml-1">kcal</span>
            </p>
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 mb-1 font-bold">完了クエスト</p>
            <p className="text-3xl font-black text-cyan-600">
              {userStats.totalQuests}<span className="text-sm font-medium ml-1">回</span>
            </p>
          </div>
        </div>

        {/* バッジ一覧 */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Award size={16} className="text-yellow-500" />
            獲得バッジ
            <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full">
              {userStats.badges.length}個
            </span>
          </h3>
          <p className="text-[10px] text-slate-400">タップで証明書を表示</p>
        </div>

        {userStats.badges.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center text-slate-400 shadow-sm border border-slate-100">
            <Award size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold">まだバッジがありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {userStats.badges.map(badge => (
              <button
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform hover:border-cyan-200"
              >
                <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0">
                  <Award size={20} className="text-yellow-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{badge.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400">{badge.date}</span>
                    {badge.completedAt && (
                      <span className="text-[10px] text-slate-400">
                        {getTimeRange(badge.completedAt, badge.duration)}
                      </span>
                    )}
                  </div>
                </div>
                {badge.calories && (
                  <span className="text-xs font-bold text-orange-500 shrink-0">
                    {badge.calories}kcal
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* アクティビティカレンダー */}
        <h3 className="font-bold mt-8 mb-3 flex items-center text-sm text-slate-800">
          <CalendarDays size={18} className="mr-2 text-cyan-600" />
          アクティビティカレンダー
        </h3>
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-slate-700 text-sm">
              {today.getFullYear()}年{today.getMonth() + 1}月の活動
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['日', '月', '火', '水', '木', '金', '土'].map(day => (
              <div key={day} className="text-[10px] text-slate-400 font-bold">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const isToday = day === today.getDate()
              const hasActivity = completedDays.has(day)
              let bgClass = 'bg-slate-50 text-slate-600'
              if (hasActivity) bgClass = 'bg-cyan-100 text-cyan-700 font-bold border border-cyan-300'
              else if (isToday) bgClass = 'bg-white border-2 border-cyan-500 font-bold text-cyan-600 shadow-sm'
              return (
                <div key={day} className={`w-full aspect-square flex flex-col items-center justify-center rounded-lg transition-all ${bgClass}`}>
                  <span className="text-[11px]">{day}</span>
                  {hasActivity && <CheckCircle2 size={10} className="text-cyan-600 mt-0.5" />}
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
