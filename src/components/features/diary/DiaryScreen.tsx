import { useState } from 'react'
import { ChevronRight, Scale, Utensils, Dumbbell, X, Plus, Settings, ChevronDown, Trash2 } from 'lucide-react'
import { useDiaryLogs } from '@/hooks/useDiaryLogs'
import { useChallengeSettings } from '@/hooks/useChallengeSettings'
import type { UserProfile, WeightLog, MealLog, ExerciseLog } from '@/types'

type DiaryTab = 'weight' | 'meal' | 'exercise'

const today = () => new Date().toISOString().split('T')[0]

// --- 体重グラフ ---
function WeightChart({ logs }: { logs: WeightLog[] }) {
  if (logs.length < 2) {
    return <p className="text-[11px] text-slate-400 text-center py-4">2件以上記録するとグラフが表示されます</p>
  }
  const W = 280, H = 72, PAD = 12
  const weights = logs.map(l => Number(l.weight_kg))
  const minW = Math.min(...weights)
  const maxW = Math.max(...weights)
  const range = maxW - minW || 0.5
  const pts = logs.map((l, i) => ({
    x: PAD + (i / (logs.length - 1)) * (W - PAD * 2),
    y: PAD + (1 - (Number(l.weight_kg) - minW) / range) * (H - PAD * 2),
    w: Number(l.weight_kg),
  }))
  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ')
  const last = pts[pts.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <polyline points={polyline} fill="none" stroke="#06b6d4" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 4 : 2.5} fill="#06b6d4" />
      ))}
      <text x={last.x} y={last.y - 9} textAnchor="middle" fontSize="10" fill="#0e7490" fontWeight="bold">
        {last.w}kg
      </text>
    </svg>
  )
}

// --- 体重タブ ---
function WeightTab({ logs, onAdd, onDelete }: {
  logs: WeightLog[]
  onAdd: (date: string, kg: number) => Promise<boolean>
  onDelete: (id: string) => void
}) {
  const [date, setDate] = useState(today())
  const [kg, setKg] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const v = parseFloat(kg)
    if (isNaN(v) || v < 20 || v > 300) return
    setSaving(true)
    await onAdd(date, v)
    setSaving(false)
    setKg('')
  }

  const recent = [...logs].slice(-14)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <p className="text-sm font-bold text-slate-700">体重を記録</p>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">日付</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">体重 (kg)</label>
            <input type="number" step="0.1" min="20" max="300" value={kg} onChange={e => setKg(e.target.value)}
              placeholder="例: 72.5"
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || !kg}
          className="w-full py-2.5 bg-cyan-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          <Plus size={16} /> {saving ? '保存中...' : '記録する'}
        </button>
      </div>

      {logs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-600 mb-3">推移グラフ</p>
          <WeightChart logs={recent} />
          {logs.length >= 2 && (
            <div className="flex justify-between mt-2 text-[10px] text-slate-400">
              <span>{recent[0]?.date}</span>
              <span>{recent[recent.length - 1]?.date}</span>
            </div>
          )}
        </div>
      )}

      {logs.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-600 mb-2">記録一覧</p>
          <div className="space-y-2">
            {[...logs].reverse().slice(0, 10).map(log => (
              <div key={log.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">{Number(log.weight_kg).toFixed(1)} kg</p>
                  <p className="text-[10px] text-slate-400">{log.date}</p>
                </div>
                <button onClick={() => onDelete(log.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// --- 食事タブ ---
const MEAL_TYPES = ['朝食', '昼食', '夕食', '間食']
const CALORIE_PRESETS = [300, 500, 700, 1000]

function MealTab({ logs, onAdd, onDelete }: {
  logs: MealLog[]
  onAdd: (date: string, type: string, cal?: number, memo?: string) => Promise<boolean>
  onDelete: (id: string) => void
}) {
  const [date, setDate] = useState(today())
  const [mealType, setMealType] = useState('朝食')
  const [calories, setCalories] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onAdd(date, mealType, calories ? parseInt(calories) : undefined, memo || undefined)
    setSaving(false)
    setCalories('')
    setMemo('')
  }

  const todayLogs = logs.filter(l => l.date === date)
  const todayCalories = todayLogs.reduce((s, l) => s + (l.calories || 0), 0)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">食事を記録</p>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">区分</label>
          <div className="flex gap-2 mt-1">
            {MEAL_TYPES.map(t => (
              <button key={t} onClick={() => setMealType(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${mealType === t ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">カロリー (kcal)</label>
          <div className="flex gap-2 mt-1 mb-2">
            {CALORIE_PRESETS.map(p => (
              <button key={p} onClick={() => setCalories(String(p))}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${calories === String(p) ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600'}`}>
                {p}
              </button>
            ))}
          </div>
          <input type="number" value={calories} onChange={e => setCalories(e.target.value)}
            placeholder="カロリーを入力"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">メモ</label>
          <input value={memo} onChange={e => setMemo(e.target.value)}
            placeholder="例: 鶏むね肉サラダ、ノンオイルドレッシング"
            className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-2.5 bg-cyan-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          <Plus size={16} /> {saving ? '保存中...' : '記録する'}
        </button>
      </div>

      {todayLogs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-600">{date} の食事</p>
            {todayCalories > 0 && (
              <span className="text-xs font-bold text-orange-500">合計 {todayCalories} kcal</span>
            )}
          </div>
          <div className="space-y-2">
            {todayLogs.map(log => (
              <div key={log.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-bold">{log.meal_type}</span>
                    {log.calories && <span className="text-[10px] text-orange-500 font-bold">{log.calories} kcal</span>}
                  </div>
                  {log.memo && <p className="text-xs text-slate-500 mt-1">{log.memo}</p>}
                </div>
                <button onClick={() => onDelete(log.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// --- 運動タブ ---
const EXERCISE_TYPES = ['海ゴミ拾い', 'フラフープ', 'ウォーキング', 'その他']

function ExerciseTab({ logs, onAdd, onDelete }: {
  logs: ExerciseLog[]
  onAdd: (date: string, type: string, mins: number, notes?: string) => Promise<boolean>
  onDelete: (id: string) => void
}) {
  const [date, setDate] = useState(today())
  const [exType, setExType] = useState('海ゴミ拾い')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const mins = parseInt(duration)
    if (isNaN(mins) || mins <= 0) return
    setSaving(true)
    await onAdd(date, exType, mins, notes || undefined)
    setSaving(false)
    setDuration('')
    setNotes('')
  }

  const recentLogs = logs.slice(0, 10)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">運動を記録</p>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">種類</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {EXERCISE_TYPES.map(t => (
              <button key={t} onClick={() => setExType(t)}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${exType === t ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {t === '海ゴミ拾い' ? '🌊 ' : t === 'フラフープ' ? '⭕ ' : t === 'ウォーキング' ? '🚶 ' : '📝 '}{t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">実施時間 (分)</label>
          <div className="flex gap-2 mt-1 mb-2">
            {[20, 30, 40, 60].map(m => (
              <button key={m} onClick={() => setDuration(String(m))}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${duration === String(m) ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {m}分
              </button>
            ))}
          </div>
          <input type="number" value={duration} onChange={e => setDuration(e.target.value)}
            placeholder="分数を入力"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">メモ</label>
          <input value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="例: 平塚海岸、ゴミ袋1.5袋分"
            className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>

        <button onClick={handleSave} disabled={saving || !duration}
          className="w-full py-2.5 bg-cyan-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
          <Plus size={16} /> {saving ? '保存中...' : '記録する'}
        </button>
      </div>

      {recentLogs.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-600 mb-2">運動履歴</p>
          <div className="space-y-2">
            {recentLogs.map(log => (
              <div key={log.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{log.exercise_type}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{log.duration_minutes}分</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{log.date}{log.notes ? ` — ${log.notes}` : ''}</p>
                </div>
                <button onClick={() => onDelete(log.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// --- チャレンジ設定カード ---
function ChallengeSetupCard() {
  const { settings, updateSettings, dayNumber, isActive } = useChallengeSettings()
  const [open, setOpen] = useState(!isActive)
  const [startDate, setStartDate] = useState(settings.startDate || today())
  const [startWeight, setStartWeight] = useState(settings.startWeight ? String(settings.startWeight) : '')
  const [targetWeight, setTargetWeight] = useState(settings.targetWeight ? String(settings.targetWeight) : '')

  const handleSave = () => {
    updateSettings({
      startDate: startDate || null,
      startWeight: startWeight ? parseFloat(startWeight) : null,
      targetWeight: targetWeight ? parseFloat(targetWeight) : null,
    })
    setOpen(false)
  }

  const weightDelta = settings.startWeight && settings.targetWeight
    ? (settings.startWeight - settings.targetWeight).toFixed(1)
    : null

  return (
    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg mb-4">
      <button className="w-full flex items-center justify-between" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2">
          <Settings size={16} />
          <span className="font-bold text-sm">50日チャレンジ設定</span>
          {isActive && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Day {dayNumber} / 50</span>}
        </div>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {!open && isActive && (
        <div className="mt-3 flex justify-between text-sm">
          <div>
            <p className="text-[10px] text-blue-100">開始日</p>
            <p className="font-bold">{settings.startDate}</p>
          </div>
          {settings.startWeight && (
            <div className="text-center">
              <p className="text-[10px] text-blue-100">開始体重</p>
              <p className="font-bold">{settings.startWeight} kg</p>
            </div>
          )}
          {weightDelta && (
            <div className="text-right">
              <p className="text-[10px] text-blue-100">目標減量</p>
              <p className="font-bold">-{weightDelta} kg</p>
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-[10px] text-blue-100 uppercase font-bold">チャレンジ開始日</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full mt-1 bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-blue-100 uppercase font-bold">開始体重 (kg)</label>
              <input type="number" step="0.1" value={startWeight} onChange={e => setStartWeight(e.target.value)}
                placeholder="例: 76.0"
                className="w-full mt-1 bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-blue-100 uppercase font-bold">目標体重 (kg)</label>
              <input type="number" step="0.1" value={targetWeight} onChange={e => setTargetWeight(e.target.value)}
                placeholder="例: 68.0"
                className="w-full mt-1 bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" />
            </div>
          </div>
          <button onClick={handleSave}
            className="w-full py-2.5 bg-white text-cyan-600 rounded-xl font-bold text-sm">
            保存する
          </button>
        </div>
      )}
    </div>
  )
}

// --- メイン DiaryScreen ---
interface Props {
  userProfile: UserProfile
  onBack: () => void
}

export default function DiaryScreen({ userProfile, onBack }: Props) {
  const [tab, setTab] = useState<DiaryTab>('weight')
  const { weightLogs, mealLogs, exerciseLogs, addWeight, deleteWeight, addMeal, deleteMeal, addExercise, deleteExercise } = useDiaryLogs(userProfile.id)

  const tabs: { key: DiaryTab; label: string; icon: typeof Scale }[] = [
    { key: 'weight', label: '体重', icon: Scale },
    { key: 'meal', label: '食事', icon: Utensils },
    { key: 'exercise', label: '運動', icon: Dumbbell },
  ]

  return (
    <div className="bg-slate-50 min-h-screen pb-24 animate-in fade-in duration-300">
      <header className="bg-white border-b border-slate-100 px-4 pt-12 pb-0 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center mb-4">
          <button onClick={onBack} className="mr-3 text-slate-400 hover:text-slate-600">
            <ChevronRight size={24} className="rotate-180" />
          </button>
          <h2 className="text-lg font-black text-slate-800">日記 📓</h2>
        </div>
        <div className="flex border-b border-slate-100">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${tab === t.key ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-slate-400'}`}>
                <Icon size={15} /> {t.label}
              </button>
            )
          })}
        </div>
      </header>

      <main className="p-4 mt-2">
        <ChallengeSetupCard />
        {tab === 'weight' && (
          <WeightTab logs={weightLogs} onAdd={addWeight} onDelete={deleteWeight} />
        )}
        {tab === 'meal' && (
          <MealTab logs={mealLogs} onAdd={addMeal} onDelete={deleteMeal} />
        )}
        {tab === 'exercise' && (
          <ExerciseTab logs={exerciseLogs} onAdd={addExercise} onDelete={deleteExercise} />
        )}
      </main>
    </div>
  )
}
