import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import {
  ChevronRight, Shield, MapPin, Cloud, Users,
  Save, X, CheckCircle2, AlertOctagon, Sun, RefreshCw
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Quest, WeatherOverride, AdminProfile } from '@/types'

interface Props {
  quests: Quest[]
  onBack: () => void
  onUpdateQuestSettings: (questId: number, settings: Record<string, string>) => Promise<boolean>
}

type Tab = 'quest' | 'weather' | 'users'

// --- Quest Settings Tab ---
function QuestSettingsTab({ quests, onUpdate }: { quests: Quest[]; onUpdate: (id: number, s: Record<string, string>) => Promise<boolean> }) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const [form, setForm] = useState<Record<number, Record<string, string>>>({})
  const [saving, setSaving] = useState<number | null>(null)
  const [saved, setSaved] = useState<number | null>(null)

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

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 mb-4">ゴミ袋の受取場所・集積所をマスタとして変更できます。</p>
      {quests.map(quest => (
        <div key={quest.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 text-left"
            onClick={() => handleExpand(quest)}
          >
            <div className="flex items-center">
              <MapPin size={16} className="text-cyan-500 mr-2" />
              <span className="font-bold text-sm text-slate-800">{quest.title}</span>
            </div>
            <ChevronRight size={18} className={`text-slate-400 transition-transform ${expanded === quest.id ? 'rotate-90' : ''}`} />
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
              <button
                onClick={() => handleSave(quest.id)}
                disabled={saving === quest.id}
                className="w-full py-3 bg-cyan-500 text-white rounded-xl font-bold text-sm flex items-center justify-center disabled:opacity-60"
              >
                {saving === quest.id ? <RefreshCw size={16} className="animate-spin mr-2" /> : saved === quest.id ? <CheckCircle2 size={16} className="mr-2" /> : <Save size={16} className="mr-2" />}
                {saving === quest.id ? '保存中...' : saved === quest.id ? '保存しました！' : '変更を保存'}
              </button>
            </div>
          )}
        </div>
      ))}
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

// --- Main AdminPanel ---
export default function AdminPanel({ quests, onBack, onUpdateQuestSettings }: Props) {
  const [tab, setTab] = useState<Tab>('quest')

  const tabs: { key: Tab; label: string; icon: ReactNode }[] = [
    { key: 'quest', label: '受取場所', icon: <MapPin size={16} /> },
    { key: 'weather', label: '天気制御', icon: <Cloud size={16} /> },
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
        {tab === 'quest' && <QuestSettingsTab quests={quests} onUpdate={onUpdateQuestSettings} />}
        {tab === 'weather' && <WeatherTab />}
        {tab === 'users' && <UsersTab />}
      </main>
    </div>
  )
}
