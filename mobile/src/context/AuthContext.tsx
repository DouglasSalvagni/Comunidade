import { createContext, useContext, useMemo, useState } from 'react'
import { apiLogin, apiRegister, apiVerifyEmail, apiForgotPassword, apiResetPassword, apiProfile, apiGoogleOAuth } from '../services/api'

type AuthUser = {
  id: string
  email: string
  name?: string
  role?: string
}

type AuthContextValue = {
  user: AuthUser | null
  accessToken: string | null
  setTokens: (accessToken: string | null) => void
  activeProfileId: string | null
  setActiveProfileId: (id: string | null) => void
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, newPassword: string) => Promise<void>
  googleOAuth: (idToken: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: any }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)

  function setTokens(token: string | null) {
    setAccessToken(token)
  }

  async function login(email: string, password: string) {
    const res = await apiLogin(email, password)
    setAccessToken(res.accessToken || null)
    setUser(res.user || null)
  }

  async function register(name: string, email: string, password: string) {
    const res = await apiRegister(name, email, password)
    setAccessToken(res.accessToken || null)
    setUser(res.user || null)
  }

  async function verifyEmail(token: string) {
    const res = await apiVerifyEmail(token)
    setAccessToken(res.accessToken || null)
    setUser(res.user || null)
  }

  async function forgotPassword(email: string) {
    await apiForgotPassword(email)
  }

  async function resetPassword(token: string, newPassword: string) {
    await apiResetPassword(token, newPassword)
  }

  async function googleOAuth(idToken: string) {
    const res = await apiGoogleOAuth(idToken)
    setAccessToken(res.accessToken || null)
    setUser(res.user || null)
  }

  function logout() {
    setAccessToken(null)
    setUser(null)
    setActiveProfileId(null)
  }

  const value = useMemo(
    () => ({ user, accessToken, setTokens, activeProfileId, setActiveProfileId, login, register, verifyEmail, forgotPassword, resetPassword, googleOAuth, logout }),
    [user, accessToken, activeProfileId],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthContext not found')
  return ctx
}