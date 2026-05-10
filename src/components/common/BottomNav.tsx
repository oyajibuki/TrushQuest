import { Home, User, Shield } from 'lucide-react'
import type { View } from '@/types'

interface Props {
  currentView: View
  isAdmin: boolean
  onNavigate: (view: View) => void
}

export default function BottomNav({ currentView, isAdmin, onNavigate }: Props) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-lg border-t border-slate-100 flex justify-around pb-safe z-40">
      <button
        className={`pt-3 pb-4 px-6 flex flex-col items-center transition-colors ${
          currentView === 'home' || currentView === 'detail' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
        }`}
        onClick={() => onNavigate('home')}
      >
        <Home size={24} className={`mb-1 transition-transform ${currentView === 'home' ? 'scale-110' : ''}`} />
        <span className="text-[10px] font-bold">クエスト</span>
      </button>

      <button
        className={`pt-3 pb-4 px-6 flex flex-col items-center transition-colors ${
          currentView === 'profile' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
        }`}
        onClick={() => onNavigate('profile')}
      >
        <User size={24} className={`mb-1 transition-transform ${currentView === 'profile' ? 'scale-110' : ''}`} />
        <span className="text-[10px] font-bold">マイページ</span>
      </button>

      {isAdmin && (
        <button
          className={`pt-3 pb-4 px-6 flex flex-col items-center transition-colors ${
            currentView === 'admin' ? 'text-cyan-600' : 'text-slate-400 hover:text-slate-600'
          }`}
          onClick={() => onNavigate('admin')}
        >
          <Shield size={24} className={`mb-1 transition-transform ${currentView === 'admin' ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold">管理</span>
        </button>
      )}
    </nav>
  )
}
