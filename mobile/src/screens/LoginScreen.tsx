import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Keyboard, Animated } from 'react-native'
import Input from '../components/Input'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'
import { apiRequestEmailVerification } from '../services/api'
import * as WebBrowser from 'expo-web-browser'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
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
  const { login, googleOAuth } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unverified, setUnverified] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [gLoading, setGLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const shift = useRef(new Animated.Value(0)).current

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
      await GoogleSignin.signOut()
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()
      const idToken = userInfo.data?.idToken
      if (!idToken) throw new Error('Não foi possível concluir o login com Google. Tente novamente.')
      await googleOAuth(idToken)
      onLoggedIn()
    } catch (e: any) {
      try { console.error('[Mobile][GoogleLogin] erro', { code: e?.code, message: e?.message }) } catch {}
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
        // usuário cancelou
      } else if (e.code === statusCodes.IN_PROGRESS) {
        // operação já em andamento
      } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Google Play Services não disponível')
      } else {
        setError('Não foi possível entrar com Google. Tente novamente.')
      }
    } finally {
      setGLoading(false)
    }
  }

  useEffect(() => {
    const webClientId = (appConfig as any)?.expo?.extra?.googleOAuth?.expoClientId
    GoogleSignin.configure({
      webClientId,
      offlineAccess: false,
    })
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
