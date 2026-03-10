"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, AdminCourseDetail } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Upload,
  Video,
} from "lucide-react";
import Link from "next/link";

export default function AdminCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<AdminCourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Course edit fields
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState<"rascunho" | "publicado">("rascunho");

  // New module dialog
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [newModuleTitulo, setNewModuleTitulo] = useState("");

  // New lesson dialog
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [lessonModuleId, setLessonModuleId] = useState<string>("");
  const [newLessonTitulo, setNewLessonTitulo] = useState("");

  const loadCourse = async () => {
    if (!id) return;
    try {
      const data = await api.adminGetCourse(id);
      setCourse(data);
      setTitulo(data.titulo);
      setDescricao(data.descricao || "");
      setStatus(data.status);
      setExpandedModules(new Set(data.modulos.map((m) => m.id)));
    } catch (err) {
      console.error("Erro ao carregar curso:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [id]);

  const handleSaveCourse = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await api.adminUpdateCourse(id, { titulo, descricao, status });
      await loadCourse();
    } catch (err) {
      console.error("Erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddModule = async () => {
    if (!id || !newModuleTitulo.trim()) return;
    try {
      await api.adminCreateModule(id, { titulo: newModuleTitulo });
      setModuleDialogOpen(false);
      setNewModuleTitulo("");
      await loadCourse();
    } catch (err) {
      console.error("Erro ao criar módulo:", err);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!id || !confirm("Excluir este módulo?")) return;
    try {
      await api.adminDeleteModule(id, moduleId);
      await loadCourse();
    } catch (err) {
      console.error("Erro ao excluir módulo:", err);
    }
  };

  const handleAddLesson = async () => {
    if (!id || !lessonModuleId || !newLessonTitulo.trim()) return;
    try {
      await api.adminCreateLesson(id, lessonModuleId, { titulo: newLessonTitulo });
      setLessonDialogOpen(false);
      setNewLessonTitulo("");
      setLessonModuleId("");
      await loadCourse();
    } catch (err) {
      console.error("Erro ao criar aula:", err);
    }
  };

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    if (!id || !confirm("Excluir esta aula?")) return;
    try {
      await api.adminDeleteLesson(id, moduleId, lessonId);
      await loadCourse();
    } catch (err) {
      console.error("Erro ao excluir aula:", err);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  // Upload video
  const handleUploadVideo = async (moduleId: string, lessonId: string) => {
    if (!id) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        // Get signed URL from backend
        const { uploadUrl, key } = await api.adminGetUploadUrl(id, file.name);

        // Upload directly to S3
        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        // Update lesson with video key
        await api.adminUpdateLesson(id, moduleId, lessonId, { videoKey: key });
        await loadCourse();
      } catch (err) {
        console.error("Erro no upload:", err);
        alert("Erro ao fazer upload do vídeo.");
      }
    };
    input.click();
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

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Course info edit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Informações do Curso</span>
            <Badge variant={status === "publicado" ? "default" : "secondary"}>
              {status === "publicado" ? "Publicado" : "Rascunho"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="edit-titulo">Título</Label>
            <Input id="edit-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-descricao">Descrição</Label>
            <Textarea
              id="edit-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="edit-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="publicado">Publicado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSaveCourse} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
          </Button>
        </CardContent>
      </Card>

      {/* Modules & Lessons */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Módulos & Aulas</h2>
        <div className="flex gap-2">
          <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="mr-1 h-3 w-3" /> Módulo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Módulo</DialogTitle>
                <DialogDescription>Adicione um módulo ao curso</DialogDescription>
              </DialogHeader>
              <div>
                <Label>Título do Módulo</Label>
                <Input
                  value={newModuleTitulo}
                  onChange={(e) => setNewModuleTitulo(e.target.value)}
                  placeholder="Ex: Módulo 1 - Fundamentos"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddModule} disabled={!newModuleTitulo.trim()}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-3 w-3" /> Aula
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Aula</DialogTitle>
                <DialogDescription>Adicione uma aula a um módulo</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Módulo</Label>
                  <Select value={lessonModuleId} onValueChange={setLessonModuleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o módulo" />
                    </SelectTrigger>
                    <SelectContent>
                      {course.modulos.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Título da Aula</Label>
                  <Input
                    value={newLessonTitulo}
                    onChange={(e) => setNewLessonTitulo(e.target.value)}
                    placeholder="Ex: Aula 1 - Introdução"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddLesson} disabled={!lessonModuleId || !newLessonTitulo.trim()}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {course.modulos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhum módulo criado. Clique em &ldquo;+ Módulo&rdquo; para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {course.modulos
            .sort((a, b) => a.ordem - b.ordem)
            .map((modulo) => (
              <Card key={modulo.id}>
                <CardHeader
                  className="cursor-pointer py-3 px-4"
                  onClick={() => toggleModule(modulo.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">{modulo.titulo}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {modulo.aulas.length} {modulo.aulas.length === 1 ? "aula" : "aulas"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteModule(modulo.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
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
                    {modulo.aulas.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma aula neste módulo
                      </p>
                    ) : (
                      <div className="divide-y">
                        {modulo.aulas
                          .sort((a, b) => a.ordem - b.ordem)
                          .map((aula) => (
                            <div
                              key={aula.id}
                              className="flex items-center gap-3 py-2 px-2"
                            >
                              <GripVertical className="h-3 w-3 text-muted-foreground" />
                              <span className="flex-1 text-sm">{aula.titulo}</span>
                              {aula.videoKey ? (
                                <Badge variant="outline" className="text-xs">
                                  <Video className="mr-1 h-3 w-3" /> Vídeo
                                </Badge>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUploadVideo(modulo.id, aula.id)}
                                >
                                  <Upload className="mr-1 h-3 w-3" /> Upload
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteLesson(modulo.id, aula.id)}
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
