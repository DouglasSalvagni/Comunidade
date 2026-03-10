"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Plus, Trash2, Save, ChevronDown, ChevronUp, GripVertical, Upload, Video } from "lucide-react";

// dnd-kit
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ──────────────────────────────────────────
// Sortable Lesson Row
// ──────────────────────────────────────────
function SortableLessonRow({
  aula,
  moduleId,
  courseId,
  onDelete,
  onUpload,
}: {
  aula: AdminCourseDetail["modulos"][0]["aulas"][0];
  moduleId: string;
  courseId: string;
  onDelete: (moduleId: string, lessonId: string) => void;
  onUpload: (moduleId: string, lessonId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: aula.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/30 transition-colors"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 text-sm">{aula.titulo}</span>
      {aula.videoKey ? (
        <Badge variant="outline" className="text-xs shrink-0">
          <Video className="mr-1 h-3 w-3" /> Vídeo
        </Badge>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 h-7 text-xs"
          onClick={() => onUpload(moduleId, aula.id)}
        >
          <Upload className="mr-1 h-3 w-3" /> Upload
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 h-7 w-7 p-0"
        onClick={() => onDelete(moduleId, aula.id)}
      >
        <Trash2 className="h-3 w-3 text-destructive" />
      </Button>
    </div>
  );
}

// ──────────────────────────────────────────
// Sortable Module Card
// ──────────────────────────────────────────
function SortableModuleCard({
  modulo,
  courseId,
  expanded,
  onToggle,
  onDeleteModule,
  onDeleteLesson,
  onUploadVideo,
  onLessonDragEnd,
}: {
  modulo: AdminCourseDetail["modulos"][0];
  courseId: string;
  expanded: boolean;
  onToggle: () => void;
  onDeleteModule: (moduleId: string) => void;
  onDeleteLesson: (moduleId: string, lessonId: string) => void;
  onUploadVideo: (moduleId: string, lessonId: string) => void;
  onLessonDragEnd: (moduleId: string, activeId: string, overId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: modulo.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const lessonSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="overflow-hidden">
        <CardHeader className="py-3 px-4 cursor-pointer" onClick={onToggle}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <CardTitle className="text-base">{modulo.titulo}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {modulo.aulas.length} {modulo.aulas.length === 1 ? "aula" : "aulas"}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteModule(modulo.id);
                }}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="pt-0 px-4 pb-3">
            {modulo.aulas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma aula neste módulo
              </p>
            ) : (
              <DndContext
                sensors={lessonSensors}
                collisionDetection={closestCenter}
                onDragEnd={(event: DragEndEvent) => {
                  const { active, over } = event;
                  if (over && active.id !== over.id) {
                    onLessonDragEnd(modulo.id, String(active.id), String(over.id));
                  }
                }}
              >
                <SortableContext
                  items={modulo.aulas.map((a) => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y">
                    {modulo.aulas.map((aula) => (
                      <SortableLessonRow
                        key={aula.id}
                        aula={aula}
                        moduleId={modulo.id}
                        courseId={courseId}
                        onDelete={onDeleteLesson}
                        onUpload={onUploadVideo}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────
export default function AdminCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<AdminCourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [moduleOrder, setModuleOrder] = useState<string[]>([]);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState<"rascunho" | "publicado">("rascunho");

  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [newModuleTitulo, setNewModuleTitulo] = useState("");

  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [lessonModuleId, setLessonModuleId] = useState("");
  const [newLessonTitulo, setNewLessonTitulo] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadCourse = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.adminGetCourse(id);
      setCourse(data);
      setTitulo(data.titulo);
      setDescricao(data.descricao || "");
      setStatus(data.status);
      setExpandedModules(new Set(data.modulos.map((m) => m.id)));
      setModuleOrder(
        [...data.modulos].sort((a, b) => a.ordem - b.ordem).map((m) => m.id)
      );
    } catch (err) {
      console.error("Erro ao carregar curso:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  // ── Course edit ──
  const handleSaveCourse = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await api.adminUpdateCourse(id, { titulo, descricao, status });
      await loadCourse();
    } finally {
      setSaving(false);
    }
  };

  // ── Module drag end ──
  const handleModuleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !id) return;

    const oldIndex = moduleOrder.indexOf(String(active.id));
    const newIndex = moduleOrder.indexOf(String(over.id));
    const newOrder = arrayMove(moduleOrder, oldIndex, newIndex);

    setModuleOrder(newOrder);
    // Optimistically reorder in state
    if (course) {
      const newModulos = newOrder.map((mid) =>
        course.modulos.find((m) => m.id === mid)!
      );
      setCourse({ ...course, modulos: newModulos });
    }

    try {
      await api.adminReorderModules(id, newOrder);
    } catch {
      await loadCourse();
    }
  };

  // ── Lesson drag end ──
  const handleLessonDragEnd = async (moduleId: string, activeId: string, overId: string) => {
    if (!id || !course) return;

    const modIdx = course.modulos.findIndex((m) => m.id === moduleId);
    if (modIdx === -1) return;

    const aulas = course.modulos[modIdx].aulas;
    const oldIndex = aulas.findIndex((a) => a.id === activeId);
    const newIndex = aulas.findIndex((a) => a.id === overId);
    const newAulas = arrayMove(aulas, oldIndex, newIndex);

    const newModulos = course.modulos.map((m, i) =>
      i === modIdx ? { ...m, aulas: newAulas } : m
    );
    setCourse({ ...course, modulos: newModulos });

    try {
      await api.adminReorderLessons(id, moduleId, newAulas.map((a) => a.id));
    } catch {
      await loadCourse();
    }
  };

  // ── Modules CRUD ──
  const handleAddModule = async () => {
    if (!id || !newModuleTitulo.trim()) return;
    try {
      await api.adminCreateModule(id, { titulo: newModuleTitulo });
      setModuleDialogOpen(false);
      setNewModuleTitulo("");
      await loadCourse();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!id || !confirm("Excluir este módulo e todas as suas aulas?")) return;
    try {
      await api.adminDeleteModule(id, moduleId);
      await loadCourse();
    } catch (err) {
      console.error(err);
    }
  };

  // ── Lessons CRUD ──
  const handleAddLesson = async () => {
    if (!id || !lessonModuleId || !newLessonTitulo.trim()) return;
    try {
      await api.adminCreateLesson(id, lessonModuleId, { titulo: newLessonTitulo });
      setLessonDialogOpen(false);
      setNewLessonTitulo("");
      setLessonModuleId("");
      await loadCourse();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
    if (!id || !confirm("Excluir esta aula?")) return;
    try {
      await api.adminDeleteLesson(id, moduleId, lessonId);
      await loadCourse();
    } catch (err) {
      console.error(err);
    }
  };

  // ── Video upload ──
  const handleUploadVideo = async (moduleId: string, lessonId: string) => {
    if (!id) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const { uploadUrl, key } = await api.adminGetUploadUrl(id, file.name);
        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        await api.adminUpdateLesson(id, moduleId, lessonId, { videoKey: key });
        await loadCourse();
      } catch (err) {
        console.error("Erro no upload:", err);
        alert("Erro ao fazer upload do vídeo.");
      }
    };
    input.click();
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Curso não encontrado
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Course Info */}
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
            <Input
              id="edit-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
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
            <Label>Status</Label>
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
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </CardContent>
      </Card>

      {/* Modules & Lessons Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Módulos & Aulas</h2>
          <p className="text-sm text-muted-foreground">
            Arraste para reordenar módulos e aulas
          </p>
        </div>
        <div className="flex gap-2">
          {/* Add Module */}
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
                  onKeyDown={(e) => e.key === "Enter" && handleAddModule()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddModule} disabled={!newModuleTitulo.trim()}>
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Lesson */}
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
                    onKeyDown={(e) => e.key === "Enter" && handleAddLesson()}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddLesson}
                  disabled={!lessonModuleId || !newLessonTitulo.trim()}
                >
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Modules List (draggable) */}
      {course.modulos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhum módulo criado. Clique em &ldquo;+ Módulo&rdquo; para começar.
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleModuleDragEnd}
        >
          <SortableContext items={moduleOrder} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {moduleOrder.map((moduleId) => {
                const modulo = course.modulos.find((m) => m.id === moduleId);
                if (!modulo) return null;
                return (
                  <SortableModuleCard
                    key={modulo.id}
                    modulo={modulo}
                    courseId={id!}
                    expanded={expandedModules.has(modulo.id)}
                    onToggle={() => toggleModule(modulo.id)}
                    onDeleteModule={handleDeleteModule}
                    onDeleteLesson={handleDeleteLesson}
                    onUploadVideo={handleUploadVideo}
                    onLessonDragEnd={handleLessonDragEnd}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
