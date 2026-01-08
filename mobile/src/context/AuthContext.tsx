import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { apiLogin, apiRegister, apiVerifyEmail, apiForgotPassword, apiResetPassword, apiProfile, apiGoogleOAuth, setUnauthorizedHandler } from '../services/api'

type AuthUser = {
  id: string
  email: string
  name?: string
  role?: string
  authProvider?: 'local' | 'google'
  acceptedLegal?: boolean
  hasAcceptedAnyRequired?: boolean
}

type AuthContextValue = {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean
  setTokens: (accessToken: string | null) => void
  activeProfileId: string | null
  setActiveProfileId: (id: string | null) => void
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, acceptedLegal: boolean) => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, newPassword: string) => Promise<void>
  googleOAuth: (idToken: string) => Promise<void>
  refreshProfile: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: any }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStorage()
  }, [])

  async function loadStorage() {
    try {
      const [token, userJson, profileId] = await Promise.all([
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('activeProfileId')
      ])

      if (token && userJson) {
        setAccessToken(token)
        setUser(JSON.parse(userJson))
        if (profileId) {
          setActiveProfileId(profileId)
        }
      }
    } catch (e) {
      console.error('[Auth] Failed to load storage', e)
    } finally {
      setIsLoading(false)
    }
  }

  function setTokens(token: string | null) {
    setAccessToken(token)
    if (token) {
      AsyncStorage.setItem('accessToken', token)
    } else {
      AsyncStorage.removeItem('accessToken')
    }
  }

  async function login(email: string, password: string) {
    const res = await apiLogin(email, password)
    const token = res.accessToken || null
    const userData = res.user || null
    
    setAccessToken(token)
    setUser(userData)
    
    if (token) await AsyncStorage.setItem('accessToken', token)
    if (userData) await AsyncStorage.setItem('user', JSON.stringify(userData))
  }

  async function register(name: string, email: string, password: string, acceptedLegal: boolean) {
    await apiRegister(name, email, password, acceptedLegal)
    // Usuário precisa confirmar o e-mail antes de autenticar de fato,
    // portanto não mantemos tokens/usuário aqui.
    setAccessToken(null)
    setUser(null)
    await AsyncStorage.multiRemove(['accessToken', 'user', 'activeProfileId'])
  }

  async function verifyEmail(token: string) {
    const res = await apiVerifyEmail(token)
    const newToken = res.accessToken || null
    const newUser = res.user || null
    
    setAccessToken(newToken)
    setUser(newUser)

    if (newToken) await AsyncStorage.setItem('accessToken', newToken)
    if (newUser) await AsyncStorage.setItem('user', JSON.stringify(newUser))
  }

  async function forgotPassword(email: string) {
    await apiForgotPassword(email)
  }

  async function resetPassword(token: string, newPassword: string) {
    await apiResetPassword(token, newPassword)
  }

  async function googleOAuth(idToken: string) {
    try {
      const res = await apiGoogleOAuth(idToken)
      const token = res.accessToken || null
      const userData = res.user || null
      
      setAccessToken(token)
      setUser(userData)

      if (token) await AsyncStorage.setItem('accessToken', token)
      if (userData) await AsyncStorage.setItem('user', JSON.stringify(userData))
    } catch (e: any) {
      try { console.error('[Mobile][Auth] googleOAuth falhou', { message: e?.message }) } catch {}
      throw e
    }
  }

  async function refreshProfile() {
    if (!accessToken) return
    try {
      const me = await apiProfile(accessToken)
      setUser(me || null)
      if (me) await AsyncStorage.setItem('user', JSON.stringify(me))
    } catch {}
  }

  function logout() {
    setAccessToken(null)
    setUser(null)
    setActiveProfileId(null)
    AsyncStorage.multiRemove(['accessToken', 'user', 'activeProfileId'])
  }

  useEffect(() => {
    setUnauthorizedHandler(() => logout())
    return () => setUnauthorizedHandler(undefined)
  }, [])

  // Intercept setActiveProfileId to persist it
  const setActiveProfileIdWithPersistence = (id: string | null) => {
    setActiveProfileId(id)
    if (id) {
      AsyncStorage.setItem('activeProfileId', id)
    } else {
      AsyncStorage.removeItem('activeProfileId')
    }
  }

  const value = useMemo(
    () => ({ 
      user, 
      accessToken, 
      isLoading,
      setTokens, 
      activeProfileId, 
      setActiveProfileId: setActiveProfileIdWithPersistence, 
      login, 
      register, 
      verifyEmail, 
      forgotPassword, 
      resetPassword, 
      googleOAuth, 
      refreshProfile, 
      logout 
    }),
    [user, accessToken, activeProfileId, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthContext not found')
  return ctx
}
