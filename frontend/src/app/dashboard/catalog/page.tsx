"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Music, BookOpen, Tv, Filter, Star, Play, ListPlus } from "lucide-react";
import fallbackAudio from "@/assets/fallback-audio.jpg";
import { api, Work, Tag } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const CatalogPage = () => {
  const [works, setWorks] = useState<Work[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [minAge, setMinAge] = useState<string>("");
  const [maxAge, setMaxAge] = useState<string>("");
  const [ageUnit, setAgeUnit] = useState<"years" | "months">("years");
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileKey, setProfileKey] = useState(0);

  const computedTags: Tag[] = useMemo(() => {
    const map = new Map<string, Tag>();
    works.forEach((w) => (w.tags || []).forEach((t) => { if (!map.has(t.id)) map.set(t.id, t); }));
    return Array.from(map.values());
  }, [works]);

  useEffect(() => {
    const fetchWorks = async () => {
      setLoading(true);
      try {
        const selectedTagNames = tagFilters
          .map((id) => computedTags.find((t) => t.id === id)?.name)
          .filter((n): n is string => !!n);
        const params: any = { page: 1, limit: 50 };
        const pid = typeof window !== 'undefined' ? window.localStorage.getItem('activeProfileId') || undefined : undefined;
        if (pid) params.profileId = pid;
        if (searchTerm.trim().length > 0) params.search = searchTerm.trim();
        if (typeFilter !== "all") params.type = typeFilter;
        const minNum = parseFloat(minAge);
        const maxNum = parseFloat(maxAge);
        const hasMin = !Number.isNaN(minNum);
        const hasMax = !Number.isNaN(maxNum);
        if (hasMin && hasMax) {
          const toMonths = (v: number) => (ageUnit === "years" ? Math.round(v * 12) : Math.round(v));
          params.minMonths = toMonths(minNum);
          params.maxMonths = toMonths(maxNum);
        }
        if (selectedTagNames.length > 0) params.tags = selectedTagNames.join(",");
        const r = await api.getWorks(params);
        setWorks(Array.isArray((r as any)?.data) ? (r as any).data : (Array.isArray(r as any) ? (r as any) : []));
      } catch {}
      setLoading(false);
    };
    fetchWorks();
  }, [searchTerm, typeFilter, tagFilters, minAge, maxAge, ageUnit, profileKey]);

  useEffect(() => {
    const onProfileChange = () => setProfileKey(k => k + 1);
    if (typeof window !== 'undefined') {
      window.addEventListener('profile-change', onProfileChange as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('profile-change', onProfileChange as EventListener);
      }
    };
  }, []);

  const handleFavoriteToggle = async (workId: string) => {
    try {
      const pid = typeof window !== 'undefined' ? window.localStorage.getItem('activeProfileId') || undefined : undefined;
      const res = await api.toggleFavorite(workId);
      const isFav = (res as any)?.isFavorite ?? false;
      setWorks((prevWorks) => prevWorks.map((work) => work.id === workId ? { ...work, isFavorite: isFav } : work));
    } catch {}
  };

  const filteredWorks = works;

  

  const handleTagChange = (tagId: string) => {
    setTagFilters((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
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

  const Filters = () => (
    <div className="space-y-4">
      <div>
        <Label>Tipo</Label>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="music">Música</SelectItem>
            <SelectItem value="audiobook">Audiobook</SelectItem>
            <SelectItem value="series">Série</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Intervalo de idade</Label>
        <div className="space-y-2">
          <Select value={ageUnit} onValueChange={(v) => setAgeUnit(v as any)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="years">anos</SelectItem>
              <SelectItem value="months">meses</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input placeholder="mín" value={minAge} onChange={(e) => setMinAge(e.target.value)} className="flex-1" />
            <span>-</span>
            <Input placeholder="máx" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} className="flex-1" />
          </div>
        </div>
      </div>
      <div>
        <Label>Tags</Label>
        <div className="space-y-2">
          {computedTags.map((tag) => (
            <div key={tag.id} className="flex items-center space-x-2">
              <Checkbox
                id={`tag-${tag.id}`}
                checked={tagFilters.includes(tag.id)}
                onCheckedChange={() => handleTagChange(tag.id)}
              />
              <Label htmlFor={`tag-${tag.id}`}>{tag.name}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Catálogo de Conteúdo</h1>
        <p className="text-muted-foreground">
          Explore e gerencie as músicas e audiobooks.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="hidden md:block w-full md:w-52 md:flex-shrink-0 space-y-6">
          <h3 className="font-semibold text-lg">Filtros</h3>
          <Filters />
        </div>

        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por título..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  <div className="p-4">
                    <Filters />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading && (
              Array.from({ length: 8 }).map((_, idx) => (
                <Card key={`skeleton-${idx}`} className="overflow-hidden">
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
              ))
            )}
            {!loading && filteredWorks.map((item) => (
              <Card key={item.id} className="overflow-hidden flex flex-col">
                <div className="relative">
                  <img
                    src={item.coverUrl || (fallbackAudio as unknown as string)}
                    alt={item.title}
                    className="w-full h-40 object-cover bg-muted"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 rounded-full"
                    onClick={() => handleFavoriteToggle(item.id)}
                  >
                    <Star
                      className={`w-5 h-5 ${item.isFavorite ? "text-yellow-400" : "text-white"}`}
                      fill={item.isFavorite ? "currentColor" : "none"}
                    />
                  </Button>
                </div>
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
                      Idade: {item.recommendedAgeLabel || (typeof item.recommendedMinMonths === "number" && typeof item.recommendedMaxMonths === "number" ? `${item.recommendedMinMonths}-${item.recommendedMaxMonths}m` : "-")}
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
                      <Button variant="outline" size="sm" onClick={() => {
                        const track = (item.tracks || [])[0];
                        if (!track) return;
                        const fn = (window as any).__player_addTrack;
                        if (typeof fn === 'function') {
                          fn({ id: track.id, title: track.title || item.title, duration: track.duration, coverUrl: item.coverUrl });
                        } else {
                          toast.error("Player não inicializado");
                        }
                      }}>
                        Adicionar à playlist
                      </Button>
                    </div>
                  </div>
                  
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;
