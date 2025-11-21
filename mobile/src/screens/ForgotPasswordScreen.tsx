import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Animated } from 'react-native'
import Input from '../components/Input'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'

type Props = {
  onBack: () => void
}

export default function ForgotPasswordScreen({ onBack }: Props) {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const shift = useRef(new Animated.Value(0)).current

  async function handleSubmit() {
    try {
      setLoading(true)
      setError(null)
      const emailValid = /\S+@\S+\.\S+/.test(email.trim())
      if (!emailValid) throw new Error('E-mail inválido')
      await forgotPassword(email.trim())
      setSent(true)
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Falha ao enviar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Animated.View style={{ transform: [{ translateY: shift }] }}>
      <Text style={styles.title}>Recuperar senha</Text>
      {!sent && (
        <>
          <Input label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="seu@email.com" />
          {error && <Text style={styles.error}>{error}</Text>}
          <PrimaryButton title={loading ? 'Enviando...' : 'Enviar'} onPress={handleSubmit} disabled={loading} />
          <View style={{ height: 12 }} />
          <PrimaryButton variant={'outline'} title={'Voltar'} onPress={onBack} />
        </>
      )}
      {sent && (
        <>
          <Text style={styles.info}>Enviamos um link por e-mail para redefinir sua senha. Acesse pelo navegador e, depois, entre no app com a nova senha.</Text>
          <PrimaryButton title={'Voltar ao login'} onPress={onBack} />
        </>
      )}
      </Animated.View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#0b1023' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 16, color: '#F8FAFC', textAlign: 'center' },
  error: { color: '#ff8b8b', marginBottom: 12 },
  info: { color: '#cfd3ff', marginBottom: 16, textAlign: 'center' },
})