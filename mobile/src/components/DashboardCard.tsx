import { View, Text, StyleSheet, Image, Pressable } from 'react-native'

type Work = {
    id: string
    title: string
    type: 'music' | 'audiobook' | 'series'
    coverUrl?: string
    recommendedMinMonths?: number
    recommendedMaxMonths?: number
    recommendedAgeLabel?: string
}

type Props = {
    work: Work
    onPress: () => void
}

export default function DashboardCard({ work, onPress }: Props) {
    return (
        <Pressable style={styles.card} onPress={onPress}>
            {work.coverUrl ? (
                <Image source={{ uri: work.coverUrl }} style={styles.cover} />
            ) : (
                <View style={[styles.cover, styles.coverPlaceholder]} />
            )}
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{work.title}</Text>
                <Text style={styles.subtitle}>{work.type === 'music' ? 'Música' : 'Audiobook'}</Text>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: { width: 140, marginRight: 12 },
    cover: { width: 140, height: 140, borderRadius: 12, backgroundColor: '#1d223b', marginBottom: 8 },
    coverPlaceholder: { backgroundColor: '#171a2f' },
    info: { paddingHorizontal: 4 },
    title: { color: '#e6e9ff', fontSize: 14, fontWeight: '600', marginBottom: 2 },
    subtitle: { color: '#8b92b8', fontSize: 12 },
})
