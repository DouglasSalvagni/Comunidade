import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Input from '../components/Input'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'

type Props = {
  onBack: () => void
}

export default function ResetPasswordScreen({ onBack }: Props) {
  const { resetPassword } = useAuth()
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    try {
      setLoading(true)
      setError(null)
      if (!token.trim()) throw new Error('Token inválido')
      const passwordLen = newPassword.length >= 6
      if (!passwordLen) throw new Error('Senha deve ter ao menos 6 caracteres')
      await resetPassword(token.trim(), newPassword)
      onBack()
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Falha ao redefinir')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.mood}>🌙 ⭐</Text>
      <Text style={styles.title}>Redefinir senha</Text>
      <Input label="Token" value={token} onChangeText={setToken} placeholder="Cole o token recebido" />
      <Input label="Nova senha" value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="••••••" />
      {error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton title={loading ? 'Redefinindo...' : 'Redefinir'} onPress={handleSubmit} disabled={loading} />
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