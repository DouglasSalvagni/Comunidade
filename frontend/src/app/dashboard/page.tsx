"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music, BookOpen, Tv, Play, ListPlus } from "lucide-react";
import Image from "next/image";
import fallbackAudio from "@/assets/fallback-audio.jpg";
import { api, Work } from "@/services/api";
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
              <Card key={item.id} className="overflow-hidden flex flex-col">
                <Image
                  src={(item.coverUrl || '').trim() || fallbackAudio}
                  alt={item.title}
                  width={640}
                  height={160}
                  className="w-full h-40 object-cover bg-muted"
                />
                <div className="p-4 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    {getIcon(item.type)}
                    <span className="capitalize">{item.type}</span>
                  </div>
                  <h3 className="font-semibold text-lg flex-grow">{item.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(item.tags || []).map((tag) => (
                      <Badge key={tag.id} variant="secondary">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xs text-muted-foreground">
                      {item.recommendedAgeLabel || " "}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button size="icon" onClick={() => {
                      const track = (item.tracks || [])[0];
                      if (!track) return;
                      const fn = (window as any).__player_playTrack;
                      if (typeof fn === 'function') {
                          fn({ id: track.id, title: track.title || item.title, duration: track.duration, coverUrl: item.coverUrl });
                      } else {
                          toast.error("Player não inicializado");
                      }
                    }}>
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <Button className="w-full" size="sm" variant="outline" onClick={() => {
                    const track = (item.tracks || [])[0];
                    if (!track) return;
                    const fn = (window as any).__player_addTrack;
                    if (typeof fn === 'function') {
                        fn({ id: track.id, title: track.title || item.title, duration: track.duration, coverUrl: item.coverUrl });
                    } else {
                        toast.error("Player não inicializado");
                    }
                  }}>
                    <ListPlus className="w-4 h-4" />
                    Adicionar à playlist
                  </Button>
                </div>
              </div>
            </Card>
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
              <Card key={`s-${item.id}`} className="overflow-hidden flex flex-col">
                <Image
                  src={(item.coverUrl || '').trim() || fallbackAudio}
                  alt={item.title}
                  width={640}
                  height={160}
                  className="w-full h-40 object-cover bg-muted"
                />
                <div className="p-4 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    {getIcon(item.type)}
                    <span className="capitalize">{item.type}</span>
                  </div>
                  <h3 className="font-semibold text-lg flex-grow">{item.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(item.tags || []).map((tag) => (
                      <Badge key={tag.id} variant="secondary">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xs text-muted-foreground">
                      {item.recommendedAgeLabel || " "}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button size="icon" onClick={() => {
                      const track = (item.tracks || [])[0];
                      if (!track) return;
                      const fn = (window as any).__player_playTrack;
                      if (typeof fn === 'function') {
                          fn({ id: track.id, title: track.title || item.title, duration: track.duration, coverUrl: item.coverUrl });
                      } else {
                          toast.error("Player não inicializado");
                      }
                    }}>
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <Button className="w-full" size="sm" variant="outline" onClick={() => {
                    const track = (item.tracks || [])[0];
                    if (!track) return;
                    const fn = (window as any).__player_addTrack;
                    if (typeof fn === 'function') {
                        fn({ id: track.id, title: track.title || item.title, duration: track.duration, coverUrl: item.coverUrl });
                    } else {
                        toast.error("Player não inicializado");
                    }
                  }}>
                    <ListPlus className="w-4 h-4" />
                    Adicionar à playlist
                  </Button>
                </div>
              </div>
            </Card>
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
