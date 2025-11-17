"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music, BookOpen, Tv, Star, Play, ListPlus } from "lucide-react";
import fallbackAudio from "@/assets/fallback-audio.jpg";
import type { Work, Track } from "@/services/api";

interface Props {
  work: Work;
  onToggleFavorite: (workId: string) => void;
  onPlay: (track: Track, work: Work) => void;
  onAddToPlaylist: (track: Track, work: Work) => void;
  showTags?: boolean;
  showAge?: boolean;
}

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

export default function ContentCard({ work, onToggleFavorite, onPlay, onAddToPlaylist, showTags = true, showAge = true }: Props) {
  const firstTrack = (work.tracks || [])[0] as Track | undefined;
  const ageLabel = work.recommendedAgeLabel || (typeof work.recommendedMinMonths === "number" && typeof work.recommendedMaxMonths === "number" ? `${work.recommendedMinMonths}-${work.recommendedMaxMonths}m` : "-");

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="relative">
        <img
          src={work.coverUrl || (fallbackAudio as unknown as string)}
          alt={work.title}
          className="w-full h-52 object-cover bg-muted"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 rounded-full"
          onClick={() => onToggleFavorite(work.id)}
        >
          <Star
            className={`w-5 h-5 ${work.isFavorite ? "text-yellow-400" : "text-white"}`}
            fill={work.isFavorite ? "currentColor" : "none"}
          />
        </Button>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          {getIcon(work.type)}
          <span className="capitalize">{work.type}</span>
        </div>
        <h3 className="font-semibold text-lg flex-grow">{work.title}</h3>
        {showTags && (
          <div className="flex flex-wrap gap-2 mt-2">
            {(work.tags || []).map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
        <div className="mt-4 space-y-2">
          {showAge && (
            <span className="text-xs text-muted-foreground">Idade: {ageLabel}</span>
          )}
          <Button
            className="w-full"
            onClick={() => {
              if (!firstTrack) return;
              onPlay(firstTrack, work);
            }}
            disabled={!firstTrack}
          >
            <Play className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              if (!firstTrack) return;
              onAddToPlaylist(firstTrack, work);
            }}
            disabled={!firstTrack}
          >
            <ListPlus className="w-4 h-4" />
            Adicionar à playlist
          </Button>
        </div>
      </div>
    </Card>
  );
}