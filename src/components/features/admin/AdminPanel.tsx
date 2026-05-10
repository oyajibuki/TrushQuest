import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import {
  ChevronRight, Shield, MapPin, Cloud, Users,
  Save, X, CheckCircle2, AlertOctagon, Sun, RefreshCw, CalendarDays, Plus
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Quest, WeatherOverride, AdminProfile, AppEvent } from '@/types'

interface Props {
  quests: Quest[]
  onBack: () => void
  onUpdateQuestSettings: (questId: number, settings: Record<string, string>) => Promise<boolean>
  onAddQuest: (quest: NewQuestForm) => Promise<boolean>
  onDeleteQuest: (questId: number) => Promise<boolean>
}

interface NewQuestForm {
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
}

type Tab = 'quest' | 'weather' | 'users' | 'events'

const EMPTY_NEW_QUEST: NewQuestForm = {
  title: '', location: '', city: '', duration: '', calories: 0, difficulty: 'Easy',
  lat: 0, lon: 0, image: '',
  bag_pickup_name: '', bag_pickup_map_url: '', bag_pickup_image: '',
  dropoff_name: '', dropoff_map_url: '', dropoff_image: '',
}

// --- Quest Settings Tab ---
function QuestSettingsTab({
  quests,
  onUpdate,
  onAdd,
  onDelete,
}: {
  quests: Quest[]
  onUpdate: (id: number, s: Record<string, string>) => Promise<boolean>
  onAdd: (q: NewQuestForm) => Promise<boolean>
  onDelete: (id: number) => Promise<boolean>
}) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const [form, setForm] = useState<Record<number, Record<string, string>>>({})
  const [saving, setSaving] = useState<number | null>(null)
  const [saved, setSaved] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newQuest, setNewQuest] = useState<NewQuestForm>(EMPTY_NEW_QUEST)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  const DEFAULT_IDS = new Set([1, 2])

  const initForm = (quest: Quest) => {
    if (!form[quest.id]) {
      setForm(prev => ({
        ...prev,
        [quest.id]: {
          bag_pickup_name: quest.bagPickup.name,
          bag_pickup_map_url: quest.bagPickup.mapUrl,
          bag_pickup_image: quest.bagPickup.image,
          dropoff_name: quest.dropoff.name,
          dropoff_map_url: quest.dropoff.mapUrl,
          dropoff_image: quest.dropoff.image,
        },
      }))
    }
  }

  const handleExpand = (quest: Quest) => {
    if (expanded === quest.id) {
      setExpanded(null)
    } else {
      setExpanded(quest.id)
      initForm(quest)
    }
  }

  const handleSave = async (questId: number) => {
    setSaving(questId)
    const ok = await onUpdate(questId, form[questId])
    setSaving(null)
    if (ok) {
      setSaved(questId)
      setTimeout(() => setSaved(null), 2000)
    }
  }

  const handleAdd = async () => {
    if (!newQuest.title || !newQuest.location) return
    setAdding(true)
    const ok = await onAdd(newQuest)
    setAdding(false)
    if (ok) {
      setNewQuest(EMPTY_NEW_QUEST)
      setShowAddForm(false)
    }
  }

  const handleDelete = async (questId: number) => {
    if (!confirm(`「${quests.find(q => q.id === questId)?.title}」を削除しますか？`)) return
    setDeleting(questId)
    await onDelete(questId)
    setDeleting(null)
  }

  const setNQ = (key: keyof NewQuestForm, value: string | number) =>
    setNewQuest(prev => ({ ...prev, [key]: value }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500">ゴミ袋の受取場所・集積所を管理できます。</p>
        <button
          onClick={() => setShowAddForm(v => !v)}
          className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500 text-white rounded-xl text-xs font-bold"
        >
          <Plus size={14} /> クエスト追加
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-2xl border border-cyan-200 shadow-sm p-4 space-y-3">
          <p className="text-sm font-bold text-slate-700">新しいクエストを追加</p>

          <Section label="基本情報">
            <Field label="タイトル *" value={newQuest.title} onChange={v => setNQ('title', v)} placeholder="例: 鎌倉海岸ビーチクリーン" />
            <Field label="場所 (都道府県 市区町村)" value={newQuest.location} onChange={v => setNQ('location', v)} placeholder="例: 神奈川県 鎌倉市" />
            <Field label="市区町村" value={newQuest.city} onChange={v => setNQ('city', v)} placeholder="例: 鎌倉市" />
            <div className="flex gap-2">
              <Field label="所要時間" value={newQuest.duration} onChange={v => setNQ('duration', v)} placeholder="例: 45分" />
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">カロリー</label>
                <input type="number" className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="例: 220" value={newQuest.calories || ''}
                  onChange={e => setNQ('calories', Number(e.target.value))} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">難易度</label>
              <select className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                value={newQuest.difficulty} onChange={e => setNQ('difficulty', e.target.value)}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">緯度</label>
                <input type="number" step="0.0001" className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="例: 35.3286" value={newQuest.lat || ''}
                  onChange={e => setNQ('lat', Number(e.target.value))} />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">経度</label>
                <input type="number" step="0.0001" className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="例: 139.3495" value={newQuest.lon || ''}
                  onChange={e => setNQ('lon', Number(e.target.value))} />
              </div>
            </div>
            <Field label="クエスト画像URL" value={newQuest.image} onChange={v => setNQ('image', v)} placeholder="https://..." />
          </Section>

          <Section label="袋受取場所">
            <Field label="場所名 *" value={newQuest.bag_pickup_name} onChange={v => setNQ('bag_pickup_name', v)} placeholder="例: 管理棟前 ボックス" />
            <Field label="GoogleマップURL" value={newQuest.bag_pickup_map_url} onChange={v => setNQ('bag_pickup_map_url', v)} placeholder="https://maps.google.com/..." />
            <Field label="写真URL" value={newQuest.bag_pickup_image} onChange={v => setNQ('bag_pickup_image', v)} placeholder="https://..." />
          </Section>

          <Section label="ゴミ集積所">
            <Field label="場所名 *" value={newQuest.dropoff_name} onChange={v => setNQ('dropoff_name', v)} placeholder="例: 南側 指定集積所" />
            <Field label="GoogleマップURL" value={newQuest.dropoff_map_url} onChange={v => setNQ('dropoff_map_url', v)} placeholder="https://maps.google.com/..." />
            <Field label="写真URL" value={newQuest.dropoff_image} onChange={v => setNQ('dropoff_image', v)} placeholder="https://..." />
          </Section>

          <div className="flex gap-2">
            <button onClick={() => { setShowAddForm(false); setNewQuest(EMPTY_NEW_QUEST) }}
              className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">
              キャンセル
            </button>
            <button onClick={handleAdd} disabled={adding || !newQuest.title || !newQuest.location}
              className="flex-1 py-2.5 bg-cyan-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              {adding ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
              {adding ? '追加中...' : '追加'}
            </button>
          </div>
        </div>
      )}

      {quests.map(quest => (
        <div key={quest.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 text-left"
            onClick={() => handleExpand(quest)}
          >
            <div className="flex items-center min-w-0">
              <MapPin size={16} className="text-cyan-500 mr-2 shrink-0" />
              <span className="font-bold text-sm text-slate-800 truncate">{quest.title}</span>
              {!DEFAULT_IDS.has(quest.id) && (
                <span className="ml-2 shrink-0 text-[9px] bg-cyan-100 text-cyan-600 px-1.5 py-0.5 rounded-full font-bold">追加</span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {!DEFAULT_IDS.has(quest.id) && (
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(quest.id) }}
                  disabled={deleting === quest.id}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  {deleting === quest.id ? <RefreshCw size={14} className="animate-spin" /> : <X size={14} />}
                </button>
              )}
              <ChevronRight size={18} className={`text-slate-400 transition-transform ${expanded === quest.id ? 'rotate-90' : ''}`} />
            </div>
          </button>

          {expanded === quest.id && form[quest.id] && (
            <div className="px-4 pb-4 border-t border-slate-100 pt-4 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">袋受取場所</p>
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="場所名"
                  value={form[quest.id].bag_pickup_name}
                  onChange={e => setForm(prev => ({ ...prev, [quest.id]: { ...prev[quest.id], bag_pickup_name: e.target.value } }))}
                />
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="GoogleマップURL"
                  value={form[quest.id].bag_pickup_map_url}
                  onChange={e => setForm(prev => ({ ...prev, [quest.id]: { ...prev[quest.id], bag_pickup_map_url: e.target.value } }))}
                />
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="写真URL"
                  value={form[quest.id].bag_pickup_image}
                  onChange={e => setForm(prev => ({ ...prev, [quest.id]: { ...prev[quest.id], bag_pickup_image: e.target.value } }))}
                />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">ゴミ集積所</p>
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="場所名"
                  value={form[quest.id].dropoff_name}
                  onChange={e => setForm(prev => ({ ...prev, [quest.id]: { ...prev[quest.id], dropoff_name: e.target.value } }))}
                />
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="GoogleマップURL"
                  value={form[quest.id].dropoff_map_url}
                  onChange={e => setForm(prev => ({ ...prev, [quest.id]: { ...prev[quest.id], dropoff_map_url: e.target.value } }))}
                />
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="写真URL"
                  value={form[quest.id].dropoff_image}
                  onChange={e => setForm(prev => ({ ...prev, [quest.id]: { ...prev[quest.id], dropoff_image: e.target.value } }))}
                />
              </div>
              {DEFAULT_IDS.has(quest.id) && (
                <button
                  onClick={() => handleSave(quest.id)}
                  disabled={saving === quest.id}
                  className="w-full py-3 bg-cyan-500 text-white rounded-xl font-bold text-sm flex items-center justify-center disabled:opacity-60"
                >
                  {saving === quest.id ? <RefreshCw size={16} className="animate-spin mr-2" /> : saved === quest.id ? <CheckCircle2 size={16} className="mr-2" /> : <Save size={16} className="mr-2" />}
                  {saving === quest.id ? '保存中...' : saved === quest.id ? '保存しました！' : '変更を保存'}
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">{label}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-500 uppercase">{label}</label>
      <input
        className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

// --- Weather Override Tab ---
function WeatherTab() {
  const [overrides, setOverrides] = useState<WeatherOverride[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isCancelled, setIsCancelled] = useState(true)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadOverrides = async () => {
    if (!isSupabaseConfigured) return
    const { data } = await supabase
      .from('weather_overrides')
      .select('*')
      .gte('override_date', new Date().toISOString().split('T')[0])
      .order('override_date', { ascending: true })
      .limit(10)
    setOverrides(data || [])
    setLoading(false)
  }

  useEffect(() => { loadOverrides() }, [])

  const handleSave = async () => {
    if (!isSupabaseConfigured) return
    setSaving(true)
    await supabase.from('weather_overrides').upsert({
      quest_id: null,
      override_date: date,
      is_cancelled: isCancelled,
      reason: reason || null,
    })
    setReason('')
    await loadOverrides()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!isSupabaseConfigured) return
    await supabase.from('weather_overrides').delete().eq('id', id)
    await loadOverrides()
  }

  return (
    <div>
      <p className="text-xs text-slate-500 mb-4">
        天気APIの結果を上書きして、手動でクエストの開催・中止を設定できます。
      </p>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
        <p className="text-sm font-bold text-slate-700 mb-3">手動設定を追加</p>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">日付</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">開催状況</label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setIsCancelled(false)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${!isCancelled ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'}`}
              >
                <Sun size={16} className="mr-1.5" /> 開催
              </button>
              <button
                onClick={() => setIsCancelled(true)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${isCancelled ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'}`}
              >
                <AlertOctagon size={16} className="mr-1.5" /> 中止
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">理由（任意）</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="例: 台風接近のため"
              className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-cyan-500 text-white rounded-xl font-bold text-sm flex items-center justify-center disabled:opacity-60"
          >
            {saving ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
            {saving ? '保存中...' : '設定を保存'}
          </button>
        </div>
      </div>

      <p className="text-xs font-bold text-slate-600 mb-2">今後の手動設定</p>
      {loading ? (
        <p className="text-xs text-slate-400">読み込み中...</p>
      ) : overrides.length === 0 ? (
        <p className="text-xs text-slate-400">手動設定はありません（天気APIを自動使用）</p>
      ) : (
        <div className="space-y-2">
          {overrides.map(ov => (
            <div key={ov.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center justify-between">
              <div className="flex items-center">
                {ov.is_cancelled
                  ? <AlertOctagon size={16} className="text-red-500 mr-2" />
                  : <Sun size={16} className="text-green-500 mr-2" />}
                <div>
                  <p className="text-xs font-bold text-slate-700">{ov.override_date} — {ov.is_cancelled ? '中止' : '開催'}</p>
                  {ov.reason && <p className="text-[10px] text-slate-400">{ov.reason}</p>}
                </div>
              </div>
              <button onClick={() => handleDelete(ov.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Admin Users Tab ---
function UsersTab() {
  const [users, setUsers] = useState<AdminProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const loadUsers = async () => {
    if (!isSupabaseConfigured) return
    const { data } = await supabase
      .from('profiles')
      .select('id, email, nickname, is_admin, created_at')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  const toggleAdmin = async (userId: string, current: boolean) => {
    if (!isSupabaseConfigured) return
    setUpdating(userId)
    await supabase.from('profiles').update({ is_admin: !current }).eq('id', userId)
    await loadUsers()
    setUpdating(null)
  }

  return (
    <div>
      <p className="text-xs text-slate-500 mb-4">
        Googleログインしたユーザーを管理者に設定できます。<br />
        ※ 新しい管理者候補はGoogleでログインしてもらってから追加してください。
      </p>

      {loading ? (
        <p className="text-xs text-slate-400">読み込み中...</p>
      ) : users.length === 0 ? (
        <p className="text-xs text-slate-400">ユーザーがいません</p>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
              <div className="flex items-center min-w-0">
                <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center mr-3 shrink-0">
                  <Users size={16} className="text-cyan-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{u.nickname || u.email}</p>
                  <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                </div>
              </div>
              <button
                onClick={() => toggleAdmin(u.id, u.is_admin)}
                disabled={updating === u.id}
                className={`ml-3 shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${u.is_admin ? 'bg-cyan-100 text-cyan-700 border border-cyan-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}
              >
                {updating === u.id ? '...' : u.is_admin ? '管理者✓' : '一般'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Events Tab ---
function EventsTab() {
  const [events, setEvents] = useState<AppEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', event_date: new Date().toISOString().split('T')[0], location: '', description: '' })

  const loadEvents = async () => {
    if (!isSupabaseConfigured) return
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase.from('events').select('*').gte('event_date', today).order('event_date')
    setEvents(data || [])
    setLoading(false)
  }

  useEffect(() => { loadEvents() }, [])

  const handleAdd = async () => {
    if (!form.title || !form.event_date || !isSupabaseConfigured) return
    setSaving(true)
    await supabase.from('events').insert({ title: form.title, event_date: form.event_date, location: form.location || null, description: form.description || null })
    setForm(prev => ({ ...prev, title: '', location: '', description: '' }))
    await loadEvents()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!isSupabaseConfigured) return
    await supabase.from('events').delete().eq('id', id)
    await loadEvents()
  }

  return (
    <div>
      <p className="text-xs text-slate-500 mb-4">ホーム画面に表示するイベント情報を登録できます。</p>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4 space-y-3">
        <p className="text-sm font-bold text-slate-700">イベントを追加</p>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">タイトル *</label>
          <input className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="例: 湘南ビーチクリーン大会" value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">開催日 *</label>
          <input type="date" className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            value={form.event_date} onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))} />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">場所</label>
          <input className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="例: 茅ヶ崎海岸" value={form.location}
            onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">説明</label>
          <input className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="例: 参加無料・手袋持参" value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>
        <button onClick={handleAdd} disabled={!form.title || saving}
          className="w-full py-3 bg-cyan-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          {saving ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
          {saving ? '追加中...' : 'イベントを追加'}
        </button>
      </div>

      <p className="text-xs font-bold text-slate-600 mb-2">登録済みイベント</p>
      {loading ? <p className="text-xs text-slate-400">読み込み中...</p>
        : events.length === 0 ? <p className="text-xs text-slate-400">登録済みのイベントはありません</p>
        : (
          <div className="space-y-2">
            {events.map(ev => (
              <div key={ev.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <CalendarDays size={16} className="text-cyan-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700">{ev.event_date} — {ev.title}</p>
                    {ev.location && <p className="text-[10px] text-slate-400">{ev.location}</p>}
                    {ev.description && <p className="text-[10px] text-slate-400">{ev.description}</p>}
                  </div>
                </div>
                <button onClick={() => handleDelete(ev.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

// --- Main AdminPanel ---
export default function AdminPanel({ quests, onBack, onUpdateQuestSettings, onAddQuest, onDeleteQuest }: Props) {
  const [tab, setTab] = useState<Tab>('quest')

  const tabs: { key: Tab; label: string; icon: ReactNode }[] = [
    { key: 'quest', label: '受取場所', icon: <MapPin size={16} /> },
    { key: 'weather', label: '天気制御', icon: <Cloud size={16} /> },
    { key: 'events', label: 'イベント', icon: <CalendarDays size={16} /> },
    { key: 'users', label: 'ユーザー', icon: <Users size={16} /> },
  ]

  return (
    <div className="bg-slate-50 min-h-screen pb-24 animate-in fade-in duration-300">
      <header className="bg-white border-b border-slate-100 px-4 pt-12 pb-0 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center mb-4">
          <button onClick={onBack} className="mr-3 text-slate-400 hover:text-slate-600">
            <ChevronRight size={24} className="rotate-180" />
          </button>
          <div className="flex items-center">
            <Shield size={20} className="text-cyan-500 mr-2" />
            <h2 className="text-lg font-black text-slate-800">管理者パネル</h2>
          </div>
        </div>

        <div className="flex border-b border-slate-100">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${tab === t.key ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-slate-400'}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="p-4 mt-2">
        {!isSupabaseConfigured && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4 text-yellow-800 text-xs font-medium">
            ⚠️ Supabaseが設定されていません。.env.localを設定してください。
          </div>
        )}
        {tab === 'quest' && <QuestSettingsTab quests={quests} onUpdate={onUpdateQuestSettings} onAdd={onAddQuest} onDelete={onDeleteQuest} />}
        {tab === 'weather' && <WeatherTab />}
        {tab === 'events' && <EventsTab />}
        {tab === 'users' && <UsersTab />}
      </main>
    </div>
  )
}
