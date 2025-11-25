import { createContext, useContext, useMemo, useState, useEffect, useRef } from 'react'
import { Audio, AVPlaybackStatus } from 'expo-av'
import { useAuth } from './AuthContext'
import { apiGetStreamingUrl, apiToggleFavorite } from '../services/api'
import { Platform } from 'react-native'

type PlayerTrack = { id: string; title?: string; workId: string; work?: any }
type PlayerWork = { id: string; title?: string; coverUrl?: string; isFavorite?: boolean; tracks?: PlayerTrack[] }

type PlayerContextValue = {
  currentTrack: PlayerTrack | null
  currentWork: PlayerWork | null
  isPlaying: boolean
  position: number
  duration: number
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
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined)

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
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null)
  const [currentWork, setCurrentWork] = useState<PlayerWork | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [queue, setQueue] = useState<PlayerTrack[] | null>(null) // active playlist queue (ordered)
  const [queueSource, setQueueSource] = useState<'playlist' | null>(null)
  const [queueIndex, setQueueIndex] = useState<number | null>(null)
  const lastAdvanceDirection = useRef<'next' | 'prev' | null>(null)

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
        console.error('Error configuring audio mode:', error)
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
      advanceQueue('next')
        .catch(() => { })
        .finally(() => { isAutoAdvancing.current = false })
    }
  }

  useEffect(() => {
    onPlaybackStatusUpdateRef.current = onPlaybackStatusUpdate
  })

  const onPlaybackStatusUpdateWrapper = (status: AVPlaybackStatus) => {
    onPlaybackStatusUpdateRef.current(status)
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
        console.error('Error unloading sound:', error)
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
    if (queueSource === 'playlist' && Array.isArray(queue) && queue.length > 0) {
      return queue
    }
    return getOrderedTracks(currentWork)
  }

  const computeNextFromQueue = (direction: 'next' | 'prev') => {
    const tracks = getActiveQueue()
    if (tracks.length === 0) return { track: null, tracksSource: tracks }

    // If playlist queue is active and we have an index, use it for consistency
    if (queueSource === 'playlist' && typeof queueIndex === 'number' && queueIndex >= 0) {
      const nextIdx =
        direction === 'next'
          ? (queueIndex + 1) % tracks.length
          : (queueIndex - 1 + tracks.length) % tracks.length
      return { track: tracks[nextIdx], tracksSource: tracks, nextIndex: nextIdx }
    }

    let idx = currentTrack ? tracks.findIndex((t) => t.id === currentTrack.id) : -1
    if (idx === -1) idx = 0
    const nextIdx =
      direction === 'next'
        ? (idx + 1) % tracks.length
        : (idx - 1 + tracks.length) % tracks.length
    return { track: tracks[nextIdx], tracksSource: tracks, nextIndex: nextIdx }
  }

  const hasPrev = useMemo(() => {
    const tracks = getActiveQueue()
    return tracks.length > 1
  }, [queueSource, queue, currentWork, currentTrack?.id, queueIndex])

  const hasNext = useMemo(() => {
    const tracks = getActiveQueue()
    return tracks.length > 1
  }, [queueSource, queue, currentWork, currentTrack?.id, queueIndex])

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
    if (typeof nextIndex === 'number') setQueueIndex(nextIndex)
    lastAdvanceDirection.current = null
  }

  async function nextTrack() {
    if (isLoadingTrack.current) return
    await advanceQueue('next')
  }

  async function prevTrack() {
    if (isLoadingTrack.current) return
    await advanceQueue('prev')
  }

  async function playTrack(track: PlayerTrack, work?: PlayerWork, options?: { playlistQueue?: PlayerTrack[]; nextIndex?: number }) {
    if (!accessToken || !isAudioConfigured.current) return

    // Prevent concurrent track loading
    if (isLoadingTrack.current) {
      return
    }

    isLoadingTrack.current = true

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
      } else if (queueSource === 'playlist' && queue && queue.length > 0) {
        // keep existing playlist queue, update index to current track
        const idx = queue.findIndex((t) => t.id === track.id)
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

      // Get streaming URL from backend
      const res = await apiGetStreamingUrl(accessToken, track.id, 'original')
      const url = (res as any)?.url || ''
      if (!url) {
        console.error('No streaming URL returned')
        isLoadingTrack.current = false
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

      setIsPlaying(true)
    } catch (error) {
      console.error('Error playing track:', error)
      setIsPlaying(false)
      await unloadCurrentSound()
    } finally {
      isLoadingTrack.current = false
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
    } catch (error) {
      console.error('Error stopping playback:', error)
    }
  }

  async function seekTo(seconds: number) {
    if (!soundRef.current || isLoadingTrack.current) return
    try {
      const clamped = Math.max(0, Math.min(duration || seconds, seconds))
      const status = await soundRef.current.playFromPositionAsync(clamped * 1000)
      setPosition(clamped)
      lastTick.current = Date.now()
    } catch (error) {
      console.error('Error seeking:', error)
    }
  }

  const value = useMemo(
    () => ({
      currentTrack,
      currentWork,
      isPlaying,
      position,
      duration,
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
      stop
    }),
    [currentTrack, currentWork, isPlaying, position, duration, isFavorite, accessToken, activeProfileId, hasNext, hasPrev],
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
