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
  const [completed, setCompleted] = useState(false);

  // O ref é declarado aqui e passado diretamente ao <video> — sem intermediários
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    api
      .getLessonDetail(lessonId)
      .then((data) => {
        setLesson(data);
        setCompleted(data.concluida);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lessonId]);

  // Monta o player HLS (ou MP4 nativo) assim que temos a URL e o ref
  useEffect(() => {
    const video = videoRef.current;
    const src = lesson?.videoUrl;
    if (!video || !src) return;

    // Destroy instância anterior
    hlsRef.current?.destroy();
    hlsRef.current = null;

    const isHls = src.includes(".m3u8");
    const startTime = lesson?.tempoAssistido ?? 0;

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, maxBufferLength: 30 });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (startTime > 0) video.currentTime = startTime;
      });
      hlsRef.current = hls;
    } else if (isHls && video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari — HLS nativo
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        if (startTime > 0) video.currentTime = startTime;
      });
    } else {
      // MP4 cru (fallback MVP)
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        if (startTime > 0) video.currentTime = startTime;
      });
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [lesson?.videoUrl]);

  // Salva progresso — lê currentTime diretamente do ref
  const saveProgress = useCallback(
    async (concluida?: boolean) => {
      if (!lessonId) return;
      const tempoAssistido = Math.floor(videoRef.current?.currentTime ?? 0);
      try {
        await api.updateLessonProgress(lessonId, {
          tempoAssistido,
          ...(concluida !== undefined ? { concluida } : {}),
        });
        if (concluida === true) setCompleted(true);
      } catch (err) {
        console.error("Erro ao salvar progresso:", err);
      }
    },
    [lessonId]
  );

  // Auto-save a cada 15 segundos
  useEffect(() => {
    const interval = setInterval(() => saveProgress(), 15_000);
    return () => clearInterval(interval);
  }, [saveProgress]);

  const handleVideoEnded = () => saveProgress(true);
  const handleVideoPause = () => saveProgress();

  const handleMarkComplete = () => saveProgress(true);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Aula não encontrada
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground flex items-center gap-1">
        <button
          onClick={() => router.push(`/dashboard/courses/${lesson.cursoId}`)}
          className="hover:underline hover:text-foreground transition-colors"
        >
          {lesson.cursoTitulo}
        </button>
        <span>›</span>
        <span>{lesson.moduloTitulo}</span>
      </div>

      <h1 className="text-2xl font-bold">{lesson.titulo}</h1>

      {/* Video player */}
      {lesson.videoUrl ? (
        <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-lg">
          <video
            ref={videoRef}
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full"
            onEnded={handleVideoEnded}
            onPause={handleVideoPause}
          />
        </div>
      ) : lesson.status === "pendente" ? (
        <div className="aspect-video w-full bg-muted rounded-xl flex items-center justify-center text-muted-foreground text-sm">
          Vídeo em processamento...
        </div>
      ) : null}

      {/* Navegação + Concluir */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {lesson.aulaAnterior && (
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/dashboard/courses/lessons/${lesson.aulaAnterior!.id}`)
              }
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
            </Button>
          )}
          {lesson.proximaAula && (
            <Button
              onClick={() =>
                router.push(`/dashboard/courses/lessons/${lesson.proximaAula!.id}`)
              }
            >
              Próxima <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>

        {completed ? (
          <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
            <CheckCircle2 className="h-5 w-5" /> Aula concluída
          </div>
        ) : (
          <Button variant="outline" onClick={handleMarkComplete}>
            Marcar como concluída
          </Button>
        )}
      </div>

      {/* Material de apoio */}
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
