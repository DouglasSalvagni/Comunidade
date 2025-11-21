import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Keyboard, Animated } from 'react-native'
import Input from '../components/Input'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'
import { apiRequestEmailVerification } from '../services/api'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
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

  const extra: any = (appConfig as any)?.expo?.extra || {}
  const googleIds: any = extra?.googleOAuth || {}
  const expoClientId: string | undefined = googleIds?.expoClientId
  const androidClientId: string | undefined = googleIds?.androidClientId
  const iosClientId: string | undefined = googleIds?.iosClientId

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: expoClientId,
  })

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
      if (!expoClientId && !androidClientId && !iosClientId) {
        throw new Error('Configuração do Google ausente')
      }
      const res = await promptAsync({ useProxy: true } as any)
      if (res?.type === 'success') {
        const idToken = (res as any)?.params?.id_token
        if (!idToken) throw new Error('idToken não recebido')
        await googleOAuth(idToken)
        onLoggedIn()
      } else if (res?.type === 'dismiss') {
        throw new Error('Login com Google cancelado')
      }
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Falha no login com Google')
    } finally {
      setGLoading(false)
    }
  }

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
      <Text style={styles.mood}>🌙 ⭐</Text>
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
      <PrimaryButton variant={'outline'} title={gLoading ? 'Abrindo Google...' : 'Entrar com Google'} onPress={handleGoogleLogin} disabled={gLoading || !request} />
      </Animated.View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#0b1023' },
  mood: { textAlign: 'center', fontSize: 22, color: '#ffd66b', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#e6e9ff', textAlign: 'center' },
  links: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  linkText: { color: '#ffd66b', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#1d2340', marginVertical: 16 },
  error: { color: '#ff8b8b', marginBottom: 12 },
  info: { color: '#cfd3ff', marginBottom: 12 },
})