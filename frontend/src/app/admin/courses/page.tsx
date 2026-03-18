"use client";

import { useEffect, useState } from "react";
import { api, AdminCourse, Plan } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState<"rascunho" | "publicado">("rascunho");
  const [planIds, setPlanIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const loadCourses = async () => {
    try {
      const [coursesData, plansData] = await Promise.all([
        api.adminGetCourses(),
        api.adminGetPlans(),
      ]);
      setCourses(coursesData);
      setPlans(plansData);
    } catch (err) {
      console.error("Erro ao carregar cursos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreate = async () => {
    if (!titulo.trim()) return;
    setSaving(true);
    try {
      const created = await api.adminCreateCourse({ titulo, descricao, status });
      if (planIds.length > 0) {
        await api.adminUpdateCoursePlanAccess(created.id, planIds);
      }
      setDialogOpen(false);
      setTitulo("");
      setDescricao("");
      setStatus("rascunho");
      setPlanIds([]);
      await loadCourses();
    } catch (err) {
      console.error("Erro ao criar curso:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este curso?")) return;
    try {
      await api.adminDeleteCourse(id);
      await loadCourses();
    } catch (err) {
      console.error("Erro ao excluir curso:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Cursos</h1>
          <p className="text-muted-foreground">Gerencie os cursos da plataforma</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Curso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Curso</DialogTitle>
              <DialogDescription>Preencha as informações do curso</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Introdução ao React"
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Breve descrição do curso..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="publicado">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Acesso por plano</Label>
                <div className="grid gap-2 max-h-28 overflow-auto border rounded-md p-2">
                  {plans.map((plan) => (
                    <label key={plan.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={planIds.includes(plan.id)}
                        onChange={() =>
                          setPlanIds((current) =>
                            current.includes(plan.id)
                              ? current.filter((id) => id !== plan.id)
                              : [...current, plan.id],
                          )
                        }
                      />
                      <span>{plan.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={saving || !titulo.trim()}>
                {saving ? "Criando..." : "Criar Curso"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum curso criado</h3>
            <p className="text-muted-foreground mb-4">Crie seu primeiro curso para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{course.titulo}</CardTitle>
                  <Badge variant={course.status === "publicado" ? "default" : "secondary"}>
                    {course.status === "publicado" ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {course.descricao || "Sem descrição"}
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/admin/courses/${course.id}`}>
                      <Pencil className="mr-1 h-3 w-3" /> Editar
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(course.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
