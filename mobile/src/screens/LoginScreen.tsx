import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Keyboard, Animated } from 'react-native'
import Input from '../components/Input'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'
import { apiRequestEmailVerification } from '../services/api'
import * as WebBrowser from 'expo-web-browser'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import Constants from 'expo-constants'
import appConfig from '../../app.json'

type Props = {
  onRegister: () => void
  onForgot: () => void
  onLoggedIn: () => void
  onVerificationNotice: () => void
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
  const shift = useRef(new Animated.Value(0)).current

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
      console.error(e)
      const msg = e?.message || ''
      if (msg.includes('E-mail não verificado')) {
        setUnverified(true)
        setError('Seu e-mail ainda não foi verificado')
      } else {
        setError(msg || 'Falha ao entrar')
      }
    } finally {
      setLoading(false)
    }
  }

  async function resendVerification() {
    try {
      setInfo(null)
      const emailValid = /\S+@\S+\.\S+/.test(email.trim())
      if (!emailValid) throw new Error('E-mail inválido')
      await apiRequestEmailVerification(email.trim())
      setInfo('Reenviamos o e-mail de verificação. Confira sua caixa de entrada.')
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Falha ao reenviar e-mail')
    }
  }

  async function handleGoogleLogin() {
    try {
      setGLoading(true)
      setError(null)
      await GoogleSignin.signOut() // Ensure we clear previous session to allow account selection
      await GoogleSignin.hasPlayServices()
      const userInfo = await GoogleSignin.signIn()
      const idToken = userInfo.data?.idToken
      if (!idToken) throw new Error('idToken não recebido')
      await googleOAuth(idToken)
      onLoggedIn()
    } catch (e: any) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (e.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setError('Google Play Services não disponível')
      } else {
        console.error(e)
        setError(e?.message || 'Falha no login com Google')
      }
    } finally {
      setGLoading(false)
    }
  }

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '1049428265578-ns10palgcam2ed039dginpat3osecn7i.apps.googleusercontent.com',
      offlineAccess: true,
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
        <Input label="Senha" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••" />
        {error && <Text style={styles.error}>{error}</Text>}
        {info && <Text style={styles.info}>{info}</Text>}
        <PrimaryButton title={loading ? 'Entrando...' : 'Entrar'} onPress={handleSubmit} disabled={loading} />
        <View style={styles.links}>
          <Pressable onPress={onRegister}><Text style={styles.linkText}>Criar conta</Text></Pressable>
          <Pressable onPress={onForgot}><Text style={styles.linkText}>Esqueci a senha</Text></Pressable>
        </View>
        {unverified && (
          <View style={{ marginTop: 16 }}>
            <PrimaryButton title={'Reenviar e-mail de verificação'} onPress={resendVerification} />
            <View style={{ height: 12 }} />
            <PrimaryButton title={'Ver instruções'} onPress={onVerificationNotice} />
          </View>
        )}
        <View style={styles.divider} />
        <PrimaryButton variant={'outline'} title={gLoading ? 'Abrindo Google...' : 'Entrar com Google'} onPress={handleGoogleLogin} disabled={gLoading} />
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
