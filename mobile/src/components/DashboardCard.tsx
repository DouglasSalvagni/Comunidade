import { View, Text, StyleSheet, Image, Pressable } from 'react-native'

type Work = {
    id: string
    title: string
    type: 'music' | 'audiobook' | 'series'
    coverUrl?: string
    coverThumbUrl?: string
    recommendedMinMonths?: number
    recommendedMaxMonths?: number
    recommendedAgeLabel?: string
    isPremium?: boolean
}

type Props = {
    work: Work
    onPress: () => void
    variant?: 'square' | 'portrait' | 'landscape'
}

export default function DashboardCard({ work, onPress, variant = 'square' }: Props) {
    const getCardStyle = () => {
        switch (variant) {
            case 'portrait': return styles.cardPortrait
            case 'landscape': return styles.cardLandscape
            default: return styles.cardSquare
        }
    }

    const getCoverStyle = () => {
        switch (variant) {
            case 'portrait': return styles.coverPortrait
            case 'landscape': return styles.coverLandscape
            default: return styles.coverSquare
        }
    }

    return (
        <Pressable style={[styles.card, getCardStyle()]} onPress={onPress}>
            <View>
                {(work.coverThumbUrl || work.coverUrl) ? (
                    <Image source={{ uri: work.coverThumbUrl || work.coverUrl! }} style={[styles.cover, getCoverStyle()]} />
                ) : (
                    <View style={[styles.cover, getCoverStyle(), styles.coverPlaceholder]} />
                )}
                {work.isPremium && (
                    <View style={styles.premiumBadge}>
                        <Text style={styles.premiumBadgeText}>★ Premium</Text>
                    </View>
                )}
            </View>
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{work.title}</Text>
                <Text style={styles.subtitle}>{work.type === 'music' ? 'Música' : 'Audiobook'}</Text>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: { marginRight: 12 },
    cardSquare: { width: 140 },
    cardPortrait: { width: 120 },
    cardLandscape: { width: 220 },

    cover: { borderRadius: 12, backgroundColor: '#1d223b', marginBottom: 8 },
    coverSquare: { width: 140, height: 140 },
    coverPortrait: { width: 120, height: 170 },
    coverLandscape: { width: 220, height: 125 },

    coverPlaceholder: { backgroundColor: '#171a2f' },
    info: { paddingHorizontal: 4 },
    title: { color: '#e6e9ff', fontSize: 14, fontWeight: '600', marginBottom: 2 },
    subtitle: { color: '#8b92b8', fontSize: 12 },
    premiumBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(180, 130, 20, 0.88)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    premiumBadgeText: { color: '#fff8e1', fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
})
