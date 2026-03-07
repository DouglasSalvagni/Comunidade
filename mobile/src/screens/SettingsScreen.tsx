import { View, Text, StyleSheet, ScrollView, Switch, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { usePlayer } from '../context/PlayerContext'

type Props = {
    onBack: () => void
}

export default function SettingsScreen({ onBack }: Props) {
    const insets = useSafeAreaInsets()
    const { loopPlaylist, setLoopPlaylist, autoPlayAfterTrack, setAutoPlayAfterTrack } = usePlayer()

    return (
        <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Configurações</Text>
                <Pressable onPress={onBack} style={styles.back}>
                    <Text style={styles.backText}>Voltar</Text>
                </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
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

                <View style={styles.card}>
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
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0b1023' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#e6e9ff' },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    card: { backgroundColor: '#0e1430', borderWidth: 1, borderColor: '#1d2340', borderRadius: 12, padding: 16, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#e6e9ff', marginBottom: 8 },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
    toggleLabel: { fontSize: 14, color: '#e6e9ff', marginBottom: 4 },
    toggleDescription: { fontSize: 12, color: '#9ca3af', paddingRight: 16 },
    back: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#1d2340', borderRadius: 8 },
    backText: { color: '#cfd3ff' },
})
