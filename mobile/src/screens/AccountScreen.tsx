import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Input from '../components/Input'
import PrimaryButton from '../components/PrimaryButton'
import AccountSkeleton from '../components/AccountSkeleton'
import { useAuth } from '../context/AuthContext'
import { apiProfile, apiUpdateMyProfile, apiChangeMyPassword, apiGetCurrentSubscription } from '../services/api'

type Props = {
  onBack: () => void
}

export default function AccountScreen({ onBack }: Props) {
  const { accessToken, user, refreshProfile } = useAuth()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [authProvider, setAuthProvider] = useState<'local' | 'google' | 'apple' | undefined>(undefined)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (!accessToken) throw new Error('Não autenticado')

        const [me, subData] = await Promise.all([
          apiProfile(accessToken),
          apiGetCurrentSubscription(accessToken).catch(() => ({ subscription: null }))
        ])

        if (!mounted) return
        setName(me?.name || '')
        setEmail(me?.email || '')
        setAuthProvider(me?.authProvider)
        setSubscription(subData?.subscription)
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const dateOnly = dateString.split('T')[0];
    const [year, month, day] = dateOnly.split('-');
    if (!year || !month || !day) return "Data inválida";
    return `${day}/${month}/${year}`;
  };

  const getStatusLabel = (status: string, isCourtesy: boolean) => {
    if (isCourtesy && status === 'expiring') {
      return 'Cortesia ativa';
    }
    const labels: Record<string, string> = {
      active: "Ativo",
      expiring: "Cancelado",
      canceled: "Cancelado",
      past_due: "Vencido",
      unpaid: "Não pago",
    };
    return labels[status] || status;
  };

  const renderSubscriptionCard = () => {
    if (!subscription || !subscription.plan) {
      return (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Assinatura</Text>
          <Text style={styles.infoText}>Nenhuma assinatura ativa.</Text>
        </View>
      )
    }

    const isCourtesyPlan = subscription.plan.slug === 'plano-cortesia';
    const isActiveOrCourtesy = subscription.status === "active" || (isCourtesyPlan && subscription.status === "expiring");
    const statusLabel = getStatusLabel(subscription.status, isCourtesyPlan);

    return (
      <View style={styles.card}>
        <View style={styles.subHeader}>
          <View>
            <Text style={styles.subLabel}>Seu Plano Atual</Text>
            <Text style={styles.planName}>{subscription.plan.name}</Text>
          </View>
          <View style={[styles.badge, isActiveOrCourtesy ? styles.badgeSuccess : styles.badgeError]}>
            <Text style={styles.badgeText}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.subContent}>
          {subscription.status === 'expiring' ? (
            <Text style={styles.infoText}>
              {subscription.periodEnd ? (
                isCourtesyPlan ?
                  `Seu plano cortesia seguirá ativo até ${formatDate(subscription.periodEnd)}.` :
                  `Seu plano seguirá ativo até ${formatDate(subscription.periodEnd)}. Você não receberá cobranças novamente.`
              ) : (
                isCourtesyPlan ? "Seu plano cortesia está ativo." : "Plano será cancelado em breve."
              )}
            </Text>
          ) : (
            subscription.periodEnd && (
              <View style={styles.row}>
                <Text style={styles.infoText}>Próxima cobrança em {formatDate(subscription.periodEnd)}</Text>
              </View>
            )
          )}
        </View>
      </View>
    )
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

        {loading ? (
          <AccountSkeleton />
        ) : (
          <>
            <View style={{ marginBottom: 20 }}>
              {renderSubscriptionCard()}
            </View>

            <Text style={styles.subtitle}>Atualize seu nome de exibição.</Text>
            <View style={styles.card}>
              {!!error && <Text style={styles.error}>{error}</Text>}
              {!!message && <Text style={styles.success}>{message}</Text>}

              <Input label="Nome" value={name} onChangeText={setName} placeholder="Seu nome" />

              <View style={styles.readonlyField}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.readonlyText}>{email}</Text>
              </View>

              <PrimaryButton title={saving ? 'Salvando...' : 'Salvar'} onPress={onSave} disabled={saving || !name.trim()} />

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
          </>
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
  // Subscription Card Styles
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 2 },
  planName: { fontSize: 20, fontWeight: 'bold', color: '#e6e9ff' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 },
  badgeSuccess: { backgroundColor: '#22c55e' },
  badgeError: { backgroundColor: '#ef4444' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#1d2340', marginVertical: 12 },
  subContent: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
})
