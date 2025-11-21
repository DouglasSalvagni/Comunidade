import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Animated } from 'react-native'
import Input from '../components/Input'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'

type Props = {
  onBackToLogin: () => void
  onVerifyEmail: () => void
}

export default function RegisterScreen({ onBackToLogin, onVerifyEmail }: Props) {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const shift = useRef(new Animated.Value(0)).current

  async function handleSubmit() {
    try {
      setLoading(true)
      setError(null)
      const nameValid = name.trim().length >= 2 && name.trim().length <= 100
      const emailValid = /\S+@\S+\.\S+/.test(email.trim())
      const passwordLen = password.length >= 6
      const hasLetter = /[A-Za-z]/.test(password)
      const hasNumber = /\d/.test(password)
      if (!nameValid || !emailValid || !(passwordLen && hasLetter && hasNumber)) {
        const messages: string[] = []
        if (!nameValid) messages.push('Nome deve ter entre 2 e 100 caracteres')
        if (!emailValid) messages.push('E-mail inválido')
        if (!(passwordLen && hasLetter && hasNumber)) messages.push('Senha deve ter 6+ caracteres, letra e número')
        throw new Error(messages.join(', '))
      }
      await register(name.trim(), email.trim(), password)
      onVerifyEmail()
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Falha ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Animated.View style={{ transform: [{ translateY: shift }] }}>
      <Text style={styles.mood}>🌙 ⭐</Text>
      <Text style={styles.title}>Criar conta</Text>
      <Input label="Nome" value={name} onChangeText={setName} placeholder="Seu nome" />
      <Input label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="seu@email.com" />
      <Input label="Senha" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••" />
      {error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton title={loading ? 'Criando...' : 'Criar conta'} onPress={handleSubmit} disabled={loading} />
      <View style={{ height: 12 }} />
      <PrimaryButton variant={'outline'} title={'Voltar'} onPress={onBackToLogin} />
      </Animated.View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#0b1023' },
  mood: { textAlign: 'center', fontSize: 22, color: '#ffd66b', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#e6e9ff', textAlign: 'center' },
  error: { color: '#ff8b8b', marginBottom: 12 },
})