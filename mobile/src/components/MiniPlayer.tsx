import { View, Text, StyleSheet, Pressable, Image, Animated, PanResponder } from 'react-native'
import { useEffect, useRef } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { usePlayer } from '../context/PlayerContext'
import appConfig from '../../app.json'

type Props = { onOpen: () => void; bottomOffset?: number }

export default function MiniPlayer({ onOpen, bottomOffset }: Props) {
  const { currentWork, currentTrack, isPlaying, togglePlay, toggleFavorite, isFavorite, stop, togglePlaylist, playlistItemId } = usePlayer()
  const translateX = useRef(new Animated.Value(0)).current
  useEffect(() => { try { translateX.setValue(0) } catch { } }, [currentTrack?.id, currentWork?.id])
  const opacity = translateX.interpolate({ inputRange: [-260, 0, 260], outputRange: [0.25, 1, 0.25], extrapolate: 'clamp' })
  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6,
    onPanResponderMove: (_e, g) => { translateX.setValue(g.dx) },
    onPanResponderRelease: (_e, g) => {
      const threshold = 80
      if (Math.abs(g.dx) >= threshold) {
        const to = g.dx > 0 ? 260 : -260
        Animated.timing(translateX, { toValue: to, duration: 160, useNativeDriver: true }).start(() => { stop() })
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start()
      }
    },
  })
  if (!currentTrack || !currentWork) return null
  return (
    <Animated.View style={[styles.wrap, { bottom: (bottomOffset || 70) + 8 }, { transform: [{ translateX }], opacity }]} {...pan.panHandlers}>
      <Pressable style={styles.container} onPress={onOpen}>
        {currentWork.coverUrl ? (
          <Image source={{ uri: currentWork.coverUrl }} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverPlaceholder]} />
        )}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{currentTrack.title || currentWork.title || 'Faixa'}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{(currentWork as any).artistName || (appConfig as any)?.name || 'Ninaro'}</Text>
        </View>
        <Pressable style={styles.iconBtn} onPress={(e) => { e.preventDefault(); e.stopPropagation(); togglePlay() }}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color={'#0b1023'} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={(e) => { e.preventDefault(); e.stopPropagation(); togglePlaylist() }}>
          <Ionicons name={playlistItemId ? 'checkmark-circle' : 'add-circle-outline'} size={18} color={playlistItemId ? '#A78BFA' : '#0b1023'} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite() }}>
          <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={18} color={isFavorite ? '#cc8f00' : '#0b1023'} />
        </Pressable>
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
