import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../lib/api'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [conf, setConf] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name || !email || !pass) return setError('All fields are required.')
    if (pass.length < 6) return setError('Password must be at least 6 characters.')
    if (pass !== conf) return setError('Passwords do not match.')
    setLoading(true)
    try {
      await api.signup({ name, email, password: pass })
      setDone(true)
    } catch (err: any) {
      setError(err.message || 'Signup failed.')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    setResending(true)
    try { await api.resendVerification(email); setResent(true) } catch {}
    setResending(false)
  }

  if (done) return (
    <div style={{ minHeight: '100vh', background: '#F7F6F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card" style={{ maxWidth: 420, width: '100%', textAlign: 'center', padding: '2.5rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
        <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: '1.5rem', marginBottom: '.5rem' }}>Check your email</h2>
        <p style={{ color: '#5F5E5A', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          We sent a verification link to <strong>{email}</strong>.<br />Click it to activate your account.
        </p>
        {resent
          ? <div className="al al-s">Verification email resent!</div>
          : <button className="btn bo" onClick={resend} disabled={resending}>{resending ? 'Sending...' : 'Resend verification email'}</button>
        }
        <p style={{ marginTop: '1.25rem', fontSize: '.84rem', color: '#9E9D99' }}>Already verified? <Link to="/login" style={{ color: '#639922', fontWeight: 600 }}>Log in</Link></p>
      </motion.div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 410 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Link to="/" style={{ fontFamily: 'Instrument Serif, serif', fontSize: '1.6rem', color: '#27500A', textDecoration: 'none', display: 'block', marginBottom: '.5rem' }}>🔥 FitTrack Lite</Link>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '.2rem' }}>Create your account</h2>
          <p style={{ color: '#5F5E5A', fontSize: '.875rem' }}>Start tracking your fitness goals today</p>
        </div>
        <form onSubmit={submit} className="card" style={{ padding: '1.85rem' }}>
          {error && <div className="al al-e">{error}</div>}
          <div className="fg"><label>Full name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Alex Johnson" /></div>
          <div className="fg"><label>Email address</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alex@example.com" /></div>
          <div className="fg"><label>Password</label><input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Min. 6 characters" /></div>
          <div className="fg"><label>Confirm password</label><input type="password" value={conf} onChange={e => setConf(e.target.value)} placeholder="Repeat password" /></div>
          <button type="submit" className="btn bp" style={{ width: '100%' }} disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.1rem', fontSize: '.84rem', color: '#5F5E5A' }}>Already have an account? <Link to="/login" style={{ color: '#639922', fontWeight: 600 }}>Log in</Link></p>
      </motion.div>
    </div>
  )
}
