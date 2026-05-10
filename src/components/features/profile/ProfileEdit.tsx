import { useState } from 'react'
import { X, Save, Camera, User } from 'lucide-react'
import type { UserProfile } from '@/types'

interface Props {
  userProfile: UserProfile
  isGuest: boolean
  onSave: (name: string, bio: string) => Promise<void>
  onBack: () => void
}

export default function ProfileEdit({ userProfile, isGuest, onSave, onBack }: Props) {
  const [name, setName] = useState(userProfile.name)
  const [bio, setBio] = useState(userProfile.bio)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onSave(name, bio)
    setSaving(false)
    onBack()
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-24 animate-in slide-in-from-bottom-4 duration-300">
      <header className="bg-white p-6 border-b border-slate-100 pt-12 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
          <h2 className="text-lg font-black text-slate-800">プロフィール編集</h2>
        </div>
      </header>

      <main className="p-5">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-cyan-500 rounded-full flex items-center justify-center text-white border-4 border-white shadow-md relative mb-3 overflow-hidden">
              {userProfile.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <User size={40} />
              )}
              <div className="absolute bottom-0 right-0 bg-slate-800 text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                <Camera size={14} />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              {isGuest ? '※写真はGoogleログイン後に設定できます' : '※写真の変更はGoogleアカウント設定で行います'}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">ニックネーム</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"
                placeholder="ニックネームを入力"
                maxLength={30}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">自己紹介文</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all min-h-[100px] resize-none"
                placeholder="活動エリアや意気込みなどを入力しましょう"
                maxLength={100}
              />
              <p className="text-right text-[10px] text-slate-400 mt-1">{bio.length} / 100文字</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-lg shadow-slate-900/20 hover:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-60"
          >
            <Save size={20} className="mr-2" />
            {saving ? '保存中...' : '変更を保存する'}
          </button>
        </div>
      </main>
    </div>
  )
}
