"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, CourseListItem } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, PlayCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function DashboardCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isCoursesEnabled = process.env.NEXT_PUBLIC_ENABLE_COURSES_FEATURE !== 'false';
    if (!isCoursesEnabled) {
      router.push('/dashboard');
      return;
    }

    api
      .getCourses()
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            Meus Cursos
          </h1>
          <p className="text-muted-foreground text-lg">
            Acesse os cursos disponíveis da plataforma
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden border-none shadow-sm bg-card/50">
              <Skeleton className="aspect-video w-full rounded-b-none" />
              <CardHeader className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-2 w-full mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/10">
          <CardContent className="py-24 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhum curso disponível</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Novos cursos serão adicionados em breve. Fique atento às novidades!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/dashboard/courses/${course.id}`} className="group block h-full">
              <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/50 group-hover:-translate-y-1 flex flex-col">
                <div className="aspect-video w-full overflow-hidden relative bg-muted">
                  {course.thumbnailUrl ? (
                    <img
                      src={course.thumbnailUrl}
                      alt={course.titulo}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/20">
                      <BookOpen className="w-12 h-12 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <Button variant="secondary" className="rounded-full gap-2">
                      <PlayCircle className="w-4 h-4" /> Continuar
                    </Button>
                  </div>
                </div>
                
                <CardHeader className="pb-3 flex-none">
                  <CardTitle className="text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {course.titulo}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col justify-between gap-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.descricao || "Sem descrição disponível."}
                  </p>
                  
                  <div className="space-y-2 mt-auto pt-2">
                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.aulasCompletas}/{course.totalAulas} aulas
                      </span>
                      <span className={course.progresso >= 100 ? "text-green-600" : "text-primary"}>
                        {Math.round(course.progresso)}%
                      </span>
                    </div>
                    <Progress 
                      value={course.progresso} 
                      className="h-2 bg-secondary" 
                      indicatorClassName={course.progresso >= 100 ? "bg-green-600" : ""}
                    />
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
