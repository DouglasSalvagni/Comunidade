import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Pressable, Image } from 'react-native'
import { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'
import { apiGetFavorites, apiToggleFavorite } from '../services/api'

export default function FavoritesScreen() {
    const { accessToken, activeProfileId } = useAuth()
    const { playWork } = usePlayer()
    const [favorites, setFavorites] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)

    const loadFavorites = async (pageNum: number = 1, append: boolean = false) => {
        if (!accessToken) return

        try {
            if (!append) setLoading(true)

            const result = await apiGetFavorites(accessToken, {
                page: pageNum,
                limit: 20,
                profileId: activeProfileId || undefined,
            })

            const data = Array.isArray(result) ? result : (result?.data || [])
            const meta = (result as any)?.meta

            if (append) {
                setFavorites(prev => [...prev, ...data])
            } else {
                setFavorites(data)
            }

            // Check if there are more pages
            if (meta) {
                setHasMore(meta.currentPage < meta.totalPages)
            } else {
                setHasMore(data.length >= 20)
            }
        } catch (error) {
            console.error('Error loading favorites:', error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        loadFavorites(1, false)
    }, [accessToken, activeProfileId])

    const handleRefresh = () => {
        setRefreshing(true)
        setPage(1)
        loadFavorites(1, false)
    }

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1
            setPage(nextPage)
            loadFavorites(nextPage, true)
        }
    }

    const handleToggleFavorite = async (workId: string) => {
        if (!accessToken) return

        try {
            const result = await apiToggleFavorite(accessToken, workId, activeProfileId || undefined)
            const isFav = (result as any)?.isFavorite ?? false

            // Update local state
            setFavorites(prev => prev.map(work =>
                work.id === workId ? { ...work, isFavorite: isFav } : work
            ))

            // If unfavorited, remove from list
            if (!isFav) {
                setFavorites(prev => prev.filter(work => work.id !== workId))
            }
        } catch (error) {
            console.error('Error toggling favorite:', error)
        }
    }

    const handlePlay = (work: any) => {
        playWork(work)
    }

    const renderWork = ({ item }: { item: any }) => (
        <Pressable style={styles.card} onPress={() => handlePlay(item)}>
            {item.coverUrl ? (
                <Image source={{ uri: item.coverUrl }} style={styles.cover} />
            ) : (
                <View style={[styles.cover, styles.coverPlaceholder]}>
                    <Ionicons name="musical-notes" size={32} color="#3b4466" />
                </View>
            )}

            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{item.title || 'Sem título'}</Text>
                <Text style={styles.type}>{item.type === 'music' ? 'Música' : item.type === 'audiobook' ? 'Audiobook' : 'Série'}</Text>
                {item.tags && item.tags.length > 0 && (
                    <View style={styles.tags}>
                        {item.tags.slice(0, 2).map((tag: any) => (
                            <View key={tag.id} style={styles.tag}>
                                <Text style={styles.tagText}>{tag.name}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            <Pressable
                style={styles.favoriteBtn}
                onPress={(e) => {
                    e.stopPropagation()
                    handleToggleFavorite(item.id)
                }}
            >
                <Ionicons
                    name={item.isFavorite ? 'star' : 'star-outline'}
                    size={24}
                    color={item.isFavorite ? '#fbbf24' : '#cfd3ff'}
                />
            </Pressable>
        </Pressable>
    )

    const renderEmpty = () => (
        <View style={styles.empty}>
            <Ionicons name="star-outline" size={64} color="#3b4466" />
            <Text style={styles.emptyTitle}>Nenhum favorito ainda</Text>
            <Text style={styles.emptyText}>
                Explore o catálogo e adicione suas músicas e audiobooks favoritos!
            </Text>
        </View>
    )

    const renderFooter = () => {
        if (!loading || favorites.length === 0) return null
        return (
            <View style={styles.footer}>
                <ActivityIndicator size="small" color="#A78BFA" />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Meus Favoritos</Text>
                <Text style={styles.headerSubtitle}>
                    {favorites.length} {favorites.length === 1 ? 'item' : 'itens'}
                </Text>
            </View>

            {loading && favorites.length === 0 ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#A78BFA" />
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    renderItem={renderWork}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={favorites.length === 0 ? styles.listEmpty : styles.list}
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={renderFooter}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#A78BFA"
                            colors={['#A78BFA']}
                        />
                    }
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0b1023',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1d2340',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#e6e9ff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#8b92b8',
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    listEmpty: {
        flexGrow: 1,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#121632',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1d2340',
        alignItems: 'center',
    },
    cover: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#1d2340',
    },
    coverPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#e6e9ff',
        marginBottom: 4,
    },
    type: {
        fontSize: 13,
        color: '#8b92b8',
        marginBottom: 6,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    tag: {
        backgroundColor: '#1d2340',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    tagText: {
        fontSize: 11,
        color: '#A78BFA',
    },
    favoriteBtn: {
        padding: 8,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#e6e9ff',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#8b92b8',
        textAlign: 'center',
        lineHeight: 20,
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
})
