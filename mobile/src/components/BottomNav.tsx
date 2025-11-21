import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Pressable, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type Tab = { key: string; label: string }

type Props = {
  tabs: Tab[]
  current: string
  onChange: (key: string) => void
}

function getIconName(key: string, active: boolean): keyof typeof Ionicons.glyphMap {
  switch (key) {
    case 'home':
      return active ? 'home' : 'home-outline'
    case 'catalog':
      return active ? 'albums' : 'albums-outline'
    case 'favorites':
      return active ? 'star' : 'star-outline'
    case 'playlist':
      return active ? 'list' : 'list-outline'
    case 'settings':
      return active ? 'settings' : 'settings-outline'
    default:
      return active ? 'ellipse' : 'ellipse-outline'
  }
}

export default function BottomNav({ tabs, current, onChange }: Props) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safe}>
      <View style={styles.container}>
        {tabs.map((t) => {
          const active = t.key === current
          const iconName = getIconName(t.key, active)
          return (
            <Pressable key={t.key} style={[styles.item, active && styles.itemActive]} onPress={() => onChange(t.key)}>
              <Ionicons name={iconName} size={22} color={active ? '#A78BFA' : '#cfd3ff'} />
              <Text style={[styles.label, active && styles.labelActive]}>{t.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { backgroundColor: '#0b1023', paddingHorizontal: 0 },
  container: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#1d2340', paddingVertical: 6, width: '100%' },
  item: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  itemActive: { backgroundColor: '#121632' },
  label: { fontSize: 12, color: '#cfd3ff', marginTop: 2 },
  labelActive: { color: '#A78BFA', fontWeight: '600' },
})