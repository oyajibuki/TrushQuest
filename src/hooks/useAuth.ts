import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { UserProfile, UserStats, Badge } from '@/types'

const DEFAULT_PROFILE: UserProfile = {
  name: 'ゲスト ユーザー',
  bio: '海と健康のために頑張ります！',
}

const DEFAULT_STATS: UserStats = {
  badges: [],
  totalCalories: 0,
  totalQuests: 0,
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE)
  const [userStats, setUserStats] = useState<UserStats>(DEFAULT_STATS)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadUserData = useCallback(async (u: User) => {
    setLoading(true)
    try {
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .single()

      // プロフィールがない場合は作成（トリガーが失敗したケース）
      if (!profile) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            id: u.id,
            email: u.email,
            nickname: u.user_metadata?.name || u.email?.split('@')[0],
            avatar_url: u.user_metadata?.avatar_url,
            is_admin: u.email === 'oyajibuki@gmail.com',
          })
          .select()
          .single()
        profile = newProfile
      }

      if (profile) {
        // オーナーのメールアドレスは常に管理者 (DB が未設定の場合も自動修正)
        const isOwner = u.email === 'oyajibuki@gmail.com'
        if (isOwner && !profile.is_admin) {
          await supabase.from('profiles').update({ is_admin: true }).eq('id', u.id)
          profile = { ...profile, is_admin: true }
        }
        setUserProfile({
          id: profile.id,
          name: profile.nickname || (u.user_metadata?.name as string | undefined) || 'ユーザー',
          bio: profile.bio || '',
          email: profile.email,
          avatarUrl: profile.avatar_url || (u.user_metadata?.avatar_url as string | undefined),
          isAdmin: profile.is_admin,
        })
        setIsAdmin(profile.is_admin || isOwner)
      }

      const { data: completions } = await supabase
        .from('quest_completions')
        .select('*')
        .eq('user_id', u.id)
        .order('completed_at', { ascending: false })

      if (completions) {
        const badges: Badge[] = completions.map((c: { id: string; quest_title: string; completed_at: string; quest_id: number; calories: number; location?: string; duration?: string }) => ({
          id: c.id,
          name: c.quest_title,
          date: new Date(c.completed_at).toLocaleDateString('ja-JP'),
          questId: c.quest_id,
          calories: c.calories,
          completedAt: c.completed_at,
          location: c.location,
          duration: c.duration,
        }))
        setUserStats({
          badges,
          totalCalories: completions.reduce((sum: number, c: { calories?: number }) => sum + (c.calories || 0), 0),
          totalQuests: completions.length,
        })
      }
    } catch (e) {
      console.error('Failed to load user data', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        loadUserData(session.user)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setIsGuest(false)
        loadUserData(session.user)
      } else {
        setUser(null)
        setIsGuest(false)
        setIsAdmin(false)
        setUserProfile(DEFAULT_PROFILE)
        setUserStats(DEFAULT_STATS)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadUserData])

  const loginWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      alert('Supabaseの設定が必要です。.env.localを確認してください。')
      return
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
  }

  const loginAsGuest = () => {
    setIsGuest(true)
    setUserProfile(DEFAULT_PROFILE)
    setUserStats(DEFAULT_STATS)
    setLoading(false)
  }

  const logout = async () => {
    setIsGuest(false)
    if (isSupabaseConfigured && user) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setIsAdmin(false)
    setUserProfile(DEFAULT_PROFILE)
    setUserStats(DEFAULT_STATS)
  }

  const addCompletion = async (questId: number, questTitle: string, calories: number, location?: string, duration?: string): Promise<{ success: boolean; message?: string }> => {
    // 1日1クエストまで
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const alreadyToday = userStats.badges.some(b => {
      const d = b.completedAt ? new Date(b.completedAt) : null
      if (!d) return false
      return d >= todayStart
    })
    if (alreadyToday) {
      return { success: false, message: '本日はすでにクエストをクリアしています。\nまた明日チャレンジしてください！🌊' }
    }

    const now = new Date()
    const newBadge: Badge = {
      id: Date.now(),
      name: questTitle,
      date: now.toLocaleDateString('ja-JP'),
      questId,
      calories,
      completedAt: now.toISOString(),
      location,
      duration,
    }
    setUserStats(prev => ({
      badges: [newBadge, ...prev.badges],
      totalCalories: prev.totalCalories + calories,
      totalQuests: prev.totalQuests + 1,
    }))

    if (user && isSupabaseConfigured) {
      await supabase.from('quest_completions').insert({
        user_id: user.id,
        quest_id: questId,
        quest_title: questTitle,
        calories,
        location,
        duration,
      })
      // 運動ログに自動登録
      const durationMins = (() => {
        if (!duration) return 30
        const m = duration.match(/(\d+)/)
        return m ? parseInt(m[1]) : 30
      })()
      await supabase.from('exercise_logs').insert({
        user_id: user.id,
        date: now.toISOString().split('T')[0],
        exercise_type: '海ゴミ拾い',
        duration_minutes: durationMins,
        notes: location || null,
      })
    }
    return { success: true }
  }

  const updateProfile = async (name: string, bio: string) => {
    setUserProfile(prev => ({ ...prev, name, bio }))
    if (user && isSupabaseConfigured) {
      await supabase
        .from('profiles')
        .update({ nickname: name, bio, updated_at: new Date().toISOString() })
        .eq('id', user.id)
    }
  }

  return {
    user,
    userProfile,
    userStats,
    isAdmin,
    isGuest,
    isLoggedIn: !!user || isGuest,
    loading,
    loginWithGoogle,
    loginAsGuest,
    logout,
    addCompletion,
    updateProfile,
  }
}
