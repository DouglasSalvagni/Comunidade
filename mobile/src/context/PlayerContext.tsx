import { createContext, useContext, useMemo, useState, useEffect, useRef } from 'react'
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio'
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

  // Create a single audio player instance that persists
  const player = useAudioPlayer('')
  const isPlayerInitialized = useRef(false)

  // Configure audio mode for background playback on mount
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          staysActiveInBackground: true,
        })
        isPlayerInitialized.current = true
      } catch (error) {
        console.error('Error configuring audio mode:', error)
      }
    }
    configureAudio()
  }, [])

  // Update position periodically when playing
  useEffect(() => {
    if (!player.playing) return

    const interval = setInterval(() => {
      setPosition(player.currentTime)
      setDuration(player.duration)
    }, 500)

    return () => clearInterval(interval)
  }, [player.playing, player.currentTime, player.duration])

  // Sync playing state with player
  useEffect(() => {
    setIsPlaying(player.playing)
  }, [player.playing])

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
    if (!accessToken || !isPlayerInitialized.current) return

    try {
      const workData = work || currentWork
      setCurrentTrack(track)
      setCurrentWork(workData)
      setIsFavorite(Boolean(workData?.isFavorite))
      setPosition(0)

      // Get streaming URL from backend
      const res = await apiGetStreamingUrl(accessToken, track.id)
      const url = (res as any)?.url || ''
      if (!url) {
        console.error('No streaming URL returned')
        setIsPlaying(false)
        return
      }

      // Replace the current source with the new URL
      player.replace(url)

      // Try to enable lock screen controls if the method exists
      try {
        if (typeof player.setActiveForLockScreen === 'function') {
          await player.setActiveForLockScreen(true, {
            title: track.title || workData?.title || 'Unknown Track',
            artist: 'BabyTune',
            artwork: workData?.coverUrl,
          })
        }
      } catch (lockScreenError) {
        console.log('Lock screen controls not available:', lockScreenError)
      }

      // Play the new track
      player.play()
      setIsPlaying(true)
    } catch (error) {
      console.error('Error playing track:', error)
      setIsPlaying(false)
    }
  }

  async function togglePlay() {
    if (!isPlayerInitialized.current) return

    try {
      if (player.playing) {
        player.pause()
      } else {
        player.play()
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
    if (!isPlayerInitialized.current) return

    try {
      player.pause()

      // Try to disable lock screen controls if the method exists
      try {
        if (typeof player.setActiveForLockScreen === 'function') {
          await player.setActiveForLockScreen(false)
        }
      } catch (lockScreenError) {
        console.log('Lock screen controls not available:', lockScreenError)
      }

      player.replace('')
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