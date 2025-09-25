import { createContext, useContext, useMemo, useState } from 'react'

type AuthContextValue = {
  isAuthenticated: boolean
  login: (u: string, p: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated,
    login: async () => { setIsAuthenticated(true) },
    logout: () => { setIsAuthenticated(false) },
  }), [isAuthenticated])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


