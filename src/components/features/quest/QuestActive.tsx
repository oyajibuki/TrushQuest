import { CheckCircle2, MapPin, Camera } from 'lucide-react'
import type { Quest } from '@/types'

interface Tasks {
  pickup: boolean
  active: boolean
  dropoff: boolean
}

interface Props {
  quest: Quest
  tasks: Tasks
  onToggleTask: (key: keyof Tasks) => void
  onNext: () => void
}

export default function QuestActive({ quest, tasks, onToggleTask, onNext }: Props) {
  const allDone = tasks.pickup && tasks.active && tasks.dropoff

  return (
    <div className="bg-slate-900 min-h-screen text-white flex flex-col p-6 pb-32 animate-in zoom-in-95 duration-300">
      <div className="text-center mt-8 mb-10">
        <h2 className="text-2xl font-black">{quest.title}</h2>
        <p className="text-cyan-400 mt-2">安全に気をつけて開始してください！</p>
      </div>

      <div className="bg-slate-800 rounded-3xl p-5 border border-slate-700 shadow-xl flex-1">
        <h3 className="font-bold text-slate-300 mb-4 flex items-center">
          <CheckCircle2 size={16} className="mr-2 text-cyan-500" /> ミッションリスト
        </h3>
        <div className="space-y-4">
          <div onClick={() => onToggleTask('pickup')} className="flex items-start p-4 rounded-2xl bg-slate-900/50 border border-slate-700 cursor-pointer">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 mt-0.5 shrink-0 ${tasks.pickup ? 'bg-cyan-500 border-cyan-500' : 'border-slate-500'}`}>
              {tasks.pickup && <CheckCircle2 size={14} className="text-white" />}
            </div>
            <div className="flex-1">
              <p className={`font-bold ${tasks.pickup ? 'text-slate-400 line-through' : 'text-white'}`}>ゴミ袋を受け取る</p>
              <p className="text-xs text-slate-400 mt-1">{quest.bagPickup.name}</p>
              <a href={quest.bagPickup.mapUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center text-[10px] font-bold text-cyan-400 mt-2 bg-cyan-900/50 border border-cyan-800 px-3 py-2 rounded-lg active:bg-cyan-800 transition-colors">
                <MapPin size={12} className="mr-1" /> マップを確認
              </a>
            </div>
          </div>

          <div onClick={() => onToggleTask('active')} className="flex items-center p-4 rounded-2xl bg-slate-900/50 border border-slate-700 cursor-pointer">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 shrink-0 ${tasks.active ? 'bg-cyan-500 border-cyan-500' : 'border-slate-500'}`}>
              {tasks.active && <CheckCircle2 size={14} className="text-white" />}
            </div>
            <p className={`font-bold ${tasks.active ? 'text-slate-400 line-through' : 'text-white'}`}>ゴミを拾いながら運動する</p>
          </div>

          <div onClick={() => onToggleTask('dropoff')} className="flex items-start p-4 rounded-2xl bg-slate-900/50 border border-slate-700 cursor-pointer">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 mt-0.5 shrink-0 ${tasks.dropoff ? 'bg-cyan-500 border-cyan-500' : 'border-slate-500'}`}>
              {tasks.dropoff && <CheckCircle2 size={14} className="text-white" />}
            </div>
            <div className="flex-1">
              <p className={`font-bold ${tasks.dropoff ? 'text-slate-400 line-through' : 'text-white'}`}>集積所にゴミを置く</p>
              <p className="text-xs text-slate-400 mt-1">{quest.dropoff.name}</p>
              <a href={quest.dropoff.mapUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center text-[10px] font-bold text-cyan-400 mt-2 bg-cyan-900/50 border border-cyan-800 px-3 py-2 rounded-lg active:bg-cyan-800 transition-colors">
                <MapPin size={12} className="mr-1" /> マップを確認
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-6 bg-slate-900 border-t border-slate-800 z-50 pb-safe">
        <button
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center transition-all ${allDone ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
          disabled={!allDone}
          onClick={onNext}
        >
          <Camera size={20} className="mr-2" />
          写真を撮って報告
        </button>
      </div>
    </div>
  )
}
