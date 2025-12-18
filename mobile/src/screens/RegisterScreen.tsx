import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Animated, Pressable } from 'react-native'
import Input from '../components/Input'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import ExternalLinkModal from '../components/ExternalLinkModal'
import appConfig from '../../app.json'

type Props = {
  onBackToLogin: () => void
  onVerifyEmail: (email: string) => void
}

export default function RegisterScreen({ onBackToLogin, onVerifyEmail }: Props) {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [extUrl, setExtUrl] = useState<string>('')
  const [extVisible, setExtVisible] = useState(false)
  const shift = useRef(new Animated.Value(0)).current

  const friendlyError = (msg: string) => {
    const normalized = msg || ''
    const lower = normalized.toLowerCase()
    if (!normalized || normalized.startsWith('http')) return 'Não foi possível criar a conta. Tente novamente.'
    if (lower.includes('409') || lower.includes('já existe')) return 'Este e-mail já está cadastrado.'
    return normalized
  }

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
      if (!accepted) {
        throw new Error('Você precisa aceitar os Termos de Uso e a Política de Privacidade')
      }
      await register(name.trim(), email.trim(), password, true)
      onVerifyEmail(email.trim())
    } catch (e: any) {
      setError(friendlyError(e?.message || ''))
    } finally {
      setLoading(false)
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

  const SITE_BASE_URL: string = (appConfig as any)?.expo?.extra?.siteBaseUrl || String((appConfig as any)?.expo?.extra?.apiBaseUrl || '').replace(/\/?api\/v1\/?$/, '')

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Animated.View style={{ transform: [{ translateY: shift }] }}>
      <Text style={styles.title}>Criar conta</Text>
      <Input label="Nome" value={name} onChangeText={setName} placeholder="Seu nome" />
      <Input label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="seu@email.com" />
      <Input label="Senha" value={password} onChangeText={setPassword} secureTextEntry placeholder="********" />
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={{ height: 8 }} />
      <Animated.View style={styles.acceptBlock}>
        <Pressable style={styles.checkboxPressable} onPress={() => setAccepted(a => !a)}>
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && <Ionicons name="checkmark" size={18} color="#0b1023" />}
          </View>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Pressable onPress={() => setAccepted(a => !a)}>
            <Text style={styles.acceptLabel}>Eu li e aceito os Termos de Uso e a Política de Privacidade</Text>
          </Pressable>
          <View style={{ marginTop: 6 }}>
            <Text style={styles.acceptText}>
              Eu li e aceito os 
              <Text style={styles.inlineLink} onPress={() => { setExtUrl(`${SITE_BASE_URL}/terms`); setExtVisible(true) }}>Termos de Uso </Text>
               e 
              <Text style={styles.inlineLink} onPress={() => { setExtUrl(`${SITE_BASE_URL}/privacy`); setExtVisible(true) }}> Política de Privacidade</Text>
              .
            </Text>
          </View>
        </View>
      </Animated.View>
      <ExternalLinkModal visible={extVisible} url={extUrl} onClose={() => setExtVisible(false)} />
      <View style={{ height: 24 }} />
      <PrimaryButton title={loading ? 'Criando...' : 'Criar conta'} onPress={handleSubmit} disabled={loading || !accepted} />
      <View style={{ height: 12 }} />
      <PrimaryButton variant={'outline'} title={'Voltar'} onPress={onBackToLogin} />
      </Animated.View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#0b1023' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 16, color: '#F8FAFC', textAlign: 'center' },
  error: { color: '#ff8b8b', marginBottom: 12 },
  checkboxPressable: { padding: 6, paddingRight: 12 },
  checkbox: { width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: '#93c5fd', marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#93c5fd', borderColor: '#93c5fd' },
  acceptBlock: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  acceptLabel: { color: '#e2e8f0', flex: 1, lineHeight: 20, fontSize: 14, fontWeight: '600' },
  acceptText: { color: '#cfd3ff', lineHeight: 20, fontSize: 13 },
  inlineLink: { color: '#93c5fd', textDecorationLine: 'underline' },
  dot: { color: '#64748b', marginRight: 10 },
})
