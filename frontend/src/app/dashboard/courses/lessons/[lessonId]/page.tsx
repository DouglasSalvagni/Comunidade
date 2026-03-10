"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, LessonDetail } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import Hls from "hls.js";

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    api
      .getLessonDetail(lessonId)
      .then(setLesson)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lessonId]);

  // Setup HLS player
  useEffect(() => {
    if (!lesson?.videoUrl || !videoRef.current) return;
    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        maxBufferLength: 30,
      });
      hls.loadSource(lesson.videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (lesson.tempoAssistido > 0) {
          video.currentTime = lesson.tempoAssistido;
        }
      });
      hlsRef.current = hls;
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = lesson.videoUrl;
      video.addEventListener("loadedmetadata", () => {
        if (lesson.tempoAssistido > 0) {
          video.currentTime = lesson.tempoAssistido;
        }
      });
    }
  }, [lesson?.videoUrl]);

  // Save progress periodically
  const saveProgress = useCallback(
    async (concluida?: boolean) => {
      if (!lessonId || !videoRef.current) return;
      const tempoAssistido = Math.floor(videoRef.current.currentTime);
      try {
        await api.updateLessonProgress(lessonId, {
          tempoAssistido,
          ...(concluida !== undefined ? { concluida } : {}),
        });
      } catch {}
    },
    [lessonId]
  );

  useEffect(() => {
    const interval = setInterval(() => saveProgress(), 15000);
    return () => clearInterval(interval);
  }, [saveProgress]);

  const handleVideoEnd = async () => {
    await saveProgress(true);
    setLesson((prev) => (prev ? { ...prev, concluida: true } : prev));
  };

  const handleMarkComplete = async () => {
    if (!lessonId) return;
    try {
      await api.updateLessonProgress(lessonId, { concluida: true });
      setLesson((prev) => (prev ? { ...prev, concluida: true } : prev));
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lesson) {
    return <div className="text-center py-20 text-muted-foreground">Aula não encontrada</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        <button onClick={() => router.push(`/dashboard/courses/${lesson.cursoId}`)} className="hover:underline">
          {lesson.cursoTitulo}
        </button>
        <span className="mx-2">›</span>
        <span>{lesson.moduloTitulo}</span>
      </div>

      <h1 className="text-2xl font-bold">{lesson.titulo}</h1>

      {/* Video Player */}
      {lesson.videoUrl && (
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            controls
            className="w-full h-full"
            onEnded={handleVideoEnd}
            onPause={() => saveProgress()}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {lesson.aulaAnterior && (
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/courses/lessons/${lesson.aulaAnterior!.id}`)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
            </Button>
          )}
          {lesson.proximaAula && (
            <Button
              onClick={() => router.push(`/dashboard/courses/lessons/${lesson.proximaAula!.id}`)}
            >
              Próxima <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
        {lesson.concluida ? (
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <CheckCircle2 className="h-5 w-5" /> Aula concluída
          </div>
        ) : (
          <Button variant="outline" onClick={handleMarkComplete}>
            Marcar como concluída
          </Button>
        )}
      </div>

      {/* Lesson content (markdown text) */}
      {lesson.conteudoTexto && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Material de Apoio</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: lesson.conteudoTexto }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
