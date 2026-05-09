import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, ProfileResponse } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

function fmtDate(s: string) { return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }
function fmtShort(s: string) { return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
const BADGE_CLS: Record<string, string> = { active: 'bg-gr', upcoming: 'bg-pu', finished: 'bg-gy' }

export default function Profile() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [editName, setEditName] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => api.getProfile().then(r => { setData(r); setLoading(false) }).catch(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleLogout = async () => { await logout(); navigate('/') }

  const saveProfile = async () => {
    if (!newName.trim()) return
    setSaving(true)
    await api.updateProfile({ name: newName.trim() })
    await load(); setEditName(false); setSaving(false)
  }

  const deleteAccount = async () => {
    if (!confirm('Delete your account and ALL data permanently? This cannot be undone.')) return
    await api.deleteAccount(); await logout(); navigate('/')
  }

  if (loading) return <div className="spinner"><div className="spin" /></div>
  if (!data) return <div className="empty"><div className="ei">⚠️</div><h3>Failed to load profile</h3></div>

  const { profile, stats, goals_breakdown } = data
  const initials = profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="ph"><h1>Profile</h1><p>Your account and stats overview.</p></div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,280px) 1fr', gap: '1.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {/* Left: identity */}
        <div className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <div className="av" style={{ margin: '0 auto .9rem' }}>{initials}</div>
          {editName ? (
            <div style={{ marginBottom: '.75rem' }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} style={{ marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                <button className="btn bsm bp" onClick={saveProfile} disabled={saving}>Save</button>
                <button className="btn bsm bo" onClick={() => setEditName(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 3 }}>{profile.name}</h2>
          )}
          <p style={{ color: '#5F5E5A', fontSize: '.84rem', marginBottom: '.9rem' }}>{profile.email}</p>
          <span className="badge bg-gr" style={{ fontSize: '.72rem', marginBottom: '1rem', display: 'inline-flex' }}>
            Member since {fmtShort(profile.created_at)}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: '.5rem' }}>
            {!editName && <button className="btn bo bsm" onClick={() => { setNewName(profile.name); setEditName(true) }}>Edit name</button>}
            <button className="btn lo bsm" style={{ background: 'none', border: '1.5px solid #E24B4A', color: '#E24B4A', borderRadius: 8, cursor: 'pointer', padding: '6px 13px', fontSize: '.78rem', fontWeight: 600, fontFamily: 'inherit' }} onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* Right: stats */}
        <div>
          {/* Overview stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '.85rem', marginBottom: '1.1rem' }}>
            <div className="sc gr"><div className="sv">{stats.active_goals}</div><div className="sl">Active Now</div></div>
            <div className="sc bl"><div className="sv">{stats.upcoming_goals}</div><div className="sl">Upcoming</div></div>
            <div className="sc" style={{ background: '#F4F3EF' }}><div className="sv" style={{ color: '#444' }}>{stats.finished_goals}</div><div className="sl">Finished</div></div>
            <div className="sc gr"><div className="sv">{stats.total_completed}</div><div className="sl">Days Done</div></div>
            <div className="sc re"><div className="sv">{stats.total_missed}</div><div className="sl">Days Missed</div></div>
            <div className="sc am"><div className="sv">{stats.best_streak}🔥</div><div className="sl">Best Streak</div></div>
          </div>

          {/* Overall completion rate */}
          <div className="card" style={{ padding: '1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.82rem', fontWeight: 600, marginBottom: 6 }}>
              <span>Overall Completion Rate</span><span>{stats.overall_pct}%</span>
            </div>
            <div className="pbg">
              <div className={`pbf ${stats.overall_pct < 40 ? 'red' : stats.overall_pct < 70 ? 'amber' : ''}`} style={{ width: `${stats.overall_pct}%` }} />
            </div>
            <p style={{ fontSize: '.75rem', color: '#9E9D99', marginTop: 6 }}>
              {stats.total_completed} completed out of {stats.total_completed + stats.total_missed} logged days across {stats.total_goals} goal{stats.total_goals !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Per-goal breakdown */}
      {goals_breakdown.length > 0 && (
        <>
          <div className="stitle">Goal Breakdown</div>
          {goals_breakdown.map((g, i) => {
            const s = g.stats ?? { completed: 0, missed: 0, pct: 0, streak: 0, days_left: 0, tracked_days: 0 }
            const barCls = s.pct < 40 ? 'red' : s.pct < 70 ? 'amber' : ''
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="gcrd" style={{ marginBottom: '.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.85rem', flexWrap: 'wrap', gap: '.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                      <span className={`badge ${BADGE_CLS[g.status || 'active']}`}>{g.status}</span>
                      <span className="badge bg-gy">{g.category}</span>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 2 }}>{g.title}</div>
                    <div style={{ fontSize: '.8rem', color: '#5F5E5A' }}>{fmtShort(g.start_date)} · {g.duration_days} days</div>
                  </div>
                  {g.status === 'active' && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#BA7517' }}>{s.streak}🔥</div>
                      <div style={{ fontSize: '.72rem', color: '#5F5E5A' }}>current streak</div>
                    </div>
                  )}
                </div>
                {g.status !== 'upcoming' ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.5rem', marginBottom: '.75rem' }}>
                      <div className="sc gr" style={{ padding: '.75rem' }}><div className="sv" style={{ fontSize: '1.2rem' }}>{s.completed}</div><div className="sl">Done</div></div>
                      <div className="sc re" style={{ padding: '.75rem' }}><div className="sv" style={{ fontSize: '1.2rem' }}>{s.missed}</div><div className="sl">Missed</div></div>
                      <div className="sc bl" style={{ padding: '.75rem' }}><div className="sv" style={{ fontSize: '1.2rem' }}>{s.pct}%</div><div className="sl">Rate</div></div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', color: '#5F5E5A', marginBottom: 4 }}><span>Progress</span><span>{s.pct}%</span></div>
                      <div className="pbg"><div className={`pbf ${barCls}`} style={{ width: `${s.pct}%` }} /></div>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: '.82rem', color: '#534AB7', fontWeight: 500 }}>⏰ Starts {fmtDate(g.start_date)}</p>
                )}
              </motion.div>
            )
          })}
        </>
      )}

      {/* Danger zone */}
      <div className="card" style={{ marginTop: '1.5rem', borderColor: '#F7C1C1' }}>
        <div style={{ fontWeight: 700, marginBottom: '.4rem', color: '#791F1F' }}>Danger Zone</div>
        <p style={{ fontSize: '.85rem', color: '#5F5E5A', marginBottom: '1rem' }}>Permanently delete your account and all your data. This cannot be undone.</p>
        <button className="btn bd bsm" onClick={deleteAccount}>Delete my account</button>
      </div>
    </motion.div>
  )
}
