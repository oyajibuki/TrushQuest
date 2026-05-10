import { MapPin, Navigation, Trash2, AlertTriangle, CheckCircle2, AlertOctagon, ChevronRight } from 'lucide-react'
import type { Quest, WeatherState } from '@/types'

const CITY_SORTING_RULES: Record<string, Array<{ type?: string; color?: string; items?: string; note?: string }>> = {
  '平塚市': [
    { type: '可燃', color: 'bg-red-100 text-red-700 border-red-200', items: '木、葉、草、布、紙、フィルム状のプラスチック、ペットボトル、ゴム、発泡スチロール、たばこのフィルター' },
    { type: '不燃', color: 'bg-blue-100 text-blue-700 border-blue-200', items: '缶、ビン、金属、ガラス、セトモノ、プラスチック製品、ライター' },
    { note: '※スプレー缶は他のごみとは混ぜずに、別途まとめてください。' },
  ],
  '茅ヶ崎市': [
    { type: '可燃', color: 'bg-red-100 text-red-700 border-red-200', items: '木、葉、草、布、紙、フィルム状のプラスチック、生ごみ、花火ごみ、たばこのフィルター' },
    { type: '不燃', color: 'bg-blue-100 text-blue-700 border-blue-200', items: '缶、ビン、金属、ガラス、セトモノ、プラスチック製品、ペットボトル、ゴム、発泡スチロール、ライター' },
    { note: '※スプレー缶は他のごみとは混ぜずに、別途まとめてください。' },
  ],
}

const RULES = [
  { title: '1. 石・貝殻・海藻は拾わない', desc: '自然のモノでごみではありませんので、そのままにしておきましょう。' },
  { title: '2. ガス缶は別にする', desc: 'スプレー缶・カセットボンベ等はごみ処理の過程で爆発する可能性があるので、必ず別の袋に分けて集積所に置いてください。' },
  { title: '3. 注射器に注意', desc: '見つけたら素手で触らずに、ペットボトルなどの容器に入れて他のごみとは別にして集積所に置いてください。' },
  { title: '4. サーファー等の荷物に注意', desc: '砂浜にあるレジ袋などは、マリンスポーツを楽しんでいる人たちの荷物かもしれません。判断がつかないものはそのままに。' },
  { title: '5. 処理に時間がかかるごみ', desc: '漁網、ブイ、家電製品、タイヤ、バッテリー等の粗大ごみ等は、処理に関係機関と調整が必要になります。' },
  { title: '※ イベントごみは持ち帰ってください', desc: 'お弁当や飲み物等の容器など、イベントで出たごみはビーチクリーンごみに混ぜずに持ち帰ってください。' },
]

interface Props {
  quest: Quest
  weather: WeatherState
  agreed: boolean
  onAgree: (v: boolean) => void
  onBack: () => void
  onStart: () => void
}

export default function QuestDetail({ quest, weather, agreed, onAgree, onBack, onStart }: Props) {
  const isCancelled = weather.status === 'rain' || weather.status === 'typhoon'

  return (
    <div className="bg-slate-50 min-h-screen pb-24 animate-in slide-in-from-right-4 duration-300">
      <div className="h-64 relative">
        <img src={quest.image} alt={quest.title} className="w-full h-full object-cover" />
        <button
          onClick={onBack}
          className="absolute top-6 left-4 bg-white/20 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-white/30 transition"
        >
          <ChevronRight size={24} className="rotate-180" />
        </button>
      </div>

      <div className="px-5 py-8 bg-slate-50 -mt-6 rounded-t-[2rem] relative z-10">
        <h2 className="text-2xl font-black text-slate-800 mb-2">{quest.title}</h2>
        <p className="text-slate-500 flex items-center mb-6 text-sm font-medium">
          <MapPin size={16} className="mr-1.5 text-cyan-500" /> {quest.location}
        </p>

        {/* クエストルート */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
            <Navigation size={16} className="mr-2 text-cyan-500" /> クエストルート
          </h3>
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm relative">
            <div className="absolute left-[29px] top-10 bottom-10 w-0.5 bg-slate-100" />

            <div className="flex items-start mb-10 relative z-10">
              <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs font-bold mr-4 ring-4 ring-white shrink-0">1</div>
              <div className="w-full">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Start: 袋を受け取る</p>
                <p className="font-bold text-sm text-slate-700 mt-0.5 mb-2">{quest.bagPickup.name}</p>
                <img src={quest.bagPickup.image} alt="受け取り場所" className="w-full h-32 object-cover rounded-xl mb-2 border border-slate-100 shadow-sm" />
                <a href={quest.bagPickup.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-blue-600 font-bold bg-blue-50 px-3 py-2.5 rounded-xl w-full justify-center active:bg-blue-100 transition-colors">
                  <MapPin size={14} className="mr-1" /> Googleマップで位置を確認
                </a>
              </div>
            </div>

            <div className="flex items-start relative z-10">
              <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xs font-bold mr-4 ring-4 ring-white shrink-0">2</div>
              <div className="w-full">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Goal: 集積所に置く</p>
                <p className="font-bold text-sm text-slate-700 mt-0.5 mb-2">{quest.dropoff.name}</p>
                <img src={quest.dropoff.image} alt="集積所" className="w-full h-32 object-cover rounded-xl mb-2 border border-slate-100 shadow-sm" />
                <a href={quest.dropoff.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-orange-600 font-bold bg-orange-50 px-3 py-2.5 rounded-xl w-full justify-center active:bg-orange-100 transition-colors">
                  <MapPin size={14} className="mr-1" /> Googleマップで位置を確認
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 分別ルール */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
            <Trash2 size={16} className="mr-2 text-cyan-500" /> {quest.city}のごみ分別基準
          </h3>
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
            <div className="space-y-3">
              {CITY_SORTING_RULES[quest.city]?.map((rule, idx) =>
                rule.type ? (
                  <div key={idx} className="flex flex-col">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold border w-fit mb-1 ${rule.color}`}>
                      {rule.type}
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">{rule.items}</p>
                  </div>
                ) : (
                  <p key={idx} className="text-xs font-bold text-red-500 pt-2 border-t border-slate-100">{rule.note}</p>
                )
              )}
            </div>
          </div>
        </div>

        {/* 参加前の確認事項 */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-red-500 mb-3 flex items-center">
            <AlertTriangle size={16} className="mr-2" /> 参加前の確認事項（必須）
          </h3>
          <div className="bg-red-50 border border-red-100 p-5 rounded-2xl">
            <ul className="space-y-4 mb-5">
              {RULES.map((rule, idx) => (
                <li key={idx} className="flex flex-col text-sm text-red-900/80 items-start">
                  <div className="flex items-center font-bold text-red-700 mb-1">
                    <span className="mr-2 text-red-500">•</span>
                    {rule.title}
                  </div>
                  <span className="text-xs pl-4 leading-snug">{rule.desc}</span>
                </li>
              ))}
            </ul>

            <label className="flex items-center pt-4 border-t border-red-200/60 cursor-pointer">
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center mr-3 shrink-0 ${agreed ? 'bg-red-500 border-red-500' : 'bg-white border-red-300'}`}>
                {agreed && <CheckCircle2 size={16} className="text-white" />}
              </div>
              <input type="checkbox" className="hidden" checked={agreed} onChange={e => onAgree(e.target.checked)} />
              <span className="text-sm font-bold text-red-900">すべてのルールに同意します</span>
            </label>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50 pb-safe shadow-[0_-10px_15px_rgba(0,0,0,0.03)]">
          {isCancelled ? (
            <div className="bg-red-100 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center text-sm font-bold">
              <AlertOctagon size={24} className="mr-3 shrink-0" />
              {weather.status === 'typhoon' ? '暴風雨' : '雨天'}のため、クエストを停止しています。
            </div>
          ) : (
            <button
              className={`w-full max-w-md mx-auto block py-4 rounded-2xl font-bold text-lg transition-all ${agreed ? 'bg-slate-900 text-white hover:scale-[0.98]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              disabled={!agreed}
              onClick={onStart}
            >
              クエストを開始する
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
