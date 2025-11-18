"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music, BookOpen, Tv, Play, ListPlus } from "lucide-react";
import Image from "next/image";
import fallbackAudio from "@/assets/fallback-audio.jpg";
import { api, Work, Track } from "@/services/api";
import ContentCard from "@/components/ContentCard";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardPage = () => {
  const [favorites, setFavorites] = useState<Work[]>([]);
  const [suggested, setSuggested] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const pid = typeof window !== 'undefined' ? window.localStorage.getItem('activeProfileId') || undefined : undefined;
        const fav = await api.getFavorites({ profileId: pid, page: 1, limit: 12 });
        setFavorites(Array.isArray((fav as any)) ? (fav as any) : (Array.isArray((fav as any)?.data) ? (fav as any).data : []));
        const sug = await api.getSuggestedWorks({ profileId: pid, page: 1, limit: 12 });
        setSuggested(Array.isArray((sug as any)) ? (sug as any) : (Array.isArray((sug as any)?.data) ? (sug as any).data : []));
      } catch (e: any) { toast.error(e?.message || "Falha ao carregar dashboard"); }
      setLoading(false);
    };
    load();
    const onProfileChange = () => load();
    if (typeof window !== 'undefined') window.addEventListener('profile-change', onProfileChange as EventListener);
    return () => { if (typeof window !== 'undefined') window.removeEventListener('profile-change', onProfileChange as EventListener); };
  }, []);

  const handleFavoriteToggle = async (workId: string) => {
    try {
      const pid = typeof window !== 'undefined' ? window.localStorage.getItem('activeProfileId') || undefined : undefined;
      if (!pid) {
        toast.error("Você precisa selecionar ou criar um perfil para favoritar.");
        return;
      }
      const res = await api.toggleFavorite(workId);
      const isFav = (res as any)?.isFavorite ?? false;
      setFavorites(prev => prev.map(w => w.id === workId ? { ...w, isFavorite: isFav } : w));
      setSuggested(prev => prev.map(w => w.id === workId ? { ...w, isFavorite: isFav } : w));
    } catch (e: any) {
      const msg = e?.message || "Falha ao marcar como favorito";
      if (e?.statusCode === 403 || /Profile does not belong/i.test(String(msg))) {
        toast.error("Você precisa usar um perfil que pertença à sua conta.");
      } else {
        toast.error(msg);
      }
    }
  };

  const handlePlay = (track: Track, work: Work) => {
    const fn = (window as any).__player_playTrack;
    if (typeof fn === 'function') {
      fn({ id: track.id, title: track.title || work.title, duration: track.duration, coverUrl: work.coverUrl });
    } else {
      toast.error("Player não inicializado");
    }
  };

  const handleAddToPlaylist = (track: Track, work: Work) => {
    const fn = (window as any).__player_addTrack;
    if (typeof fn === 'function') {
      fn({ id: track.id, title: track.title || work.title, duration: track.duration, coverUrl: work.coverUrl });
    } else {
      toast.error("Player não inicializado");
    }
  };

  const getIcon = (type: Work["type"]) => {
    switch (type) {
      case "music":
        return <Music className="w-4 h-4" />;
      case "audiobook":
        return <BookOpen className="w-4 h-4" />;
      case "series":
        return <Tv className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bem-vindo à sua Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Aqui estão seus itens favoritos e sugestões com base no perfil ativo.
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Favoritos</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Card key={`fav-skeleton-${idx}`} className="overflow-hidden">
                <Skeleton className="w-full h-40" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-5 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-8 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((item) => (
              <ContentCard
                key={item.id}
                work={item}
                onToggleFavorite={handleFavoriteToggle}
                onPlay={handlePlay}
                onAddToPlaylist={handleAddToPlaylist}
              />
            ))}
        </div>
        ) : (
          <p className="text-muted-foreground">
            Você ainda não marcou nenhum item como favorito. Explore o catálogo!
          </p>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Sugestões para o perfil</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Card key={`sug-skeleton-${idx}`} className="overflow-hidden">
                <Skeleton className="w-full h-40" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-5 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-8 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : suggested.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {suggested.map((item) => (
              <ContentCard
                key={`s-${item.id}`}
                work={item}
                onToggleFavorite={handleFavoriteToggle}
                onPlay={handlePlay}
                onAddToPlaylist={handleAddToPlaylist}
              />
            ))}
        </div>
        ) : (
          <p className="text-muted-foreground">
            Nenhuma sugestão disponível para o perfil selecionado.
          </p>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
