import { useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import Input from '../components/Input'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'
import { apiRequestEmailVerification } from '../services/api'

type Props = {
  onRegister: () => void
  onForgot: () => void
  onLoggedIn: () => void
  onGoogle: () => void
  onVerificationNotice: () => void
}

export default function LoginScreen({ onRegister, onForgot, onLoggedIn, onGoogle, onVerificationNotice }: Props) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unverified, setUnverified] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

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

  return (
    <View style={styles.container}>
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
      <PrimaryButton title={'Entrar com Google'} onPress={onGoogle} />
    </View>
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