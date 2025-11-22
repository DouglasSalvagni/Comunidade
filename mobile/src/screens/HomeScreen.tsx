import { View, Text, StyleSheet, Pressable } from 'react-native'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import MiniPlayer from '../components/MiniPlayer'
import { useState } from 'react'
import ProfilesScreen from './ProfilesScreen'
import AccountScreen from './AccountScreen'
import CatalogScreen from './CatalogScreen'

type Props = {
  onLogout: () => void
}

export default function HomeScreen({ onLogout }: Props) {
  const { user } = useAuth()
  const [tab, setTab] = useState<'home' | 'catalog' | 'favorites' | 'playlist' | 'settings'>('home')
  const [settingsView, setSettingsView] = useState<'menu' | 'profiles' | 'account'>('menu')
  const [bottomNavHeight, setBottomNavHeight] = useState(70)
  const [playerVisible, setPlayerVisible] = useState(false)
  return (
    <View style={styles.container}>
      {/* Seletor de perfil removido; seleção é feita na tela de Perfis */}
      {tab === 'catalog' ? (
        <CatalogScreen />
      ) : tab === 'settings' && settingsView === 'profiles' ? (
        <ProfilesScreen onBack={() => setSettingsView('menu')} />
      ) : tab === 'settings' && settingsView === 'account' ? (
        <AccountScreen onBack={() => setSettingsView('menu')} />
      ) : (
        <View style={styles.content}>
          <Text style={styles.title}>{(() => {
            switch (tab) {
              case 'home': return 'Início'
              case 'favorites': return 'Favoritos'
              case 'playlist': return 'Playlist'
              case 'settings': return 'Mais'
              default: return 'Mais'
            }
          })()}</Text>
          <Text style={styles.subtitle}>{user?.name || user?.email}</Text>
          {tab === 'settings' ? (
            <View style={styles.menu}>
              <Pressable style={styles.menuItem} onPress={() => setSettingsView('profiles')}>
                <Text style={styles.menuItemText}>Perfis</Text>
              </Pressable>
              <Pressable style={styles.menuItem} onPress={() => setSettingsView('account')}>
                <Text style={styles.menuItemText}>Conta</Text>
              </Pressable>
            </View>
          ) : (
            <PrimaryButton title={'Sair'} onPress={onLogout} />
          )}
        </View>
      )}
      <MiniPlayer onOpen={() => setPlayerVisible(true)} bottomOffset={bottomNavHeight} />
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
        onHeight={(h) => setBottomNavHeight(Math.max(60, Math.round(h)))}
      />
      {playerVisible && (
        <View style={styles.playerOverlay}>
          <View style={styles.playerBox}>
            <Text style={styles.playerTitle}>Player</Text>
            <Text style={styles.playerSubtitle}>Em breve: tela completa do player</Text>
            <PrimaryButton title={'Fechar'} onPress={() => setPlayerVisible(false)} />
          </View>
        </View>
      )}
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
  playerOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(11,16,35,0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 40 },
  playerBox: { backgroundColor: '#121632', borderRadius: 12, padding: 16, width: '86%', borderWidth: 1, borderColor: '#1d2340' },
  playerTitle: { color: '#e6e9ff', fontSize: 18, fontWeight: '700' },
  playerSubtitle: { color: '#cfd3ff', fontSize: 13, marginTop: 8, marginBottom: 12 },
})