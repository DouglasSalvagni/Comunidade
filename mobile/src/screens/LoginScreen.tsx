import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Keyboard, Animated } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import Input from '../components/Input'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'
import { apiRequestEmailVerification } from '../services/api'
import * as WebBrowser from 'expo-web-browser'
import { GoogleSignin, statusCodes, isErrorWithCode, isSuccessResponse } from '@react-native-google-signin/google-signin'
import { AntDesign } from '@expo/vector-icons'
import appConfig from '../../app.json'

type Props = {
  onRegister: () => void
  onForgot: () => void
  onLoggedIn: () => void
  onVerificationNotice: (email: string) => void
}

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen({ onRegister, onForgot, onLoggedIn, onVerificationNotice }: Props) {
  const { login, googleOAuth, appleOAuth } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unverified, setUnverified] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [gLoading, setGLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const shift = useRef(new Animated.Value(0)).current
  const [logs, setLogs] = useState<string[]>([])
  const [appleAvailable, setAppleAvailable] = useState(false)
  const [aLoading, setALoading] = useState(false)
  const appendLog = (msg: string, data?: any) => {
    const ts = new Date().toISOString()
    let line = `[${ts}] ${msg}`
    if (data !== undefined) {
      try { line += ` ${JSON.stringify(data)}` } catch { }
    }
    setLogs(prev => [...prev, line])
  }

  const friendlyError = (msg: string) => {
    const normalized = (msg || '').toString()
    const lower = normalized.toLowerCase()
    const plain = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const invalidCreds =
      plain.includes('invalid credentials') ||
      plain.includes('senha') ||
      plain.includes('password') ||
      plain.includes('credencial') ||
      plain.includes('credenciais')
    const unverifiedMatch = plain.includes('nao verificado') || plain.includes('não verificado')
    if (!normalized || normalized.startsWith('http')) return 'Não foi possível entrar agora. Tente novamente.'
    if (invalidCreds) return 'E-mail ou senha incorretos.'
    if (unverifiedMatch) return 'Seu e-mail ainda não foi verificado.'
    if (plain.includes('token') || plain.includes('idtoken') || plain.includes('oauth')) return 'Não foi possível entrar agora. Tente novamente.'
    return normalized || 'Não foi possível entrar agora. Tente novamente.'
  }

  async function handleSubmit() {
    try {
      setLoading(true)
      setError(null)
      const emailValid = /\S+@\S+\.\S+/.test(email.trim())
      const passwordValid = password.length >= 6
      if (!emailValid || !passwordValid) {
        const messages: string[] = []
        if (!emailValid) messages.push('E-mail inválido')
        if (!passwordValid) messages.push('Senha deve ter ao menos 6 caracteres')
        throw new Error(messages.join(', '))
      }
      await login(email.trim(), password)
      onLoggedIn()
    } catch (e: any) {
      const msg = (e?.message || '').toString()
      const plain = msg.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      const unverifiedMatch = plain.includes('nao verificado') || plain.includes('não verificado')
      const invalidCreds =
        plain.includes('invalid credentials') ||
        plain.includes('senha') ||
        plain.includes('password') ||
        plain.includes('credencial')
      if (unverifiedMatch) {
        setUnverified(true)
        setError('Seu e-mail ainda não foi verificado')
      } else {
        setUnverified(false)
        setError(friendlyError(msg))
      }
    } finally {
      setLoading(false)
    }
  }

  async function resendVerification() {
    try {
      setResendLoading(true)
      setInfo(null)
      const emailValid = /\S+@\S+\.\S+/.test(email.trim())
      if (!emailValid) throw new Error('E-mail inválido')
      await apiRequestEmailVerification(email.trim())
      setInfo('Reenviamos o e-mail de verificação. Confira sua caixa de entrada.')
    } catch (e: any) {
      setError(friendlyError(e?.message || 'Não foi possível reenviar agora.'))
    } finally {
      setResendLoading(false)
    }
  }

  async function handleGoogleLogin() {
    try {
      setGLoading(true)
      setError(null)
      appendLog('Iniciando Google Sign-In')
      await GoogleSignin.signOut()
      appendLog('GoogleSignin.signOut concluído')
      await GoogleSignin.hasPlayServices()
      appendLog('Play Services disponível')
      const response = await GoogleSignin.signIn()
      appendLog('GoogleSignin.signIn retornou', { type: (response as any)?.type })
      if (isSuccessResponse(response)) {
        const { idToken, serverAuthCode, user } = response.data || {}
        appendLog('Resposta de sucesso', { hasIdToken: !!idToken, serverAuthCodePresent: !!serverAuthCode })
        appendLog('Dados do usuário', { name: user?.name, email: user?.email, id: user?.id })
        if (!idToken) throw new Error('Resposta de sucesso sem idToken')
        appendLog('idToken obtido (truncado)', idToken?.slice(0, 24) + '...')
        appendLog('Chamando backend via contexto googleOAuth')
        try {
          await googleOAuth(idToken)
          appendLog('Backend respondeu OK e contexto atualizado', { loggedIn: true })
          onLoggedIn()
        } catch (be: any) {
          appendLog('Backend retornou erro', { message: be?.message })
          setError(`Falha na validação no servidor: ${String(be?.message || 'erro desconhecido')}`)
        }
      } else {
        appendLog('Sign-In cancelado pelo usuário ou sem credenciais salvas')
        setError('Login Google cancelado ou sem credenciais')
      }
    } catch (e: any) {
      try { console.error('[Mobile][GoogleLogin] erro', { code: e?.code, message: e?.message }) } catch { }
      if (isErrorWithCode(e)) {
        appendLog('Erro do Google Sign-In', { code: e.code, message: e.message, userInfo: (e as any)?.userInfo })
        switch (e.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            setError('Login Google cancelado pelo usuário')
            break
          case statusCodes.IN_PROGRESS:
            setError('Operação de login já em andamento')
            break
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            setError('Google Play Services não disponível ou desatualizado')
            break
          default:
            setError(`Falha no Google Sign-In (${e.code})`)
        }
      } else {
        appendLog('Erro inesperado (fora do módulo)', { message: e?.message })
        setError('Erro inesperado ao entrar com Google')
      }
    } finally {
      setGLoading(false)
    }
  }

  useEffect(() => {
    const webClientId = (appConfig as any)?.expo?.extra?.googleOAuth?.expoClientId
    const iosClientId = (appConfig as any)?.expo?.extra?.googleOAuth?.iosClientId
    appendLog('Configurando GoogleSignin', { webClientIdPresent: !!webClientId, iosClientIdPresent: !!iosClientId })
    GoogleSignin.configure({
      webClientId,
      iosClientId,
      offlineAccess: false,
    })
    appendLog('GoogleSignin.configure concluído')
  }, [])

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const showSub = Keyboard.addListener(showEvt, () => {
      Animated.timing(shift, { toValue: -60, duration: 200, useNativeDriver: true }).start()
    })
    const hideSub = Keyboard.addListener(hideEvt, () => {
      Animated.timing(shift, { toValue: 0, duration: 200, useNativeDriver: true }).start()
    })
    return () => { showSub.remove(); hideSub.remove() }
  }, [shift])

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => setAppleAvailable(false))
    }
  }, [])

  async function handleAppleLogin() {
    try {
      setALoading(true)
      setError(null)
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })

      if (!credential.identityToken) {
        throw new Error('Apple Sign-In não retornou identityToken')
      }

      const userData: { name?: { firstName?: string; lastName?: string }; email?: string } = {}
      if (credential.fullName?.givenName || credential.fullName?.familyName) {
        userData.name = {
          firstName: credential.fullName?.givenName ?? undefined,
          lastName: credential.fullName?.familyName ?? undefined,
        }
      }
      if (credential.email) {
        userData.email = credential.email
      }

      await appleOAuth({
        identityToken: credential.identityToken,
        appleUserId: credential.user,
        user: Object.keys(userData).length > 0 ? userData : undefined,
      })
      onLoggedIn()
    } catch (e: any) {
      if (e?.code === 'ERR_REQUEST_CANCELED') {
        setError('Login Apple cancelado')
      } else {
        setError(friendlyError(e?.message || 'Erro ao entrar com Apple'))
      }
    } finally {
      setALoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Animated.View style={{ transform: [{ translateY: shift }] }}>
        <Text style={styles.title}>Entrar</Text>
        <Input label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="seu@email.com" />
        <Input label="Senha" value={password} onChangeText={setPassword} secureTextEntry placeholder="********" />
        {error && <Text style={styles.error}>{error}</Text>}
        {info && <Text style={styles.info}>{info}</Text>}
        <PrimaryButton title={loading ? 'Entrando...' : 'Entrar'} onPress={handleSubmit} disabled={loading} />
        <View style={styles.links}>
          <Pressable onPress={onRegister}><Text style={styles.linkText}>Criar conta</Text></Pressable>
          <Pressable onPress={onForgot}><Text style={styles.linkText}>Esqueci a senha</Text></Pressable>
        </View>
        {unverified && (
          <View style={{ marginTop: 16 }}>
            <PrimaryButton
              title={resendLoading ? 'Reenviando...' : 'Reenviar e-mail de verificação'}
              onPress={resendVerification}
              disabled={resendLoading}
            />
          </View>
        )}
        <View style={styles.divider} />
        <PrimaryButton
          variant={'outline'}
          title={gLoading ? 'Abrindo Google...' : 'Entrar com Google'}
          onPress={handleGoogleLogin}
          disabled={gLoading}
          rightIcon={<AntDesign name="google" size={18} color="#DB4437" />}
        />
        {appleAvailable && (
          <View style={{ marginTop: 10 }}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={8}
              style={{ width: '100%', height: 48 }}
              onPress={handleAppleLogin}
            />
          </View>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#0b1023' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 16, color: '#F8FAFC', textAlign: 'center' },
  links: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  linkText: { color: '#A78BFA', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#1d2340', marginVertical: 16 },
  error: { color: '#ff8b8b', marginBottom: 12 },
  info: { color: '#cfd3ff', marginBottom: 12 },
})
