import { useState } from 'react';
import { 
  MapPin, Clock, Flame, ChevronRight, AlertTriangle, 
  Award, Camera, User, Home, Navigation, Trash2,
  CheckCircle2, X, Image as ImageIcon, Share2,
  Sun, Wind, AlertOctagon, CalendarDays, LogIn, Cloud,
  Edit3, Save
} from 'lucide-react';

// --- 実在の資料に基づく分別ルール ---
const CITY_SORTING_RULES = {
  "平塚市": [
    { type: "可燃", color: "bg-red-100 text-red-700 border-red-200", items: "木、葉、草、布、紙、フィルム状のプラスチック、ペットボトル、ゴム、発泡スチロール、たばこのフィルター" },
    { type: "不燃", color: "bg-blue-100 text-blue-700 border-blue-200", items: "缶、ビン、金属、ガラス、セトモノ、プラスチック製品、ライター" },
    { note: "※スプレー缶は他のごみとは混ぜずに、別途まとめてください。" }
  ],
  "茅ヶ崎市": [
    { type: "可燃", color: "bg-red-100 text-red-700 border-red-200", items: "木、葉、草、布、紙、フィルム状のプラスチック、生ごみ、花火ごみ、たばこのフィルター" },
    { type: "不燃", color: "bg-blue-100 text-blue-700 border-blue-200", items: "缶、ビン、金属、ガラス、セトモノ、プラスチック製品、ペットボトル、ゴム、発泡スチロール、ライター" },
    { note: "※スプレー缶は他のごみとは混ぜずに、別途まとめてください。" }
  ]
};

// --- 実在の資料に基づく注意事項 ---
const RULES = [
  { title: "1. 石・貝殻・海藻は拾わない", desc: "自然のモノでごみではありませんので、そのままにしておきましょう。" },
  { title: "2. ガス缶は別にする", desc: "スプレー缶・カセットボンベ等はごみ処理の過程で爆発する可能性があるので、必ず別の袋に分けて集積所に置いてください。" },
  { title: "3. 注射器に注意", desc: "見つけたら素手で触らずに、ペットボトルなどの容器に入れて他のごみとは別にして集積所に置いてください。" },
  { title: "4. サーファー等の荷物に注意", desc: "砂浜にあるレジ袋などは、マリンスポーツを楽しんでいる人たちの荷物かもしれません。判断がつかないものはそのままに。" },
  { title: "5. 処理に時間がかかるごみ", desc: "漁網、ブイ、家電製品、タイヤ、バッテリー等の粗大ごみ等は、処理に関係機関と調整が必要になります。" },
  { title: "※ イベントごみは持ち帰ってください", desc: "お弁当や飲み物等の容器など、イベントで出たごみはビーチクリーンごみに混ぜずに持ち帰ってください。" }
];

// --- モックデータ ---
const MAP_URL = "https://www.google.com/maps/d/viewer?mid=1pcVcNpvp8j8L1DeX2NvU_RoeWtvHOAo&ll=35.315751460313194%2C139.35926100365504&z=16";

const QUESTS = [
  {
    id: 1,
    title: "平塚海岸ビーチクリーン",
    location: "神奈川県 平塚市",
    city: "平塚市",
    duration: "40分",
    calories: 250,
    difficulty: "Medium",
    bagPickup: {
      name: "湘南ベルマーレひらつかビーチパーク 管理棟前",
      image: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=400&q=80",
      mapUrl: MAP_URL
    },
    dropoff: {
      name: "ボードウォーク南側 指定集積所",
      image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=400&q=80",
      mapUrl: MAP_URL
    },
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2,
    title: "茅ヶ崎サザンビーチ ウォーキング",
    location: "神奈川県 茅ヶ崎市",
    city: "茅ヶ崎市",
    duration: "30分",
    calories: 180,
    difficulty: "Easy",
    bagPickup: {
      name: "サザンビーチカフェ入口横 ボックス",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=400&q=80",
      mapUrl: MAP_URL
    },
    dropoff: {
      name: "サザンCモニュメント裏 集積所",
      image: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=400&q=80",
      mapUrl: MAP_URL
    },
    image: "https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState('login'); // loginを初期画面に変更
  const [userType, setUserType] = useState(null); // 'guest' または 'google'
  const [selectedQuest, setSelectedQuest] = useState(null);
  
  // ログイン状態に応じた初期ステータス
  const [userStats, setUserStats] = useState({
    badges: [],
    totalCalories: 0,
    totalQuests: 0
  });

  // プロフィール情報
  const [userProfile, setUserProfile] = useState({
    name: 'ゲスト ユーザー',
    bio: '海と健康のために頑張ります！'
  });

  const [agreed, setAgreed] = useState(false);
  const [tasks, setTasks] = useState({ pickup: false, active: false, dropoff: false });
  const [captured, setCaptured] = useState(false);
  const [showShareMsg, setShowShareMsg] = useState(false);
  const [weather, setWeather] = useState('sunny');

  const navigateTo = (view, quest = null) => {
    if (quest) setSelectedQuest(quest);
    setCurrentView(view);
    
    if (view === 'detail') setAgreed(false);
    if (view === 'active') setTasks({ pickup: false, active: false, dropoff: false });
    if (view === 'camera') setCaptured(false);
    if (view === 'reward') setShowShareMsg(false);
    
    window.scrollTo(0, 0);
  };

  const handleLogin = (type) => {
    setUserType(type);
    
    // Googleログインの場合は過去のデータが読み込まれたというモック動作
    if (type === 'google') {
      setUserStats({
        badges: [
          { id: 1, name: "初めてのビーチクリーン", date: "2024/04/10" },
          { id: 2, name: "茅ヶ崎マスター", date: "2024/05/01" }
        ],
        totalCalories: 850,
        totalQuests: 4
      });
      setUserProfile({
        name: 'Eco Runner',
        bio: '湘南エリアを中心に活動中！週末の朝活でビーチクリーンを楽しんでいます。'
      });
    } else {
      setUserStats({ badges: [], totalCalories: 0, totalQuests: 0 });
      setUserProfile({
        name: 'ゲスト ユーザー',
        bio: '海と健康のために頑張ります！'
      });
    }
    
    navigateTo('home');
  };

  const handleLogout = () => {
    setUserType(null);
    setUserStats({ badges: [], totalCalories: 0, totalQuests: 0 });
    setUserProfile({ name: 'ゲスト ユーザー', bio: '' });
    navigateTo('login');
  };

  const handleComplete = () => {
    setUserStats(prev => ({
      badges: [
        { id: Date.now(), name: selectedQuest.title, date: new Date().toLocaleDateString() },
        ...prev.badges
      ],
      totalCalories: prev.totalCalories + selectedQuest.calories,
      totalQuests: prev.totalQuests + 1
    }));
    navigateTo('reward');
  };

  const allTasksDone = tasks.pickup && tasks.active && tasks.dropoff;
  const toggleTask = (key) => setTasks(prev => ({ ...prev, [key]: !prev[key] }));

  const handleShare = () => {
    setShowShareMsg(true);
    setTimeout(() => setShowShareMsg(false), 3000);
  };

  const capturePhoto = () => {
    setCaptured(true);
    setTimeout(() => handleComplete(), 1500);
  };

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t border-slate-100 flex justify-around pb-safe z-40">
      <button 
        className={`pt-3 pb-4 px-6 flex flex-col items-center transition-colors ${currentView === 'home' || currentView === 'detail' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
        onClick={() => navigateTo('home')}
      >
        <Home size={24} className={`mb-1 transition-transform ${currentView === 'home' ? 'scale-110' : ''}`} />
        <span className="text-[10px] font-bold">クエスト</span>
      </button>
      <button 
        className={`pt-3 pb-4 px-6 flex flex-col items-center transition-colors ${currentView === 'profile' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
        onClick={() => navigateTo('profile')}
      >
        <User size={24} className={`mb-1 transition-transform ${currentView === 'profile' ? 'scale-110' : ''}`} />
        <span className="text-[10px] font-bold">マイページ</span>
      </button>
    </nav>
  );

  return (
    <div className="max-w-md mx-auto bg-slate-900 min-h-screen relative shadow-2xl overflow-hidden font-sans selection:bg-cyan-200">
      <div className="bg-slate-50 min-h-screen w-full">
        
        {/* === ログイン画面 === */}
        {currentView === 'login' && (
          <div className="min-h-screen relative flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
            {/* 背景画像 */}
            <div className="absolute inset-0 z-0">
              <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="background" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/80 to-slate-900"></div>
            </div>

            <div className="relative z-10 w-full flex flex-col items-center mt-20">
              <div className="w-24 h-24 bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-3xl shadow-2xl flex items-center justify-center mb-6 rotate-3">
                <Trash2 size={48} className="text-white drop-shadow-md" />
              </div>
              
              <h1 className="text-4xl font-black tracking-tight text-white mb-2">TrashQuest</h1>
              <p className="text-cyan-100 font-medium mb-16 text-center leading-relaxed">
                地球を綺麗にしながら<br/>自分も健康になれるフィットネス
              </p>

              <div className="w-full space-y-4 max-w-sm">
                <button 
                  onClick={() => handleLogin('google')}
                  className="w-full bg-white text-slate-800 py-4 px-6 rounded-2xl font-bold flex items-center justify-center shadow-lg hover:scale-[0.98] transition-all"
                >
                  {/* Googleアイコンの代わり */}
                  <div className="w-5 h-5 bg-gradient-to-br from-red-500 via-yellow-400 to-blue-500 rounded-full mr-3 p-[2px]">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-black text-slate-800">G</span>
                    </div>
                  </div>
                  Googleでログインして記録を保存
                </button>

                <button 
                  onClick={() => handleLogin('guest')}
                  className="w-full bg-white/10 text-white border border-white/20 py-4 px-6 rounded-2xl font-bold flex items-center justify-center shadow-lg hover:bg-white/20 transition-all backdrop-blur-sm"
                >
                  <LogIn size={20} className="mr-2" />
                  ゲストとしてはじめる（お試し）
                </button>
              </div>

              <p className="text-[10px] text-slate-400 mt-12 text-center">
                登録することで、利用規約とプライバシーポリシーに<br/>同意したものとみなされます。
              </p>
            </div>
          </div>
        )}

        {/* === ホーム画面 === */}
        {currentView === 'home' && (
          <div className="pb-20 animate-in fade-in duration-300">
            <header className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-6 rounded-b-[2rem] shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-black tracking-tight">TrashQuest</h1>
              </div>
              <p className="text-blue-50 text-sm font-medium mb-4">地球を綺麗にしながら、自分も健康に。</p>

              <div 
                className={`mb-6 p-3 rounded-xl flex items-center justify-between cursor-pointer border backdrop-blur-sm transition-colors ${
                  weather === 'sunny' ? 'bg-white/20 border-white/30' : 'bg-red-500/80 border-red-400'
                }`}
                onClick={() => setWeather(w => w === 'sunny' ? 'typhoon' : 'sunny')}
              >
                <div className="flex items-center">
                  {weather === 'sunny' ? <Sun size={20} className="text-yellow-300 mr-2" /> : <Wind size={20} className="text-white mr-2 animate-pulse" />}
                  <div>
                    <p className="text-xs font-bold opacity-80">{weather === 'sunny' ? '現在の天候: 晴れ' : '現在の天候: 暴風雨（台風）'}</p>
                    <p className="text-[10px]">{weather === 'sunny' ? '絶好のゴミ拾い日和です！' : '危険なためクエストは中止されています'}</p>
                  </div>
                </div>
                <span className="text-[8px] bg-black/20 px-2 py-1 rounded text-white/80">PoC切替</span>
              </div>
              
              <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20">
                <div>
                  <p className="text-[10px] text-blue-100 uppercase tracking-wider mb-1">今月の消費カロリー</p>
                  <p className="text-3xl font-black flex items-baseline">
                    {userStats.totalCalories} <span className="text-sm font-medium ml-1 opacity-80">kcal</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-blue-100 uppercase tracking-wider mb-1">達成クエスト</p>
                  <p className="text-3xl font-black flex items-baseline justify-end">
                    {userStats.totalQuests} <span className="text-sm font-medium ml-1 opacity-80">回</span>
                  </p>
                </div>
              </div>
            </header>

            <main className="p-5 mt-2">
              <h2 className="text-lg font-bold text-slate-800 mb-4">近くのクエスト</h2>
              <div className="space-y-5">
                {QUESTS.map(quest => (
                  <div 
                    key={quest.id} 
                    className={`bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative transition-all ${weather === 'typhoon' ? 'opacity-70 grayscale-[30%]' : 'cursor-pointer active:scale-[0.98]'}`}
                    onClick={() => {
                      if (weather !== 'typhoon') navigateTo('detail', quest);
                    }}
                  >
                    {weather === 'typhoon' && (
                      <div className="absolute inset-0 bg-slate-900/20 z-20 flex items-center justify-center backdrop-blur-[2px]">
                         <div className="bg-red-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg flex items-center">
                           <AlertOctagon size={18} className="mr-2" /> 悪天候のため中止
                         </div>
                      </div>
                    )}
                    <div className="h-40 w-full relative">
                      <img src={quest.image} alt={quest.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="font-bold text-white text-lg mb-1">{quest.title}</h3>
                        <div className="flex items-center text-xs text-slate-200">
                          <MapPin size={12} className="mr-1 text-cyan-400" />
                          {quest.location}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 flex justify-between items-center bg-white">
                      <div className="flex space-x-3">
                        <span className="flex items-center bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-lg text-xs font-medium">
                          <Clock size={14} className="mr-1.5 text-slate-400" /> {quest.duration}
                        </span>
                        <span className="flex items-center bg-orange-50 text-orange-600 px-2.5 py-1.5 rounded-lg text-xs font-bold">
                          <Flame size={14} className="mr-1.5" /> {quest.calories}kcal
                        </span>
                      </div>
                      <div className="w-8 h-8 bg-cyan-50 rounded-full flex items-center justify-center text-cyan-600">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        )}

        {/* === 詳細・ルール同意画面 === */}
        {currentView === 'detail' && selectedQuest && (
          <div className="bg-slate-50 min-h-screen pb-24 animate-in slide-in-from-right-4 duration-300">
            <div className="h-64 relative">
              <img src={selectedQuest.image} alt={selectedQuest.title} className="w-full h-full object-cover" />
              <button 
                onClick={() => navigateTo('home')}
                className="absolute top-6 left-4 bg-white/20 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-white/30 transition"
              >
                <ChevronRight size={24} className="rotate-180" />
              </button>
            </div>

            <div className="px-5 py-8 bg-slate-50 -mt-6 rounded-t-[2rem] relative z-10">
              <h2 className="text-2xl font-black text-slate-800 mb-2">{selectedQuest.title}</h2>
              <p className="text-slate-500 flex items-center mb-6 text-sm font-medium">
                <MapPin size={16} className="mr-1.5 text-cyan-500" /> {selectedQuest.location}
              </p>

              {/* マップとルート */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                  <Navigation size={16} className="mr-2 text-cyan-500" /> クエストルート
                </h3>
                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm relative">
                  <div className="absolute left-[29px] top-10 bottom-10 w-0.5 bg-slate-100"></div>
                  
                  <div className="flex items-start mb-10 relative z-10">
                    <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs font-bold mr-4 ring-4 ring-white shrink-0">1</div>
                    <div className="w-full">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Start: 袋を受け取る</p>
                      <p className="font-bold text-sm text-slate-700 mt-0.5 mb-2">{selectedQuest.bagPickup.name}</p>
                      <img src={selectedQuest.bagPickup.image} alt="受け取り場所" className="w-full h-32 object-cover rounded-xl mb-2 border border-slate-100 shadow-sm" />
                      <a href={selectedQuest.bagPickup.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-blue-600 font-bold bg-blue-50 px-3 py-2.5 rounded-xl w-full justify-center active:bg-blue-100 transition-colors">
                        <MapPin size={14} className="mr-1" /> Googleマップで位置を確認
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start relative z-10">
                    <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xs font-bold mr-4 ring-4 ring-white shrink-0">2</div>
                    <div className="w-full">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Goal: 集積所に置く</p>
                      <p className="font-bold text-sm text-slate-700 mt-0.5 mb-2">{selectedQuest.dropoff.name}</p>
                      <img src={selectedQuest.dropoff.image} alt="集積所" className="w-full h-32 object-cover rounded-xl mb-2 border border-slate-100 shadow-sm" />
                      <a href={selectedQuest.dropoff.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-orange-600 font-bold bg-orange-50 px-3 py-2.5 rounded-xl w-full justify-center active:bg-orange-100 transition-colors">
                        <MapPin size={14} className="mr-1" /> Googleマップで位置を確認
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* 分別ルール（市町村別） */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                  <Trash2 size={16} className="mr-2 text-cyan-500" /> {selectedQuest.city}のごみ分別基準
                </h3>
                <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                  <div className="space-y-3">
                    {CITY_SORTING_RULES[selectedQuest.city]?.map((rule, idx) => (
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
                    ))}
                  </div>
                </div>
              </div>

              {/* 参加前の確認事項（資料反映版） */}
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
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                    />
                    <span className="text-sm font-bold text-red-900">
                      すべてのルールに同意します
                    </span>
                  </label>
                </div>
              </div>

              <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50 pb-safe shadow-[0_-10px_15px_rgba(0,0,0,0.03)]">
                {weather === 'typhoon' ? (
                  <div className="bg-red-100 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center text-sm font-bold">
                    <AlertOctagon size={24} className="mr-3 shrink-0" />
                    悪天候のため、クエストを停止しています。
                  </div>
                ) : (
                  <button 
                    className={`w-full max-w-md mx-auto block py-4 rounded-2xl font-bold text-lg transition-all ${agreed ? 'bg-slate-900 text-white hover:scale-[0.98]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    disabled={!agreed}
                    onClick={() => navigateTo('active')}
                  >
                    クエストを開始する
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === 実行中画面 === */}
        {currentView === 'active' && selectedQuest && (
          <div className="bg-slate-900 min-h-screen text-white flex flex-col p-6 pb-32 animate-in zoom-in-95 duration-300">
            <div className="text-center mt-8 mb-10">
              <h2 className="text-2xl font-black">{selectedQuest.title}</h2>
              <p className="text-cyan-400 mt-2">安全に気をつけて開始してください！</p>
            </div>

            <div className="bg-slate-800 rounded-3xl p-5 border border-slate-700 shadow-xl flex-1">
              <h3 className="font-bold text-slate-300 mb-4 flex items-center">
                <CheckCircle2 size={16} className="mr-2 text-cyan-500" /> ミッションリスト
              </h3>
              <div className="space-y-4">
                <div onClick={() => toggleTask('pickup')} className="flex items-start p-4 rounded-2xl bg-slate-900/50 border border-slate-700 cursor-pointer">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 mt-0.5 shrink-0 ${tasks.pickup ? 'bg-cyan-500 border-cyan-500' : 'border-slate-500'}`}>
                    {tasks.pickup && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold ${tasks.pickup ? 'text-slate-400 line-through' : 'text-white'}`}>ゴミ袋を受け取る</p>
                    <p className="text-xs text-slate-400 mt-1">{selectedQuest.bagPickup.name}</p>
                    <a href={selectedQuest.bagPickup.mapUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center text-[10px] font-bold text-cyan-400 mt-2 bg-cyan-900/50 border border-cyan-800 px-3 py-2 rounded-lg active:bg-cyan-800 transition-colors">
                      <MapPin size={12} className="mr-1" /> マップを確認
                    </a>
                  </div>
                </div>
                
                <div onClick={() => toggleTask('active')} className="flex items-center p-4 rounded-2xl bg-slate-900/50 border border-slate-700 cursor-pointer">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 shrink-0 ${tasks.active ? 'bg-cyan-500 border-cyan-500' : 'border-slate-500'}`}>
                    {tasks.active && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                  <p className={`font-bold ${tasks.active ? 'text-slate-400 line-through' : 'text-white'}`}>ゴミを拾いながら運動する</p>
                </div>

                <div onClick={() => toggleTask('dropoff')} className="flex items-start p-4 rounded-2xl bg-slate-900/50 border border-slate-700 cursor-pointer">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 mt-0.5 shrink-0 ${tasks.dropoff ? 'bg-cyan-500 border-cyan-500' : 'border-slate-500'}`}>
                    {tasks.dropoff && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold ${tasks.dropoff ? 'text-slate-400 line-through' : 'text-white'}`}>集積所にゴミを置く</p>
                    <p className="text-xs text-slate-400 mt-1">{selectedQuest.dropoff.name}</p>
                    <a href={selectedQuest.dropoff.mapUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center text-[10px] font-bold text-cyan-400 mt-2 bg-cyan-900/50 border border-cyan-800 px-3 py-2 rounded-lg active:bg-cyan-800 transition-colors">
                      <MapPin size={12} className="mr-1" /> マップを確認
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 w-full p-6 bg-slate-900 border-t border-slate-800 z-50 pb-safe">
              <button 
                className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center transition-all ${allTasksDone ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                disabled={!allTasksDone}
                onClick={() => navigateTo('camera')}
              >
                <Camera size={20} className="mr-2" />
                写真を撮って報告
              </button>
            </div>
          </div>
        )}

        {/* === カメラ画面 === */}
        {currentView === 'camera' && (
          <div className="bg-black min-h-screen text-white flex flex-col">
            <div className="flex-1 bg-slate-800 flex items-center justify-center relative">
              {captured ? (
                <img src="https://images.unsplash.com/photo-1618477461853-cf6ed80fbfc5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Captured" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-slate-500">
                  <ImageIcon size={64} className="mx-auto mb-4 opacity-50" />
                  <p>カメラ起動中（モック）</p>
                </div>
              )}
            </div>
            <div className="h-40 bg-black flex items-center justify-center">
              {!captured ? (
                <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-4 border-slate-300"></button>
              ) : (
                 <p className="text-cyan-400 font-bold">送信中...</p>
              )}
            </div>
          </div>
        )}

        {/* === 報酬画面 === */}
        {currentView === 'reward' && selectedQuest && (
          <div className="bg-slate-900 min-h-screen text-white flex flex-col items-center justify-center p-6 text-center">
            <div className="w-32 h-32 bg-yellow-400 rounded-full mx-auto flex items-center justify-center mb-8">
              <Award size={64} className="text-white" />
            </div>
            <h2 className="text-4xl font-black mb-2">CLEAR!</h2>
            <p className="text-cyan-400 mb-8">海が綺麗になりました！</p>

            <div className="bg-slate-800 rounded-3xl p-6 w-full mb-8">
              <h3 className="font-bold mb-4">{selectedQuest.title}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">消費カロリー</p>
                  <p className="text-2xl font-bold text-orange-400">{selectedQuest.calories}kcal</p>
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
                onClick={handleShare}
              >
                {showShareMsg ? 'リンクをコピーしました！' : <><Share2 size={20} className="mr-2" /> SNSでシェア</>}
              </button>
              <button 
                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold"
                onClick={() => navigateTo('home')}
              >
                ホームに戻る
              </button>
            </div>
          </div>
        )}

        {/* === プロフィール画面 === */}
        {currentView === 'profile' && (
          <div className="pb-24 bg-slate-50 min-h-screen animate-in fade-in duration-300">
            <header className="bg-white p-6 border-b border-slate-100 pt-12 relative overflow-hidden">
              <div className="flex items-center relative z-10">
                <div className="w-20 h-20 bg-cyan-500 rounded-full flex items-center justify-center text-white mr-5 border-4 border-white shadow-sm shrink-0">
                  {userType === 'google' ? <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" alt="profile" className="w-full h-full object-cover rounded-full" /> : <User size={36} />}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-slate-800 break-words line-clamp-2">
                    {userProfile.name}
                  </h2>
                  <div className="flex items-center mt-1">
                    <p className="text-[10px] text-cyan-600 font-bold bg-cyan-50 px-2 py-1 rounded-md">Lv. {userStats.totalQuests > 0 ? Math.floor(userStats.totalQuests / 2) + 1 : 1}</p>
                    {userType === 'google' && (
                      <span className="ml-2 flex items-center text-[9px] text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                        <Cloud size={10} className="mr-1" /> クラウド保存ON
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 relative z-10">
                 <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{userProfile.bio}</p>
              </div>
              
              <div className="absolute top-6 right-6 flex items-center space-x-4">
                <button 
                  onClick={() => navigateTo('profileEdit')}
                  className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={handleLogout}
                  className="text-[10px] text-slate-400 font-bold hover:text-slate-600"
                >
                  ログアウト
                </button>
              </div>
            </header>

            <main className="p-5 mt-2">
              {/* ゲスト用：アカウント連携の案内 */}
              {userType === 'guest' && (
                <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl p-5 text-white mb-6 shadow-md relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="font-bold text-lg mb-1 flex items-center">
                      <Cloud size={20} className="mr-2" /> 記録を保存しませんか？
                    </h3>
                    <p className="text-xs text-blue-50 mb-4 leading-relaxed">
                      現在ゲストモードのため、アプリを閉じると記録や獲得したバッジが消えてしまいます。Googleアカウントでログインすると、記録をクラウドに保存できます。
                    </p>
                    <button 
                      onClick={() => handleLogin('google')}
                      className="bg-white text-blue-600 text-sm font-bold py-2.5 px-4 rounded-xl shadow-sm hover:scale-[0.98] transition-transform flex items-center justify-center w-full"
                    >
                      Googleでログインして保存する
                    </button>
                  </div>
                  <Award size={100} className="absolute -right-6 -bottom-6 text-white opacity-10" />
                </div>
              )}

              <h3 className="font-bold mb-3 text-sm text-slate-800">実績</h3>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                  <p className="text-xs text-slate-400 mb-1 font-bold">総消費カロリー</p>
                  <p className="text-3xl font-black text-orange-500">{userStats.totalCalories}<span className="text-sm font-medium ml-1">kcal</span></p>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
                  <p className="text-xs text-slate-400 mb-1 font-bold">完了クエスト</p>
                  <p className="text-3xl font-black text-cyan-600">{userStats.totalQuests}<span className="text-sm font-medium ml-1">回</span></p>
                </div>
              </div>

              <h3 className="font-bold mb-3 text-sm text-slate-800">獲得バッジ</h3>
              {userStats.badges.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center text-slate-400 shadow-sm border border-slate-100">
                  <Award size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold">まだバッジがありません</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {userStats.badges.map(badge => (
                    <div key={badge.id} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100">
                      <Award size={24} className="text-yellow-500 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-slate-700 leading-tight">{badge.name}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* カレンダー機能（モック） */}
              <h3 className="font-bold mt-8 mb-3 flex items-center text-sm text-slate-800">
                <CalendarDays size={18} className="mr-2 text-cyan-600" />
                アクティビティカレンダー
              </h3>
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-slate-700 text-sm">今月の活動</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {['日', '月', '火', '水', '木', '金', '土'].map(day => (
                    <div key={day} className="text-[10px] text-slate-400 font-bold">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* 先月分の余白 */}
                  {Array.from({ length: 5 }).map((_, i) => <div key={`empty-${i}`}></div>)}
                  {/* 今月の日付 */}
                  {Array.from({ length: 31 }).map((_, i) => {
                    const day = i + 1;
                    const isToday = day === new Date().getDate(); // 今日の日付
                    // Googleログイン時のみ、過去のモックバッジ日付（2日、4日）をアクティブにする
                    const isCompletedPast = userType === 'google' && [2, 4].includes(day); 
                    // 今日バッジを獲得したか
                    const hasBadgeToday = isToday && userStats.badges.some(b => b.id > 100); // 新規獲得判定用

                    let bgClass = "bg-slate-50 text-slate-600";
                    if (hasBadgeToday || isCompletedPast) {
                      bgClass = "bg-cyan-100 text-cyan-700 font-bold border border-cyan-300";
                    } else if (isToday) {
                      bgClass = "bg-white border-2 border-cyan-500 font-bold text-cyan-600 shadow-sm";
                    }

                    return (
                      <div key={day} className={`w-full aspect-square flex flex-col items-center justify-center rounded-lg transition-all ${bgClass}`}>
                        <span className="text-[11px]">{day}</span>
                        {(hasBadgeToday || isCompletedPast) && <CheckCircle2 size={10} className="text-cyan-600 mt-0.5" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </main>
          </div>
        )}

        {/* === プロフィール編集画面 === */}
        {currentView === 'profileEdit' && (
          <div className="bg-slate-50 min-h-screen pb-24 animate-in slide-in-from-bottom-4 duration-300">
            <header className="bg-white p-6 border-b border-slate-100 pt-12 flex items-center justify-between sticky top-0 z-20 shadow-sm">
              <div className="flex items-center">
                <button onClick={() => navigateTo('profile')} className="mr-4 text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
                <h2 className="text-lg font-black text-slate-800">プロフィール編集</h2>
              </div>
            </header>

            <main className="p-5">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex flex-col items-center mb-8">
                  <div className="w-24 h-24 bg-cyan-500 rounded-full flex items-center justify-center text-white border-4 border-white shadow-md relative mb-3">
                    {userType === 'google' ? <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" alt="profile" className="w-full h-full object-cover rounded-full" /> : <User size={40} />}
                    <div className="absolute bottom-0 right-0 bg-slate-800 text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                      <Camera size={14} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">※写真の変更はGoogleアカウント設定で行います</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">ニックネーム</label>
                    <input 
                      type="text" 
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"
                      placeholder="ニックネームを入力"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">自己紹介文</label>
                    <textarea 
                      value={userProfile.bio}
                      onChange={(e) => setUserProfile({...userProfile, bio: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all min-h-[100px] resize-none"
                      placeholder="活動エリアや意気込みなどを入力しましょう"
                      maxLength={100}
                    ></textarea>
                    <p className="text-right text-[10px] text-slate-400 mt-1">{userProfile.bio.length} / 100文字</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => navigateTo('profile')}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-lg shadow-slate-900/20 hover:scale-[0.98] transition-all flex items-center justify-center"
                >
                  <Save size={20} className="mr-2" />
                  変更を保存する
                </button>
              </div>
            </main>
          </div>
        )}
      </div>
      
      {/* ボトムナビゲーション: ホーム画面とプロフィール画面でのみ表示する */}
      {(currentView === 'home' || currentView === 'profile') && <BottomNav />}
    </div>
  );
}
