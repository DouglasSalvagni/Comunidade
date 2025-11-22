import { createContext, useContext, useMemo, useRef, useState, useEffect } from 'react'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useEvent } from 'expo'
import { useAuth } from './AuthContext'
import { apiGetStreamingUrl, apiToggleFavorite } from '../services/api'
import { View } from 'react-native'

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
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)

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
    if (!accessToken) { return }
    try {
      setCurrentTrack(track)
      setCurrentWork(work || currentWork)
      setIsFavorite(Boolean((work || currentWork)?.isFavorite))
      setIsPlaying(true)
      setPosition(0)
      const res = await apiGetStreamingUrl(accessToken, track.id)
      const url = (res as any)?.url || ''
      if (!url) {
        setIsPlaying(false)
        return
      }
      setStreamUrl(url)
    } catch {}
  }

  // expo-video player
  const player = useVideoPlayer(streamUrl || '', (p) => {
    p.loop = false
  })

  async function togglePlay() {
    if (!player) return
    const native = player.playing === true
    try { native ? player.pause() : player.play() } catch {}
    setIsPlaying(!native)
  }

  async function toggleFavorite() {
    if (!accessToken || !currentWork) return
    try {
      const res = await apiToggleFavorite(accessToken, currentWork.id, activeProfileId || undefined)
      const fav = Boolean((res as any)?.isFavorite)
      setIsFavorite(fav)
      setCurrentWork((w) => (w ? { ...w, isFavorite: fav } : w))
    } catch {}
  }

  async function stop() {
    try { if (player) player.pause() } catch {}
    setIsPlaying(false)
    setStreamUrl(null)
    setCurrentTrack(null)
    setCurrentWork(null)
    setPosition(0)
    setDuration(0)
    setIsFavorite(false)
  }

  // keep native playing state in sync when possible
  const nativePlaying = useEvent(player, 'playingChange', { isPlaying: player?.playing }).isPlaying
  useEffect(() => {
    if (typeof nativePlaying === 'boolean') setIsPlaying(nativePlaying)
  }, [nativePlaying])

  const value = useMemo(
    () => ({ currentTrack, currentWork, isPlaying, position, duration, playWork, playTrack, togglePlay, toggleFavorite, isFavorite, stop }),
    [currentTrack, currentWork, isPlaying, position, duration, isFavorite, accessToken, activeProfileId, player],
  )

  useEffect(() => {
    if (!player || !streamUrl) return
    try { player.replace(streamUrl) } catch {}
    if (isPlaying) {
      try { player.play() } catch {}
    } else {
      try { player.pause() } catch {}
    }
  }, [streamUrl, player, isPlaying])

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <View style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
        {streamUrl ? (
          <VideoView player={player} style={{ width: 1, height: 1 }} />
        ) : null}
      </View>
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('PlayerContext not found')
  return ctx
}