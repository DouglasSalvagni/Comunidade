import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'
import { apiRequestEmailVerification } from '../services/api'

type Props = {
  email?: string
  onBackToLogin: () => void
}

export default function VerificationNoticeScreen({ email, onBackToLogin }: Props) {
  const { user } = useAuth()
  const contactEmail = (email || user?.email || '').trim()
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const friendlyError = (msg: string) => {
    const normalized = msg || ''
    if (!normalized || normalized.toLowerCase().startsWith('http')) return 'Não foi possível reenviar agora. Tente novamente.'
    return normalized
  }

  async function handleResend() {
    try {
      setLoading(true)
      setError(null)
      setInfo(null)
      if (!contactEmail) throw new Error('Não encontramos um e-mail para reenviar. Volte e tente novamente.')
      await apiRequestEmailVerification(contactEmail)
      setInfo('Enviamos novamente o e-mail de confirmação.')
    } catch (e: any) {
      setError(friendlyError(e?.message || ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.mood}>💫</Text>
      <Text style={styles.title}>Verifique seu e-mail</Text>
      <Text style={styles.info}>Enviamos um link para confirmar seu e-mail. Acesse pelo navegador e, depois, entre no app com sua conta confirmada.</Text>
      {info && <Text style={styles.success}>{info}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton title={loading ? 'Reenviando...' : 'Reenviar e-mail'} onPress={handleResend} disabled={loading} />
      <View style={{ height: 12 }} />
      <PrimaryButton title={'Voltar ao login'} onPress={onBackToLogin} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#0b1023' },
  mood: { textAlign: 'center', fontSize: 22, color: '#ffd66b', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12, color: '#e6e9ff', textAlign: 'center' },
  info: { color: '#cfd3ff', marginBottom: 16, textAlign: 'center' },
  success: { color: '#4ade80', marginBottom: 12, textAlign: 'center' },
  error: { color: '#ff8b8b', marginBottom: 12, textAlign: 'center' },
})
