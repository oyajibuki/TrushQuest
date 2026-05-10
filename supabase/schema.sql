-- TrashQuest Supabase Schema
-- Supabaseダッシュボードの SQL Editor で実行してください

-- 1. profiles テーブル (auth.users の拡張)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  nickname TEXT,
  bio TEXT DEFAULT '海と健康のために頑張ります！',
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- 2. quest_completions テーブル (バッジ・完了記録)
CREATE TABLE IF NOT EXISTS public.quest_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_id INTEGER NOT NULL,
  quest_title TEXT NOT NULL,
  calories INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quest_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions" ON public.quest_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions" ON public.quest_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. quest_settings テーブル (管理者が編集可能なマスタ)
CREATE TABLE IF NOT EXISTS public.quest_settings (
  quest_id INTEGER PRIMARY KEY,
  bag_pickup_name TEXT,
  bag_pickup_map_url TEXT,
  bag_pickup_image TEXT,
  dropoff_name TEXT,
  dropoff_map_url TEXT,
  dropoff_image TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.quest_settings ENABLE ROW LEVEL SECURITY;

-- ゲストを含む全ユーザーが読める
CREATE POLICY "Anyone can read quest settings" ON public.quest_settings
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage quest settings" ON public.quest_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- 4. weather_overrides テーブル (手動天気・開催状況制御)
CREATE TABLE IF NOT EXISTS public.weather_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id INTEGER,  -- NULL = 全クエストに適用
  override_date DATE NOT NULL,
  is_cancelled BOOLEAN NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quest_id, override_date)
);

ALTER TABLE public.weather_overrides ENABLE ROW LEVEL SECURITY;

-- ゲストを含む全ユーザーが読める
CREATE POLICY "Anyone can read weather overrides" ON public.weather_overrides
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage weather overrides" ON public.weather_overrides
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
  );

-- 5. 新規ユーザー登録時に自動でプロフィールを作成するトリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname, avatar_url, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email = 'oyajibuki@gmail.com'  -- デフォルト管理者
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
