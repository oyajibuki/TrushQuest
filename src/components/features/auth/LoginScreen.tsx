import { Trash2, LogIn } from 'lucide-react'

interface Props {
  onGoogleLogin: () => void
  onGuestLogin: () => void
}

export default function LoginScreen({ onGoogleLogin, onGuestLogin }: Props) {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
          alt="background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/80 to-slate-900" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center mt-20">
        <div className="w-24 h-24 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-3xl shadow-2xl flex items-center justify-center mb-6 rotate-3">
          <Trash2 size={48} className="text-white drop-shadow-md" />
        </div>

        <h1 className="text-4xl font-black tracking-tight text-white mb-2">TrashQuest</h1>
        <p className="text-cyan-100 font-medium mb-16 text-center leading-relaxed">
          地球を綺麗にしながら<br />自分も健康になれるフィットネス
        </p>

        <div className="w-full space-y-4 max-w-sm">
          <button
            onClick={onGoogleLogin}
            className="w-full bg-white text-slate-800 py-4 px-6 rounded-2xl font-bold flex items-center justify-center shadow-lg hover:scale-[0.98] transition-all"
          >
            <div className="w-5 h-5 bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500 rounded-full mr-3 p-[2px]">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <span className="text-[10px] font-black text-slate-800">G</span>
              </div>
            </div>
            Googleでログインして記録を保存
          </button>

          <button
            onClick={onGuestLogin}
            className="w-full bg-white/10 text-white border border-white/20 py-4 px-6 rounded-2xl font-bold flex items-center justify-center shadow-lg hover:bg-white/20 transition-all backdrop-blur-sm"
          >
            <LogIn size={20} className="mr-2" />
            ゲストとしてはじめる（お試し）
          </button>
        </div>

        <p className="text-[10px] text-slate-400 mt-12 text-center">
          登録することで、利用規約とプライバシーポリシーに<br />同意したものとみなされます。
        </p>
      </div>
    </div>
  )
}
