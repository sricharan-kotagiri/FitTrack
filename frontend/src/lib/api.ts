import { supabase } from './supabase'

// ── helpers ───────────────────────────────────────────────

export function goalStatus(goal: any): 'active' | 'upcoming' | 'finished' {
  const today = new Date().toISOString().split('T')[0]
  if (!goal.start_date) return 'active'
  if (goal.start_date > today) return 'upcoming'
  
  const start = new Date(goal.start_date + 'T00:00:00')
  const end = new Date(start.getTime())
  end.setDate(end.getDate() + Number(goal.duration_days))
  
  return today >= end.toISOString().split('T')[0] ? 'finished' : 'active'
}

export function computeStats(goal: any, logsMap: Record<string, any>) {
  const today = new Date().toISOString().split('T')[0]
  let completed = 0, missed = 0, tracked = 0, streak = 0
  
  for (let i = 0; i < goal.duration_days; i++) {
    const d = new Date(goal.start_date + 'T00:00:00')
    d.setDate(d.getDate() + i)
    const ds = d.toISOString().split('T')[0]
    if (ds > today) break
    tracked++
    
    const key = `${goal.id}_${ds}`
    if (logsMap[key]) {
      if (logsMap[key].status === 'completed') completed++
      else missed++
    }
  }
  
  for (let i = 0; i < 365; i++) {
    const d = new Date(today + 'T00:00:00')
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    if (ds < goal.start_date) break
    
    const key = `${goal.id}_${ds}`
    if (logsMap[key]?.status === 'completed') streak++
    else if (i > 0) break
  }
  
  return {
    completed,
    missed,
    tracked_days: tracked,
    pct: tracked > 0 ? Math.round(completed / tracked * 100) : 0,
    streak,
    days_left: Math.max(0, goal.duration_days - completed),
    today_log: logsMap[`${goal.id}_${today}`]
  }
}

// ── api ───────────────────────────────────────────────────

export const api = {
  signup: async (body: { name: string; email: string; password: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: { data: { name: body.name } }
    })
    if (error) throw new Error(error.message)
    
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name: body.name,
        email: body.email
      })
    }
    
    return { message: 'Account created! Check your email to verify.', email: body.email }
  },

  login: async (body: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password
    })
    if (error) throw new Error(error.message)
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle()
    
    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email!,
        name: profile?.name || data.user.user_metadata?.name || '',
        joined: data.user.created_at
      }
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    return { message: 'Logged out' }
  },

  me: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) throw new Error('Unauthorized')
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    
    return {
      user: {
        id: user.id,
        email: user.email!,
        name: profile?.name || '',
        joined: profile?.created_at || user.created_at
      }
    }
  },

  resendVerification: async (email: string) => {
    await supabase.auth.resend({ type: 'signup', email })
    return { message: 'Verification email resent.' }
  },

  refreshToken: async (_refresh_token: string) => {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) throw new Error(error.message)
    
    return {
      access_token: data.session!.access_token,
      refresh_token: data.session!.refresh_token
    }
  },

  getGoals: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at')
    
    if (error) throw new Error(error.message)
    
    const { data: logs } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
    
    const logsMap: Record<string, any> = {}
    ;(logs || []).forEach(l => {
      logsMap[`${l.goal_id}_${l.log_date}`] = l
    })
    
    return {
      goals: (goals || []).map(g => ({
        ...g,
        status: goalStatus(g),
        stats: computeStats(g, logsMap)
      }))
    }
  },

  createGoal: async (body: Partial<Goal>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: body.title,
        duration_days: body.duration_days,
        start_date: body.start_date || new Date().toISOString().split('T')[0],
        category: body.category || 'General',
        color: body.color || 'green',
        notes: body.notes || ''
      })
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    
    return {
      goal: {
        ...data,
        status: goalStatus(data),
        stats: computeStats(data, {})
      }
    }
  },

  updateGoal: async (id: string, body: Partial<Goal>) => {
    const { data, error } = await supabase
      .from('goals')
      .update(body)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    
    return {
      goal: {
        ...data,
        status: goalStatus(data),
        stats: computeStats(data, {})
      }
    }
  },

  deleteGoal: async (id: string) => {
    await supabase.from('daily_logs').delete().eq('goal_id', id)
    await supabase.from('goals').delete().eq('id', id)
    return { message: 'Goal deleted' }
  },

  getGoalStats: async (id: string) => {
    const { data: goal, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw new Error(error.message)
    
    const { data: logs } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('goal_id', id)
    
    const logsMap: Record<string, any> = {}
    ;(logs || []).forEach(l => {
      logsMap[`${l.goal_id}_${l.log_date}`] = l
    })
    
    return {
      goal,
      status: goalStatus(goal),
      stats: computeStats(goal, logsMap),
      logs: logs || []
    }
  },

  getLogs: async (params?: { goal_id?: string; date?: string; limit?: number }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    let q = supabase
      .from('daily_logs')
      .select('*, goals(title,color,category)')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
    
    if (params?.goal_id) q = q.eq('goal_id', params.goal_id)
    if (params?.limit) q = q.limit(params.limit)
    
    const { data, error } = await q
    if (error) throw new Error(error.message)
    
    return { logs: data || [] }
  },

  saveLog: async (body: { goal_id: string; log_date: string; status: 'completed' | 'missed'; notes: string }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const { data, error } = await supabase
      .from('daily_logs')
      .upsert(
        { user_id: user.id, ...body },
        { onConflict: 'user_id,goal_id,log_date' }
      )
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    
    return { log: data, message: 'Check-in saved!' }
  },

  deleteLog: async (id: string) => {
    await supabase.from('daily_logs').delete().eq('id', id)
    return { message: 'Log deleted' }
  },

  getTodayLogs: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('log_date', today)
    
    if (error) throw new Error(error.message)
    
    return { logs: data || [], date: today }
  },

  getProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    // Use maybeSingle() instead of single() to avoid 406 when row missing
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    
    // If profile doesn't exist yet, create it
    let finalProfile = profile
    if (!finalProfile) {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          email: user.email || ''
        })
        .select()
        .maybeSingle()
      finalProfile = newProfile
    }
    
    if (!finalProfile) throw new Error('Could not load profile')
    
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
    
    const { data: logs } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
    
    const logsMap: Record<string, any> = {}
    ;(logs || []).forEach(l => {
      logsMap[`${l.goal_id}_${l.log_date}`] = l
    })
    
    const goalsList = goals || []
    const totalCompleted = (logs || []).filter(l => l.status === 'completed').length
    const totalMissed = (logs || []).filter(l => l.status === 'missed').length
    
    return {
      profile: finalProfile,
      stats: {
        total_goals: goalsList.length,
        active_goals: goalsList.filter(g => goalStatus(g) === 'active').length,
        upcoming_goals: goalsList.filter(g => goalStatus(g) === 'upcoming').length,
        finished_goals: goalsList.filter(g => goalStatus(g) === 'finished').length,
        total_completed: totalCompleted,
        total_missed: totalMissed,
        best_streak: goalsList.length > 0
          ? Math.max(...goalsList.map(g => computeStats(g, logsMap).streak))
          : 0,
        overall_pct: (totalCompleted + totalMissed) > 0
          ? Math.round(totalCompleted / (totalCompleted + totalMissed) * 100)
          : 0
      },
      goals_breakdown: goalsList.map(g => ({
        ...g,
        status: goalStatus(g),
        stats: computeStats(g, logsMap)
      }))
    }
  },

  updateProfile: async (body: { name: string }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    await supabase.from('profiles').update(body).eq('id', user.id)
    
    return { message: 'Profile updated' }
  },

  deleteAccount: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    await supabase.from('daily_logs').delete().eq('user_id', user.id)
    await supabase.from('goals').delete().eq('user_id', user.id)
    await supabase.from('profiles').delete().eq('id', user.id)
    await supabase.auth.signOut()
    
    return { message: 'Account deleted' }
  }
}

// ── Types ──────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  joined: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  duration_days: number
  start_date: string
  category: string
  color: string
  notes: string
  created_at: string
  status?: string
  stats?: GoalStatsSummary
}

export interface GoalStatsSummary {
  completed: number
  missed: number
  tracked_days: number
  pct: number
  streak: number
  days_left: number
  today_log?: Log
}

export interface GoalStats {
  goal: Goal
  status: string
  stats: GoalStatsSummary
  logs: Log[]
}

export interface Log {
  id: string
  user_id: string
  goal_id: string
  log_date: string
  status: 'completed' | 'missed'
  notes: string
  created_at: string
  goals?: { title: string; color: string; category: string }
}

export interface ProfileResponse {
  profile: { id: string; name: string; email: string; created_at: string }
  stats: {
    total_goals: number
    active_goals: number
    upcoming_goals: number
    finished_goals: number
    total_completed: number
    total_missed: number
    best_streak: number
    overall_pct: number
  }
  goals_breakdown: (Goal & { status: string; stats: GoalStatsSummary })[]
}
