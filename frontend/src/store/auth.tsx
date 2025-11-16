import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type AuthContextValue = {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function postJson(path: string, body: unknown) {
  const resp = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  let payload: any = null
  try {
    payload = await resp.json()
  } catch {
    payload = null
  }

  if (!resp.ok) {
    const message =
      (payload && typeof payload.error === 'string' && payload.error) ||
      'Request failed'
    throw new Error(message)
  }

  return payload
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)

  const login = useCallback(async (username: string, password: string) => {
    setIsAuthenticated(false)
    await postJson('/api/auth/login/', { username, password })
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      login,
      logout,
    }),
    [isAuthenticated, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
