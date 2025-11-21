import { View, Text, StyleSheet } from 'react-native'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'
import { apiRequestEmailVerification } from '../services/api'

type Props = {
  onBackToLogin: () => void
}

export default function VerificationNoticeScreen({ onBackToLogin }: Props) {
  const { user } = useAuth()

  async function handleResend() {
    const email = user?.email || ''
    if (email) await apiRequestEmailVerification(email)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.mood}>🌙 ⭐</Text>
      <Text style={styles.title}>Verifique seu e-mail</Text>
      <Text style={styles.info}>Enviamos um link para confirmar seu e-mail. Acesse pelo navegador e, depois, entre no app com sua conta confirmada.</Text>
      <PrimaryButton title={'Reenviar e-mail'} onPress={handleResend} />
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
})