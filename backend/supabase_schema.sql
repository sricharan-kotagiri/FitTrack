-- ============================================================
-- FitTrack Lite — Supabase Database Schema
-- Run this entire file in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES ─────────────────────────────────────────────────
-- Mirrors auth.users; created automatically on signup via backend
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── GOALS ────────────────────────────────────────────────────
-- Users can have multiple goals; future goals supported via start_date
CREATE TABLE IF NOT EXISTS public.goals (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    start_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    category      TEXT NOT NULL DEFAULT 'General'
                  CHECK (category IN ('Cardio','Strength','Flexibility','Nutrition','Wellness','General')),
    color         TEXT NOT NULL DEFAULT 'green'
                  CHECK (color IN ('green','blue','amber','purple','red')),
    notes         TEXT DEFAULT '',
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── DAILY LOGS ───────────────────────────────────────────────
-- One log per user per goal per day — enforced by unique constraint
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id    UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    log_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    status     TEXT NOT NULL CHECK (status IN ('completed', 'missed')),
    notes      TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- ✅ This is the key constraint: one log per goal per day per user
    UNIQUE (user_id, goal_id, log_date)
);

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_goal_id ON public.daily_logs(goal_id);
CREATE INDEX IF NOT EXISTS idx_logs_date ON public.daily_logs(log_date);

-- ── ROW LEVEL SECURITY (RLS) ─────────────────────────────────
-- Users can only access their own data

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Goals: users can CRUD their own
CREATE POLICY "goals_select" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goals_insert" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_update" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "goals_delete" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- Daily logs: users can CRUD their own
CREATE POLICY "logs_select" ON public.daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "logs_insert" ON public.daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "logs_update" ON public.daily_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "logs_delete" ON public.daily_logs FOR DELETE USING (auth.uid() = user_id);

-- ── SERVICE ROLE BYPASS ──────────────────────────────────────
-- The backend uses service_role key which bypasses RLS automatically.
-- No additional policies needed for backend operations.

-- ============================================================
-- DONE. Your database is ready.
-- ============================================================
