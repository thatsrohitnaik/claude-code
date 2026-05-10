-- ============================================
-- LIFEPILOT NEW TABLES - Run in Supabase SQL Editor
-- ============================================

-- RITUALS TABLE
CREATE TABLE IF NOT EXISTS rituals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  frequency TEXT NOT NULL,
  preferred_day TEXT,
  preferred_time TEXT,
  why TEXT,
  is_paused BOOLEAN DEFAULT false,
  pause_until TIMESTAMP,
  emoji TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- TODOS TABLE
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID,
  due_date DATE NOT NULL,
  due_time TEXT,
  time_of_day TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  snoozed_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- JOURNEYS TABLE
CREATE TABLE IF NOT EXISTS journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  total_chapters INT DEFAULT 3,
  current_chapter INT DEFAULT 1,
  duration_weeks INT NOT NULL,
  daily_minutes INT DEFAULT 30,
  preferred_time TEXT,
  progress_pct INT DEFAULT 0,
  status TEXT DEFAULT 'in_motion',
  chapters JSONB,
  why TEXT,
  emoji TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- AMBITIONS TABLE
CREATE TABLE IF NOT EXISTS ambitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  target_date DATE,
  current_chapter INT DEFAULT 1,
  total_chapters INT DEFAULT 4,
  progress_pct INT DEFAULT 0,
  status TEXT DEFAULT 'in_motion',
  chapters JSONB,
  why TEXT,
  emoji TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- USER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  evening_checkin_time TEXT DEFAULT '21:00',
  friday_windup_enabled BOOLEAN DEFAULT true,
  onboarding_complete BOOLEAN DEFAULT false,
  roll_days INT DEFAULT 0,
  roll_last_date DATE,
  one_thing_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE rituals ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Users see own rituals" ON rituals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own todos" ON todos
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own journeys" ON journeys
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own ambitions" ON ambitions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);