import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api, Goal, Log } from '../lib/api'

function today() { return new Date().toISOString().split('T')[0] }
function fmtShort(s: string) { return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }

export default function Checkin() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [selectedGoalId, setSelectedGoalId] = useState('')
  const [date, setDate] = useState(today())
  const [status, setStatus] = useState<'completed' | 'missed'>('completed')
  const [notes, setNotes] = useState('')
  const [existing, setExisting] = useState<Log | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [recentLogs, setRecentLogs] = useState<Log[]>([])

  useEffect(() => {
    Promise.all([api.getGoals(), api.getLogs({ limit: 10 })]).then(([gr, lr]) => {
      const active = gr.goals.filter(g => g.status === 'active')
      setGoals(active)
      if (active.length > 0) {
        // Support pre-selecting via URL param
        const params = new URLSearchParams(window.location.search)
        const preGoal = params.get('goal')
        setSelectedGoalId(preGoal && active.find(g => g.id === preGoal) ? preGoal : active[0].id)
      }
      setRecentLogs(lr.logs)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Fetch existing log when goal or date changes
  useEffect(() => {
    if (!selectedGoalId || !date) return
    api.getLogs({ goal_id: selectedGoalId, date }).then(r => {
      const log = r.logs[0] || null
      setExisting(log)
      if (log) { setStatus(log.status); setNotes(log.notes || '') }
      else { setStatus('completed'); setNotes('') }
    })
  }, [selectedGoalId, date])

  const save = async () => {
    if (!selectedGoalId) return
    setSaving(true); setMsg(null)
    try {
      await api.saveLog({ goal_id: selectedGoalId, log_date: date, status, notes })
      setMsg({ type: 'success', text: 'Check-in saved!' })
      // Refresh
      const [lr, logCheck] = await Promise.all([api.getLogs({ limit: 10 }), api.getLogs({ goal_id: selectedGoalId, date })])
      setRecentLogs(lr.logs)
      setExisting(logCheck.logs[0] || null)
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Failed to save.' })
    }
    setSaving(false)
    setTimeout(() => setMsg(null), 3000)
  }

  const del = async () => {
    if (!existing || !confirm('Delete this check-in?')) return
    await api.deleteLog(existing.id)
    setExisting(null); setStatus('completed'); setNotes('')
    const lr = await api.getLogs({ limit: 10 }); setRecentLogs(lr.logs)
  }

  const selectedGoal = goals.find(g => g.id === selectedGoalId)

  if (loading) return <div className="spinner"><div className="spin" /></div>

  if (goals.length === 0) return (
    <div>
      <div className="ph"><h1>Daily Check-in</h1></div>
      <div className="empty card"><div className="ei">📅</div><h3>No active goals</h3><p>Create or activate a goal first.</p><a href="/goals" className="btn bp">Go to Goals</a></div>
    </div>
  )

  const goalStart = selectedGoal?.start_date || today()
  const goalEnd = (() => {
    if (!selectedGoal) return today()
    const d = new Date(selectedGoal.start_date + 'T00:00:00')
    d.setDate(d.getDate() + selectedGoal.duration_days)
    return d.toISOString().split('T')[0]
  })()

  const dateOutOfRange = date < goalStart || date >= goalEnd

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="ph"><h1>Daily Check-in</h1><p>Log your activity for each goal. One check-in per goal per day.</p></div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px,560px) 1fr', gap: '1.5rem', alignItems: 'start', flexWrap: 'wrap' }}>
        {/* Left: form */}
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            {/* Goal + date selectors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="fg" style={{ margin: 0 }}>
                <label>Goal</label>
                <select value={selectedGoalId} onChange={e => setSelectedGoalId(e.target.value)}>
                  {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
              </div>
              <div className="fg" style={{ margin: 0 }}>
                <label>Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>

            {dateOutOfRange ? (
              <div className="al" style={{ background: '#FAEEDA', color: '#7D4A09', border: '1px solid #F0C97A', marginBottom: 0 }}>
                {date < goalStart ? `This goal starts on ${fmtShort(goalStart)}` : `This goal ended on ${fmtShort(goalEnd)}`}
              </div>
            ) : (
              <>
                {existing && (
                  <div style={{ background: '#EAF3DE', borderRadius: 8, padding: '.9rem 1rem', marginBottom: '1rem', fontSize: '.875rem', color: '#27500A', fontWeight: 600 }}>
                    ✓ Already logged for {fmtShort(date)}: <strong>{existing.status}</strong>{existing.notes ? ` — "${existing.notes}"` : ''}
                    <span style={{ color: '#639922', marginLeft: 8, fontWeight: 400, fontSize: '.78rem' }}>Updating entry below</span>
                  </div>
                )}

                {msg && <div className={`al ${msg.type === 'success' ? 'al-s' : 'al-e'}`}>{msg.text}</div>}

                <div className="fg">
                  <label>Status for {fmtShort(date)}</label>
                  <div className="stog">
                    <div className={`sopt ${status === 'completed' ? 'sc2' : ''}`} onClick={() => setStatus('completed')}>✓ Completed</div>
                    <div className={`sopt ${status === 'missed' ? 'sm' : ''}`} onClick={() => setStatus('missed')}>✗ Missed</div>
                  </div>
                </div>
                <div className="fg" style={{ marginBottom: '1rem' }}>
                  <label>Notes (optional)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="How did it go?" />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn bp" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Check-in'}</button>
                  {existing && <button className="btn bd" onClick={del}>Delete Entry</button>}
                </div>
              </>
            )}
          </div>

          {/* Goal info */}
          {selectedGoal && (
            <div className="card" style={{ fontSize: '.85rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '.5rem' }}>{selectedGoal.title}</div>
              <div style={{ color: '#5F5E5A' }}>
                {selectedGoal.category} · {selectedGoal.duration_days} days · Started {fmtShort(selectedGoal.start_date)}
              </div>
              {selectedGoal.stats && (
                <div style={{ marginTop: '.75rem', display: 'flex', gap: '1rem' }}>
                  <span style={{ color: '#27500A', fontWeight: 600 }}>✓ {selectedGoal.stats.completed} done</span>
                  <span style={{ color: '#E24B4A', fontWeight: 600 }}>✗ {selectedGoal.stats.missed} missed</span>
                  <span style={{ color: '#BA7517', fontWeight: 600 }}>🔥 {selectedGoal.stats.streak} streak</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: recent logs */}
        <div>
          <div className="stitle">Recent Check-ins</div>
          {recentLogs.length === 0 ? (
            <div className="card" style={{ color: '#9E9D99', fontSize: '.875rem', textAlign: 'center', padding: '2rem' }}>No logs yet</div>
          ) : (
            <div className="card">
              {recentLogs.map(l => (
                <div key={l.id} className="log-item">
                  <div className={`ld ${l.status === 'completed' ? 'c' : 'm'}`} />
                  <div style={{ minWidth: 80, fontSize: '.835rem', fontWeight: 600 }}>{fmtShort(l.log_date)}</div>
                  <div style={{ flex: 1, fontSize: '.78rem', color: '#5F5E5A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.goals?.title || ''}</div>
                  <div style={{ fontSize: '.775rem', fontWeight: 600, color: l.status === 'completed' ? '#27500A' : '#E24B4A' }}>
                    {l.status === 'completed' ? '✓ Done' : '✗ Missed'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
