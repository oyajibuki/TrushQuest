import { useState } from 'react'
import { User, Cloud, Award, CalendarDays, Edit3, X, Flame, MapPin, Clock, Hash, ChevronDown, ChevronLeft, ChevronRight, Scale, Utensils, Dumbbell } from 'lucide-react'
import { useDiaryLogs } from '@/hooks/useDiaryLogs'
import type { UserProfile, UserStats, Badge, WeightLog, MealLog, ExerciseLog } from '@/types'

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

const LEVELS = [
  { min: 0,  level: 1,  title: '砂浜の新人',        next: 1  },
  { min: 1,  level: 2,  title: 'ビーチウォーカー',    next: 3  },
  { min: 3,  level: 3,  title: '清掃ビギナー',        next: 5  },
  { min: 5,  level: 4,  title: '海のパトローラー',    next: 8  },
  { min: 8,  level: 5,  title: 'ビーチコーマー',      next: 12 },
  { min: 12, level: 6,  title: '湘南クリーナー',      next: 18 },
  { min: 18, level: 7,  title: '海の守護者',          next: 25 },
  { min: 25, level: 8,  title: '環境アクティビスト',  next: 35 },
  { min: 35, level: 9,  title: '海の伝説',            next: 50 },
  { min: 50, level: 10, title: '地球の守護神',        next: null },
]

function getLevelInfo(questCount: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (questCount >= LEVELS[i].min) return LEVELS[i]
  }
  return LEVELS[0]
}

// --- 証明書モーダル ---
function CertModal({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  const hash = generateCertHash(badge.id, badge.questId, badge.completedAt)
  const timeRange = getTimeRange(badge.completedAt, badge.duration)
  const dateStr = badge.completedAt
    ? new Date(badge.completedAt).toLocaleDateString('ja-JP', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
      })
    : badge.date

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 text-white text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
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

// --- 日記詳細ボトムシート ---
function DayDetailSheet({ date, weightLogs, mealLogs, exerciseLogs, badges, onClose, onBadgeClick }: {
  date: string
  weightLogs: WeightLog[]
  mealLogs: MealLog[]
  exerciseLogs: ExerciseLog[]
  badges: Badge[]
  onClose: () => void
  onBadgeClick: (b: Badge) => void
}) {
  const dayWeights = weightLogs.filter(l => l.date === date)
  const dayMeals = mealLogs.filter(l => l.date === date)
  const dayExercises = exerciseLogs.filter(l => l.date === date)
  const dayBadges = badges.filter(b => b.completedAt ? b.completedAt.startsWith(date) : false)
  const hasData = dayWeights.length > 0 || dayMeals.length > 0 || dayExercises.length > 0 || dayBadges.length > 0

  const dateObj = new Date(date + 'T00:00:00')
  const dateStr = dateObj.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[75vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-3xl">
          <p className="font-bold text-slate-800 text-sm">{dateStr}</p>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-4 pb-8">
          {!hasData && (
            <p className="text-center text-sm text-slate-400 py-10">この日の記録はありません</p>
          )}

          {dayWeights.length > 0 && (
            <section>
              <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-2">
                <Scale size={11} /> 体重
              </p>
              {dayWeights.map(w => (
                <div key={w.id} className="bg-slate-50 rounded-2xl overflow-hidden">
                  {w.photo_url && <img src={w.photo_url} alt="体型写真" className="w-full h-52 object-cover" />}
                  <div className="p-3">
                    <p className="text-2xl font-black text-slate-800">{Number(w.weight_kg).toFixed(1)} <span className="text-sm font-medium text-slate-400">kg</span></p>
                  </div>
                </div>
              ))}
            </section>
          )}

          {dayMeals.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <Utensils size={11} /> 食事
                </p>
                <span className="text-[10px] font-bold text-orange-500">
                  {dayMeals.reduce((s, m) => s + (m.calories || 0), 0)} kcal
                </span>
              </div>
              <div className="space-y-2">
                {dayMeals.map(m => (
                  <div key={m.id} className="bg-slate-50 rounded-xl overflow-hidden">
                    {m.photo_url && <img src={m.photo_url} alt="食事写真" className="w-full h-36 object-cover" />}
                    <div className="p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-bold">{m.meal_type}</span>
                        {m.calories && <span className="text-[10px] text-orange-500 font-bold">{m.calories} kcal</span>}
                      </div>
                      {m.memo && <p className="text-xs text-slate-500 mt-1">{m.memo}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {dayExercises.length > 0 && (
            <section>
              <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-2">
                <Dumbbell size={11} /> 運動
              </p>
              <div className="space-y-1.5">
                {dayExercises.map(e => (
                  <div key={e.id} className="bg-green-50 rounded-xl p-3 flex items-center gap-2">
                    <span className="text-[10px] bg-green-200 text-green-700 px-2 py-0.5 rounded-full font-bold shrink-0">{e.exercise_type}</span>
                    <span className="text-xs text-slate-600 font-bold">{e.duration_minutes}分</span>
                    {e.notes && <span className="text-[10px] text-slate-400 truncate">{e.notes}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {dayBadges.length > 0 && (
            <section>
              <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-2">
                <Award size={11} /> クエスト達成
              </p>
              <div className="space-y-1.5">
                {dayBadges.map(b => (
                  <button key={b.id} onClick={() => onBadgeClick(b)}
                    className="w-full bg-cyan-50 rounded-xl p-3 flex items-center gap-2 text-left hover:bg-cyan-100 transition-colors">
                    <Award size={16} className="text-yellow-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{b.name}</p>
                      {b.calories && <p className="text-[10px] text-orange-500">{b.calories} kcal</p>}
                    </div>
                    <span className="text-[10px] text-cyan-500 font-bold shrink-0">証明書 →</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

// --- カレンダー ---
function DiaryCalendar({ userId, badges }: { userId?: string; badges: Badge[] }) {
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [certBadge, setCertBadge] = useState<Badge | null>(null)
  const { weightLogs, mealLogs, exerciseLogs } = useDiaryLogs(userId)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = new Date().toISOString().split('T')[0]

  const toDateStr = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const hasBadge = (d: number) => badges.some(b => {
    const s = b.completedAt ? b.completedAt.split('T')[0] : null
    return s === toDateStr(d)
  })

  const hasDiary = (d: number) => {
    const ds = toDateStr(d)
    return weightLogs.some(l => l.date === ds) || mealLogs.some(l => l.date === ds) || exerciseLogs.some(l => l.date === ds)
  }

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  return (
    <>
      {certBadge && <CertModal badge={certBadge} onClose={() => setCertBadge(null)} />}
      {selectedDate && (
        <DayDetailSheet
          date={selectedDate}
          weightLogs={weightLogs}
          mealLogs={mealLogs}
          exerciseLogs={exerciseLogs}
          badges={badges}
          onClose={() => setSelectedDate(null)}
          onBadgeClick={b => { setSelectedDate(null); setCertBadge(b) }}
        />
      )}

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <ChevronLeft size={18} />
          </button>
          <span className="font-bold text-slate-700 text-sm">{year}年{month + 1}月</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {['日', '月', '火', '水', '木', '金', '土'].map(d => (
            <div key={d} className="text-[10px] text-slate-400 font-bold py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const ds = toDateStr(day)
            const isToday = ds === todayStr
            const badge = hasBadge(day)
            const diary = hasDiary(day)
            const isSelected = selectedDate === ds

            let bg = 'bg-slate-50 text-slate-500'
            if (isSelected) bg = 'bg-cyan-500 text-white'
            else if (badge && diary) bg = 'bg-gradient-to-br from-cyan-100 to-orange-100 text-slate-700 font-bold'
            else if (badge) bg = 'bg-cyan-100 text-cyan-700 font-bold'
            else if (diary) bg = 'bg-orange-50 text-orange-700 font-bold'
            else if (isToday) bg = 'border-2 border-cyan-400 text-cyan-600 font-bold bg-white'

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(ds === selectedDate ? null : ds)}
                className={`w-full aspect-square flex flex-col items-center justify-center rounded-lg transition-all active:scale-95 ${bg}`}
              >
                <span className="text-[11px] leading-none">{day}</span>
                <div className="flex gap-0.5 mt-0.5">
                  {badge && !isSelected && <span className="w-1 h-1 rounded-full bg-cyan-500 inline-block" />}
                  {diary && !isSelected && <span className="w-1 h-1 rounded-full bg-orange-400 inline-block" />}
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex gap-3 mt-3 justify-center">
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" /> クエスト
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> 日記
          </span>
        </div>
      </div>
    </>
  )
}

export default function ProfileScreen({ userProfile, userStats, isGuest, onEdit, onLogout, onGoogleLogin }: Props) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  const [badgesOpen, setBadgesOpen] = useState(false)

  const levelInfo = getLevelInfo(userStats.totalQuests)

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
              <p className="text-[10px] text-cyan-600 font-bold bg-cyan-50 px-2 py-1 rounded-md">
                Lv.{levelInfo.level} {levelInfo.title}
              </p>
              {levelInfo.next && (
                <p className="text-[9px] text-slate-400">次まであと{levelInfo.next - userStats.totalQuests}回</p>
              )}
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
                現在ゲストモードのため、アプリを閉じると記録が消えてしまいます。
              </p>
              <button onClick={onGoogleLogin}
                className="bg-white text-blue-600 text-sm font-bold py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center w-full">
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

        {/* バッジ一覧（折りたたみ） */}
        <button
          onClick={() => setBadgesOpen(prev => !prev)}
          className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between mb-2 active:scale-[0.99] transition-transform"
        >
          <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <Award size={16} className="text-yellow-500" />
            獲得バッジ
            <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full">
              {userStats.badges.length}個
            </span>
          </span>
          <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${badgesOpen ? 'rotate-180' : ''}`} />
        </button>

        {badgesOpen && (
          userStats.badges.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center text-slate-400 shadow-sm border border-slate-100 mb-2">
              <Award size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold">まだバッジがありません</p>
            </div>
          ) : (
            <div className="space-y-2 mb-2">
              <p className="text-[10px] text-slate-400 text-right pr-1">タップで証明書を表示</p>
              {userStats.badges.map(badge => (
                <button key={badge.id} onClick={() => setSelectedBadge(badge)}
                  className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform hover:border-cyan-200">
                  <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0">
                    <Award size={20} className="text-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{badge.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400">{badge.date}</span>
                      {badge.completedAt && (
                        <span className="text-[10px] text-slate-400">{getTimeRange(badge.completedAt, badge.duration)}</span>
                      )}
                    </div>
                  </div>
                  {badge.calories && (
                    <span className="text-xs font-bold text-orange-500 shrink-0">{badge.calories}kcal</span>
                  )}
                </button>
              ))}
            </div>
          )
        )}

        {/* アクティビティカレンダー */}
        <h3 className="font-bold mt-8 mb-3 flex items-center text-sm text-slate-800">
          <CalendarDays size={18} className="mr-2 text-cyan-600" />
          アクティビティカレンダー
        </h3>
        <p className="text-[10px] text-slate-400 mb-3">日付をタップすると記録を確認できます</p>
        <DiaryCalendar userId={userProfile.id} badges={userStats.badges} />
      </main>
    </div>
  )
}
