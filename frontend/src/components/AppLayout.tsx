import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AppLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <nav className="nav">
        <NavLink to="/dashboard" className="logo">🔥 FitTrack Lite</NavLink>
        <div className="nav-links">
          <NavLink to="/dashboard" className={({ isActive }) => `nl${isActive ? ' on' : ''}`}>Dashboard</NavLink>
          <NavLink to="/goals" className={({ isActive }) => `nl${isActive ? ' on' : ''}`}>Goals</NavLink>
          <NavLink to="/checkin" className={({ isActive }) => `nl${isActive ? ' on' : ''}`}>Check-in</NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nl${isActive ? ' on' : ''}`}>Profile</NavLink>
          <button className="nl lo" onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <div className="app-body">
        <Outlet />
      </div>
    </div>
  )
}
