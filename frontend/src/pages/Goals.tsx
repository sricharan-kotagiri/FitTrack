import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api, Goal } from '../lib/api'

const CATEGORIES = ['Cardio', 'Strength', 'Flexibility', 'Nutrition', 'Wellness', 'General']
const COLORS = ['green', 'blue', 'amber', 'purple', 'red']
const COLOR_LABELS: Record<string, string> = { green: 'Green', blue: 'Blue', amber: 'Amber', purple: 'Purple', red: 'Red' }
const BADGE_CLS: Record<string, string> = { active: 'bg-gr', upcoming: 'bg-pu', finished: 'bg-gy' }

function today() { return new Date().toISOString().split('T')[0] }
function fmtDate(s: string) { return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }

type Filter = 'all' | 'active' | 'upcoming' | 'finished'
type ModalMode = 'create' | 'edit' | null

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [modal, setModal] = useState<ModalMode>(null)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState('30')
  const [startDate, setStartDate] = useState(today())
  const [category, setCategory] = useState('General')
  const [color, setColor] = useState('green')
  const [notes, setNotes] = useState('')

  const load = () => api.getGoals().then(r => { setGoals(r.goals); setLoading(false) }).catch(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditGoal(null); setTitle(''); setDuration('30'); setStartDate(today())
    setCategory('General'); setColor('green'); setNotes(''); setErr(''); setModal('create')
  }
  const openEdit = (g: Goal) => {
    setEditGoal(g); setTitle(g.title); setDuration(String(g.duration_days))
    setStartDate(g.start_date); setCategory(g.category); setColor(g.color); setNotes(g.notes || ''); setErr(''); setModal('edit')
  }
  const closeModal = () => { setModal(null); setEditGoal(null) }

  const save = async () => {
    if (!title.trim()) return setErr('Goal title is required.')
    if (!duration || Number(duration) < 1) return setErr('Valid duration required.')
    setSaving(true); setErr('')
    try {
      const payload = { title: title.trim(), duration_days: Number(duration), start_date: startDate, category, color, notes }
      if (modal === 'edit' && editGoal) { await api.updateGoal(editGoal.id, payload) }
      else { await api.createGoal(payload) }
      await load(); closeModal()
    } catch (e: any) { setErr(e.message || 'Failed to save goal.') }
    setSaving(false)
  }

  const del = async (id: string) => {
    if (!confirm('Delete this goal and all its logs?')) return
    await api.deleteGoal(id); load()
  }

  const filtered = filter === 'all' ? goals : goals.filter(g => g.status === filter)

  if (loading) return <div className="spinner"><div className="spin" /></div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="ph" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.5rem' }}>
        <div><h1>Goals</h1><p>Manage your fitness goals. Schedule future ones. Track multiple at once.</p></div>
        <button className="btn bp" onClick={openCreate}>+ Create Goal</button>
      </div>

      {/* Filter tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem', maxWidth: 440 }}>
        {(['all', 'active', 'upcoming', 'finished'] as Filter[]).map(f => (
          <button key={f} className={`tab ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && <span style={{ marginLeft: 5, fontSize: '.7rem', opacity: .7 }}>({goals.filter(g => g.status === f).length})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="ei">{filter === 'upcoming' ? '⏰' : '🎯'}</div>
          <h3>No {filter === 'all' ? '' : filter} goals</h3>
          <p>{filter === 'all' ? 'Create your first goal to get started.' : `No ${filter} goals yet.`}</p>
          <button className="btn bp" onClick={openCreate}>+ Create Goal</button>
        </div>
      ) : (
        <AnimatePresence>
          {filtered.map((g, i) => {
            const s = g.stats
            const barCls = s ? (s.pct < 40 ? 'red' : s.pct < 70 ? 'amber' : '') : ''
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }} className="gcrd">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.9rem', flexWrap: 'wrap', gap: '.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                      <span className={`badge ${BADGE_CLS[g.status || 'active']}`}>{g.status}</span>
                      <span className="badge bg-gy">{g.category}</span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 2 }}>{g.title}</div>
                    <div style={{ fontSize: '.8rem', color: '#5F5E5A' }}>Started {fmtDate(g.start_date)} · {g.duration_days} days</div>
                  </div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {g.status === 'active' && <a href="/checkin" className="btn bo bsm" onClick={e => { e.preventDefault(); window.location.href = `/checkin?goal=${g.id}` }}>Log today</a>}
                    <button className="btn bo bsm" onClick={() => openEdit(g)}>Edit</button>
                    <button className="btn bd bsm" onClick={() => del(g.id)}>Delete</button>
                  </div>
                </div>
                {s && g.status !== 'upcoming' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.6rem', marginBottom: '.9rem' }}>
                      <div className="sc gr" style={{ padding: '.75rem' }}><div className="sv" style={{ fontSize: '1.3rem' }}>{s.completed}</div><div className="sl">Done</div></div>
                      <div className="sc re" style={{ padding: '.75rem' }}><div className="sv" style={{ fontSize: '1.3rem' }}>{s.missed}</div><div className="sl">Missed</div></div>
                      <div className="sc bl" style={{ padding: '.75rem' }}><div className="sv" style={{ fontSize: '1.3rem' }}>{s.pct}%</div><div className="sl">Progress</div></div>
                      <div className="sc am" style={{ padding: '.75rem' }}><div className="sv" style={{ fontSize: '1.3rem' }}>{s.streak}🔥</div><div className="sl">Streak</div></div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', color: '#5F5E5A', marginBottom: 4 }}><span>Progress</span><span>{s.pct}%</span></div>
                      <div className="pbg"><div className={`pbf ${barCls}`} style={{ width: `${s.pct}%` }} /></div>
                    </div>
                  </>
                )}
                {g.status === 'upcoming' && (
                  <div style={{ fontSize: '.82rem', color: '#534AB7', fontWeight: 500 }}>
                    ⏰ Starts {fmtDate(g.start_date)}
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      )}

      {/* Create / Edit modal */}
      {modal && (
        <div className="modal-ov" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal">
            <h3>
              {modal === 'create' ? 'Create New Goal' : 'Edit Goal'}
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#888' }}>✕</button>
            </h3>
            {err && <div className="al al-e">{err}</div>}
            <div className="fg"><label>Goal Title</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Run 5km every morning" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="fg"><label>Duration (days)</label><input type="number" value={duration} onChange={e => setDuration(e.target.value)} min="1" max="365" /></div>
              <div className="fg"><label>Category</label><select value={category} onChange={e => setCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="fg">
                <label>Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                {startDate > today() && <p style={{ fontSize: '.75rem', color: '#534AB7', marginTop: 4 }}>⏰ This goal will be scheduled for the future</p>}
              </div>
              <div className="fg"><label>Color</label><select value={color} onChange={e => setColor(e.target.value)}>{COLORS.map(c => <option key={c} value={c}>{COLOR_LABELS[c]}</option>)}</select></div>
            </div>
            <div className="fg"><label>Notes (optional)</label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="What's this goal about?" /></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '.5rem' }}>
              <button className="btn bo" onClick={closeModal}>Cancel</button>
              <button className="btn bp" onClick={save} disabled={saving}>{saving ? 'Saving...' : modal === 'create' ? 'Create Goal' : 'Save Changes'}</button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
