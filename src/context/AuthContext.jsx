import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getAuthToken, getMe, setAuthToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = getAuthToken()
    if (!token) {
      setUser(null)
      return null
    }
    const u = await getMe()
    setUser(u)
    return u
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (getAuthToken()) {
          const u = await getMe()
          if (!cancelled) setUser(u)
        }
      } catch {
        if (!cancelled) {
          setAuthToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loginWithSession = useCallback((token, nextUser) => {
    setAuthToken(token)
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    setAuthToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      loginWithSession,
      logout,
      refreshUser,
    }),
    [user, loading, loginWithSession, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
