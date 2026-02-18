'use client';

import { useEffect, useRef, useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, List, Trash, ChevronUp, ChevronDown, X } from "lucide-react";
import { usePlayerHeight } from "@/context/PlayerHeightContext";
import Image from "next/image";
import fallbackAudio from "@/assets/fallback-audio.jpg";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import type { Track } from "@/services/api";
import { api } from "@/services/api";
import Hls from "hls.js";
import { toast } from "sonner";

type Props = {
  autoAdvance?: boolean;
  onEnded?: () => void;
};

const AudioPlayer = ({ autoAdvance = true, onEnded }: Props) => {
  const playerRef = useRef<HTMLDivElement>(null);
  const { setPlayerHeight } = usePlayerHeight();
  type PlayerTrack = Track & { coverUrl?: string };
  const [playlist, setPlaylist] = useState<PlayerTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [lastVolume, setLastVolume] = useState<number>(50);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const hlsRef = useRef<Hls | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [nowTrack, setNowTrack] = useState<PlayerTrack | null>(null);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [playlistMap, setPlaylistMap] = useState<Record<string, string>>({});
  const [pulsePlaylistBtn, setPulsePlaylistBtn] = useState(false);

  const currentTrack = nowTrack || null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(1, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const selectIndex = (i: number) => {
    setCurrentIndex(i);
    const t = playlist[i];
    setNowTrack(t ?? null);
  };

  const moveUp = (i: number) => {
    if (i <= 0) return;
    setPlaylist(prev => {
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
    setCurrentIndex(idx => (idx === i ? i - 1 : idx === i - 1 ? i : idx));
    if (playlistId) {
      const order = [...playlist].map(t => playlistMap[t.id]);
      const moved = [order[i - 1], order[i]];
      order[i - 1] = moved[1];
      order[i] = moved[0];
      api.reorderPlaylistItems(playlistId, order.filter(Boolean) as string[]).catch(() => { });
    }
  };

  const moveDown = (i: number) => {
    if (i >= playlist.length - 1) return;
    setPlaylist(prev => {
      const next = [...prev];
      [next[i + 1], next[i]] = [next[i], next[i + 1]];
      return next;
    });
    setCurrentIndex(idx => (idx === i ? i + 1 : idx === i + 1 ? i : idx));
    if (playlistId) {
      const order = [...playlist].map(t => playlistMap[t.id]);
      const moved = [order[i], order[i + 1]];
      order[i] = moved[1];
      order[i + 1] = moved[0];
      api.reorderPlaylistItems(playlistId, order.filter(Boolean) as string[]).catch(() => { });
    }
  };

  const removeAt = (i: number) => {
    setPlaylist(prev => {
      const next = prev.filter((_, idx) => idx !== i);
      const newLen = next.length;
      setCurrentIndex(ci => {
        if (newLen === 0) return 0;
        if (i < ci) return Math.max(ci - 1, 0);
        if (i === ci) return Math.min(ci, newLen - 1);
        return ci;
      });
      if (playlistId) {
        const t = prev[i];
        const itemId = playlistMap[t.id];
        if (itemId) api.removePlaylistItem(playlistId, itemId).catch(() => { });
        const { [t.id]: _, ...rest } = playlistMap;
        setPlaylistMap(rest);
      }
      return next;
    });
  };

  const prevTrack = async () => {
    if (playlist.length > 0) {
      setCurrentIndex(i => {
        const nextIdx = (i - 1 + playlist.length) % playlist.length;
        const t = playlist[nextIdx];
        setNowTrack(t ?? null);
        return nextIdx;
      });
    } else if (autoAdvance) {
      await playRandomFromCatalog();
    }
  };

  const nextTrack = async () => {
    if (playlist.length > 0) {
      setCurrentIndex(i => {
        const nextIdx = ((i + 1) % playlist.length + playlist.length) % playlist.length;
        const t = playlist[nextIdx];
        setNowTrack(t ?? null);
        return nextIdx;
      });
    } else if (autoAdvance) {
      await playRandomFromCatalog();
    }
  };

  const playRandomFromCatalog = async () => {
    try {
      const res = await api.getWorks({ page: 1, limit: 50 });
      const works = (res as any)?.data || [];
      const candidates = works.filter((w: any) => Array.isArray(w.tracks) && w.tracks.length > 0);
      if (candidates.length === 0) return;
      const w = candidates[Math.floor(Math.random() * candidates.length)];
      const track = w.tracks[0];
      setNowTrack({ id: track.id, title: track.title || w.title, duration: track.duration, coverUrl: w.coverUrl } as any);
    } catch { }
  };

  const toggleMute = () => {
    if (!isMuted) {
      setLastVolume(volume || 50);
      setVolume(0);
      setIsMuted(true);
    } else {
      setVolume(lastVolume || 50);
      setIsMuted(false);
    }
  };

  const closePlayer = () => {
    const el = audioRef.current;
    try { el?.pause(); } catch { }
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
    setNowTrack(null);
    if (onEnded) onEnded();
  };

  useEffect(() => {
    const updateHeight = () => {
      if (playerRef.current) {
        setPlayerHeight(playerRef.current.offsetHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      setPlayerHeight(0);
    };
  }, [setPlayerHeight]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !currentTrack) return;
    const load = async () => {
      try {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        const { url } = await api.getStreamingUrl(currentTrack.id);
        if (url && url.includes('.m3u8') && Hls.isSupported()) {
          const hls = new Hls();
          hlsRef.current = hls;
          hls.loadSource(url);
          hls.attachMedia(el);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            el.play().then(() => {
              setIsPlaying(true);
              // Report play event
              const profileId = typeof window !== 'undefined' ? window.localStorage.getItem('activeProfileId') || undefined : undefined;
              api.recordPlaybackEvent({
                trackId: currentTrack.id,
                eventType: 'play',
                positionSeconds: 0,
                profileId
              }).catch(err => console.error('[PLAY EVENT] Error:', err));
            }).catch(() => setIsPlaying(false));
          });
          hls.on(Hls.Events.LEVEL_LOADED, (_evt, data: any) => {
            const d = data?.details;
            if (d && d.live === false && typeof d.totalduration === 'number') {
              setDuration(d.totalduration || 0);
            }
          });
          hls.on(Hls.Events.ERROR, () => {
            setIsPlaying(false);
          });
        } else {
          el.src = url;
          el.play().then(() => {
            setIsPlaying(true);
            // Report play event
            const profileId = typeof window !== 'undefined' ? window.localStorage.getItem('activeProfileId') || undefined : undefined;
            api.recordPlaybackEvent({
              trackId: currentTrack.id,
              eventType: 'play',
              positionSeconds: 0,
              profileId
            }).catch(err => console.error('[PLAY EVENT] Error:', err));
          }).catch(() => setIsPlaying(false));
        }
        setPosition(0);
      } catch (e: any) {
        if (e?.response?.status === 403) {
          toast.error("Assinatura necessária para reproduzir");
        } else {
          toast.error(e?.message || "Falha ao iniciar reprodução");
        }
        setIsPlaying(false);
      }
    };
    load();
  }, [currentTrack?.id]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = (isMuted ? 0 : volume) / 100;
  }, [volume, isMuted]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnded = () => {
      if (autoAdvance) {
        nextTrack();
        return;
      }
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
      setNowTrack(null);
      if (onEnded) onEnded();
    };
    const onTimeUpdate = () => setPosition(el.currentTime || 0);
    const onLoaded = () => setDuration(el.duration || 0);
    const onDurationChange = () => setDuration(el.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    el.addEventListener('ended', onEnded);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('durationchange', onDurationChange);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    return () => {
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('durationchange', onDurationChange);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [autoAdvance, nextTrack, onEnded]);

  useEffect(() => {
    const addTrack = (t: PlayerTrack) => {
      setPlaylist(prev => {
        if (prev.find(p => p.id === t.id)) return prev;
        return [...prev, t];
      });
      setPulsePlaylistBtn(true);
      setTimeout(() => setPulsePlaylistBtn(false), 700);
      const ensureAndAdd = async () => {
        try {
          let plId = playlistId;
          if (!plId) {
            const pid = typeof window !== 'undefined' ? window.localStorage.getItem('activeProfileId') || undefined : undefined;
            const pls = await api.getPlaylists(pid ? { profileId: pid } : undefined);
            plId = pls[0]?.id;
            if (!plId) {
              const created = await api.createPlaylist({ name: 'Minha Playlist', profileId: pid });
              plId = created.id;
            }
            setPlaylistId(plId);
          }
          if (plId) {
            const item = await api.addPlaylistItem(plId, t.id);
            setPlaylistMap(pm => ({ ...pm, [t.id]: item.id }));
          }
        } catch (e: any) {
          toast.error(e?.message || 'Falha ao adicionar à playlist');
        }
      };
      ensureAndAdd();
    };
    const playTrack = (t: PlayerTrack) => {
      setNowTrack(t);
    };
    (window as any).__player_addTrack = addTrack;
    (window as any).__player_playTrack = playTrack;
    const onProfileChange = () => {
      setPlaylist([]);
      setCurrentIndex(0);
      const el = audioRef.current;
      try { el?.pause(); } catch { }
      setNowTrack(null);
      setPlaylistId(null);
      setPlaylistMap({});
      const reload = async () => {
        try {
          const pid = typeof window !== 'undefined' ? window.localStorage.getItem('activeProfileId') || undefined : undefined;
          const pls = await api.getPlaylists(pid ? { profileId: pid } : undefined);
          let plId = pls[0]?.id;
          if (!plId) {
            const created = await api.createPlaylist({ name: 'Minha Playlist', profileId: pid });
            plId = created.id;
          }
          setPlaylistId(plId);
          const items = await api.getPlaylistItems(plId);
          const map: Record<string, string> = {};
          const tracks: PlayerTrack[] = items.map(it => {
            map[it.track.id] = it.id;
            return { ...it.track } as PlayerTrack;
          });
          setPlaylistMap(map);
          setPlaylist(tracks);
          setCurrentIndex(0);
        } catch { }
      };
      reload();
    };
    window.addEventListener('profile-change', onProfileChange as EventListener);
    return () => {
      window.removeEventListener('profile-change', onProfileChange as EventListener);
      if ((window as any).__player_addTrack === addTrack) {
        delete (window as any).__player_addTrack;
      }
      if ((window as any).__player_playTrack === playTrack) {
        delete (window as any).__player_playTrack;
      }
    };
  }, [playlistId]);

  useEffect(() => {
    const load = async () => {
      try {
        const pid = typeof window !== 'undefined' ? window.localStorage.getItem('activeProfileId') || undefined : undefined;
        const pls = await api.getPlaylists(pid ? { profileId: pid } : undefined);
        let plId = pls[0]?.id;
        if (!plId) {
          const created = await api.createPlaylist({ name: 'Minha Playlist', profileId: pid });
          plId = created.id;
        }
        setPlaylistId(plId);
        const items = await api.getPlaylistItems(plId);
        const map: Record<string, string> = {};
        const tracks: PlayerTrack[] = items.map(it => {
          map[it.track.id] = it.id;
          return { ...it.track } as PlayerTrack;
        });
        setPlaylistMap(map);
        setPlaylist(tracks);
        setCurrentIndex(0);
      } catch { }
    };
    load();
  }, []);

  return (
    <div ref={playerRef} className="fixed bottom-0 left-0 right-0 bg-sidebar/80 backdrop-blur-xl border-t border-sidebar-border p-4 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] text-sidebar-foreground">
      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="flex items-center gap-4">
          <Image src={currentTrack?.coverUrl || fallbackAudio} alt={currentTrack ? currentTrack.title : 'Sem faixa'} width={56} height={56} className="w-14 h-14 rounded-md bg-sidebar-accent object-cover border border-sidebar-border" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate text-sidebar-foreground">{currentTrack ? currentTrack.title : 'Sem faixa'}</h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Playlist"
                className={`${pulsePlaylistBtn ? 'bg-yellow-50 text-yellow-600 ring-2 ring-yellow-400 shadow-[0_0_16px_2px_rgba(250,204,21,0.6)] scale-110' : ''} transition-all duration-300 transform`}
              >
                <List className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64" style={{ maxHeight: '16rem', overflowY: 'auto' }}>
              <DropdownMenuLabel>Playlist</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {playlist.length === 0 ? (
                <DropdownMenuItem disabled>Vazia</DropdownMenuItem>
              ) : (
                playlist.map((t, i) => (
                  <DropdownMenuItem key={t.id} className="flex items-center justify-between gap-2">
                    <button className="text-left truncate" onClick={() => selectIndex(i)}>
                      {i === currentIndex ? `▶ ${t.title}` : t.title}
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          moveUp(i);
                        }}
                        aria-label="Mover para cima"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          moveDown(i);
                        }}
                        aria-label="Mover para baixo"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeAt(i);
                        }}
                        aria-label="Remover"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="icon"
            aria-label="Fechar player"
            onClick={closePlayer}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2 my-3">
          <span className="text-xs w-10 text-center">{formatTime(position)}</span>
          <Slider
            value={[position]}
            max={Number.isFinite(duration) ? Math.max(duration, 1) : Math.max(position, 1)}
            step={1}
            className="flex-1"
            disabled={!currentTrack}
            onValueChange={(v) => {
              const val = v[0];
              setPosition(val);
              const el = audioRef.current;
              if (el) el.currentTime = val;
            }}
          />
          <span className="text-xs w-10 text-center">{formatTime(duration || 0)}</span>
        </div>
        <div className="flex justify-center items-center gap-6">
          <SkipBack className={`w-6 h-6 ${currentTrack ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`} onClick={currentTrack ? prevTrack : undefined} />
          <div className={`w-10 h-10 ${currentTrack ? 'bg-primary text-primary-foreground cursor-pointer' : 'bg-muted text-muted-foreground cursor-not-allowed'} rounded-full flex items-center justify-center`} onClick={currentTrack ? async () => {
            const el = audioRef.current;
            if (!el) return;
            if (isPlaying) { el.pause(); setIsPlaying(false); } else { await el.play(); setIsPlaying(true); }
          } : undefined}>
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </div>
          <SkipForward className={`w-6 h-6 ${currentTrack ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`} onClick={currentTrack ? nextTrack : undefined} />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-4 w-full">
        <Image src={currentTrack?.coverUrl || fallbackAudio} alt={currentTrack ? currentTrack.title : 'Sem faixa'} width={64} height={64} className="w-16 h-16 rounded-md bg-sidebar-accent object-cover border border-sidebar-border" />
        <div className="flex-1">
          <h3 className="font-semibold text-sidebar-foreground">{currentTrack ? currentTrack.title : 'Sem faixa'}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-sidebar-foreground/70">{formatTime(position)}</span>
            <Slider
              value={[position]}
              max={Number.isFinite(duration) ? Math.max(duration, 1) : Math.max(position, 1)}
              step={1}
              className="flex-1"
              disabled={!currentTrack}
              onValueChange={(v) => {
                const val = v[0];
                setPosition(val);
                const el = audioRef.current;
                if (el) el.currentTime = val;
              }}
            />
            <span className="text-xs text-sidebar-foreground/70">{formatTime(duration || 0)}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <SkipBack className={`w-6 h-6 ${currentTrack ? 'cursor-pointer text-sidebar-foreground hover:text-sidebar-primary' : 'opacity-50 cursor-not-allowed text-sidebar-foreground/50'}`} onClick={currentTrack ? prevTrack : undefined} />
          <div className={`w-10 h-10 ${currentTrack ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 cursor-pointer' : 'bg-sidebar-accent text-sidebar-foreground/50 cursor-not-allowed'} rounded-full flex items-center justify-center transition-colors`} onClick={currentTrack ? async () => {
            const el = audioRef.current;
            if (!el) return;
            if (isPlaying) { el.pause(); setIsPlaying(false); } else { await el.play(); setIsPlaying(true); }
          } : undefined}>
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </div>
          <SkipForward className={`w-6 h-6 ${currentTrack ? 'cursor-pointer text-sidebar-foreground hover:text-sidebar-primary' : 'opacity-50 cursor-not-allowed text-sidebar-foreground/50'}`} onClick={currentTrack ? nextTrack : undefined} />
        </div>
        <div className="flex items-center gap-2 w-28">
          {isMuted || volume === 0 ? (
            <VolumeX className="w-5 h-5 cursor-pointer text-sidebar-foreground hover:text-sidebar-primary" onClick={toggleMute} />
          ) : (
            <Volume2 className="w-5 h-5 cursor-pointer text-sidebar-foreground hover:text-sidebar-primary" onClick={toggleMute} />
          )}
          <Slider
            value={[volume]}
            max={100}
            step={1}
            onValueChange={(v) => {
              const val = v[0];
              setVolume(val);
              if (val === 0) setIsMuted(true);
              else setIsMuted(false);
            }}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Playlist"
              className={`${pulsePlaylistBtn ? 'bg-yellow-50 text-yellow-600 ring-2 ring-yellow-400 shadow-[0_0_16px_2px_rgba(250,204,21,0.6)] scale-110' : 'bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'} transition-all duration-300 transform`}
            >
              <List className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72" style={{ maxHeight: '20rem', overflowY: 'auto' }}>
            <DropdownMenuLabel>Playlist</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {playlist.length === 0 ? (
              <DropdownMenuItem disabled>Vazia</DropdownMenuItem>
            ) : (
              playlist.map((t, i) => (
                <DropdownMenuItem key={t.id} className="flex items-center justify-between gap-2">
                  <button className="text-left truncate" onClick={() => selectIndex(i)}>
                    {i === currentIndex ? `▶ ${t.title}` : t.title}
                  </button>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        moveUp(i);
                      }}
                      aria-label="Mover para cima"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        moveDown(i);
                      }}
                      aria-label="Mover para baixo"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeAt(i);
                      }}
                      aria-label="Remover"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="icon"
          aria-label="Fechar player"
          className="bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={closePlayer}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
      <audio ref={audioRef} hidden preload="metadata" />
    </div>
  );
};

export default AudioPlayer;
