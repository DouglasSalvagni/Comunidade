import { createContext, useContext, useMemo, useRef, useState, useEffect } from 'react'
import { Video, ResizeMode } from 'expo-av'
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
  const videoRef = useRef<Video | null>(null)
  const [currentTrack, setCurrentTrack] = useState<PlayerTrack | null>(null)
  const [currentWork, setCurrentWork] = useState<PlayerWork | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  async function playWork(work: PlayerWork) {
    try { console.log('[Player] playWork', (work as any)?.id, 'tracks:', Array.isArray(work.tracks) ? work.tracks.length : 0) } catch {}
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
    if (!accessToken) { try { console.log('[Player] playTrack aborted: no accessToken') } catch {}; return }
    try {
      try { console.log('[Player] playTrack', (track as any)?.id, 'accessToken?', !!accessToken) } catch {}
      setCurrentTrack(track)
      setCurrentWork(work || currentWork)
      setIsFavorite(Boolean((work || currentWork)?.isFavorite))
      setIsPlaying(true)
      setPosition(0)
      try { console.log('[Player] fetching streaming url for track', (track as any)?.id) } catch {}
      const res = await apiGetStreamingUrl(accessToken, track.id)
      const url = (res as any)?.url || ''
      if (!url) {
        try { console.log('[Player] streaming url missing for track', (track as any)?.id) } catch {}
        setIsPlaying(false)
        return
      }
      try { console.log('[Player] streaming url ok for track', (track as any)?.id) } catch {}
      setStreamUrl(url)
    } catch (e) { try { console.log('[Player] error fetching streaming url', e) } catch {} }
  }

  async function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (isPlaying) {
      try { await v.pauseAsync() } catch {}
      setIsPlaying(false)
    } else {
      try { await v.playAsync() } catch {}
      setIsPlaying(true)
    }
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
    const v = videoRef.current
    try { if (v) await v.pauseAsync() } catch {}
    setIsPlaying(false)
    setStreamUrl(null)
    setCurrentTrack(null)
    setCurrentWork(null)
    setPosition(0)
    setDuration(0)
    setIsFavorite(false)
  }

  const onStatus = (status: any) => {
    if (!status) return
    const pos = typeof status.positionMillis === 'number' ? Math.floor(status.positionMillis / 1000) : 0
    const dur = typeof status.durationMillis === 'number' ? Math.floor(status.durationMillis / 1000) : duration
    setPosition(pos)
    if (dur > 0) setDuration(dur)
    if (typeof status.isPlaying === 'boolean') setIsPlaying(status.isPlaying)
    if (status.didJustFinish) setIsPlaying(false)
  }

  const value = useMemo(
    () => ({ currentTrack, currentWork, isPlaying, position, duration, playWork, playTrack, togglePlay, toggleFavorite, isFavorite, stop }),
    [currentTrack, currentWork, isPlaying, position, duration, isFavorite, accessToken, activeProfileId],
  )

  useEffect(() => {
    const v = videoRef.current
    if (!v || !streamUrl) return
    if (isPlaying) {
      try { v.playAsync() } catch {}
    }
  }, [streamUrl])

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <View style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}>
        {streamUrl ? (
          <Video
            ref={(r) => { videoRef.current = r }}
            source={{ uri: streamUrl }}
            shouldPlay={isPlaying}
            useNativeControls={false}
            isLooping={false}
            onPlaybackStatusUpdate={onStatus}
            resizeMode={ResizeMode.CONTAIN}
          />
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