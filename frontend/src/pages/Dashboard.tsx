import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, Goal } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

function fmtShort(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function today() { return new Date().toISOString().split('T')[0] }

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [quickGoalId, setQuickGoalId] = useState<string | null>(null)
  const [quickStatus, setQuickStatus] = useState<'completed' | 'missed'>('completed')
  const [quickNotes, setQuickNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.getGoals().then(r => { setGoals(r.goals); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const active = goals.filter(g => g.status === 'active')
  const upcoming = goals.filter(g => g.status === 'upcoming')

  const totalCompleted = active.reduce((s, g) => s + (g.stats?.completed || 0), 0)
  const totalMissed = active.reduce((s, g) => s + (g.stats?.missed || 0), 0)
  const bestStreak = Math.max(0, ...active.map(g => g.stats?.streak || 0))

  const saveQuick = async () => {
    if (!quickGoalId) return
    setSaving(true)
    try {
      await api.saveLog({ goal_id: quickGoalId, log_date: today(), status: quickStatus, notes: quickNotes })
      const r = await api.getGoals(); setGoals(r.goals)
      setQuickGoalId(null); setQuickNotes('')
    } catch {}
    setSaving(false)
  }

  const insights: { icon: string; text: string }[] = []
  const pendingToday = active.filter(g => !g.stats?.today_log).length
  const doneToday = active.filter(g => g.stats?.today_log?.status === 'completed').length
  if (pendingToday > 0) insights.push({ icon: '⏰', text: `${pendingToday} goal${pendingToday > 1 ? 's' : ''} still need a check-in today.` })
  if (doneToday > 0) insights.push({ icon: '✅', text: `${doneToday} goal${doneToday > 1 ? 's' : ''} marked complete today. Great work!` })
  if (bestStreak >= 5) insights.push({ icon: '🔥', text: `Your best current streak is ${bestStreak} days — keep it going!` })

  if (loading) return <div className="spinner"><div className="spin" /></div>

  if (goals.length === 0) return (
    <div>
      <div className="ph"><h1>Dashboard</h1><p>Hi {user?.name.split(' ')[0]}, welcome to FitTrack Lite!</p></div>
      <div className="card" style={{ maxWidth: 480, textAlign: 'center', padding: '2.75rem' }}>
        <div style={{ fontSize: '3.2rem', marginBottom: '.9rem' }}>🎯</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '.4rem' }}>No goals yet</h3>
        <p style={{ color: '#5F5E5A', marginBottom: '1.5rem', fontSize: '.875rem' }}>Create your first fitness goal to start tracking progress.</p>
        <button className="btn bp" onClick={() => navigate('/goals')}>Create a goal</button>
      </div>
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="ph" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.5rem' }}>
        <div><h1>Dashboard</h1><p>Hi {user?.name.split(' ')[0]}, here's your progress overview.</p></div>
        <button className="btn bp bsm" onClick={() => navigate('/goals')}>+ New Goal</button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '.85rem', marginBottom: '1.75rem' }}>
        <div className="sc gr"><div className="sv">{active.length}</div><div className="sl">Active Goals</div></div>
        <div className="sc bl"><div className="sv">{upcoming.length}</div><div className="sl">Upcoming</div></div>
        <div className="sc gr"><div className="sv">{totalCompleted}</div><div className="sl">Total Done</div></div>
        <div className="sc re"><div className="sv">{totalMissed}</div><div className="sl">Total Missed</div></div>
        <div className="sc am"><div className="sv">{bestStreak}🔥</div><div className="sl">Best Streak</div></div>
      </div>

      {/* Active goals */}
      {active.length > 0 && (
        <>
          <div className="stitle">Active Goals</div>
          {active.map(g => {
            const s = g.stats!
            const barCls = s.pct < 40 ? 'red' : s.pct < 70 ? 'amber' : ''
            const tod = s.today_log
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="gban" style={{ marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{g.title}</h2>
                    <span className="badge" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}>{g.category}</span>
                  </div>
                  <p style={{ fontSize: '.82rem', opacity: .85 }}>Started {fmtShort(g.start_date)} · {g.duration_days} days · {s.days_left} days left</p>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', opacity: .9, marginBottom: 4 }}>
                      <span>{s.completed} completed · {s.missed} missed</span><span>{s.pct}%</span>
                    </div>
                    <div className="pbg" style={{ background: 'rgba(255,255,255,.25)' }}>
                      <div className={`pbf ${barCls}`} style={{ background: 'rgba(255,255,255,.85)', width: `${s.pct}%` }} />
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{s.streak}</div>
                    <div style={{ fontSize: '.75rem', opacity: .8 }}>day streak 🔥</div>
                  </div>
                  {tod
                    ? <span className="badge" style={{ background: 'rgba(255,255,255,.2)', color: '#fff', fontSize: '.73rem' }}>{tod.status === 'completed' ? '✓ Done today' : '✗ Missed today'}</span>
                    : <button className="btn bsm" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1px solid rgba(255,255,255,.4)' }} onClick={() => setQuickGoalId(g.id)}>Log today</button>
                  }
                </div>
              </motion.div>
            )
          })}
        </>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <>
          <div className="stitle" style={{ marginTop: '1.25rem' }}>Upcoming Goals</div>
          {upcoming.map(g => (
            <div key={g.id} className="gban future" style={{ marginBottom: '.75rem' }}>
              <div><h2 style={{ fontWeight: 700, marginBottom: 3 }}>{g.title}</h2><p style={{ fontSize: '.82rem', opacity: .85 }}>Starts {fmtShort(g.start_date)} · {g.duration_days} days</p></div>
              <span className="badge" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}>Scheduled</span>
            </div>
          ))}
        </>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <>
          <div className="stitle" style={{ marginTop: '1.25rem' }}>Insights</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '.85rem', marginBottom: '1.5rem' }}>
            {insights.map((ins, i) => (
              <div key={i} className="ins"><span style={{ fontSize: 18 }}>{ins.icon}</span><span className="ins-tx">{ins.text}</span></div>
            ))}
          </div>
        </>
      )}

      {/* Quick log modal */}
      {quickGoalId && (
        <div className="modal-ov" onClick={e => { if (e.target === e.currentTarget) setQuickGoalId(null) }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal">
            <h3>
              Quick Check-in: {goals.find(g => g.id === quickGoalId)?.title}
              <button onClick={() => setQuickGoalId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#888' }}>✕</button>
            </h3>
            <p style={{ fontSize: '.85rem', color: '#5F5E5A', marginBottom: '1.1rem' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <div className="fg">
              <label>Status</label>
              <div className="stog">
                <div className={`sopt ${quickStatus === 'completed' ? 'sc2' : ''}`} onClick={() => setQuickStatus('completed')}>✓ Completed</div>
                <div className={`sopt ${quickStatus === 'missed' ? 'sm' : ''}`} onClick={() => setQuickStatus('missed')}>✗ Missed</div>
              </div>
            </div>
            <div className="fg">
              <label>Notes (optional)</label>
              <textarea value={quickNotes} onChange={e => setQuickNotes(e.target.value)} placeholder="How did it go?" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn bo" onClick={() => setQuickGoalId(null)}>Cancel</button>
              <button className="btn bp" onClick={saveQuick} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
