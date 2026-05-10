import { Award, Share2 } from 'lucide-react'
import type { Quest } from '@/types'

interface Props {
  quest: Quest
  showShareMsg: boolean
  onShare: () => void
  onHome: () => void
}

export default function QuestReward({ quest, showShareMsg, onShare, onHome }: Props) {
  return (
    <div className="bg-slate-900 min-h-screen text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-32 h-32 bg-yellow-400 rounded-full mx-auto flex items-center justify-center mb-8">
        <Award size={64} className="text-white" />
      </div>
      <h2 className="text-4xl font-black mb-2">CLEAR!</h2>
      <p className="text-cyan-400 mb-8">海が綺麗になりました！</p>

      <div className="bg-slate-800 rounded-3xl p-6 w-full mb-8">
        <h3 className="font-bold mb-4">{quest.title}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400">消費カロリー</p>
            <p className="text-2xl font-bold text-orange-400">{quest.calories}kcal</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">獲得バッジ</p>
            <p className="text-2xl font-bold text-yellow-400">1個</p>
          </div>
        </div>
      </div>

      <div className="w-full space-y-4">
        <button
          className="w-full py-4 bg-cyan-500 text-slate-900 rounded-2xl font-bold flex items-center justify-center"
          onClick={onShare}
        >
          {showShareMsg ? 'リンクをコピーしました！' : <><Share2 size={20} className="mr-2" /> SNSでシェア</>}
        </button>
        <button
          className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold"
          onClick={onHome}
        >
          ホームに戻る
        </button>
      </div>
    </div>
  )
}
