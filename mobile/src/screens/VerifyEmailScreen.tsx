import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Input from '../components/Input'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'
import { apiRequestEmailVerification } from '../services/api'

type Props = {
  onVerified: () => void
  onBack: () => void
}

export default function VerifyEmailScreen({ onVerified, onBack }: Props) {
  const { verifyEmail, user } = useAuth()
  const [token, setToken] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleVerify() {
    try {
      setLoading(true)
      setError(null)
      await verifyEmail(token.trim())
      onVerified()
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Falha ao verificar e-mail')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    try {
      setLoading(true)
      setError(null)
      await apiRequestEmailVerification(email.trim())
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Falha ao reenviar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.mood}>🌙 ⭐</Text>
      <Text style={styles.title}>Verificar e-mail</Text>
      <Input label="Token" value={token} onChangeText={setToken} placeholder="Cole o token recebido" />
      {error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton title={loading ? 'Verificando...' : 'Confirmar'} onPress={handleVerify} disabled={loading} />
      <View style={{ height: 12 }} />
      <Input label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="seu@email.com" />
      <PrimaryButton title={loading ? 'Enviando...' : 'Reenviar e-mail'} onPress={handleResend} disabled={loading} />
      <View style={{ height: 12 }} />
      <PrimaryButton title={'Voltar'} onPress={onBack} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#0b1023' },
  mood: { textAlign: 'center', fontSize: 22, color: '#ffd66b', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#e6e9ff', textAlign: 'center' },
  error: { color: '#ff8b8b', marginBottom: 12 },
})