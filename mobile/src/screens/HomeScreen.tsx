import { View, Text, StyleSheet } from 'react-native'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import ProfileSelector from '../components/ProfileSelector'
import { useState } from 'react'

type Props = {
  onLogout: () => void
}

export default function HomeScreen({ onLogout }: Props) {
  const { user } = useAuth()
  const [tab, setTab] = useState<'home' | 'catalog' | 'favorites' | 'settings'>('home')
  return (
    <View style={styles.container}>
      <ProfileSelector />
      <View style={styles.content}>
        <Text style={styles.title}>{tab === 'home' ? 'Início' : tab === 'catalog' ? 'Catálogo' : tab === 'favorites' ? 'Favoritos' : 'Configurações'}</Text>
        <Text style={styles.subtitle}>{user?.name || user?.email}</Text>
        <PrimaryButton title={'Sair'} onPress={onLogout} />
      </View>
      <BottomNav
        tabs={[
          { key: 'home', label: 'Início', icon: 'home-outline', iconActive: 'home' },
          { key: 'catalog', label: 'Catálogo', icon: 'albums-outline', iconActive: 'albums' },
          { key: 'favorites', label: 'Favoritos', icon: 'star-outline', iconActive: 'star' },
          { key: 'settings', label: 'Mais', icon: 'settings-outline', iconActive: 'settings' },
        ]}
        current={tab}
        onChange={(k) => setTab(k as any)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20, backgroundColor: '#0b1023' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, color: '#e6e9ff' },
  subtitle: { fontSize: 16, color: '#cfd3ff', marginBottom: 16 },
})