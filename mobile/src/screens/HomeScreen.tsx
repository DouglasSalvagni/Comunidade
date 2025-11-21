import { View, Text, StyleSheet } from 'react-native'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'

type Props = {
  onLogout: () => void
}

export default function HomeScreen({ onLogout }: Props) {
  const { user } = useAuth()
  return (
    <View style={styles.container}>
      <Text style={styles.mood}>🌙 ⭐</Text>
      <Text style={styles.title}>Bem-vindo</Text>
      <Text style={styles.subtitle}>{user?.name || user?.email}</Text>
      <PrimaryButton title={'Sair'} onPress={onLogout} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b1023' },
  mood: { textAlign: 'center', fontSize: 22, color: '#ffd66b', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, color: '#e6e9ff' },
  subtitle: { fontSize: 16, color: '#cfd3ff', marginBottom: 16 },
})