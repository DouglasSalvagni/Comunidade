import { View, Text, StyleSheet, Pressable, Image, ScrollView, ActivityIndicator, BackHandler } from 'react-native'
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated'
import PrimaryButton from '../components/PrimaryButton'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import MiniPlayer from '../components/MiniPlayer'
import DashboardCard from '../components/DashboardCard'
import DashboardCardSkeleton from '../components/DashboardCardSkeleton'
import CuriosityAnimation from '../components/CuriosityAnimation'
import { useEffect, useMemo, useState, useRef } from 'react'
import ProfilesScreen from './ProfilesScreen'
import AccountScreen from './AccountScreen'
import CatalogScreen from './CatalogScreen'
import FavoritesScreen from './FavoritesScreen'
import PlaylistScreen from './PlaylistScreen'
import { Ionicons } from '@expo/vector-icons'
import { usePlayer } from '../context/PlayerContext'
import { apiGetFavorites, apiGetWorks, apiGetProfiles, apiGetWork, apiGetTopPlayed } from '../services/api'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import appConfig from '../../app.json'

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
    isLoading,
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

  // Use refs for ALL dragging state to ensure synchronous access and avoid flicker
  const isDraggingRef = useRef(false)
  const dragProgressRef = useRef<number | null>(null)
  // pendingSeek holds the target progress after releasing, until player position catches up
  const pendingSeekRef = useRef<number | null>(null)
  // Track initial touch position to detect actual dragging vs tapping
  const touchStartXRef = useRef<number | null>(null)
  const hasDraggedRef = useRef(false)
  // Counter to force re-render when drag progress changes
  const [, setRenderTrigger] = useState(0)
  const forceRender = () => setRenderTrigger(n => n + 1)

  // Handle hardware back button (Android)
  useEffect(() => {
    const backAction = () => {
      // 1. If player is open, close it
      if (playerVisible) {
        setPlayerVisible(false)
        return true // Prevent default behavior
      }
      
      // 2. If inside settings sub-menus, go back to settings menu
      if (tab === 'settings' && settingsView !== 'menu') {
        setSettingsView('menu')
        return true
      }

      // 3. If in any tab other than Home, go to Home
      if (tab !== 'home') {
        setTab('home')
        return true
      }

      // 4. If in Home tab, exit app (minimize)
      BackHandler.exitApp()
      return true
    }

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    )

    return () => backHandler.remove()
  }, [playerVisible, tab, settingsView])

  // Dashboard Data
  const [favorites, setFavorites] = useState<any[]>([])
  const [suggested, setSuggested] = useState<any[]>([])
  const [recentAudiobooks, setRecentAudiobooks] = useState<any[]>([])
  const [recentMusic, setRecentMusic] = useState<any[]>([])
  const [topPlayed, setTopPlayed] = useState<any[]>([])
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [ageLabel, setAgeLabel] = useState('')
  const [playerCardTrack, setPlayerCardTrack] = useState<typeof currentTrack | null>(null)
  const [playerCardWork, setPlayerCardWork] = useState<typeof currentWork | null>(null)

  useEffect(() => {
    if (currentTrack && currentWork) {
      setPlayerCardTrack(currentTrack)
      setPlayerCardWork(currentWork)
    }
  }, [currentTrack, currentWork])

  useEffect(() => {
    if (!currentTrack && playerVisible) {
      const timeout = setTimeout(() => {
        setPlayerVisible(false)
      }, 400)
      return () => clearTimeout(timeout)
    }
  }, [currentTrack, playerVisible])

  // Clear pending seek when player position catches up
  useEffect(() => {
    if (pendingSeekRef.current !== null && duration > 0) {
      const targetPos = pendingSeekRef.current * duration
      const tolerance = Math.max(1, duration * 0.02) // 2% tolerance or 1 second minimum
      if (Math.abs(position - targetPos) < tolerance) {
        pendingSeekRef.current = null
        forceRender()
      }
    }
  }, [position, duration])

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

        // 5. Fetch Top Played (Global)
        const topRes = await apiGetTopPlayed(accessToken, { limit: 10 })
        if (mounted) setTopPlayed((topRes.data || []).slice(0, 10))

      } catch (err) {
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

  // Calculate progress: Priority: dragging > pending seek > player position
  const getProgress = () => {
    if (isDraggingRef.current && dragProgressRef.current !== null) {
      return dragProgressRef.current
    }
    if (pendingSeekRef.current !== null) {
      return pendingSeekRef.current
    }
    return duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0
  }
  const progress = getProgress()

  // Store progressBarWidth and offset in refs for synchronous access in handlers
  const progressBarWidthRef = useRef(progressBarWidth)
  const progressBarOffsetXRef = useRef(0)
  progressBarWidthRef.current = progressBarWidth

  const calculateProgressFromEvent = (event: any) => {
    // Use pageX for more accurate positioning
    const pageX = event?.nativeEvent?.pageX ?? 0
    const offsetX = progressBarOffsetXRef.current
    const width = progressBarWidthRef.current

    if (width <= 0) return 0

    // Calculate relative position within the bar
    const relativeX = pageX - offsetX
    const progress = relativeX / width

    return Math.min(1, Math.max(0, progress))
  }

  // Minimum distance required to start dragging (prevents tap from being treated as drag)
  const DRAG_THRESHOLD = 5

  const handleSeekStart = (event: any) => {
    if (!duration || duration <= 0) return
    touchStartXRef.current = event?.nativeEvent?.pageX ?? 0
    hasDraggedRef.current = false
    // Don't start dragging yet - wait for movement
  }

  const handleSeekMove = (event: any) => {
    if (!duration || duration <= 0) return

    const currentX = event?.nativeEvent?.pageX ?? 0
    const startX = touchStartXRef.current

    // Check if we've moved enough to start dragging
    if (!hasDraggedRef.current && startX !== null) {
      const distance = Math.abs(currentX - startX)
      if (distance >= DRAG_THRESHOLD) {
        // Start dragging
        hasDraggedRef.current = true
        isDraggingRef.current = true
        // Clear any pending seek when starting new drag
        pendingSeekRef.current = null
      }
    }

    if (isDraggingRef.current) {
      dragProgressRef.current = calculateProgressFromEvent(event)
      forceRender()
    }
  }

  const handleSeekEnd = (event: any) => {
    touchStartXRef.current = null

    // Only seek if we actually dragged
    if (!isDraggingRef.current || !hasDraggedRef.current) {
      isDraggingRef.current = false
      hasDraggedRef.current = false
      return
    }

    const finalProgress = calculateProgressFromEvent(event)
    const newPos = finalProgress * duration

    // Set pending seek to maintain visual position until player catches up
    pendingSeekRef.current = finalProgress
    isDraggingRef.current = false
    dragProgressRef.current = null
    hasDraggedRef.current = false

    // Seek to new position
    if (duration && duration > 0) {
      seekTo(newPos)
    }
    forceRender()
  }

  // Cancel drag if touch is terminated unexpectedly
  const handleSeekTerminate = () => {
    isDraggingRef.current = false
    dragProgressRef.current = null
    hasDraggedRef.current = false
    touchStartXRef.current = null
    // Don't clear pendingSeek - keep showing last known good position
    forceRender()
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
            {tab === 'home' ? (
              <Image
                source={require('../../assets/logo.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.title}>{tab === 'settings' ? 'Mais' : 'Mais'}</Text>
            )}
            <Text style={styles.subtitle}>
              {tab === 'home'
                ? `Bem-vindo, ${profileName || user?.name || 'Visitante'}!`
                : (user?.name || user?.email)
              }
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {tab === 'home' && (
              <View style={styles.dashboard}>
                <CuriosityAnimation />
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

                    {/* Top 10 Skeleton */}
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <View style={[styles.sectionTitleSkeleton, styles.skeleton]} />
                      </View>
                      <View style={styles.topList}>
                        {Array.from({ length: 4 }).map((_, idx) => (
                          <View key={`top-skel-${idx}`} style={[styles.topSkeleton, styles.skeleton]} />
                        ))}
                      </View>
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
                            <DashboardCard key={item.id} work={item} variant="square" onPress={() => handlePlayWork(item)} />
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {topPlayed.length > 0 && (
                      <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                          <Text style={styles.sectionTitle}>Top 10</Text>
                        </View>
                        <View style={styles.topList}>
                          {topPlayed.map((item, idx) => (
                            <Pressable key={item.id || idx} style={styles.topItem} onPress={() => handlePlayWork(item)}>
                              <View style={styles.topIndexWrap}>
                                <Text style={styles.topIndex}>{idx + 1}</Text>
                              </View>
                              {item.coverUrl ? (
                                <Image source={{ uri: item.coverUrl }} style={styles.topCover} />
                              ) : (
                                <View style={[styles.topCover, styles.topCoverPlaceholder]} />
                              )}
                              <View style={styles.topInfo}>
                                <Text style={styles.topTitle} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.topMeta} numberOfLines={1}>{item.type === 'music' ? 'Musica' : 'Audiobook'}</Text>
                              </View>
                              <Ionicons name="play" size={18} color="#cfd3ff" />
                            </Pressable>
                          ))}
                        </View>
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
      {playerVisible && playerCardTrack && playerCardWork && (
        <Animated.View 
          style={styles.playerOverlay}
          entering={SlideInDown.duration(400)}
          exiting={SlideOutDown.duration(400)}
        >
          <Pressable style={styles.playerBackdrop} onPress={() => setPlayerVisible(false)} />
          <View style={styles.playerCard}>
            <View style={styles.playerHeader}>
              <Text style={styles.playerNow}>Tocando agora</Text>
              <Pressable onPress={() => setPlayerVisible(false)} hitSlop={20}>
                <Ionicons name="chevron-down" size={32} color="#cfd3ff" />
              </Pressable>
            </View>
            <View style={styles.playerCoverWrap}>
              {playerCardWork?.coverUrl ? (
                <Image source={{ uri: playerCardWork.coverUrl }} style={styles.playerCover} />
              ) : (
                <View style={[styles.playerCover, styles.playerCoverPlaceholder]} />
              )}
            </View>
            <Text style={styles.playerTitle} numberOfLines={1}>{playerCardTrack?.title || playerCardWork?.title || 'Faixa'}</Text>
            <Text style={styles.playerSubtitle} numberOfLines={2}>{(playerCardWork as any)?.artistName || (appConfig as any)?.name || 'Ninaro'}</Text>

            <View
                style={styles.progressBarContainer}
                onLayout={(e) => {
                  setProgressBarWidth(e.nativeEvent.layout.width)
                  // Capture absolute X position for accurate touch calculations
                  e.currentTarget.measureInWindow((x) => {
                    progressBarOffsetXRef.current = x
                  })
                }}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={handleSeekStart}
                onResponderMove={handleSeekMove}
                onResponderRelease={handleSeekEnd}
                onResponderTerminate={handleSeekTerminate}
                onResponderTerminationRequest={() => false}
              >
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
                <View
                  style={[
                    styles.progressThumb,
                    { left: `${progress * 100}%` }
                  ]}
                />
            </View>
            <View style={styles.progressTimes}>
              <Text style={styles.progressText}>{formatTime(position)}</Text>
              <Text style={styles.progressText}>{formatTime(duration)}</Text>
            </View>

            <View style={styles.playerControls}>
              <View style={styles.playerSide}>
                {hasPrev && (
                  <Pressable
                    accessibilityRole="button"
                    disabled={isLoading}
                    style={styles.controlBtn}
                    onPress={prevTrack}
                  >
                    <Ionicons name="play-skip-back" size={26} color={isLoading ? '#6b7280' : '#e6e9ff'} />
                  </Pressable>
                )}
              </View>
              <View style={styles.playerCenter}>
                <Pressable
                  accessibilityRole="button"
                  style={[styles.controlBtn, styles.controlBtnPrimary]}
                  onPress={togglePlay}
                >
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color="#0b1023" />
                </Pressable>
              </View>
              <View style={styles.playerSide}>
                {hasNext && (
                  <Pressable
                    accessibilityRole="button"
                    disabled={isLoading}
                    style={styles.controlBtn}
                    onPress={nextTrack}
                  >
                    <Ionicons name="play-skip-forward" size={26} color={isLoading ? '#6b7280' : '#e6e9ff'} />
                  </Pressable>
                )}
              </View>
            </View>
            <View style={styles.playerActions}>
              <Pressable
                accessibilityRole="button"
                style={styles.actionBtn}
                onPress={togglePlaylist}
              >
                <Ionicons name={playlistItemId ? 'checkmark-circle' : 'add-circle-outline'} size={24} color={playlistItemId ? '#A78BFA' : '#cfd3ff'} />
                <Text style={[styles.actionBtnText, playlistItemId && styles.actionBtnTextActive]}>
                  {playlistItemId ? 'Na Playlist' : 'Playlist'}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={styles.actionBtn}
                onPress={toggleFavorite}
              >
                <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={24} color={isFavorite ? '#facc15' : '#cfd3ff'} />
                <Text style={[styles.actionBtnText, isFavorite && styles.actionBtnTextActive]}>
                  {isFavorite ? 'Favorito' : 'Favoritar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}
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
  progressBarContainer: { width: '100%', height: 24, justifyContent: 'center', position: 'relative' },
  progressBar: { height: 6, borderRadius: 6, backgroundColor: '#1f2742', overflow: 'hidden', width: '100%' },
  progressFill: { height: '100%', backgroundColor: '#A78BFA' },
  progressThumb: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: '#A78BFA', borderWidth: 2, borderColor: '#ffffff', top: 0, transform: [{ translateX: -12 }], shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5 },
  progressTimes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, width: '100%' },
  progressText: { color: '#94a3b8', fontSize: 14 },
  playerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20, marginTop: 20 },
  playerSide: { flex: 1, alignItems: 'center' },
  playerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  playerActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%', paddingHorizontal: 40, marginTop: 16, marginBottom: 40 },
  actionBtn: { alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 80 },
  actionBtnText: { color: '#cfd3ff', fontSize: 12, fontWeight: '500' },
  actionBtnTextActive: { color: '#e6e9ff', fontWeight: '600' },
  controlBtn: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: '#1d2340', backgroundColor: '#121632', alignItems: 'center', justifyContent: 'center' },
  controlBtnPrimary: { backgroundColor: '#A78BFA', borderColor: '#A78BFA', width: 80, height: 80, borderRadius: 40 },
  controlBtnGhost: { backgroundColor: 'transparent', borderWidth: 0, width: 48, height: 48 },
  controlBtnDisabled: { opacity: 0.4 },
  sectionTitleSkeleton: { height: 20, width: 150, borderRadius: 4 },
  skeleton: { backgroundColor: '#1d2340', opacity: 0.6 },
  topList: { paddingHorizontal: 20 },
  topItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#1d2340', backgroundColor: '#0e1430', marginBottom: 10 },
  topIndexWrap: { width: 28, alignItems: 'center' },
  topIndex: { color: '#8b92b8', fontSize: 14, fontWeight: '700' },
  topCover: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#1f2742', marginRight: 12 },
  topCoverPlaceholder: { backgroundColor: '#1d2340' },
  topInfo: { flex: 1, marginRight: 12 },
  topTitle: { color: '#e6e9ff', fontSize: 14, fontWeight: '700' },
  topMeta: { color: '#8b92b8', fontSize: 12, marginTop: 2 },
  topSkeleton: { height: 68, borderRadius: 14, marginBottom: 10 },
  headerLogo: { width: 200, height: 46, marginBottom: 8, alignSelf: 'center' },
})
