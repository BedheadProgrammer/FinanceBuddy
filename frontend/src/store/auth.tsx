import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type RegisterInput = {
  username: string
  email: string
  password: string
  confirm: string
}

type AuthContextValue = {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => void
}

type AuthResponse = {
  ok?: boolean
  username?: string
  error?: string
  detail?: string
  [key: string]: unknown
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const AUTH_STORAGE_KEY = 'fb_isAuthenticated'

function loadInitialAuthState(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY)
    return stored === 'true'
  } catch {
    return false
  }
}

async function postJson(path: string, body: unknown): Promise<AuthResponse> {
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
      (payload && typeof payload.detail === 'string' && payload.detail) ||
      'Request failed'
    throw new Error(message)
  }

  return (payload || {}) as AuthResponse
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => loadInitialAuthState())

  const setAuth = useCallback((next: boolean) => {
    setIsAuthenticated(next)
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(AUTH_STORAGE_KEY, next ? 'true' : 'false')
      }
    } catch {
      // ignore storage errors (private mode, quota, etc.)
    }
  }, [])

  const login = useCallback(
    async (username: string, password: string) => {
      setAuth(false)
      const payload = await postJson('/api/auth/login/', { username, password })

      if (!payload.ok || typeof payload.username !== 'string') {
        setAuth(false)
        throw new Error(payload.error || payload.detail || 'Invalid username or password')
      }

      setAuth(true)
    },
    [setAuth],
  )

  const register = useCallback(
    async (input: RegisterInput) => {
      setAuth(false)
      const payload = await postJson('/api/auth/register/', {
        username: input.username,
        email: input.email,
        password: input.password,
        confirm: input.confirm,
      })

      if (!payload.ok || typeof payload.username !== 'string') {
        setAuth(false)
        throw new Error(payload.error || payload.detail || 'Registration failed')
      }

      setAuth(true)
    },
    [setAuth],
  )

  const logout = useCallback(() => {
    setAuth(false)
  }, [setAuth])

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      login,
      register,
      logout,
    }),
    [isAuthenticated, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
