import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'
import appConfig from '../../app.json'
import ExternalLinkModal from '../components/ExternalLinkModal'
import { apiAcceptLegal } from '../services/api'

type Props = {
  onContinue?: () => void
  onExit?: () => void
  canSkip?: boolean
  onSkip?: () => void
}

export default function LegalAcceptScreen({ onContinue, onExit, canSkip, onSkip }: Props) {
  const { accessToken, refreshProfile, logout } = useAuth()
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const siteUrl = String((appConfig as any)?.expo?.extra?.siteBaseUrl || String((appConfig as any)?.expo?.extra?.apiBaseUrl || '').replace(/\/?api\/v1\/?$/, ''))

  const [extUrl, setExtUrl] = useState('')
  const [extVisible, setExtVisible] = useState(false)

  async function handleAccept() {
    if (!accessToken) return
    try {
      setLoading(true)
      setError(null)
      await apiAcceptLegal(accessToken)
      await refreshProfile()
      if (onContinue) onContinue()
    } catch (e: any) {
      setError(e?.message || 'Falha ao registrar aceite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{canSkip ? 'Novos Termos e Política' : 'Aceite Necessário'}</Text>
      <Text style={styles.subtitle}>{canSkip ? 'Atualizamos nossos Termos de Uso e Política de Privacidade. Você pode revisar e aceitar agora. Caso prefira, poderá continuar sem aceitar e será lembrado em seu próximo login.' : 'Para continuar, é preciso aceitar os Termos de Uso e a Política de Privacidade.'}</Text>
      <View style={{ height: 12 }} />
      <View style={styles.linksRow}>
        <Pressable onPress={() => { setExtUrl(`${siteUrl}/terms`); setExtVisible(true) }}><Text style={styles.link}>Ver Termos de Uso</Text></Pressable>
        <Text style={styles.separator}>•</Text>
        <Pressable onPress={() => { setExtUrl(`${siteUrl}/privacy`); setExtVisible(true) }}><Text style={styles.link}>Ver Política de Privacidade</Text></Pressable>
      </View>
      <View style={{ height: 16 }} />
      <Pressable style={styles.checkboxRow} onPress={() => setAccepted(a => !a)}>
        <View style={[styles.checkbox, accepted && styles.checkboxChecked]} />
        <Text style={styles.checkboxLabel}>Eu li e aceito os Termos e a Política</Text>
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={{ height: 12 }} />
      <PrimaryButton title={loading ? 'Salvando...' : 'Aceitar e continuar'} onPress={handleAccept} disabled={!accepted || loading} />
      <View style={{ height: 8 }} />
      {canSkip ? (
        <PrimaryButton variant={'outline'} title={'Continuar sem aceitar'} onPress={() => { if (onSkip) onSkip() }} />
      ) : (
        <PrimaryButton variant={'outline'} title={'Sair'} onPress={() => { logout(); if (onExit) onExit() }} />
      )}
      <ExternalLinkModal visible={extVisible} url={extUrl} onClose={() => setExtVisible(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#0b1023' },
  title: { fontSize: 24, fontWeight: '700', color: '#F8FAFC', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#cbd5e1', textAlign: 'center' },
  linksRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  link: { color: '#93c5fd', textDecorationLine: 'underline', marginHorizontal: 6, marginBottom: 6 },
  separator: { color: '#64748b' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#93c5fd', marginRight: 8 },
  checkboxChecked: { backgroundColor: '#93c5fd' },
  checkboxLabel: { color: '#e2e8f0' },
  error: { color: '#ff8b8b', marginTop: 8, textAlign: 'center' },
})
