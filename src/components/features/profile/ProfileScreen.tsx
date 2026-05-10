import { User, Cloud, Award, CalendarDays, CheckCircle2, Edit3 } from 'lucide-react'
import type { UserProfile, UserStats } from '@/types'

interface Props {
  userProfile: UserProfile
  userStats: UserStats
  isGuest: boolean
  onEdit: () => void
  onLogout: () => void
  onGoogleLogin: () => void
}

export default function ProfileScreen({ userProfile, userStats, isGuest, onEdit, onLogout, onGoogleLogin }: Props) {
  const level = userStats.totalQuests > 0 ? Math.floor(userStats.totalQuests / 2) + 1 : 1

  // カレンダー: 今月のアクティビティを表示
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()

  // 完了日のセット（日付のみ比較）
  const completedDays = new Set<number>()
  userStats.badges.forEach(badge => {
    const d = typeof badge.date === 'string' ? new Date(badge.date) : null
    if (d && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
      completedDays.add(d.getDate())
    }
  })

  return (
    <div className="pb-24 bg-slate-50 min-h-screen animate-in fade-in duration-300">
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
            <p className="text-3xl font-black text-orange-500">{userStats.totalCalories}<span className="text-sm font-medium ml-1">kcal</span></p>
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 mb-1 font-bold">完了クエスト</p>
            <p className="text-3xl font-black text-cyan-600">{userStats.totalQuests}<span className="text-sm font-medium ml-1">回</span></p>
          </div>
        </div>

        <h3 className="font-bold mb-3 text-sm text-slate-800">獲得バッジ</h3>
        {userStats.badges.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center text-slate-400 shadow-sm border border-slate-100">
            <Award size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs font-bold">まだバッジがありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {userStats.badges.map(badge => (
              <div key={badge.id} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100">
                <Award size={24} className="text-yellow-500 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-slate-700 leading-tight">{badge.name}</p>
                <p className="text-[9px] text-slate-400 mt-1">{badge.date}</p>
              </div>
            ))}
          </div>
        )}

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
