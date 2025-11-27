import { View, StyleSheet } from 'react-native'

type Props = {
    variant?: 'square' | 'portrait' | 'landscape'
}

export default function DashboardCardSkeleton({ variant = 'square' }: Props) {
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
        <View style={[styles.card, getCardStyle()]}>
            <View style={[styles.cover, getCoverStyle(), styles.skeleton]} />
            <View style={styles.info}>
                <View style={[styles.titleSkeleton, styles.skeleton]} />
                <View style={[styles.subtitleSkeleton, styles.skeleton]} />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    card: { marginRight: 12 },
    cardSquare: { width: 140 },
    cardPortrait: { width: 120 },
    cardLandscape: { width: 220 },

    cover: { borderRadius: 12, marginBottom: 8 },
    coverSquare: { width: 140, height: 140 },
    coverPortrait: { width: 120, height: 170 },
    coverLandscape: { width: 220, height: 125 },

    info: { paddingHorizontal: 4 },

    titleSkeleton: {
        height: 16,
        width: '80%',
        borderRadius: 4,
        marginBottom: 6
    },

    subtitleSkeleton: {
        height: 12,
        width: '50%',
        borderRadius: 4
    },

    skeleton: {
        backgroundColor: '#1d2340',
        opacity: 0.6,
    },
})
