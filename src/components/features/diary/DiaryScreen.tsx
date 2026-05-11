import { useState, useRef, useEffect } from 'react'
import { ChevronRight, Scale, Utensils, Dumbbell, Plus, Settings, ChevronDown, Trash2, Camera, ImagePlus, Pencil, X } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useDiaryLogs } from '@/hooks/useDiaryLogs'
import { useChallengeSettings } from '@/hooks/useChallengeSettings'
import type { UserProfile, WeightLog, MealLog, ExerciseLog } from '@/types'

type DiaryTab = 'weight' | 'meal' | 'exercise'

const today = () => new Date().toISOString().split('T')[0]

// --- 画像圧縮 ---
async function compressImage(file: File, maxWidth = 1200, quality = 0.75): Promise<File> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => {
        resolve(blob ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : file)
      }, 'image/jpeg', quality)
    }
    img.onerror = () => resolve(file)
    img.src = url
  })
}

// --- 写真アップロード ---
async function uploadDiaryPhoto(file: File, userId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null
  const compressed = await compressImage(file)
  const path = `${userId}/${Date.now()}.jpg`
  const { error } = await supabase.storage.from('diary-photos').upload(path, compressed, { contentType: 'image/jpeg' })
  if (error) return null
  const { data } = supabase.storage.from('diary-photos').getPublicUrl(path)
  return data.publicUrl
}

// --- 写真ピッカー ---
function PhotoPicker({ preview, onPhoto }: { preview: string | null; onPhoto: (file: File, preview: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) onPhoto(f, URL.createObjectURL(f))
        }} />
      {preview ? (
        <div className="relative">
          <img src={preview} alt="preview" className="w-full h-32 object-cover rounded-xl" />
          <button onClick={() => ref.current?.click()}
            className="absolute bottom-2 right-2 bg-black/50 text-white p-1.5 rounded-lg">
            <Camera size={14} />
          </button>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()}
          className="w-full h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:border-cyan-300 hover:text-cyan-400 transition-colors">
          <ImagePlus size={20} />
          <span className="text-[11px] font-medium">写真を追加（任意）</span>
        </button>
      )}
    </div>
  )
}

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
  const last = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <polyline points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 4 : 2.5} fill="#06b6d4" />)}
      <text x={last.x} y={last.y - 9} textAnchor="middle" fontSize="10" fill="#0e7490" fontWeight="bold">{last.w}kg</text>
    </svg>
  )
}

// --- 体重タブ ---
function WeightTab({ logs, onAdd, onDelete, userId }: {
  logs: WeightLog[]
  onAdd: (date: string, kg: number, photoUrl?: string) => Promise<boolean>
  onDelete: (id: string) => void
  userId?: string
}) {
  const [date, setDate] = useState(today())
  const [kg, setKg] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const todayEntry = logs.find(l => l.date === date)

  useEffect(() => {
    const entry = logs.find(l => l.date === date)
    setKg(entry ? String(entry.weight_kg) : '')
    setPhotoPreview(entry?.photo_url || null)
    setPhotoFile(null)
  }, [date, logs])

  const handleSave = async () => {
    const v = parseFloat(kg)
    if (isNaN(v) || v < 20 || v > 300) return
    setSaving(true)
    let photoUrl: string | undefined = todayEntry?.photo_url || undefined
    if (photoFile && userId) {
      const url = await uploadDiaryPhoto(photoFile, userId)
      if (url) photoUrl = url
    }
    await onAdd(date, v, photoUrl)
    setSaving(false)
    setPhotoFile(null)
  }

  const recent = [...logs].slice(-14)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <p className="text-sm font-bold text-slate-700">
          体重を記録
          {todayEntry && <span className="ml-2 text-[10px] bg-cyan-100 text-cyan-600 px-2 py-0.5 rounded-full font-bold">上書きモード</span>}
        </p>
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
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">体型写真（任意）</label>
          <PhotoPicker preview={photoPreview} onPhoto={(f, p) => { setPhotoFile(f); setPhotoPreview(p) }} />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving || !kg}
            className="flex-1 py-2.5 bg-cyan-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            <Plus size={16} /> {saving ? '保存中...' : todayEntry ? '上書き保存' : '記録する'}
          </button>
          {todayEntry && (
            <button onClick={() => onDelete(todayEntry.id)}
              className="px-3 py-2.5 bg-red-50 text-red-500 rounded-xl font-bold text-sm">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {logs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-bold text-slate-600 mb-3">推移グラフ</p>
          <WeightChart logs={recent} />
          {logs.length >= 2 && (
            <div className="flex justify-between mt-2 text-[10px] text-slate-400">
              <span>{recent[0]?.date}</span><span>{recent[recent.length - 1]?.date}</span>
            </div>
          )}
        </div>
      )}

      {logs.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-600 mb-2">記録一覧</p>
          <div className="space-y-2">
            {[...logs].reverse().slice(0, 15).map(log => (
              <div key={log.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                {log.photo_url && <img src={log.photo_url} alt="体型写真" className="w-full h-40 object-cover" />}
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{Number(log.weight_kg).toFixed(1)} kg</p>
                    <p className="text-[10px] text-slate-400">{log.date}</p>
                  </div>
                  <button onClick={() => onDelete(log.id)} className="p-1.5 text-slate-300 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
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

function MealTab({ logs, onAdd, onUpdate, onDelete, userId }: {
  logs: MealLog[]
  onAdd: (date: string, type: string, cal?: number, memo?: string, photoUrl?: string) => Promise<boolean>
  onUpdate: (id: string, date: string, type: string, cal?: number, memo?: string, photoUrl?: string) => Promise<boolean>
  onDelete: (id: string) => void
  userId?: string
}) {
  const [date, setDate] = useState(today())
  const [mealType, setMealType] = useState('朝食')
  const [calories, setCalories] = useState('')
  const [memo, setMemo] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const startEdit = (meal: MealLog) => {
    setEditingId(meal.id)
    setMealType(meal.meal_type)
    setCalories(meal.calories ? String(meal.calories) : '')
    setMemo(meal.memo || '')
    setExistingPhotoUrl(meal.photo_url || null)
    setPhotoPreview(meal.photo_url || null)
    setPhotoFile(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setCalories(''); setMemo('')
    setPhotoFile(null); setPhotoPreview(null); setExistingPhotoUrl(null)
  }

  const handleSave = async () => {
    setSaving(true)
    let photoUrl: string | undefined = existingPhotoUrl || undefined
    if (photoFile && userId) {
      const url = await uploadDiaryPhoto(photoFile, userId)
      if (url) photoUrl = url
    }
    const cal = calories ? parseInt(calories) : undefined
    if (editingId) {
      await onUpdate(editingId, date, mealType, cal, memo || undefined, photoUrl)
      cancelEdit()
    } else {
      await onAdd(date, mealType, cal, memo || undefined, photoUrl)
      setCalories(''); setMemo('')
      setPhotoFile(null); setPhotoPreview(null)
    }
    setSaving(false)
  }

  const todayLogs = logs.filter(l => l.date === date)
  const todayCalories = todayLogs.reduce((s, l) => s + (l.calories || 0), 0)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">
            {editingId ? (
              <span className="flex items-center gap-1.5">
                <Pencil size={14} className="text-cyan-500" /> 食事を編集中
              </span>
            ) : '食事を記録'}
          </p>
          <input type="date" value={date} onChange={e => { setDate(e.target.value); cancelEdit() }}
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
            placeholder="カロリーを直接入力"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">メモ</label>
          <input value={memo} onChange={e => setMemo(e.target.value)}
            placeholder="例: 鶏むね肉サラダ"
            className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">写真（任意）</label>
          <PhotoPicker preview={photoPreview} onPhoto={(f, p) => { setPhotoFile(f); setPhotoPreview(p) }} />
        </div>

        <div className="flex gap-2">
          {editingId && (
            <button onClick={cancelEdit} className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm flex items-center gap-1">
              <X size={14} /> キャンセル
            </button>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 bg-cyan-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            <Plus size={16} /> {saving ? '保存中...' : editingId ? '更新する' : '記録する'}
          </button>
        </div>
      </div>

      {todayLogs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-600">{date} の食事</p>
            {todayCalories > 0 && <span className="text-xs font-bold text-orange-500">合計 {todayCalories} kcal</span>}
          </div>
          <div className="space-y-2">
            {todayLogs.map(log => (
              <div key={log.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${editingId === log.id ? 'border-cyan-300' : 'border-slate-100'}`}>
                {log.photo_url && <img src={log.photo_url} alt="食事写真" className="w-full h-36 object-cover" />}
                <div className="p-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-bold">{log.meal_type}</span>
                      {log.calories && <span className="text-[10px] text-orange-500 font-bold">{log.calories} kcal</span>}
                    </div>
                    {log.memo && <p className="text-xs text-slate-500 mt-1">{log.memo}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(log)} className="p-1.5 text-slate-300 hover:text-cyan-500 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => onDelete(log.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// --- 運動タブ ---
const EXERCISE_TYPES = [
  { key: '海ゴミ拾い', emoji: '🌊' },
  { key: 'プランク', emoji: '💪' },
  { key: 'フラフープ', emoji: '⭕' },
  { key: 'ウォーキング', emoji: '🚶' },
  { key: 'ジョギング', emoji: '🏃' },
  { key: '筋トレ', emoji: '🏋️' },
  { key: 'ストレッチ', emoji: '🧘' },
  { key: 'その他', emoji: '📝' },
]
const TIME_PRESETS = [1, 5, 10, 20, 30, 60]

function ExerciseTab({ logs, onAdd, onUpdate, onDelete }: {
  logs: ExerciseLog[]
  onAdd: (date: string, type: string, mins: number, notes?: string) => Promise<boolean>
  onUpdate: (id: string, date: string, type: string, mins: number, notes?: string) => Promise<boolean>
  onDelete: (id: string) => void
}) {
  const [date, setDate] = useState(today())
  const [exType, setExType] = useState('海ゴミ拾い')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const startEdit = (ex: ExerciseLog) => {
    setEditingId(ex.id)
    setExType(ex.exercise_type)
    setDuration(String(ex.duration_minutes))
    setNotes(ex.notes || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDuration(''); setNotes('')
  }

  const handleSave = async () => {
    const mins = parseInt(duration)
    if (isNaN(mins) || mins <= 0) return
    setSaving(true)
    if (editingId) {
      await onUpdate(editingId, date, exType, mins, notes || undefined)
      cancelEdit()
    } else {
      await onAdd(date, exType, mins, notes || undefined)
      setDuration(''); setNotes('')
    }
    setSaving(false)
  }

  const todayLogs = logs.filter(l => l.date === date)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700">
            {editingId ? (
              <span className="flex items-center gap-1.5"><Pencil size={14} className="text-cyan-500" /> 運動を編集中</span>
            ) : '運動を記録'}
          </p>
          <input type="date" value={date} onChange={e => { setDate(e.target.value); cancelEdit() }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">種類</label>
          <div className="grid grid-cols-4 gap-1.5 mt-1">
            {EXERCISE_TYPES.map(t => (
              <button key={t.key} onClick={() => setExType(t.key)}
                className={`py-2 rounded-xl text-[11px] font-bold transition-all flex flex-col items-center gap-0.5 ${exType === t.key ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <span>{t.emoji}</span>
                <span className="leading-tight">{t.key}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">実施時間</label>
          <div className="grid grid-cols-6 gap-1.5 mt-1 mb-2">
            {TIME_PRESETS.map(m => (
              <button key={m} onClick={() => setDuration(String(m))}
                className={`py-2 rounded-lg text-[11px] font-bold transition-all ${duration === String(m) ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {m}分
              </button>
            ))}
          </div>
          <input type="number" value={duration} onChange={e => setDuration(e.target.value)}
            placeholder="分数を直接入力"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">メモ</label>
          <input value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="例: 平塚海岸、ゴミ袋1.5袋分"
            className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
        </div>

        <div className="flex gap-2">
          {editingId && (
            <button onClick={cancelEdit} className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm flex items-center gap-1">
              <X size={14} /> キャンセル
            </button>
          )}
          <button onClick={handleSave} disabled={saving || !duration}
            className="flex-1 py-2.5 bg-cyan-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            <Plus size={16} /> {saving ? '保存中...' : editingId ? '更新する' : '記録する'}
          </button>
        </div>
      </div>

      {todayLogs.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-600 mb-2">{date} の運動</p>
          <div className="space-y-2">
            {todayLogs.map(log => (
              <div key={log.id} className={`bg-white rounded-xl border shadow-sm p-3 flex items-start justify-between ${editingId === log.id ? 'border-cyan-300' : 'border-slate-100'}`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{log.exercise_type}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{log.duration_minutes}分</span>
                  </div>
                  {log.notes && <p className="text-[10px] text-slate-400 mt-0.5">{log.notes}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(log)} className="p-1.5 text-slate-300 hover:text-cyan-500 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => onDelete(log.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {logs.filter(l => l.date !== date).length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-600 mb-2">過去の運動</p>
          <div className="space-y-2">
            {logs.filter(l => l.date !== date).slice(0, 10).map(log => (
              <div key={log.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{log.exercise_type}</span>
                    <span className="text-[10px] text-slate-500 font-bold">{log.duration_minutes}分</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{log.date}{log.notes ? ` — ${log.notes}` : ''}</p>
                </div>
                <button onClick={() => onDelete(log.id)} className="p-1.5 text-slate-300 hover:text-red-500 shrink-0">
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
  const [totalDays, setTotalDays] = useState(settings.totalDays ? String(settings.totalDays) : '')
  const [garbageGoal, setGarbageGoal] = useState(settings.garbageGoal ? String(settings.garbageGoal) : '')
  const [manualDay, setManualDay] = useState(settings.manualDay ? String(settings.manualDay) : '')
  const [manualGarbage, setManualGarbage] = useState(settings.manualGarbageCount ? String(settings.manualGarbageCount) : '')

  const handleSave = () => {
    updateSettings({
      startDate: startDate || null,
      startWeight: startWeight ? parseFloat(startWeight) : null,
      targetWeight: targetWeight ? parseFloat(targetWeight) : null,
      totalDays: totalDays ? parseInt(totalDays) : null,
      garbageGoal: garbageGoal ? parseInt(garbageGoal) : null,
      manualDay: manualDay ? parseInt(manualDay) : null,
      manualGarbageCount: manualGarbage ? parseInt(manualGarbage) : null,
    })
    setOpen(false)
  }

  const weightDelta = settings.startWeight && settings.targetWeight
    ? (settings.startWeight - settings.targetWeight).toFixed(1) : null
  const displayDay = settings.manualDay ?? dayNumber

  return (
    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg mb-4">
      <button className="w-full flex items-center justify-between" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2">
          <Settings size={16} />
          <span className="font-bold text-sm">チャレンジ設定</span>
          {isActive && displayDay && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Day {displayDay}</span>}
        </div>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {!open && isActive && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div><p className="text-[10px] text-blue-100">開始日</p><p className="font-bold text-xs">{settings.startDate}</p></div>
          {settings.startWeight && <div><p className="text-[10px] text-blue-100">開始体重</p><p className="font-bold text-xs">{settings.startWeight} kg</p></div>}
          {weightDelta && <div><p className="text-[10px] text-blue-100">目標減量</p><p className="font-bold text-xs">-{weightDelta} kg</p></div>}
        </div>
      )}

      {open && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-[10px] text-blue-100 uppercase font-bold">チャレンジ開始日</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full mt-1 bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-blue-100 uppercase font-bold">開始体重 (kg)</label>
              <input type="number" step="0.1" value={startWeight} onChange={e => setStartWeight(e.target.value)} placeholder="例: 76.0"
                className="w-full mt-1 bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-blue-100 uppercase font-bold">目標体重 (kg)</label>
              <input type="number" step="0.1" value={targetWeight} onChange={e => setTargetWeight(e.target.value)} placeholder="例: 68.0"
                className="w-full mt-1 bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-blue-100 uppercase font-bold">チャレンジ日数</label>
              <input type="number" min="1" value={totalDays} onChange={e => setTotalDays(e.target.value)} placeholder="空欄=制限なし"
                className="w-full mt-1 bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-blue-100 uppercase font-bold">ゴミ拾い目標回数</label>
              <input type="number" min="1" value={garbageGoal} onChange={e => setGarbageGoal(e.target.value)} placeholder="空欄=20回"
                className="w-full mt-1 bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-blue-100 uppercase font-bold">Day数（手動）</label>
              <input type="number" min="1" value={manualDay} onChange={e => setManualDay(e.target.value)} placeholder="自動計算"
                className="w-full mt-1 bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-blue-100 uppercase font-bold">ゴミ拾い回数（手動）</label>
              <input type="number" min="0" value={manualGarbage} onChange={e => setManualGarbage(e.target.value)} placeholder="自動取得"
                className="w-full mt-1 bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50" />
            </div>
          </div>
          <p className="text-[10px] text-blue-100/70">※手動入力は空欄で自動計算に戻ります</p>
          <button onClick={handleSave} className="w-full py-2.5 bg-white text-cyan-600 rounded-xl font-bold text-sm">保存する</button>
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
  const {
    weightLogs, mealLogs, exerciseLogs,
    addWeight, deleteWeight,
    addMeal, updateMeal, deleteMeal,
    addExercise, updateExercise, deleteExercise,
  } = useDiaryLogs(userProfile.id)

  const tabs = [
    { key: 'weight' as DiaryTab, label: '体重', Icon: Scale },
    { key: 'meal' as DiaryTab, label: '食事', Icon: Utensils },
    { key: 'exercise' as DiaryTab, label: '運動', Icon: Dumbbell },
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
          {tabs.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${tab === key ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-slate-400'}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 mt-2">
        <ChallengeSetupCard />
        {tab === 'weight' && <WeightTab logs={weightLogs} onAdd={addWeight} onDelete={deleteWeight} userId={userProfile.id} />}
        {tab === 'meal' && <MealTab logs={mealLogs} onAdd={addMeal} onUpdate={updateMeal} onDelete={deleteMeal} userId={userProfile.id} />}
        {tab === 'exercise' && <ExerciseTab logs={exerciseLogs} onAdd={addExercise} onUpdate={updateExercise} onDelete={deleteExercise} />}
      </main>
    </div>
  )
}
