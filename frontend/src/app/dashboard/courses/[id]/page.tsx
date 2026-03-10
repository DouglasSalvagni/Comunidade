"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, CourseDetail } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, CheckCircle2, Circle, PlayCircle } from "lucide-react";
import Link from "next/link";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    api
      .getCourseDetail(id)
      .then((data) => {
        setCourse(data);
        // Auto-expand all modules
        setExpandedModules(new Set(data.modulos.map((m) => m.id)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return <div className="text-center py-20 text-muted-foreground">Curso não encontrado</div>;
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">{course.titulo}</h1>
        {course.descricao && (
          <p className="text-muted-foreground mt-1">{course.descricao}</p>
        )}
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{course.aulasCompletas} de {course.totalAulas} aulas concluídas</span>
            <span>{Math.round(course.progresso)}%</span>
          </div>
          <Progress value={course.progresso} className="h-2" />
        </div>
      </div>

      <div className="space-y-3">
        {course.modulos.map((modulo) => (
          <Card key={modulo.id}>
            <CardHeader
              className="cursor-pointer py-3 px-4"
              onClick={() => toggleModule(modulo.id)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {modulo.titulo}
                </CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <span>{modulo.aulas.length} aulas</span>
                  {expandedModules.has(modulo.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CardHeader>
            {expandedModules.has(modulo.id) && (
              <CardContent className="pt-0 px-4 pb-3">
                <div className="divide-y">
                  {modulo.aulas.map((aula) => (
                    <Link
                      key={aula.id}
                      href={`/dashboard/courses/lessons/${aula.id}`}
                      className="flex items-center gap-3 py-2 px-2 hover:bg-muted/50 rounded-md transition-colors"
                    >
                      {aula.concluida ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <PlayCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <span className="flex-1 text-sm">{aula.titulo}</span>
                      {aula.duracaoSegundos > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(aula.duracaoSegundos)}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
