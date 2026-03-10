"use client";

import { useEffect, useState } from "react";
import { api, CourseListItem } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen } from "lucide-react";
import Link from "next/link";

export default function DashboardCoursesPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getCourses()
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meus Cursos</h1>
        <p className="text-muted-foreground">Acesse os cursos disponíveis da plataforma</p>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum curso disponível</h3>
            <p className="text-muted-foreground">Novos cursos serão adicionados em breve</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/dashboard/courses/${course.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                {course.thumbnailUrl && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-2">{course.titulo}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {course.descricao || ""}
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{course.aulasCompletas} de {course.totalAulas} aulas</span>
                      <span>{Math.round(course.progresso)}%</span>
                    </div>
                    <Progress value={course.progresso} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
