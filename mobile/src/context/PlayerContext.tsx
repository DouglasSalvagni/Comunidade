import { createContext, useContext, useMemo, useState, useEffect, useRef } from 'react'
import { Audio, AVPlaybackStatus } from 'expo-av'
import { useAuth } from './AuthContext'
import { apiGetStreamingUrl, apiToggleFavorite } from '../services/api'

type PlayerTrack = { id: string; title?: string; workId: string }
type PlayerWork = { id: string; title?: string; coverUrl?: string; isFavorite?: boolean; tracks?: PlayerTrack[] }

type PlayerContextValue = {
  currentTrack: PlayerTrack | null
  currentWork: PlayerWork | null
  isPlaying: boolean
  position: number
  duration: number
  playWork: (work: PlayerWork) => Promise<void>
  playTrack: (track: PlayerTrack, work?: PlayerWork) => Promise<void>
  togglePlay: () => Promise<void>
  toggleFavorite: () => Promise<void>
  isFavorite: boolean
  stop: () => Promise<void>
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined)

export function PlayerProvider({ children }: { children: any }) {
  const { accessToken, activeProfileId } = useAuth()
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null)
  const [currentWork, setCurrentWork] = useState<PlayerWork | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)

  const soundRef = useRef<Audio.Sound | null>(null)
  const isAudioConfigured = useRef(false)
  const isLoadingTrack = useRef(false) // Prevent concurrent loads

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

  // Playback status update callback
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return

    setIsPlaying(status.isPlaying)
    setPosition(status.positionMillis / 1000)
    setDuration(status.durationMillis ? status.durationMillis / 1000 : 0)
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
      const ao = typeof a?.orderIndex === 'number' ? a.orderIndex : 0
      const bo = typeof b?.orderIndex === 'number' ? b.orderIndex : 0
      return ao - bo
    })
    const first = ordered.find((t) => !!t)
    if (!first) return
    await playTrack(first, work)
  }

  async function playTrack(track: PlayerTrack, work?: PlayerWork) {
    if (!accessToken || !isAudioConfigured.current) return

    // Prevent concurrent track loading
    if (isLoadingTrack.current) {
      console.log('Already loading a track, ignoring request')
      return
    }

    isLoadingTrack.current = true

    try {
      const workData = work || currentWork

      // Always stop and unload previous sound first
      await unloadCurrentSound()

      setCurrentTrack(track)
      setCurrentWork(workData)
      setIsFavorite(Boolean(workData?.isFavorite))
      setPosition(0)
      setIsPlaying(false)

      // Get streaming URL from backend
      const res = await apiGetStreamingUrl(accessToken, track.id)
      const url = (res as any)?.url || ''
      if (!url) {
        console.error('No streaming URL returned')
        isLoadingTrack.current = false
        return
      }

      // Create and load new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      )

      soundRef.current = sound
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

  const value = useMemo(
    () => ({
      currentTrack,
      currentWork,
      isPlaying,
      position,
      duration,
      playWork,
      playTrack,
      togglePlay,
      toggleFavorite,
      isFavorite,
      stop
    }),
    [currentTrack, currentWork, isPlaying, position, duration, isFavorite, accessToken, activeProfileId],
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