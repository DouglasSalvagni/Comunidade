import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Input from '../components/Input'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'
import { apiProfile, apiUpdateMyProfile, apiChangeMyPassword } from '../services/api'
import { usePlayer } from '../context/PlayerContext'

type Props = {
  onBack: () => void
}

export default function AccountScreen({ onBack }: Props) {
  const { accessToken, user, refreshProfile } = useAuth()
  const { loopPlaylist, setLoopPlaylist, autoPlayAfterTrack, setAutoPlayAfterTrack } = usePlayer()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [authProvider, setAuthProvider] = useState<'local' | 'google' | undefined>(undefined)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (!accessToken) throw new Error('Não autenticado')
        const me = await apiProfile(accessToken)
        if (!mounted) return
        setName(me?.name || '')
        setEmail(me?.email || '')
        setAuthProvider(me?.authProvider)
      } catch (e: any) {
        setError(e?.message || 'Falha ao carregar perfil')
      }
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [accessToken])

  async function onSave() {
    if (!accessToken) return
    if (!name || !name.trim()) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await apiUpdateMyProfile(accessToken, { name: name.trim() })
      await refreshProfile()
      setMessage('Perfil atualizado')
    } catch (e: any) {
      setError(e?.message || 'Falha ao atualizar perfil')
    }
    setSaving(false)
  }

  async function onChangePassword() {
    if (!accessToken) return
    if (authProvider !== 'local') return
    if (!currentPassword || !newPassword || newPassword !== confirmNewPassword) {
      setError('Verifique as senhas informadas.')
      return
    }
    if (newPassword.length < 6) {
      setError('Nova senha deve ter ao menos 6 caracteres.')
      return
    }
    setSavingPwd(true)
    setError('')
    setMessage('')
    try {
      await apiChangeMyPassword(accessToken, { currentPassword, newPassword })
      await refreshProfile()
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setMessage('Senha alterada com sucesso')
    } catch (e: any) {
      setError(e?.message || 'Falha ao alterar senha')
    }
    setSavingPwd(false)
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minha Conta</Text>
        <Pressable onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>Atualize seu nome de exibição.</Text>

        {loading ? (
          <Text style={styles.loading}>Carregando...</Text>
        ) : (
          <View style={styles.card}>
            {!!error && <Text style={styles.error}>{error}</Text>}
            {!!message && <Text style={styles.success}>{message}</Text>}

            <Input label="Nome" value={name} onChangeText={setName} placeholder="Seu nome" />

            <View style={styles.readonlyField}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.readonlyText}>{email}</Text>
            </View>

            <PrimaryButton title={saving ? 'Salvando...' : 'Salvar'} onPress={onSave} disabled={saving || !name.trim()} />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reprodução</Text>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Reprodução contínua</Text>
                  <Text style={styles.toggleDescription}>
                    Quando ativado, ao terminar uma música o app sugere e toca automaticamente a próxima.
                  </Text>
                </View>
                <Switch
                  value={autoPlayAfterTrack}
                  onValueChange={setAutoPlayAfterTrack}
                  thumbColor={autoPlayAfterTrack ? '#A78BFA' : '#f4f4f5'}
                  trackColor={{ false: '#4b5563', true: '#4c1d95' }}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reprodução da playlist</Text>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Repetir playlist quando terminar</Text>
                  <Text style={styles.toggleDescription}>
                    Quando ativado, ao chegar na última música a reprodução volta para a primeira.
                  </Text>
                </View>
                <Switch
                  value={loopPlaylist}
                  onValueChange={setLoopPlaylist}
                  thumbColor={loopPlaylist ? '#A78BFA' : '#f4f4f5'}
                  trackColor={{ false: '#4b5563', true: '#4c1d95' }}
                />
              </View>
            </View>

            {authProvider === 'local' ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Alterar Senha</Text>
                <Input label="Senha atual" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry placeholder="Sua senha atual" />
                <Input label="Nova senha" value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Nova senha" />
                <Input label="Confirmar nova senha" value={confirmNewPassword} onChangeText={setConfirmNewPassword} secureTextEntry placeholder="Confirme a nova senha" />
                <PrimaryButton
                  title={savingPwd ? 'Salvando...' : 'Salvar nova senha'}
                  onPress={onChangePassword}
                  disabled={savingPwd || !currentPassword || !newPassword || newPassword.length < 6 || newPassword !== confirmNewPassword}
                />
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.infoText}>Sua conta está conectada via login social (ex.: Google). Alteração de senha não está disponível.</Text>
              </View>
            )}

            <View style={{ height: 8 }} />
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20, backgroundColor: '#0b1023' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#e6e9ff' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4, color: '#e6e9ff' },
  subtitle: { fontSize: 14, color: '#cfd3ff', marginBottom: 16 },
  loading: { color: '#cfd3ff', marginTop: 20 },
  card: { backgroundColor: '#0e1430', borderWidth: 1, borderColor: '#1d2340', borderRadius: 12, padding: 16 },
  error: { color: '#ef4444', marginBottom: 8 },
  success: { color: '#22c55e', marginBottom: 8 },
  readonlyField: { marginBottom: 12 },
  label: { fontSize: 14, color: '#e5e7eb', marginBottom: 6 },
  readonlyText: { fontSize: 16, color: '#f8fafc', backgroundColor: '#111827', borderWidth: 1, borderColor: '#2b3448', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, opacity: 0.6 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#e6e9ff', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#cfd3ff' },
  back: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#1d2340', borderRadius: 8 },
  backText: { color: '#cfd3ff' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  toggleLabel: { fontSize: 14, color: '#e6e9ff', marginBottom: 4 },
  toggleDescription: { fontSize: 12, color: '#9ca3af' },
})
