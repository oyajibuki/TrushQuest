import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useWeather } from '@/hooks/useWeather'
import { useQuestSettings } from '@/hooks/useQuestSettings'
import { useEvents } from '@/hooks/useEvents'
import LoginScreen from '@/components/features/auth/LoginScreen'
import HomeScreen from '@/components/features/home/HomeScreen'
import QuestDetail from '@/components/features/quest/QuestDetail'
import QuestActive from '@/components/features/quest/QuestActive'
import QuestCamera from '@/components/features/quest/QuestCamera'
import QuestReward from '@/components/features/quest/QuestReward'
import ProfileScreen from '@/components/features/profile/ProfileScreen'
import ProfileEdit from '@/components/features/profile/ProfileEdit'
import AdminPanel from '@/components/features/admin/AdminPanel'
import BottomNav from '@/components/common/BottomNav'
import type { Quest, View } from '@/types'

export default function App() {
  const [currentView, setCurrentView] = useState<View>('login')
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [tasks, setTasks] = useState({ pickup: false, active: false, dropoff: false })
  const [captured, setCaptured] = useState(false)

  const auth = useAuth()
  const { quests, updateQuestSettings, addQuest, deleteQuest } = useQuestSettings()
  const { weather, refetch: refetchWeather } = useWeather()
  const { events } = useEvents()

  // OAuth リダイレクト後: ログイン済みなのに 'login' ビューのままになる問題を修正
  useEffect(() => {
    if (auth.isLoggedIn && !auth.loading && currentView === 'login') {
      setCurrentView('home')
    }
  }, [auth.isLoggedIn, auth.loading, currentView])

  const navigateTo = (view: View, quest?: Quest) => {
    if (quest) setSelectedQuest(quest)
    setCurrentView(view)
    if (view === 'detail') setAgreed(false)
    if (view === 'active') setTasks({ pickup: false, active: false, dropoff: false })
    if (view === 'camera') setCaptured(false)
    window.scrollTo(0, 0)
  }

  // ローディング中
  if (auth.loading) {
    return (
      <div className="max-w-md mx-auto bg-slate-900 min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate-300">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 未ログイン
  if (!auth.isLoggedIn) {
    return (
      <div className="max-w-md mx-auto bg-slate-900 min-h-screen relative shadow-2xl overflow-hidden font-sans">
        <LoginScreen
          onGoogleLogin={auth.loginWithGoogle}
          onGuestLogin={() => { auth.loginAsGuest(); navigateTo('home') }}
        />
      </div>
    )
  }

  const showBottomNav = ['home', 'profile', 'admin'].includes(currentView)

  return (
    <div className="max-w-md mx-auto bg-slate-900 min-h-screen relative shadow-2xl overflow-hidden font-sans selection:bg-cyan-200">
      <div className="bg-slate-50 min-h-screen w-full">
        {currentView === 'home' && (
          <HomeScreen
            quests={quests}
            weather={weather}
            userStats={auth.userStats}
            events={events}
            onQuestSelect={quest => navigateTo('detail', quest)}
            onWeatherRefresh={refetchWeather}
          />
        )}

        {currentView === 'detail' && selectedQuest && (
          <QuestDetail
            quest={selectedQuest}
            weather={weather}
            agreed={agreed}
            onAgree={setAgreed}
            onBack={() => navigateTo('home')}
            onStart={() => navigateTo('active')}
          />
        )}

        {currentView === 'active' && selectedQuest && (
          <QuestActive
            quest={selectedQuest}
            tasks={tasks}
            onToggleTask={key => setTasks(prev => ({ ...prev, [key]: !prev[key] }))}
            onNext={() => navigateTo('camera')}
          />
        )}

        {currentView === 'camera' && selectedQuest && (
          <QuestCamera
            captured={captured}
            onCapture={() => {
              setCaptured(true)
              setTimeout(async () => {
                const result = await auth.addCompletion(selectedQuest.id, selectedQuest.title, selectedQuest.calories, selectedQuest.location, selectedQuest.duration)
                if (!result.success) {
                  alert(result.message)
                  navigateTo('home')
                  return
                }
                navigateTo('reward')
              }, 1500)
            }}
          />
        )}

        {currentView === 'reward' && selectedQuest && (
          <QuestReward
            quest={selectedQuest}
            onHome={() => navigateTo('home')}
          />
        )}

        {currentView === 'profile' && (
          <ProfileScreen
            userProfile={auth.userProfile}
            userStats={auth.userStats}
            isGuest={auth.isGuest}
            onEdit={() => navigateTo('profileEdit')}
            onLogout={() => { auth.logout(); navigateTo('login') }}
            onGoogleLogin={auth.loginWithGoogle}
          />
        )}

        {currentView === 'profileEdit' && (
          <ProfileEdit
            userProfile={auth.userProfile}
            isGuest={auth.isGuest}
            onSave={auth.updateProfile}
            onBack={() => navigateTo('profile')}
          />
        )}

        {currentView === 'admin' && auth.isAdmin && (
          <AdminPanel
            quests={quests}
            onBack={() => navigateTo('home')}
            onUpdateQuestSettings={updateQuestSettings}
            onAddQuest={addQuest}
            onDeleteQuest={deleteQuest}
          />
        )}
      </div>

      {showBottomNav && (
        <BottomNav
          currentView={currentView}
          isAdmin={auth.isAdmin}
          onNavigate={navigateTo}
        />
      )}
    </div>
  )
}
