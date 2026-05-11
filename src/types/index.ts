export interface UserProfile {
  id?: string
  name: string
  bio: string
  email?: string
  avatarUrl?: string
  isAdmin?: boolean
}

export interface Badge {
  id: string | number
  name: string
  date: string
  questId?: number
  calories?: number
  completedAt?: string  // ISO timestamp
  location?: string
  duration?: string
}

export interface UserStats {
  badges: Badge[]
  totalCalories: number
  totalQuests: number
}

export interface BagPickup {
  name: string
  image: string
  mapUrl: string
}

export interface Quest {
  id: number
  title: string
  location: string
  city: string
  duration: string
  calories: number
  difficulty: string
  bagPickup: BagPickup
  dropoff: BagPickup
  image: string
  lat: number
  lon: number
}

export type WeatherStatus = 'loading' | 'sunny' | 'rain' | 'typhoon' | 'error'

export interface WeatherState {
  status: WeatherStatus
  description: string
  windspeed?: number
  code?: number
  isManualOverride?: boolean
  overrideReason?: string
}

export interface QuestSettingsRow {
  quest_id: number
  bag_pickup_name?: string
  bag_pickup_map_url?: string
  bag_pickup_image?: string
  dropoff_name?: string
  dropoff_map_url?: string
  dropoff_image?: string
}

export interface WeatherOverride {
  id: string
  quest_id: number | null
  override_date: string
  is_cancelled: boolean
  reason?: string
}

export interface AdminProfile {
  id: string
  email: string
  nickname?: string
  is_admin: boolean
  created_at: string
}

export interface AppEvent {
  id: string
  title: string
  description?: string
  event_date: string
  location?: string
  created_at?: string
}

export interface WeightLog {
  id: string
  user_id: string
  date: string
  weight_kg: number
  created_at?: string
}

export interface MealLog {
  id: string
  user_id: string
  date: string
  meal_type: string
  calories?: number
  memo?: string
  created_at?: string
}

export interface ExerciseLog {
  id: string
  user_id: string
  date: string
  exercise_type: string
  duration_minutes: number
  notes?: string
  created_at?: string
}

export type View =
  | 'login'
  | 'home'
  | 'detail'
  | 'active'
  | 'camera'
  | 'reward'
  | 'profile'
  | 'profileEdit'
  | 'admin'
  | 'diary'
