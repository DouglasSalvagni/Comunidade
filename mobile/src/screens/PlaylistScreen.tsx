import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Image } from 'react-native'
import { useState, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { usePlayer } from '../context/PlayerContext'
import { apiGetPlaylists, apiGetPlaylistItems, apiRemovePlaylistItem, apiGetWork } from '../services/api'

export default function PlaylistScreen() {
    const { accessToken, activeProfileId } = useAuth()
    const { playTrack } = usePlayer()
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [playlistId, setPlaylistId] = useState<string | null>(null)

    useEffect(() => {
        loadPlaylist()
    }, [accessToken, activeProfileId])

    const loadPlaylist = async () => {
        if (!accessToken) return

        try {
            setLoading(true)

            console.log('[PlaylistScreen] Loading playlist for profileId:', activeProfileId)

            const playlists = await apiGetPlaylists(accessToken, activeProfileId || undefined)
            console.log('[PlaylistScreen] Playlists received:', playlists)

            let selectedPlaylist = Array.isArray(playlists) ? playlists.find(p => p.isDefault) : null
            if (!selectedPlaylist && Array.isArray(playlists) && playlists.length > 0) {
                selectedPlaylist = playlists[0]
                console.log('[PlaylistScreen] No default playlist, using first one')
            }
            console.log('[PlaylistScreen] Selected playlist:', selectedPlaylist)

            if (!selectedPlaylist) {
                console.log('[PlaylistScreen] No playlist found')
                setItems([])
                setLoading(false)
                return
            }

            setPlaylistId(selectedPlaylist.id)

            const playlistItems = await apiGetPlaylistItems(accessToken, selectedPlaylist.id)
            console.log('[PlaylistScreen] Playlist items:', playlistItems)
            setItems(Array.isArray(playlistItems) ? playlistItems : [])
        } catch (error) {
            console.error('Error loading playlist:', error)
            setItems([])
        } finally {
            setLoading(false)
        }
    }

    const handlePlay = async (item: any) => {
        if (!item.track) return

        const track = {
            id: item.track.id,
            title: item.track.title,
            workId: item.track.workId,
        }

        let work = item.track.work
        if (!work && accessToken && item.track.workId) {
            try {
                work = await apiGetWork(accessToken, item.track.workId)
            } catch (error) {
                console.error('Error fetching work:', error)
            }
        }

        playTrack(track, work)
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

    const renderItem = ({ item }: { item: any }) => {
        const track = item.track
        const work = track?.work

        return (
            <Pressable style={styles.card} onPress={() => handlePlay(item)}>
                {work?.coverUrl ? (
                    <Image source={{ uri: work.coverUrl }} style={styles.thumbnail} />
                ) : (
                    <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                        <Ionicons name="musical-notes" size={16} color="#3b4466" />
                    </View>
                )}

                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>
                        {track?.title || work?.title || 'Sem título'}
                    </Text>
                </View>

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
        <View style={styles.container}>
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
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={renderEmpty}
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
