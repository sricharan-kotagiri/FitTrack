import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [unverified, setUnverified] = useState(false)
  const [resent, setResent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setUnverified(false)
    if (!email || !pass) return setError('Email and password are required.')
    setLoading(true)
    try {
      await login(email, pass)
      navigate('/dashboard')
    } catch (err: any) {
      if (err.message?.includes('verify')) { setUnverified(true) }
      else setError(err.message || 'Login failed.')
    } finally { setLoading(false) }
  }

  const resend = async () => {
    try { await api.resendVerification(email); setResent(true) } catch {}
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F6F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 410 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <Link to="/" style={{ fontFamily: 'Instrument Serif, serif', fontSize: '1.6rem', color: '#27500A', textDecoration: 'none', display: 'block', marginBottom: '.5rem' }}>🔥 FitTrack Lite</Link>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '.2rem' }}>Welcome back</h2>
          <p style={{ color: '#5F5E5A', fontSize: '.875rem' }}>Log in to see your progress</p>
        </div>
        <form onSubmit={submit} className="card" style={{ padding: '1.85rem' }}>
          {error && <div className="al al-e">{error}</div>}
          {unverified && (
            <div className="al" style={{ background: '#FAEEDA', color: '#7D4A09', border: '1px solid #F0C97A' }}>
              Please verify your email first.{' '}
              {!resent
                ? <button type="button" onClick={resend} style={{ color: '#BA7517', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Resend link</button>
                : <strong>Email sent!</strong>
              }
            </div>
          )}
          <div className="fg"><label>Email address</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alex@example.com" /></div>
          <div className="fg"><label>Password</label><input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Your password" /></div>
          <button type="submit" className="btn bp" style={{ width: '100%' }} disabled={loading}>{loading ? 'Logging in...' : 'Log in'}</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.1rem', fontSize: '.84rem', color: '#5F5E5A' }}>No account? <Link to="/signup" style={{ color: '#639922', fontWeight: 600 }}>Sign up free</Link></p>
      </motion.div>
    </div>
  )
}
