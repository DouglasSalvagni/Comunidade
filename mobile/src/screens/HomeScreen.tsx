import { View, Text, StyleSheet, Pressable } from 'react-native'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import ProfileSelector from '../components/ProfileSelector'
import { useState } from 'react'
import ProfilesScreen from './ProfilesScreen'

type Props = {
  onLogout: () => void
}

export default function HomeScreen({ onLogout }: Props) {
  const { user } = useAuth()
  const [tab, setTab] = useState<'home' | 'catalog' | 'favorites' | 'playlist' | 'settings'>('home')
  const [settingsView, setSettingsView] = useState<'menu' | 'profiles'>('menu')
  return (
    <View style={styles.container}>
      <ProfileSelector />
      {tab === 'settings' && settingsView === 'profiles' ? (
        <ProfilesScreen onBack={() => setSettingsView('menu')} />
      ) : (
        <View style={styles.content}>
          <Text style={styles.title}>{tab === 'home' ? 'Início' : tab === 'catalog' ? 'Catálogo' : tab === 'favorites' ? 'Favoritos' : tab === 'playlist' ? 'Playlist' : 'Mais'}</Text>
          <Text style={styles.subtitle}>{user?.name || user?.email}</Text>
          {tab === 'settings' ? (
            <View style={styles.menu}>
              <Pressable style={styles.menuItem} onPress={() => setSettingsView('profiles')}>
                <Text style={styles.menuItemText}>Perfis</Text>
              </Pressable>
            </View>
          ) : (
            <PrimaryButton title={'Sair'} onPress={onLogout} />
          )}
        </View>
      )}
      <BottomNav
        tabs={[
          { key: 'home', label: 'Início' },
          { key: 'catalog', label: 'Catálogo' },
          { key: 'favorites', label: 'Favoritos' },
          { key: 'playlist', label: 'Playlist' },
          { key: 'settings', label: 'Mais' },
        ]}
        current={tab}
        onChange={(k) => { setTab(k as any); if (k === 'settings') setSettingsView('menu') }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20, backgroundColor: '#0b1023' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, color: '#e6e9ff' },
  subtitle: { fontSize: 16, color: '#cfd3ff', marginBottom: 16 },
  menu: { width: '100%', paddingHorizontal: 20 },
  menuItem: { borderWidth: 1, borderColor: '#1d2340', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#0e1430', marginBottom: 10 },
  menuItemText: { color: '#e6e9ff', fontSize: 16 },
})