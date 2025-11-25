import { View, Text, StyleSheet, ActivityIndicator, Pressable, Image } from 'react-native'
import { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'
import { apiGetPlaylists, apiGetPlaylistItems, apiRemovePlaylistItem, apiGetWork, apiReorderPlaylistItems } from '../services/api'

type PlaylistItem = {
    id: string
    orderIndex: number
    track: any
}

export default function PlaylistScreen() {
    const { accessToken, activeProfileId } = useAuth()
    const { playTrack } = usePlayer()
    const [items, setItems] = useState<PlaylistItem[]>([])
    const [loading, setLoading] = useState(true)
    const [playlistId, setPlaylistId] = useState<string | null>(null)

    useEffect(() => {
        loadPlaylist()
    }, [accessToken, activeProfileId])

    const enrichPlaylistItems = async (playlistItems: PlaylistItem[]) => {
        if (!accessToken) return playlistItems

        const enriched = await Promise.all(
            playlistItems.map(async (item) => {
                if (!item.track.work && item.track.workId) {
                    try {
                        const work = await apiGetWork(accessToken, item.track.workId)
                        return { ...item, track: { ...item.track, work } }
                    } catch (error) {
                        console.error('Error fetching work for track:', item.track.id, error)
                    }
                }
                return item
            })
        )
        return enriched
    }

    const loadPlaylist = async () => {
        if (!accessToken) return

        try {
            setLoading(true)

            const playlists = await apiGetPlaylists(accessToken, activeProfileId || undefined)

            let selectedPlaylist = Array.isArray(playlists) ? playlists.find(p => p.isDefault) : null
            if (!selectedPlaylist && Array.isArray(playlists) && playlists.length > 0) {
                selectedPlaylist = playlists[0]
            }

            if (!selectedPlaylist) {
                setItems([])
                setLoading(false)
                return
            }

            setPlaylistId(selectedPlaylist.id)

            const playlistItems = await apiGetPlaylistItems(accessToken, selectedPlaylist.id)
            const enriched = await enrichPlaylistItems(Array.isArray(playlistItems) ? playlistItems : [])
            setItems(enriched)
        } catch (error) {
            console.error('Error loading playlist:', error)
            setItems([])
        } finally {
            setLoading(false)
        }
    }

    const handlePlay = async (item: PlaylistItem) => {
        if (!item.track) return

        const track = {
            id: item.track.id,
            title: item.track.title,
            workId: item.track.workId,
        }

        playTrack(track, item.track.work)
    }

    const handleRemove = async (itemId: string) => {
        if (!accessToken || !playlistId) return

        try {
            await apiRemovePlaylistItem(accessToken, playlistId, itemId)
            setItems(prev => prev.filter(i => i.id !== itemId))
        } catch (error) {
            console.error('Error removing item:', error)
        }
    }

    const handleDragEnd = async ({ data }: { data: PlaylistItem[] }) => {
        setItems(data)

        if (!accessToken || !playlistId) return

        try {
            const itemIdsInOrder = data.map(i => i.id)
            await apiReorderPlaylistItems(accessToken, playlistId, itemIdsInOrder)
        } catch (error) {
            console.error('Error reordering playlist:', error)
            loadPlaylist()
        }
    }

    const renderItem = ({ item, drag, isActive }: RenderItemParams<PlaylistItem>) => {
        const track = item.track
        const work = track?.work

        return (
            <ScaleDecorator>
                <Pressable
                    style={[styles.card, isActive && styles.cardActive]}
                    onPress={() => handlePlay(item)}
                    onLongPress={drag}
                    disabled={isActive}
                >
                    {work?.coverUrl ? (
                        <Image source={{ uri: work.coverUrl }} style={styles.thumbnail} />
                    ) : (
                        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                            <Ionicons name="musical-notes" size={20} color="#3b4466" />
                        </View>
                    )}

                    <View style={styles.info}>
                        <Text style={styles.title} numberOfLines={1}>
                            {track?.title || work?.title || 'Sem título'}
                        </Text>
                    </View>

                    <Pressable style={styles.dragHandle} onPressIn={drag}>
                        <Ionicons name="reorder-three" size={24} color="#8b92b8" />
                    </Pressable>

                    <Pressable
                        style={styles.removeBtn}
                        onPress={(e) => {
                            e.stopPropagation()
                            handleRemove(item.id)
                        }}
                    >
                        <Ionicons name="close-circle" size={20} color="#8b92b8" />
                    </Pressable>
                </Pressable>
            </ScaleDecorator>
        )
    }

    const renderEmpty = () => (
        <View style={styles.empty}>
            <Ionicons name="list-outline" size={64} color="#3b4466" />
            <Text style={styles.emptyTitle}>Playlist vazia</Text>
            <Text style={styles.emptyText}>
                Adicione músicas à sua playlist para ouvi-las aqui!
            </Text>
        </View>
    )

    return (
        <GestureHandlerRootView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Minha Playlist</Text>
                <Text style={styles.headerSubtitle}>
                    {items.length} {items.length === 1 ? 'música' : 'músicas'}
                </Text>
            </View>

            {loading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#A78BFA" />
                </View>
            ) : items.length === 0 ? (
                renderEmpty()
            ) : (
                <DraggableFlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    onDragEnd={handleDragEnd}
                    contentContainerStyle={styles.list}
                />
            )}
        </GestureHandlerRootView>
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
    card: {
        flexDirection: 'row',
        backgroundColor: '#121632',
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#1d2340',
        alignItems: 'center',
    },
    cardActive: {
        backgroundColor: '#1a1f3f',
        borderColor: '#A78BFA',
        elevation: 5,
        shadowColor: '#A78BFA',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    thumbnail: {
        width: 48,
        height: 48,
        borderRadius: 6,
        backgroundColor: '#1d2340',
    },
    thumbnailPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#e6e9ff',
    },
    dragHandle: {
        padding: 4,
        marginRight: 4,
    },
    removeBtn: {
        padding: 4,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
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
})
