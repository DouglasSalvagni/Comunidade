import { View, Text, StyleSheet, Pressable, Image } from 'react-native'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import MiniPlayer from '../components/MiniPlayer'
import { useEffect, useMemo, useState } from 'react'
import ProfilesScreen from './ProfilesScreen'
import AccountScreen from './AccountScreen'
import CatalogScreen from './CatalogScreen'
import FavoritesScreen from './FavoritesScreen'
import PlaylistScreen from './PlaylistScreen'
import { Ionicons } from '@expo/vector-icons'
import { usePlayer } from '../context/PlayerContext'

type Props = {
  onLogout: () => void
}

export default function HomeScreen({ onLogout }: Props) {
  const { user } = useAuth()
  const {
    currentTrack,
    currentWork,
    isPlaying,
    position,
    duration,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleFavorite,
    isFavorite
  } = usePlayer()
  const [tab, setTab] = useState<'home' | 'catalog' | 'favorites' | 'playlist' | 'settings'>('home')
  const [settingsView, setSettingsView] = useState<'menu' | 'profiles' | 'account'>('menu')
  const [bottomNavHeight, setBottomNavHeight] = useState(70)
  const [playerVisible, setPlayerVisible] = useState(false)

  useEffect(() => {
    if (!currentTrack) setPlayerVisible(false)
  }, [currentTrack])

  const orderedTracks = useMemo(() => {
    const list = Array.isArray(currentWork?.tracks) ? [...(currentWork as any).tracks] : []
    return list
      .filter((t) => !!t?.id)
      .sort((a: any, b: any) => {
        const ao = typeof a?.orderIndex === 'number' ? a.orderIndex : (typeof a?.order === 'number' ? a.order : 0)
        const bo = typeof b?.orderIndex === 'number' ? b.orderIndex : (typeof b?.order === 'number' ? b.order : 0)
        return ao - bo
      })
  }, [currentWork])

  const currentIndex = useMemo(() => orderedTracks.findIndex((t: any) => t.id === currentTrack?.id), [orderedTracks, currentTrack])
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex >= 0 && currentIndex < orderedTracks.length - 1

  const progress = duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0

  const formatTime = (value: number) => {
    if (!Number.isFinite(value)) return '0:00'
    const minutes = Math.floor(value / 60)
    const seconds = Math.floor(value % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <View style={styles.container}>
      {tab === 'catalog' ? (
        <CatalogScreen />
      ) : tab === 'favorites' ? (
        <FavoritesScreen />
      ) : tab === 'playlist' ? (
        <PlaylistScreen />
      ) : tab === 'settings' && settingsView === 'profiles' ? (
        <ProfilesScreen onBack={() => setSettingsView('menu')} />
      ) : tab === 'settings' && settingsView === 'account' ? (
        <AccountScreen onBack={() => setSettingsView('menu')} />
      ) : (
        <View style={styles.content}>
          <Text style={styles.title}>{(() => {
            switch (tab) {
              case 'home': return 'Início'
              case 'favorites': return 'Favoritos'
              case 'playlist': return 'Playlist'
              case 'settings': return 'Mais'
              default: return 'Mais'
            }
          })()}</Text>
          <Text style={styles.subtitle}>{user?.name || user?.email}</Text>
          {tab === 'settings' ? (
            <View style={styles.menu}>
              <Pressable style={styles.menuItem} onPress={() => setSettingsView('profiles')}>
                <Text style={styles.menuItemText}>Perfis</Text>
              </Pressable>
              <Pressable style={styles.menuItem} onPress={() => setSettingsView('account')}>
                <Text style={styles.menuItemText}>Conta</Text>
              </Pressable>
            </View>
          ) : (
            <PrimaryButton title={'Sair'} onPress={onLogout} />
          )}
        </View>
      )}
      <MiniPlayer onOpen={() => setPlayerVisible(true)} bottomOffset={bottomNavHeight} />
      <BottomNav
        tabs={[
          { key: 'home', label: 'Início' },
          { key: 'catalog', label: 'Catálogo' },
          { key: 'favorites', label: 'Favoritos' },
          { key: 'playlist', label: 'Playlist' },
          { key: 'settings', label: 'Mais' },
        ]}
        current={tab}
        onChange={(k) => { setTab(k as any); if (k === 'settings') setSettingsView('menu') }}
        onHeight={(h) => setBottomNavHeight(Math.max(60, Math.round(h)))}
      />
      {playerVisible && currentTrack && currentWork && (
        <View style={styles.playerOverlay}>
          <Pressable style={styles.playerBackdrop} onPress={() => setPlayerVisible(false)} />
          <View style={styles.playerCard}>
            <View style={styles.playerHeader}>
              <Text style={styles.playerNow}>Tocando agora</Text>
              <Pressable onPress={() => setPlayerVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#cfd3ff" />
              </Pressable>
            </View>
            <View style={styles.playerCoverWrap}>
              {currentWork.coverUrl ? (
                <Image source={{ uri: currentWork.coverUrl }} style={styles.playerCover} />
              ) : (
                <View style={[styles.playerCover, styles.playerCoverPlaceholder]} />
              )}
            </View>
            <Text style={styles.playerTitle} numberOfLines={1}>{currentTrack.title || currentWork.title || 'Faixa'}</Text>
            <Text style={styles.playerSubtitle} numberOfLines={2}>{currentWork.title || ''}</Text>

            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={styles.progressTimes}>
              <Text style={styles.progressText}>{formatTime(position)}</Text>
              <Text style={styles.progressText}>{formatTime(duration)}</Text>
            </View>

            <View style={styles.playerControls}>
              <Pressable
                accessibilityRole="button"
                disabled={!hasPrev}
                style={[styles.controlBtn, !hasPrev && styles.controlBtnDisabled]}
                onPress={prevTrack}
              >
                <Ionicons name="play-skip-back" size={26} color={hasPrev ? '#e6e9ff' : '#6b7280'} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={[styles.controlBtn, styles.controlBtnPrimary]}
                onPress={togglePlay}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color="#0b1023" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={!hasNext}
                style={[styles.controlBtn, !hasNext && styles.controlBtnDisabled]}
                onPress={nextTrack}
              >
                <Ionicons name="play-skip-forward" size={26} color={hasNext ? '#e6e9ff' : '#6b7280'} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={[styles.controlBtn, styles.controlBtnGhost]}
                onPress={toggleFavorite}
              >
                <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={22} color={isFavorite ? '#facc15' : '#cfd3ff'} />
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20, backgroundColor: '#0b1023' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8, color: '#e6e9ff' },
  subtitle: { fontSize: 16, color: '#cfd3ff', marginBottom: 16 },
  menu: { width: '100%', paddingHorizontal: 20 },
  menuItem: { borderWidth: 1, borderColor: '#1d2340', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#0e1430', marginBottom: 10 },
  menuItemText: { color: '#e6e9ff', fontSize: 16 },
  playerOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#0b1023', zIndex: 50 },
  playerBackdrop: { display: 'none' },
  playerCard: { flex: 1, width: '100%', padding: 24, paddingTop: 60, alignItems: 'center', justifyContent: 'space-around' },
  playerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 30 },
  playerNow: { color: '#cfd3ff', fontSize: 14, letterSpacing: 0.5, textTransform: 'uppercase' },
  playerCoverWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  playerCover: { width: 300, height: 300, borderRadius: 24, backgroundColor: '#121632' },
  playerCoverPlaceholder: { backgroundColor: '#1f2742' },
  playerTitle: { color: '#e6e9ff', fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  playerSubtitle: { color: '#cfd3ff', fontSize: 18, textAlign: 'center', marginBottom: 40 },
  progressBar: { height: 6, borderRadius: 6, backgroundColor: '#1f2742', overflow: 'hidden', width: '100%' },
  progressFill: { height: '100%', backgroundColor: '#A78BFA' },
  progressTimes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, width: '100%' },
  progressText: { color: '#94a3b8', fontSize: 14 },
  playerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20, marginBottom: 40 },
  controlBtn: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: '#1d2340', backgroundColor: '#121632', alignItems: 'center', justifyContent: 'center' },
  controlBtnPrimary: { backgroundColor: '#A78BFA', borderColor: '#A78BFA', width: 80, height: 80, borderRadius: 40 },
  controlBtnGhost: { backgroundColor: 'transparent', borderWidth: 0, width: 48, height: 48 },
  controlBtnDisabled: { opacity: 0.4 },
})
