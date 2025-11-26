import { View, Text, StyleSheet, Pressable, Image, ScrollView, ActivityIndicator } from 'react-native'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import MiniPlayer from '../components/MiniPlayer'
import DashboardCard from '../components/DashboardCard'
import DashboardCardSkeleton from '../components/DashboardCardSkeleton'
import { useEffect, useMemo, useState } from 'react'
import ProfilesScreen from './ProfilesScreen'
import AccountScreen from './AccountScreen'
import CatalogScreen from './CatalogScreen'
import FavoritesScreen from './FavoritesScreen'
import PlaylistScreen from './PlaylistScreen'
import { Ionicons } from '@expo/vector-icons'
import { usePlayer } from '../context/PlayerContext'
import { apiGetFavorites, apiGetWorks, apiGetProfiles, apiGetWork } from '../services/api'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Props = {
  onLogout: () => void
}

export default function HomeScreen({ onLogout }: Props) {
  const { user, accessToken, activeProfileId } = useAuth()
  const insets = useSafeAreaInsets()
  const {
    currentTrack,
    currentWork,
    isPlaying,
    position,
    duration,
    hasNext,
    hasPrev,
    seekTo,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleFavorite,
    isFavorite,
    stop,
    togglePlaylist,
    playlistItemId,
    playWork
  } = usePlayer()
  const [tab, setTab] = useState<'home' | 'catalog' | 'favorites' | 'playlist' | 'settings'>('home')
  const [settingsView, setSettingsView] = useState<'menu' | 'profiles' | 'account'>('menu')
  const [bottomNavHeight, setBottomNavHeight] = useState(70)
  const [playerVisible, setPlayerVisible] = useState(false)
  const [progressBarWidth, setProgressBarWidth] = useState(1)

  // Dashboard Data
  const [favorites, setFavorites] = useState<any[]>([])
  const [suggested, setSuggested] = useState<any[]>([])
  const [recentAudiobooks, setRecentAudiobooks] = useState<any[]>([])
  const [recentMusic, setRecentMusic] = useState<any[]>([])
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [ageLabel, setAgeLabel] = useState('')

  useEffect(() => {
    if (!currentTrack) setPlayerVisible(false)
  }, [currentTrack])

  useEffect(() => {
    let mounted = true
    async function loadDashboard() {
      if (!accessToken || !activeProfileId) return
      setLoadingDashboard(true)
      try {
        // 1. Get Profile Info
        const profiles = await apiGetProfiles(accessToken)
        const profile = profiles.find((p) => p.id === activeProfileId)
        if (profile) {
          setProfileName(profile.name)
          if (profile.birthDate) {
            const birth = new Date(profile.birthDate)
            const now = new Date()
            const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
            setAgeLabel(months < 12 ? `${months} meses` : `${Math.floor(months / 12)} anos`)

            // Fetch Suggested
            const min = Math.max(0, months - 6)
            const max = months + 6
            const suggRes = await apiGetWorks(accessToken, { minMonths: min, maxMonths: max, limit: 10, profileId: activeProfileId })
            if (mounted) setSuggested(suggRes.data || [])
          }
        }

        // 2. Fetch Favorites
        const favRes = await apiGetFavorites(accessToken, { limit: 10, profileId: activeProfileId })
        if (mounted) setFavorites(favRes.data || [])

        // 3. Fetch Recent Audiobooks
        const audioRes = await apiGetWorks(accessToken, { type: 'audiobook', sort: 'createdAt:desc', limit: 10, profileId: activeProfileId })
        if (mounted) setRecentAudiobooks(audioRes.data || [])

        // 4. Fetch Recent Music
        const musicRes = await apiGetWorks(accessToken, { type: 'music', sort: 'createdAt:desc', limit: 10, profileId: activeProfileId })
        if (mounted) setRecentMusic(musicRes.data || [])

      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        if (mounted) setLoadingDashboard(false)
      }
    }
    if (tab === 'home') {
      loadDashboard()
    }
  }, [accessToken, activeProfileId, tab])

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

  const progress = duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0

  const handleSeek = (event: any) => {
    if (!duration || duration <= 0) return
    const x = event?.nativeEvent?.locationX || 0
    const ratio = progressBarWidth ? Math.min(1, Math.max(0, x / progressBarWidth)) : 0
    const newPos = ratio * duration
    seekTo(newPos)
  }

  const handlePlayWork = async (work: any) => {
    if (!accessToken) return
    const hasTracks = Array.isArray(work.tracks) && work.tracks.length > 0
    if (hasTracks) {
      await playWork({ ...work })
    } else {
      try {
        const full = await apiGetWork(accessToken, work.id)
        await playWork({ ...(full || work) })
      } catch { }
    }
  }

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
        <View style={{ flex: 1 }}>
          <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <Text style={styles.title}>{(() => {
              switch (tab) {
                case 'home': return 'Início'
                case 'settings': return 'Mais'
                default: return 'Mais'
              }
            })()}</Text>
            <Text style={styles.subtitle}>
              {tab === 'home'
                ? `Bem-vindo, ${profileName || user?.name || 'Visitante'}`
                : (user?.name || user?.email)
              }
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {tab === 'home' && (
              <View style={styles.dashboard}>
                {loadingDashboard ? (
                  <>
                    {/* Favoritos Skeleton */}
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <View style={[styles.sectionTitleSkeleton, styles.skeleton]} />
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <DashboardCardSkeleton key={`fav-skel-${idx}`} variant="square" />
                        ))}
                      </ScrollView>
                    </View>

                    {/* Sugeridos Skeleton */}
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <View style={[styles.sectionTitleSkeleton, styles.skeleton]} />
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <DashboardCardSkeleton key={`sug-skel-${idx}`} variant="square" />
                        ))}
                      </ScrollView>
                    </View>

                    {/* Audiobooks Skeleton */}
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <View style={[styles.sectionTitleSkeleton, styles.skeleton]} />
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <DashboardCardSkeleton key={`audio-skel-${idx}`} variant="portrait" />
                        ))}
                      </ScrollView>
                    </View>

                    {/* Músicas Skeleton */}
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <View style={[styles.sectionTitleSkeleton, styles.skeleton]} />
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <DashboardCardSkeleton key={`music-skel-${idx}`} variant="landscape" />
                        ))}
                      </ScrollView>
                    </View>
                  </>
                ) : (
                  <>
                    {favorites.length > 0 && (
                      <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Favoritos</Text>
                          <Pressable onPress={() => setTab('favorites')}>
                            <Text style={styles.sectionLink}>Ver tudo</Text>
                          </Pressable>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                          {favorites.map((item) => (
                            <DashboardCard key={item.id} work={item} onPress={() => handlePlayWork(item)} />
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {suggested.length > 0 && (
                      <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Sugerido para {profileName || 'você'} {ageLabel ? `(${ageLabel})` : ''}</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                          {suggested.map((item) => (
                            <DashboardCard key={item.id} work={item} onPress={() => handlePlayWork(item)} />
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {recentAudiobooks.length > 0 && (
                      <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Audiobooks Recentes</Text>
                          <Pressable onPress={() => { setTab('catalog'); /* TODO: filter by audiobook */ }}>
                            <Text style={styles.sectionLink}>Ver mais</Text>
                          </Pressable>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                          {recentAudiobooks.map((item) => (
                            <DashboardCard key={item.id} work={item} variant="portrait" onPress={() => handlePlayWork(item)} />
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {recentMusic.length > 0 && (
                      <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Músicas Recentes</Text>
                          <Pressable onPress={() => { setTab('catalog'); /* TODO: filter by music */ }}>
                            <Text style={styles.sectionLink}>Ver mais</Text>
                          </Pressable>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
                          {recentMusic.map((item) => (
                            <DashboardCard key={item.id} work={item} variant="landscape" onPress={() => handlePlayWork(item)} />
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {favorites.length === 0 && suggested.length === 0 && (
                      <View style={styles.emptyState}>
                        <Ionicons name="musical-notes-outline" size={48} color="#2b3448" />
                        <Text style={styles.emptyText}>Explore o catálogo para encontrar músicas e histórias!</Text>
                        <PrimaryButton title="Ir para o Catálogo" onPress={() => setTab('catalog')} />
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {tab === 'settings' ? (
              <View style={styles.menu}>
                <Pressable style={styles.menuItem} onPress={() => setSettingsView('profiles')}>
                  <View style={styles.menuItemContent}>
                    <Ionicons name="people-outline" size={20} color="#e6e9ff" />
                    <Text style={styles.menuItemText}>Perfis</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8b92b8" />
                </Pressable>
                <Pressable style={styles.menuItem} onPress={() => setSettingsView('account')}>
                  <View style={styles.menuItemContent}>
                    <Ionicons name="person-outline" size={20} color="#e6e9ff" />
                    <Text style={styles.menuItemText}>Conta</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8b92b8" />
                </Pressable>
                <Pressable style={[styles.menuItem, styles.logoutButton]} onPress={() => { stop(); onLogout() }}>
                  <View style={styles.menuItemContent}>
                    <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                    <Text style={[styles.menuItemText, styles.logoutText]}>Sair</Text>
                  </View>
                </Pressable>
              </View>
            ) : (
              <View />
            )}
          </ScrollView>
        </View>
      )
      }
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
      {
        playerVisible && currentTrack && currentWork && (
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

              <View
                style={styles.progressBar}
                onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
                onStartShouldSetResponder={() => true}
                onResponderGrant={handleSeek}
                onResponderMove={handleSeek}
                onResponderRelease={handleSeek}
              >
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
                  onPress={togglePlaylist}
                >
                  <Ionicons name={playlistItemId ? 'checkmark-circle' : 'add-circle-outline'} size={22} color={playlistItemId ? '#A78BFA' : '#cfd3ff'} />
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
        )
      }
    </View >
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1023' },
  scrollContent: { paddingBottom: 100, paddingTop: 20 },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1d2340' },
  dashboard: { paddingBottom: 20 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#e6e9ff' },
  sectionLink: { color: '#A78BFA', fontSize: 14 },
  horizontalList: { paddingHorizontal: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
  emptyText: { color: '#8b92b8', textAlign: 'center', fontSize: 16 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4, color: '#e6e9ff' },
  subtitle: { fontSize: 14, color: '#8b92b8' },
  menu: { width: '100%', paddingHorizontal: 20 },
  menuItem: { borderWidth: 1, borderColor: '#1d2340', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#0e1430', marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuItemContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuItemText: { color: '#e6e9ff', fontSize: 16 },
  logoutButton: { borderColor: '#ef4444', marginTop: 20 },
  logoutText: { color: '#ef4444' },
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
  sectionTitleSkeleton: { height: 20, width: 150, borderRadius: 4 },
  skeleton: { backgroundColor: '#1d2340', opacity: 0.6 },
})
