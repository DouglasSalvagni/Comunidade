import { View, Text, StyleSheet, Pressable, Image, Animated, PanResponder } from 'react-native'
import { useEffect, useRef } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { usePlayer } from '../context/PlayerContext'
import { useSubscription } from '../context/SubscriptionContext'
import appConfig from '../../app.json'

type Props = { onOpen: () => void; bottomOffset?: number }

export default function MiniPlayer({ onOpen, bottomOffset }: Props) {
  const { currentWork, currentTrack, isPlaying, togglePlay, toggleFavorite, isFavorite, stop, togglePlaylist, playlistItemId, isPremiumPreview } = usePlayer()
  const { isFree } = useSubscription()
  const translateX = useRef(new Animated.Value(0)).current
  const swipeX = useRef(0)
  const stopRef = useRef(stop)
  useEffect(() => {
    stopRef.current = stop
  }, [stop])
  useEffect(() => {
    try {
      translateX.setValue(0)
      swipeX.current = 0
    } catch { }
  }, [currentTrack?.id, currentWork?.id])
  const opacity = translateX.interpolate({ inputRange: [-260, 0, 260], outputRange: [0.25, 1, 0.25], extrapolate: 'clamp' })
  const pan = useRef(
    PanResponder.create({
      onPanResponderGrant: () => {
        translateX.stopAnimation((value?: number) => {
          if (typeof value === 'number') {
            swipeX.current = value
          }
        })
      },
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 5,
      onMoveShouldSetPanResponderCapture: (_e, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 5,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_e, g) => {
        const max = 260
        const next = Math.max(-max, Math.min(max, g.dx))
        swipeX.current = next
        translateX.setValue(next)
      },
      onPanResponderRelease: () => {
        const x = swipeX.current
        const distanceThreshold = 120
        const draggedFarEnough = Math.abs(x) >= distanceThreshold

        if (draggedFarEnough) {
          const to = x > 0 ? 260 : -260
          Animated.timing(translateX, { toValue: to, duration: 160, useNativeDriver: true }).start(() => {
            stopRef.current()
          })
        } else {
          swipeX.current = 0
          translateX.setValue(0)
        }
      },
    })
  ).current
  if (!currentTrack || !currentWork) return null
  return (
    <Animated.View style={[styles.wrap, { bottom: (bottomOffset || 70) + 8 }, { transform: [{ translateX }], opacity }]} {...pan.panHandlers}>
      <Pressable style={styles.container} onPress={onOpen}>
        {(currentWork.coverThumbUrl || currentWork.coverUrl) ? (
          <Image source={{ uri: (currentWork as any).coverThumbUrl || currentWork.coverUrl }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]} />
        )}
        <View style={styles.info}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.title} numberOfLines={1}>{currentTrack.title || currentWork.title || 'Faixa'}</Text>
            {isPremiumPreview && <Text style={{ color: '#d4a017', fontSize: 11, fontWeight: '700' }}>★</Text>}
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>{(currentWork as any).artistName || (appConfig as any)?.name || 'Ninaro'}</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={(e) => { e.preventDefault(); e.stopPropagation(); togglePlay() }}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color={'#0b1023'} />
        </Pressable>
        {!isFree && (
          <Pressable style={styles.iconBtn} onPress={(e) => { e.preventDefault(); e.stopPropagation(); togglePlaylist() }}>
            <Ionicons name={playlistItemId ? 'checkmark-circle' : 'add-circle-outline'} size={18} color={playlistItemId ? '#A78BFA' : '#0b1023'} />
          </Pressable>
        )}
        {!isFree && (
          <Pressable style={styles.iconBtn} onPress={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite() }}>
            <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={18} color={isFavorite ? '#cc8f00' : '#0b1023'} />
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 20 },
  container: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#dce1ff', backgroundColor: '#f5f7ff', borderRadius: 12, padding: 8, elevation: 10 },
  cover: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#cfd3ff' },
  coverPlaceholder: { backgroundColor: '#e6e9ff' },
  info: { flex: 1, marginHorizontal: 10 },
  title: { color: '#0b1023', fontSize: 14, fontWeight: '600' },
  subtitle: { color: '#3b4466', fontSize: 12, marginTop: 2 },
  iconBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: '#cfd3ff', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e6e9ff', marginLeft: 6 },
})
