import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import { apiGetProfiles } from '../services/api'

type Props = {
  onChange?: (name: string) => void
}

export default function ProfileSelector({ onChange }: Props) {
  const { user, accessToken, activeProfileId, setActiveProfileId } = useAuth()
  const baseName = user?.name || user?.email || 'Perfil'
  const [open, setOpen] = useState(false)
  const [profiles, setProfiles] = useState<any[]>([])
  const insets = useSafeAreaInsets()

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!accessToken) return
      try {
        const list = await apiGetProfiles(accessToken)
        if (mounted) setProfiles(Array.isArray(list) ? list : [])
      } catch {}
    }
    load()
    return () => { mounted = false }
  }, [accessToken])

  const currentName = useMemo(() => {
    const found = profiles.find((p) => p.id === activeProfileId)
    return found?.name || baseName
  }, [profiles, activeProfileId, baseName])

  function select(id: string) {
    setActiveProfileId(id)
    setOpen(false)
    onChange && onChange(id)
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={[styles.container, { minHeight: 44 }] }>
        <Pressable style={styles.selector} onPress={() => setOpen(true)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Text style={styles.label}>Perfil</Text>
          <Text style={styles.value}>{currentName}</Text>
          <Ionicons name="chevron-down" size={16} color="#94a3b8" />
        </Pressable>
      </View>
      <Modal visible={open} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { marginTop: insets.top + 16, marginBottom: insets.bottom + 16 }]}>
            {profiles.map((p) => (
              <Pressable key={p.id} style={styles.modalItem} onPress={() => select(p.id)}>
                <Text style={styles.modalText}>{p.name}</Text>
              </Pressable>
            ))}
            <Pressable style={[styles.modalItem, { borderTopWidth: 1, borderTopColor: '#1d2340' }]} onPress={() => setOpen(false)}>
              <Text style={styles.modalText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { backgroundColor: '#0b1023' },
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 8 },
  selector: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { color: '#94a3b8', fontSize: 12 },
  value: { color: '#F8FAFC', fontSize: 15, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(11,16,35,0.6)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { backgroundColor: '#0b1023', borderRadius: 10, borderWidth: 1, borderColor: '#1d2340', width: '80%' },
  modalItem: { paddingVertical: 12, paddingHorizontal: 16 },
  modalText: { color: '#e6e9ff', textAlign: 'center' },
})