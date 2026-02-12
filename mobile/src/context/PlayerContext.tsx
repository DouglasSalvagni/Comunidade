import { createContext, useContext, useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { Audio, AVPlaybackStatus } from 'expo-av'
import { useAuth } from './AuthContext'
import { useSubscription } from './SubscriptionContext'
import {
  apiGetStreamingUrl,
  apiToggleFavorite,
  apiGetPlaylists,
  apiCreatePlaylist,
  apiGetPlaylistItems,
  apiAddPlaylistItem,
  apiRemovePlaylistItem,
  apiRecordPlaybackEvent,
  apiGetWorks,
  apiGetProfiles,
  apiGetTopPlayed,
  apiGetMyTopPlayed
} from '../services/api'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

type PlayerTrack = { id: string; title?: string; workId: string; work?: any }
type PlayerWork = { id: string; title?: string; coverUrl?: string; coverThumbUrl?: string; isFavorite?: boolean; isPremium?: boolean; tracks?: PlayerTrack[] }

const PREMIUM_PREVIEW_PERCENT = 0.30
const FADEOUT_DURATION_SEC = 3

type PlayerContextValue = {
  currentTrack: PlayerTrack | null
  currentWork: PlayerWork | null
  isPlaying: boolean
  position: number
  duration: number
  isLoading: boolean
  loopPlaylist: boolean
  autoPlayAfterTrack: boolean
  hasNext: boolean
  hasPrev: boolean
  nextTrack: () => Promise<void>
  prevTrack: () => Promise<void>
  playWork: (work: PlayerWork) => Promise<void>
  playTrack: (track: PlayerTrack, work?: PlayerWork, options?: { playlistQueue?: PlayerTrack[]; nextIndex?: number }) => Promise<void>
  seekTo: (seconds: number) => Promise<void>
  togglePlay: () => Promise<void>
  toggleFavorite: () => Promise<void>
  isFavorite: boolean
  stop: () => Promise<void>
  removeFromQueue: (trackId: string) => void
  playlistItemId: string | null
  togglePlaylist: () => Promise<void>
  setLoopPlaylist: (value: boolean) => Promise<void>
  setAutoPlayAfterTrack: (value: boolean) => Promise<void>
  isPremiumPreview: boolean
  premiumPreviewLimit: number
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined)

function toSafeMediaUrl(rawUrl: string): string {
  const trimmed = (rawUrl || '').trim()
  if (!trimmed) return ''
  try {
    return encodeURI(trimmed)
  } catch {
    return trimmed
  }
}

async function computeHlsDuration(masterUrl: string): Promise<number> {
  try {
    const masterRes = await fetch(masterUrl)
    const masterTxt = await masterRes.text()
    const lines = masterTxt.split('\n').map((l) => l.trim()).filter(Boolean)
    const variantLine = lines.find((l) => l.endsWith('.m3u8') && !l.startsWith('#'))
    const variantUrl = variantLine ? new URL(variantLine, masterUrl).toString() : masterUrl
    const variantRes = await fetch(variantUrl)
    const variantTxt = await variantRes.text()
    const matches = variantTxt.match(/#EXTINF:([0-9.]+)/g) || []
    const total = matches.reduce((acc, line) => {
      const m = line.match(/#EXTINF:([0-9.]+)/)
      if (!m) return acc
      const v = parseFloat(m[1])
      return acc + (isNaN(v) ? 0 : v)
    }, 0)
    return total
  } catch (err) {
    // Ignore HLS duration errors; player will fall back to defaults
    return 0
  }
}

export function PlayerProvider({ children }: { children: any }) {
  const { accessToken, activeProfileId } = useAuth()
  const { isFree } = useSubscription()
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null)
  const [currentWork, setCurrentWork] = useState<PlayerWork | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [queue, setQueue] = useState<PlayerTrack[] | null>(null)
  const [queueSource, setQueueSource] = useState<'playlist' | 'auto' | null>(null)
  const [autoPlayAfterTrack, setAutoPlayAfterTrackState] = useState(true)
  const [queueIndex, setQueueIndex] = useState<number | null>(null)
  const [playlistItemId, setPlaylistItemId] = useState<string | null>(null)
  const [loopPlaylist, setLoopPlaylistState] = useState(false)
  const [isPremiumPreview, setIsPremiumPreview] = useState(false)
  const [premiumPreviewLimit, setPremiumPreviewLimit] = useState(0)
  const lastAdvanceDirection = useRef<'next' | 'prev' | null>(null)
  const fadeoutStarted = useRef(false)

  const soundRef = useRef<Audio.Sound | null>(null)
  const isAudioConfigured = useRef(false)
  const isLoadingTrack = useRef(false) // Prevent concurrent loads
  const isAutoAdvancing = useRef(false)
  const manualTimer = useRef<NodeJS.Timeout | null>(null)
  const lastTick = useRef<number | null>(null)
  const onPlaybackStatusUpdateRef = useRef((status: AVPlaybackStatus) => { })

  // Configure audio mode for background playback on mount
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        })
        isAudioConfigured.current = true
      } catch (error) {
      }
    }
    configureAudio()

    // Cleanup on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => { })
      }
    }
  }, [])

  // Polling fallback to keep progress updated even if playback callback is not firing (HLS edge cases)
  useEffect(() => {
    const interval = setInterval(async () => {
      const sound = soundRef.current
      if (!sound) return
      try {
        const status = await sound.getStatusAsync()
        if (!status.isLoaded) return
        setIsPlaying(status.isPlaying)
        if (typeof status.positionMillis === 'number' && status.positionMillis > 0) {
          setPosition(status.positionMillis / 1000)
          lastTick.current = Date.now()
        }
        setDuration((prev) => (status.durationMillis ? status.durationMillis / 1000 : prev || 0))
        // Sync manual timer with real player position when available
        if (status.positionMillis) {
          lastTick.current = Date.now()
        }
      } catch (err) {
        // ignore polling errors
      }
    }, 800)
    return () => clearInterval(interval)
  }, [])

  // Manual timer to keep UI progress moving even when AV status doesn't update
  useEffect(() => {
    if (manualTimer.current) {
      clearInterval(manualTimer.current)
      manualTimer.current = null
    }
    if (isPlaying && duration > 0) {
      lastTick.current = Date.now()
      manualTimer.current = setInterval(() => {
        setPosition((prev) => {
          const now = Date.now()
          const elapsed = lastTick.current ? (now - lastTick.current) / 1000 : 0
          lastTick.current = now
          const next = Math.min(duration, prev + elapsed)
          return next
        })
      }, 500)
    } else {
      lastTick.current = null
    }
    return () => {
      if (manualTimer.current) clearInterval(manualTimer.current)
      manualTimer.current = null
    }
  }, [isPlaying, duration])

  // Playback status update callback
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return

    setIsPlaying(status.isPlaying)
    // Only overwrite position when we have a positive value; otherwise keep current (manual timer will advance)
    if (typeof status.positionMillis === 'number' && status.positionMillis > 0) {
      setPosition(status.positionMillis / 1000)
      lastTick.current = Date.now()
    }
    // Some HLS streams may not expose duration; keep previous duration if missing
    setDuration((prev) => (status.durationMillis ? status.durationMillis / 1000 : prev || 0))

    if ('didJustFinish' in status && status.didJustFinish && !isLoadingTrack.current) {
      if (isAutoAdvancing.current) return
      isAutoAdvancing.current = true
      const handleFinish = async () => {
        if (queueSource === 'playlist') {
          await advanceQueue('next')
        } else if (autoPlayAfterTrack) {
          await advanceOrBuildAutoQueue('next')
        } else {
          await stop()
        }
      }
      handleFinish()
        .catch(() => { })
        .finally(() => { isAutoAdvancing.current = false })
    }

    // Premium preview: fadeout and stop
    if (isPremiumPreview && premiumPreviewLimit > 0 && status.isPlaying) {
      const posSec = (status.positionMillis || 0) / 1000
      const fadeStart = premiumPreviewLimit - FADEOUT_DURATION_SEC
      if (posSec >= premiumPreviewLimit) {
        // Stop playback at limit
        fadeoutStarted.current = false
        if (!isAutoAdvancing.current) {
          isAutoAdvancing.current = true
          const doStop = async () => {
            try {
              if (soundRef.current) {
                await soundRef.current.setVolumeAsync(1.0)
              }
            } catch { }
            if (queueSource === 'playlist') {
              await advanceQueue('next')
            } else if (autoPlayAfterTrack) {
              await advanceOrBuildAutoQueue('next')
            } else {
              await stop()
            }
          }
          doStop().catch(() => { }).finally(() => { isAutoAdvancing.current = false })
        }
      } else if (posSec >= fadeStart && !fadeoutStarted.current) {
        fadeoutStarted.current = true
        // Gradually fade volume
        const fadeSteps = 6
        const stepMs = (FADEOUT_DURATION_SEC * 1000) / fadeSteps
        for (let i = 1; i <= fadeSteps; i++) {
          setTimeout(async () => {
            try {
              if (soundRef.current) {
                await soundRef.current.setVolumeAsync(Math.max(0, 1.0 - (i / fadeSteps)))
              }
            } catch { }
          }, stepMs * i)
        }
      }
    }
  }

  useEffect(() => {
    onPlaybackStatusUpdateRef.current = onPlaybackStatusUpdate
  })

  const onPlaybackStatusUpdateWrapper = (status: AVPlaybackStatus) => {
    onPlaybackStatusUpdateRef.current(status)
  }

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [storedLoop, storedAuto] = await Promise.all([
          AsyncStorage.getItem('player:loopPlaylist'),
          AsyncStorage.getItem('player:autoPlayAfterTrack'),
        ])
        if (storedLoop === 'true') setLoopPlaylistState(true)
        if (storedAuto === 'false') setAutoPlayAfterTrackState(false)
      } catch {
      }
    }
    loadSettings()
  }, [])

  const setLoopPlaylist = async (value: boolean) => {
    setLoopPlaylistState(value)
    try {
      await AsyncStorage.setItem('player:loopPlaylist', value ? 'true' : 'false')
    } catch {
    }
  }

  const setAutoPlayAfterTrack = async (value: boolean) => {
    setAutoPlayAfterTrackState(value)
    try {
      await AsyncStorage.setItem('player:autoPlayAfterTrack', value ? 'true' : 'false')
    } catch {
    }
  }

  // Helper function to safely unload current sound
  const unloadCurrentSound = async () => {
    if (soundRef.current) {
      try {
        const status = await soundRef.current.getStatusAsync()
        if (status.isLoaded) {
          await soundRef.current.stopAsync()
          await soundRef.current.unloadAsync()
        }
      } catch (error) {
      }
      soundRef.current = null
    }
  }

  async function playWork(work: PlayerWork) {
    const list = Array.isArray(work.tracks) ? work.tracks : []
    const ordered = [...list].sort((a: any, b: any) => {
      const ao = typeof a?.orderIndex === 'number' ? a.orderIndex : (typeof a?.order === 'number' ? a.order : 0)
      const bo = typeof b?.orderIndex === 'number' ? b.orderIndex : (typeof b?.order === 'number' ? b.order : 0)
      return ao - bo
    })
    const first = ordered.find((t) => !!t)
    if (!first) return
    await playTrack(first, work)
  }

  const getOrderedTracks = (work?: PlayerWork | null) => {
    const tracks = work?.tracks ? [...work.tracks] : []
    return tracks
      .filter((t) => !!t?.id)
      .sort((a: any, b: any) => {
        const ao = typeof a?.orderIndex === 'number' ? a.orderIndex : (typeof a?.order === 'number' ? a.order : 0)
        const bo = typeof b?.orderIndex === 'number' ? b.orderIndex : (typeof b?.order === 'number' ? b.order : 0)
        return ao - bo
      })
  }

  const getActiveQueue = () => {
    if ((queueSource === 'playlist' || queueSource === 'auto') && Array.isArray(queue) && queue.length > 0) {
      return queue
    }
    return getOrderedTracks(currentWork)
  }

  const computeNextFromQueue = (direction: 'next' | 'prev') => {
    const tracks = getActiveQueue()
    if (tracks.length === 0) return { track: null, tracksSource: tracks }

    if ((queueSource === 'playlist' || queueSource === 'auto') && typeof queueIndex === 'number' && queueIndex >= 0) {
      if (direction === 'next') {
        if (queueIndex >= tracks.length - 1) {
          if (queueSource === 'playlist' && loopPlaylist && tracks.length > 0) {
            return { track: tracks[0], tracksSource: tracks, nextIndex: 0 }
          }
          return { track: null, tracksSource: tracks }
        }
        const nextIdx = queueIndex + 1
        return { track: tracks[nextIdx], tracksSource: tracks, nextIndex: nextIdx }
      } else {
        if (queueIndex <= 0) return { track: null, tracksSource: tracks }
        const nextIdx = queueIndex - 1
        return { track: tracks[nextIdx], tracksSource: tracks, nextIndex: nextIdx }
      }
    }

    let idx = currentTrack ? tracks.findIndex((t) => t.id === currentTrack.id) : -1
    if (idx === -1) idx = 0

    if (direction === 'next') {
      if (idx >= tracks.length - 1) return { track: null, tracksSource: tracks }
      const nextIdx = idx + 1
      return { track: tracks[nextIdx], tracksSource: tracks, nextIndex: nextIdx }
    } else {
      const nextIdx = (idx - 1 + tracks.length) % tracks.length
      return { track: tracks[nextIdx], tracksSource: tracks, nextIndex: nextIdx }
    }
  }

  const hasPrev = useMemo(() => {
    if (queueSource === 'auto' && typeof queueIndex === 'number' && queueIndex > 0) return true
    if (!queueSource && autoPlayAfterTrack && currentTrack) return false
    const tracks = getActiveQueue()
    return tracks.length > 1
  }, [queueSource, queue, currentWork, currentTrack?.id, queueIndex, autoPlayAfterTrack])

  const hasNext = useMemo(() => {
    if (!queueSource && autoPlayAfterTrack && currentTrack) return true
    if (queueSource === 'auto') return true
    const tracks = getActiveQueue()
    return tracks.length > 1
  }, [queueSource, queue, currentWork, currentTrack?.id, queueIndex, autoPlayAfterTrack])

  const fetchRecommendations = async (excludeWorkId?: string): Promise<PlayerTrack[]> => {
    if (!accessToken) return []
    try {
      const currentTags = (currentWork as any)?.tags
      const currentDevThemes = (currentWork as any)?.devThemes
      const tagsStr = Array.isArray(currentTags) ? currentTags.join(',') : (typeof currentTags === 'string' ? currentTags : '')
      const devThemesStr = Array.isArray(currentDevThemes) ? currentDevThemes.join(',') : (typeof currentDevThemes === 'string' ? currentDevThemes : '')

      let ageMin: number | undefined
      let ageMax: number | undefined
      if (activeProfileId) {
        try {
          const profiles = await apiGetProfiles(accessToken)
          const profile = profiles.find((p: any) => p.id === activeProfileId)
          if (profile?.birthDate) {
            const birth = new Date(profile.birthDate)
            const now = new Date()
            const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
            ageMin = Math.max(0, months - 6)
            ageMax = months + 6
          }
        } catch { }
      }

      const extractTracks = (works: any[]): PlayerTrack[] => {
        const filtered = excludeWorkId ? works.filter(w => w.id !== excludeWorkId) : works
        return filtered
          .filter(w => Array.isArray(w.tracks) && w.tracks.length > 0)
          .map(w => {
            const sorted = [...w.tracks].sort((a: any, b: any) => {
              const ao = typeof a?.orderIndex === 'number' ? a.orderIndex : 0
              const bo = typeof b?.orderIndex === 'number' ? b.orderIndex : 0
              return ao - bo
            })
            return { ...sorted[0], work: w } as PlayerTrack
          })
      }

      const tryFetch = async (params: any): Promise<PlayerTrack[]> => {
        const res = await apiGetWorks(accessToken, { ...params, limit: 10, profileId: activeProfileId || undefined })
        return extractTracks(res.data || [])
      }

      if (ageMin !== undefined && ageMax !== undefined && tagsStr) {
        const r = await tryFetch({ minMonths: ageMin, maxMonths: ageMax, tags: tagsStr })
        if (r.length > 0) return r
      }
      if (ageMin !== undefined && ageMax !== undefined && devThemesStr) {
        const r = await tryFetch({ minMonths: ageMin, maxMonths: ageMax, devThemes: devThemesStr })
        if (r.length > 0) return r
      }
      if (ageMin !== undefined && ageMax !== undefined) {
        const r = await tryFetch({ minMonths: ageMin, maxMonths: ageMax })
        if (r.length > 0) return r
      }
      if (tagsStr) {
        const r = await tryFetch({ tags: tagsStr })
        if (r.length > 0) return r
      }
      if (activeProfileId) {
        try {
          const res = await apiGetMyTopPlayed(accessToken, { limit: 10, profileId: activeProfileId })
          const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res as any[] : [])
          const r = extractTracks(data.filter((w: any) => w.id !== excludeWorkId))
          if (r.length > 0) return r
        } catch { }
      }
      try {
        const res = await apiGetTopPlayed(accessToken, { limit: 10 })
        const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res as any[] : [])
        return extractTracks(data.filter((w: any) => w.id !== excludeWorkId))
      } catch { }
      return []
    } catch {
      return []
    }
  }

  const advanceOrBuildAutoQueue = async (direction: 'next' | 'prev' = 'next') => {
    if (queueSource === 'auto' && Array.isArray(queue) && queue.length > 0 && typeof queueIndex === 'number') {
      const { track: nextFromQueue, tracksSource, nextIndex } = computeNextFromQueue(direction)
      if (nextFromQueue) {
        const targetWork = (nextFromQueue as any).work || currentWork || undefined
        await playTrack(nextFromQueue, targetWork)
        setQueue(tracksSource)
        setQueueSource('auto')
        if (typeof nextIndex === 'number') setQueueIndex(nextIndex)
        return
      }
      if (direction === 'prev') {
        return
      }
    }
    if (direction === 'prev') return
    const recs = await fetchRecommendations(currentWork?.id)
    if (recs.length === 0) {
      await stop()
      return
    }
    setQueue(recs)
    setQueueSource('auto')
    setQueueIndex(0)
    const first = recs[0]
    const targetWork = (first as any).work || undefined
    await playTrack(first, targetWork)
    setQueue(recs)
    setQueueSource('auto')
    setQueueIndex(0)
  }

  const advanceQueue = async (direction: 'next' | 'prev') => {
    lastAdvanceDirection.current = direction
    const { track: nextTrackFromQueue, tracksSource, nextIndex } = computeNextFromQueue(direction)
    if (!nextTrackFromQueue) {
      await stop()
      lastAdvanceDirection.current = null
      return
    }
    const targetWork = (nextTrackFromQueue as any).work || currentWork || undefined
    await playTrack(
      nextTrackFromQueue,
      targetWork,
      queueSource === 'playlist' ? { playlistQueue: tracksSource, nextIndex } : undefined
    )
    if (queueSource === 'auto') {
      setQueue(tracksSource)
      setQueueSource('auto')
    }
    if (typeof nextIndex === 'number') setQueueIndex(nextIndex)
    lastAdvanceDirection.current = null
  }

  async function nextTrack() {
    if (isLoadingTrack.current) return
    if (queueSource === 'playlist') {
      await advanceQueue('next')
    } else if (autoPlayAfterTrack) {
      await advanceOrBuildAutoQueue('next')
    }
  }

  async function prevTrack() {
    if (isLoadingTrack.current) return
    if (queueSource === 'auto') {
      await advanceOrBuildAutoQueue('prev')
    } else {
      await advanceQueue('prev')
    }
  }

  async function playTrack(track: PlayerTrack, work?: PlayerWork, options?: { playlistQueue?: PlayerTrack[]; nextIndex?: number }) {
    if (!accessToken || !isAudioConfigured.current) return

    // Prevent concurrent track loading
    if (isLoadingTrack.current) {
      return
    }

    isLoadingTrack.current = true
    setIsLoading(true)

    try {
      const fromPlaylist = Array.isArray(options?.playlistQueue) && options?.playlistQueue.length > 0
      if (fromPlaylist) {
        const activeQueue = options?.playlistQueue || queue || []
        setQueue(activeQueue)
        setQueueSource('playlist')
        const idx =
          typeof options?.nextIndex === 'number'
            ? options.nextIndex
            : activeQueue.findIndex((t) => t.id === track.id)
        setQueueIndex(idx >= 0 ? idx : 0)
      } else {
        setQueue(null)
        setQueueSource(null)
        setQueueIndex(null)
      }

      const workData = work || (fromPlaylist ? (track as any).work : currentWork)

      // Always stop and unload previous sound first
      await unloadCurrentSound()

      setCurrentTrack(track)
      setCurrentWork(workData)
      setIsFavorite(Boolean(workData?.isFavorite))
      setPosition(0)
      // Prefill duration with metadata while waiting for player to report it
      const metaDuration = (track as any)?.durationSeconds || (workData as any)?.durationSeconds || 0
      setDuration(metaDuration)
      setIsPlaying(false)

      // Determine premium preview state
      const workIsPremium = Boolean((workData as any)?.isPremium)
      const previewMode = isFree && workIsPremium
      setIsPremiumPreview(previewMode)
      fadeoutStarted.current = false

      // Get streaming URL from backend
      const res = await apiGetStreamingUrl(accessToken, track.id, 'original')
      const url = toSafeMediaUrl((res as any)?.url || '')
      if (!url) {
        isLoadingTrack.current = false
        setIsLoading(false)
        return
      }

      // Create and load new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        onPlaybackStatusUpdateWrapper
      )

      // Ensure periodic status updates for progress
      await sound.setProgressUpdateIntervalAsync(500)
      sound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdateWrapper)

      soundRef.current = sound
      // If we still don't have duration, compute from HLS playlist (or fallback to long duration to keep UI moving)
      let effectiveDuration = metaDuration
      if (!effectiveDuration) {
        const hlsDuration = await computeHlsDuration(url)
        if (hlsDuration > 0) {
          effectiveDuration = hlsDuration
        }
      }
      if (!effectiveDuration) {
        effectiveDuration = 3600 // arbitrary long duration so progress can move; will cap when finish fires
      }
      setDuration(effectiveDuration)

      // Set premium preview limit
      if (isFree && Boolean((workData as any)?.isPremium) && effectiveDuration > 0) {
        setPremiumPreviewLimit(effectiveDuration * PREMIUM_PREVIEW_PERCENT)
      } else {
        setPremiumPreviewLimit(0)
      }

      setIsPlaying(true)

      // Report 'play' event for new track
      if (accessToken) {
        apiRecordPlaybackEvent(accessToken, {
          trackId: track.id,
          eventType: 'play',
          positionSeconds: 0,
          profileId: activeProfileId || undefined
        })
          .catch(() => { })
      }
    } catch (error) {
      console.error('Error playing track:', error)
      setIsPlaying(false)
      await unloadCurrentSound()
    } finally {
      isLoadingTrack.current = false
      setIsLoading(false)
    }
  }

  async function togglePlay() {
    if (!soundRef.current || !isAudioConfigured.current || isLoadingTrack.current) return

    try {
      const status = await soundRef.current.getStatusAsync()
      if (!status.isLoaded) return

      if (status.isPlaying) {
        await soundRef.current.pauseAsync()
      } else {
        await soundRef.current.playAsync()
      }
    } catch (error) {
      console.error('Error toggling play:', error)
    }
  }

  async function toggleFavorite() {
    if (!accessToken || !currentWork) return
    try {
      const res = await apiToggleFavorite(accessToken, currentWork.id, activeProfileId || undefined)
      const fav = Boolean((res as any)?.isFavorite)
      setIsFavorite(fav)
      setCurrentWork((w) => (w ? { ...w, isFavorite: fav } : w))
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  async function stop() {
    if (!isAudioConfigured.current || isLoadingTrack.current) return

    try {
      await unloadCurrentSound()

      setIsPlaying(false)
      setCurrentTrack(null)
      setCurrentWork(null)
      setPosition(0)
      setDuration(0)
      setIsFavorite(false)
      setPlaylistItemId(null)
      setIsPremiumPreview(false)
      setPremiumPreviewLimit(0)
      fadeoutStarted.current = false
    } catch (error) {
      console.error('Error stopping playback:', error)
    }
  }

  async function seekTo(seconds: number) {
    if (!soundRef.current || isLoadingTrack.current) return
    try {
      let maxSeek = duration || seconds
      // Clamp seek for premium preview
      if (isPremiumPreview && premiumPreviewLimit > 0) {
        maxSeek = Math.min(maxSeek, premiumPreviewLimit)
      }
      const clamped = Math.max(0, Math.min(maxSeek, seconds))

      // Check current playback state before seeking
      const statusBefore = await soundRef.current.getStatusAsync()
      const wasPlaying = statusBefore.isLoaded && statusBefore.isPlaying

      // Set position without auto-playing
      await soundRef.current.setPositionAsync(clamped * 1000)
      setPosition(clamped)
      lastTick.current = Date.now()

      // Only resume playback if it was playing before
      if (wasPlaying) {
        await soundRef.current.playAsync()
      }
    } catch (error) {
      console.error('Error seeking:', error)
    }
  }

  function removeFromQueue(trackId: string) {
    if (queueSource === 'playlist' && queue) {
      const newQueue = queue.filter(t => t.id !== trackId)
      setQueue(newQueue)
      // Update index if we are currently playing
      if (currentTrack) {
        const newIdx = newQueue.findIndex(t => t.id === currentTrack.id)
        setQueueIndex(newIdx >= 0 ? newIdx : null)
      }
    }
  }

  // Playlist Management
  const ensureDefaultPlaylist = async (createIfMissing = false) => {
    if (!accessToken) return null
    try {
      const playlists = await apiGetPlaylists(accessToken, activeProfileId || undefined)
      let list = Array.isArray(playlists) ? (playlists.find((p) => p.isDefault) || playlists[0]) : null
      if (!list && createIfMissing) {
        list = await apiCreatePlaylist(accessToken, { name: 'Minha Playlist', profileId: activeProfileId || undefined }) as any
      }
      return list as any
    } catch {
      return null
    }
  }

  useEffect(() => {
    const syncPlaylistState = async () => {
      if (!accessToken || !currentTrack) {
        setPlaylistItemId(null)
        return
      }
      try {
        const list = await ensureDefaultPlaylist(false)
        if (!list) {
          setPlaylistItemId(null)
          return
        }
        const items = await apiGetPlaylistItems(accessToken, (list as any).id)
        const item = Array.isArray(items) ? items.find((it: any) => (it.track?.id || it.trackId) === currentTrack.id) : null
        setPlaylistItemId(item ? item.id : null)
      } catch {
        setPlaylistItemId(null)
      }
    }
    syncPlaylistState()
  }, [accessToken, activeProfileId, currentTrack?.id])

  async function togglePlaylist() {
    if (!accessToken || !currentTrack) return
    try {
      const list = await ensureDefaultPlaylist(true)
      if (!list) return

      if (playlistItemId) {
        // Remove
        await apiRemovePlaylistItem(accessToken, list.id, playlistItemId)
        setPlaylistItemId(null)
      } else {
        // Add
        const res = await apiAddPlaylistItem(accessToken, list.id, currentTrack.id)
        setPlaylistItemId(res.id)
      }
    } catch (err) {
      console.error('Error toggling playlist:', err)
    }
  }

  const value = useMemo(
    () => ({
      currentTrack,
      currentWork,
      isPlaying,
      position,
      duration,
      isLoading,
      loopPlaylist,
      autoPlayAfterTrack,
      hasNext,
      hasPrev,
      nextTrack,
      prevTrack,
      playWork,
      playTrack,
      seekTo,
      togglePlay,
      toggleFavorite,
      isFavorite,
      stop,
      removeFromQueue,
      playlistItemId,
      togglePlaylist,
      setLoopPlaylist,
      setAutoPlayAfterTrack,
      isPremiumPreview,
      premiumPreviewLimit
    }),
    [currentTrack, currentWork, isPlaying, position, duration, isFavorite, accessToken, activeProfileId, hasNext, hasPrev, playlistItemId, isLoading, loopPlaylist, autoPlayAfterTrack, isPremiumPreview, premiumPreviewLimit],
  )

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('PlayerContext not found')
  return ctx
}
