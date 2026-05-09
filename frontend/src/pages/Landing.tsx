import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// ── Animated SVG background paths (from provided component) ──
function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    color: `rgba(15,23,42,${0.1 + i * 0.03})`,
    width: 0.5 + i * 0.03,
  }))

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <svg
        style={{ width: '100%', height: '100%', color: '#0f172a' }}
        viewBox="0 0 696 316"
        fill="none"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.03}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const words = ['Build', 'Consistency.', 'Track', 'Your', 'Fitness', 'Goals.']

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>

      {/* ── Landing Nav ── */}
      <nav style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.09)', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, zIndex: 200 }}>
        <span style={{ fontFamily: 'Instrument Serif, serif', fontSize: '1.5rem', color: '#27500A', cursor: 'pointer' }}>🔥 FitTrack Lite</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn bo" onClick={() => navigate('/login')}>Log in</button>
          <button className="btn bp" onClick={() => navigate('/signup')}>Get started</button>
        </div>
      </nav>

      {/* ── Hero with animated paths ── */}
      <div className="landing-wrap" style={{ flex: 1 }}>
        {/* Animated background */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 820, margin: '0 auto', padding: '0 1.5rem', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
          >
            {/* Animated letter-by-letter title */}
            <h1 style={{
              fontFamily: 'Instrument Serif, serif',
              fontSize: 'clamp(2.6rem, 6vw, 4.5rem)',
              fontWeight: 700,
              marginBottom: '2rem',
              letterSpacing: '-0.02em',
              lineHeight: 1.1
            }}>
              {words.map((word, wordIndex) => (
                <span key={wordIndex} style={{ display: 'inline-block', marginRight: '0.3em' }}>
                  {word.split('').map((letter, letterIndex) => (
                    <motion.span
                      key={`${wordIndex}-${letterIndex}`}
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        delay: wordIndex * 0.1 + letterIndex * 0.03,
                        type: 'spring',
                        stiffness: 150,
                        damping: 25,
                      }}
                      style={{
                        display: 'inline-block',
                        background: 'linear-gradient(to right, #111 0%, rgba(17,17,17,0.75) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {letter}
                    </motion.span>
                  ))}
                </span>
              ))}
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              style={{ fontSize: '1.1rem', color: '#5F5E5A', maxWidth: 520, margin: '0 auto 2.5rem', lineHeight: 1.7 }}
            >
              Set multiple fitness goals, schedule future ones, log daily check-ins, and stay consistent with streaks and progress insights.
            </motion.p>

            {/* CTA button — styled exactly like provided component */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
            >
              {/* Primary CTA — glassmorphism style from spec */}
              <div
                className="group"
                style={{
                  display: 'inline-block',
                  position: 'relative',
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(255,255,255,0.1))',
                  padding: 1,
                  borderRadius: '1rem',
                  backdropFilter: 'blur(12px)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
              >
                <motion.button
                  whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}
                  whileTap={{ y: 0 }}
                  onClick={() => navigate('/signup')}
                  style={{
                    padding: '14px 36px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    borderRadius: '0.9rem',
                    border: '1px solid rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.95)',
                    color: '#111',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'background .2s',
                  }}
                >
                  <span style={{ opacity: 0.9 }}>Get started free</span>
                  <motion.span
                    initial={{ x: 0 }}
                    whileHover={{ x: 6 }}
                    style={{ opacity: 0.7 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >→</motion.span>
                </motion.button>
              </div>

              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                onClick={() => navigate('/login')}
                style={{
                  padding: '14px 28px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  borderRadius: '0.9rem',
                  border: '1.5px solid rgba(0,0,0,0.12)',
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(8px)',
                  color: '#444',
                  cursor: 'pointer',
                }}
              >
                Log in
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ── Features Section ── */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        style={{ maxWidth: 940, margin: '0 auto', padding: '5rem 2rem' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: '2rem', marginBottom: '.5rem' }}>Everything you need, nothing you don't</h2>
          <p style={{ color: '#5F5E5A' }}>Simple tools. Lasting habits.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {[
            { icon: '🎯', bg: '#EAF3DE', title: 'Multiple Goals', desc: 'Run multiple fitness goals simultaneously. No artificial limits.' },
            { icon: '📅', bg: '#E6F1FB', title: 'Daily Check-ins', desc: 'One check-in per goal per day. Completed or missed. Notes included.' },
            { icon: '🔥', bg: '#FAEEDA', title: 'Streak System', desc: 'Track consecutive completed days. Watch your streaks grow.' },
            { icon: '⏰', bg: '#EEEDFE', title: 'Schedule Future Goals', desc: 'Plan a goal starting next week, next month — whenever you\'re ready.' },
            { icon: '📊', bg: '#FCEBEB', title: 'Progress Insights', desc: 'Per-goal stats, completion rates, and motivating messages.' },
            { icon: '👤', bg: '#E1F5EE', title: 'Profile Overview', desc: 'See all active, upcoming and finished goals with full history.' },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
              style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 14, padding: '1.75rem', cursor: 'default', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow .2s' }}
            >
              <div style={{ width: 46, height: 46, borderRadius: 10, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: '1.1rem' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '.4rem' }}>{f.title}</h3>
              <p style={{ fontSize: '.855rem', color: '#5F5E5A', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── CTA Section ── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        style={{ background: 'linear-gradient(135deg, #27500A, #3B6D11)', color: '#fff', textAlign: 'center', padding: '5rem 2rem' }}
      >
        <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: '2.1rem', marginBottom: '.9rem' }}>Start your fitness journey today</h2>
        <p style={{ opacity: .85, marginBottom: '1.9rem', fontSize: '1rem' }}>Join thousands building consistency one day at a time.</p>
        <motion.button
          whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/signup')}
          style={{ background: '#fff', color: '#27500A', padding: '13px 32px', borderRadius: 10, fontSize: '1rem', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Create your free account →
        </motion.button>
      </motion.section>
    </div>
  )
}
