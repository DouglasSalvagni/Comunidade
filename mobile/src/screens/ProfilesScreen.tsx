import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { apiGetProfiles, apiCreateProfile, apiUpdateProfile, apiDeleteProfile } from '../services/api'
import Input from '../components/Input'
import PrimaryButton from '../components/PrimaryButton'
import DateTimePicker from '@react-native-community/datetimepicker'

type Props = {
  onBack?: () => void
}

export default function ProfilesScreen({ onBack }: Props) {
  const { accessToken, activeProfileId, setActiveProfileId } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editBirthDate, setEditBirthDate] = useState('')
  const [newName, setNewName] = useState('')
  const [newBirthDate, setNewBirthDate] = useState('')
  const [showNewPicker, setShowNewPicker] = useState(false)
  const [showEditPickerIndex, setShowEditPickerIndex] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [editingSaving, setEditingSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [infoMsg, setInfoMsg] = useState<string>('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!accessToken) return
      setLoading(true)
      try {
        const list = await apiGetProfiles(accessToken)
        if (mounted) {
          const arr = Array.isArray(list) ? list : []
          setItems(arr)
          if (!activeProfileId && arr.length > 0) {
            setActiveProfileId(arr[0].id)
          }
        }
      } catch {}
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [accessToken])

  function activate(id: string) {
    setActiveProfileId(id)
    setInfoMsg('Perfil ativo atualizado')
    setTimeout(() => setInfoMsg(''), 1500)
  }

  async function saveEdit(i: number) {
    const p = items[i]
    try {
      setEditingSaving(true)
      const payload: any = { name: editName }
      if (/^\d{4}-\d{2}-\d{2}$/.test(editBirthDate)) payload.birthDate = editBirthDate
      const updated = await apiUpdateProfile(accessToken as string, p.id, payload)
      setItems((prev) => prev.map((it) => (it.id === p.id ? updated : it)))
      setEditIndex(null)
      setEditName('')
      setEditBirthDate('')
      setErrorMsg('')
      setEditingSaving(false)
    } catch {}
    finally { setEditingSaving(false) }
  }

  async function removeById(id: string) {
    try {
      setDeletingId(id)
      setItems((prev) => {
        const next = prev.filter((it) => it.id !== id)
        if (activeProfileId === id) {
          setActiveProfileId(next[0]?.id || null)
        }
        return next
      })
      await apiDeleteProfile(accessToken as string, id)
      try {
        const list = await apiGetProfiles(accessToken as string)
        setItems(Array.isArray(list) ? list : [])
      } catch {}
      setInfoMsg('Perfil excluído')
      setTimeout(() => setInfoMsg(''), 2000)
    } catch (e: any) {
      setErrorMsg(e?.message || 'Falha ao excluir perfil')
    } finally { setDeletingId(null) }
  }

  async function addNew() {
    console.log('[ProfilesScreen] addNew clicked')
    const nameOk = (newName || '').trim().length >= 2
    const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(newBirthDate)
    if (!accessToken) { setErrorMsg('Sessão inválida'); return }
    if (!nameOk) { setErrorMsg('Nome deve ter pelo menos 2 caracteres'); return }
    if (!dateOk) { setErrorMsg('Data de nascimento inválida'); return }
    try {
      setSaving(true)
      const payload = { name: newName.trim(), birthDate: newBirthDate }
      console.log('[ProfilesScreen] payload', payload)
      const created = await apiCreateProfile(accessToken, payload)
      console.log('[ProfilesScreen] created profile', created)
      setItems((prev) => [...prev, created])
      setNewName('')
      setNewBirthDate('')
      setErrorMsg('')
      setSaving(false)
    } catch (e: any) {
      console.log('[ProfilesScreen] create profile error', e)
      const m = String(e?.message || '')
      setErrorMsg(m || 'Falha ao criar perfil')
      setSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfis</Text>
        {onBack && (
          <Pressable onPress={onBack} style={styles.back}>
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>
        )}
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Gerenciar perfis</Text>
          {infoMsg ? <Text style={styles.info}>{infoMsg}</Text> : null}
          {loading && (
            Array.from({ length: 5 }).map((_, idx) => (
              <View key={`skel-${idx}`} style={styles.itemRow}>
                <View style={styles.viewRow}>
                  <View style={styles.skelCircle} />
                  <View style={{ flex: 1 }}>
                    <View style={[styles.skelLine, { width: '60%' }]} />
                    <View style={[styles.skelLine, { width: '40%', marginTop: 6 }]} />
                  </View>
                  <View style={styles.actionsIcons}>
                    <View style={[styles.iconBtn, styles.skelIcon]} />
                    <View style={[styles.iconBtn, styles.skelIcon]} />
                  </View>
                </View>
              </View>
            ))
          )}
          {!loading && items.length === 0 && <Text style={styles.empty}>Nenhum perfil encontrado</Text>}
          {!loading && items.map((p, i) => (
            <View key={p.id} style={styles.itemRow}>
              {editIndex === i ? (
                <View style={styles.editRow}>
                  <View style={{ flex: 1 }}>
                    <Input label={'Nome'} value={editName} onChangeText={setEditName} placeholder="Nome" />
                    <Text style={styles.label}>Data de nascimento</Text>
                    <Pressable style={styles.dateButton} onPress={() => setShowEditPickerIndex(i)}>
                      <Text style={styles.dateText}>{editBirthDate || 'Selecionar data'}</Text>
                    </Pressable>
                    {showEditPickerIndex === i && (
                      <DateTimePicker
                        value={editBirthDate ? new Date(editBirthDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(e, d) => {
                          setShowEditPickerIndex(null)
                          if (d) {
                            const yyyy = d.getFullYear()
                            const mm = String(d.getMonth() + 1).padStart(2, '0')
                            const dd = String(d.getDate()).padStart(2, '0')
                            setEditBirthDate(`${yyyy}-${mm}-${dd}`)
                          }
                        }}
                      />
                    )}
                  </View>
                  <View style={styles.actions}>
                    <PrimaryButton title={editingSaving ? 'Salvando...' : 'Salvar'} onPress={() => saveEdit(i)} disabled={editingSaving} />
                    <PrimaryButton title={'Cancelar'} variant="outline" onPress={() => { setEditIndex(null); setEditName(''); setEditBirthDate('') }} />
                  </View>
                </View>
              ) : (
                <View style={styles.viewRow}>
                  <Pressable accessibilityRole="button" onPress={() => activate(p.id)} style={{ paddingRight: 6 }}>
                    <Ionicons name={activeProfileId === p.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={activeProfileId === p.id ? '#A78BFA' : '#94a3b8'} />
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{p.name}</Text>
                    <Text style={styles.itemSub}>{p.birthDate || '-'}</Text>
                  </View>
                  <View style={styles.actionsIcons}>
                    <Pressable
                      accessibilityRole="button"
                      style={[styles.iconBtn, (deletingId === p.id) && styles.iconBtnDisabled]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      disabled={deletingId === p.id}
                      onPress={() => { setEditIndex(i); setEditName(p.name); setEditBirthDate(p.birthDate || '') }}
                    >
                      <Ionicons name="create-outline" size={22} color="#cfd3ff" />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      style={[styles.iconBtn, (deletingId === p.id) && styles.iconBtnDisabled]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      disabled={deletingId === p.id}
                      onPress={() => setConfirmId(p.id)}
                    >
                      <Ionicons name="trash-outline" size={22} color="#cfd3ff" />
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Adicionar novo perfil</Text>
          <Input label={'Nome'} value={newName} onChangeText={setNewName} placeholder="Nome da criança" />
          <Text style={styles.label}>Data de nascimento</Text>
          <Pressable style={styles.dateButton} onPress={() => setShowNewPicker(true)}>
            <Text style={styles.dateText}>{newBirthDate || 'Selecionar data'}</Text>
          </Pressable>
          {showNewPicker && (
            <DateTimePicker
              value={newBirthDate ? new Date(newBirthDate) : new Date()}
              mode="date"
              display="default"
              onChange={(e, d) => {
                setShowNewPicker(false)
                if (d) {
                  const yyyy = d.getFullYear()
                  const mm = String(d.getMonth() + 1).padStart(2, '0')
                  const dd = String(d.getDate()).padStart(2, '0')
                  setNewBirthDate(`${yyyy}-${mm}-${dd}`)
                }
              }}
            />
          )}
          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
          <View style={{ marginTop: 12 }}>
            <PrimaryButton title={saving ? 'Adicionando...' : 'Adicionar Perfil'} onPress={addNew} disabled={saving} />
          </View>
        </View>
      </ScrollView>
      <Modal visible={!!confirmId} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Excluir perfil?</Text>
            <Text style={styles.modalText}>Esta ação não pode ser desfeita.</Text>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setConfirmId(null)}>
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnDelete]} onPress={() => { const id = confirmId as string; setConfirmId(null); removeById(id) }}>
                <Text style={styles.modalBtnText}>Excluir</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1023' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#e6e9ff' },
  back: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#1d2340', borderRadius: 8 },
  backText: { color: '#cfd3ff' },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { borderWidth: 1, borderColor: '#1d2340', borderRadius: 10, padding: 16, marginBottom: 16, backgroundColor: '#0e1430' },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#e6e9ff', marginBottom: 12 },
  empty: { color: '#cfd3ff', marginBottom: 8 },
  itemRow: { borderTopWidth: 1, borderTopColor: '#1d2340', paddingVertical: 14 },
  editRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemName: { color: '#e6e9ff', fontSize: 16, fontWeight: '600' },
  itemSub: { color: '#94a3b8', fontSize: 13 },
  actions: { gap: 8, minWidth: 120 },
  actionsIcons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { padding: 8, borderWidth: 1, borderColor: '#2b3448', borderRadius: 8, backgroundColor: '#111827' },
  iconBtnDisabled: { opacity: 0.5 },
  skelCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#171a2f' },
  skelLine: { height: 12, backgroundColor: '#171a2f', borderRadius: 6 },
  skelIcon: { backgroundColor: '#171a2f', borderColor: '#171a2f' },
  label: { fontSize: 14, color: '#e5e7eb', marginBottom: 6 },
  dateButton: { borderWidth: 1, borderColor: '#2b3448', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#111827' },
  dateText: { color: '#f8fafc', fontSize: 16 },
  error: { color: '#ef4444', marginBottom: 8 },
  info: { color: '#22c55e', marginBottom: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(11,16,35,0.6)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { backgroundColor: '#0b1023', borderRadius: 10, borderWidth: 1, borderColor: '#1d2340', width: '80%', padding: 16 },
  modalTitle: { color: '#e6e9ff', fontSize: 18, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  modalText: { color: '#cfd3ff', textAlign: 'center', marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#2b3448', borderRadius: 8, backgroundColor: '#111827' },
  modalBtnCancel: {},
  modalBtnDelete: { borderColor: '#ef4444' },
  modalBtnText: { color: '#e6e9ff', fontWeight: '600' },
})