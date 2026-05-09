import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api, User } from '../lib/api'
import { supabase } from '../lib/supabase'

interface AuthCtx {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (u: User | null) => void
}

const Ctx = createContext<AuthCtx>({} as AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        api.me()
          .then(r => setUser(r.user))
          .catch(() => {})
          .finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password })
    setUser(res.user)
  }

  const logout = async () => {
    await api.logout()
    setUser(null)
  }

  return (
    <Ctx.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
