import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Logo = () => (
  <svg width="28" height="28" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{flexShrink:0}}>
    <defs>
      <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366F1"/>
        <stop offset="100%" stopColor="#8B5CF6"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="22" fill="url(#lg)"/>
    <path d="M28 66 L44 34 L54 52 L63 40 L74 66Z" fill="none" stroke="white" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round"/>
    <circle cx="74" cy="36" r="6" fill="#4ADE80"/>
  </svg>
)

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  )},
  { to: '/goals', label: 'Goals', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  )},
  { to: '/checkin', label: 'Check-in', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )},
  { to: '/profile', label: 'Profile', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )},
]

export default function AppLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* ── Desktop + Mobile Top Nav ── */}
      <nav className="nav">
        <NavLink to="/dashboard" style={{display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none'}}>
          <Logo />
          <span style={{fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '1.15rem', background: 'linear-gradient(135deg, #818CF8 0%, #A78BFA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.02em'}}>FitTrack</span>
        </NavLink>

        {/* Desktop Links */}
        <div className="nav-links desktop-nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nl${isActive ? ' on' : ''}`}>
              {item.label}
            </NavLink>
          ))}
          <button className="nl lo" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* ── Page Content ── */}
      <div style={{ flex: 1, paddingBottom: '80px' }} className="page-content">
        <div className="app-body">
          <Outlet />
        </div>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <div className="mobile-bottom-nav">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} className="mbn-item">
            {({ isActive }) => (
              <>
                <span className={`mbn-icon ${isActive ? 'active' : ''}`}>
                  {item.icon}
                </span>
                <span className={`mbn-label ${isActive ? 'active' : ''}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
        <button className="mbn-item mbn-logout" onClick={handleLogout}>
          <span className="mbn-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span className="mbn-label">Logout</span>
        </button>
      </div>
    </div>
  )
}