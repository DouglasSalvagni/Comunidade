"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { api, AdminCourseDetail, LessonAttachment, Plan } from "@/services/api";
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
import { Plus, Trash2, Save, ChevronDown, ChevronUp, GripVertical, Upload, Video, FileText, Paperclip, X, Pencil } from "lucide-react";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), { ssr: false });

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
  onRemoveVideo,
  onEditContent,
  uploadProgress,
}: {
  aula: AdminCourseDetail["modulos"][0]["aulas"][0];
  moduleId: string;
  courseId: string;
  onDelete: (moduleId: string, lessonId: string) => void;
  onUpload: (moduleId: string, lessonId: string) => void;
  onRemoveVideo: (moduleId: string, lessonId: string) => void;
  onEditContent: (moduleId: string, lessonId: string, titulo: string, conteudoTexto: string) => void;
  uploadProgress?: number;
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
      
      {uploadProgress !== undefined ? (
        <div className="flex items-center gap-2 w-32 shrink-0">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }} 
            />
          </div>
          <span className="text-xs text-muted-foreground w-8">{Math.round(uploadProgress)}%</span>
        </div>
      ) : aula.videoKey ? (
        <div className="flex items-center gap-1 shrink-0">
          <Badge variant="outline" className="text-xs">
            <Video className="mr-1 h-3 w-3" /> Vídeo
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title="Remover vídeo"
            onClick={() => onRemoveVideo(moduleId, aula.id)}
          >
            <X className="h-3 w-3 text-destructive" />
          </Button>
        </div>
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
        className="shrink-0 h-7 text-xs"
        onClick={() => onEditContent(moduleId, aula.id, aula.titulo, aula.conteudoTexto || "")}
      >
        <Paperclip className="mr-1 h-3 w-3" /> Texto & Anexos
      </Button>
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
  onRemoveVideo,
  onLessonDragEnd,
  onEditLessonContent,
  onRenameModule,
  uploadProgressMap,
}: {
  modulo: AdminCourseDetail["modulos"][0];
  courseId: string;
  expanded: boolean;
  onToggle: () => void;
  onDeleteModule: (moduleId: string) => void;
  onDeleteLesson: (moduleId: string, lessonId: string) => void;
  onUploadVideo: (moduleId: string, lessonId: string) => void;
  onRemoveVideo: (moduleId: string, lessonId: string) => void;
  onLessonDragEnd: (moduleId: string, activeId: string, overId: string) => void;
  onEditLessonContent: (moduleId: string, lessonId: string, titulo: string, conteudoTexto: string) => void;
  onRenameModule: (moduleId: string, newTitulo: string) => Promise<void>;
  uploadProgressMap: Record<string, number>;
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

  // ── Inline title editing ──
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(modulo.titulo);
  const [savingTitle, setSavingTitle] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent card toggle
    setDraftTitle(modulo.titulo);
    setEditingTitle(true);
    // Focus happens after render via useEffect
  };

  useEffect(() => {
    if (editingTitle) inputRef.current?.focus();
  }, [editingTitle]);

  const commitEdit = async () => {
    const trimmed = draftTitle.trim();
    if (!trimmed || trimmed === modulo.titulo) {
      setEditingTitle(false);
      return;
    }
    setSavingTitle(true);
    try {
      await onRenameModule(modulo.id, trimmed);
    } finally {
      setSavingTitle(false);
      setEditingTitle(false);
    }
  };

  const cancelEdit = () => {
    setDraftTitle(modulo.titulo);
    setEditingTitle(false);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="overflow-hidden">
        <CardHeader
          className="py-3 px-4"
          // Only toggle when NOT editing the title
          onClick={editingTitle ? undefined : onToggle}
          style={{ cursor: editingTitle ? "default" : "pointer" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
                onClick={(e) => e.stopPropagation()}
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </button>

              {editingTitle ? (
                // ── Edit mode ──
                <input
                  ref={inputRef}
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
                    if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  disabled={savingTitle}
                  className="flex-1 min-w-0 text-base font-semibold bg-transparent border-b border-primary outline-none px-0 py-0.5 text-foreground placeholder:text-muted-foreground"
                />
              ) : (
                // ── View mode ──
                <button
                  className="group flex items-center gap-1.5 text-left flex-1 min-w-0"
                  onClick={startEditing}
                  title="Clique para editar o nome do módulo"
                >
                  <span className="text-base font-semibold truncate">{modulo.titulo}</span>
                  <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              )}

              <Badge variant="outline" className="text-xs shrink-0">
                {modulo.aulas.length} {modulo.aulas.length === 1 ? "aula" : "aulas"}
              </Badge>
            </div>
            <div className="flex items-center gap-1 shrink-0">
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
                        onRemoveVideo={onRemoveVideo}
                        onEditContent={onEditLessonContent}
                        uploadProgress={uploadProgressMap[aula.id]}
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
// Lesson Content Editor Dialog
// ──────────────────────────────────────────
function LessonContentDialog({
  open,
  onClose,
  onSaved,
  courseId,
  moduleId,
  lessonId,
  lessonTitulo,
  initialContent,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  courseId: string;
  moduleId: string;
  lessonId: string;
  lessonTitulo: string;
  initialContent?: string;
}) {
  const [content, setContent] = useState(initialContent || "");
  const [attachments, setAttachments] = useState<LessonAttachment[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load attachments via admin endpoint when dialog opens
  useEffect(() => {
    if (!open || !lessonId) return;
    // Reset state before loading
    setContent(initialContent || "");
    setAttachments([]);
    setLoadingContent(true);
    // Fetch only attachments via admin route (no subscription required)
    api
      .adminListAttachments(courseId, moduleId, lessonId)
      .then((data) => {
        setAttachments(data || []);
      })
      .catch(console.error)
      .finally(() => setLoadingContent(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lessonId]);

  const handleSaveContent = async () => {
    setSaving(true);
    try {
      await api.adminUpdateLesson(courseId, moduleId, lessonId, { conteudoTexto: content });
      await onSaved();
      onClose();
    } catch (err) {
      console.error("Erro ao salvar conteúdo:", err);
      alert("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAttachment = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const { uploadUrl, key } = await api.adminGetAttachmentUploadUrl(
          courseId,
          moduleId,
          lessonId,
          file.name,
          file.type || "application/octet-stream"
        );
        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/octet-stream" },
        });
        const attachment = await api.adminCreateAttachment(courseId, moduleId, lessonId, {
          nome: file.name,
          fileKey: key,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          tamanhoBytes: file.size,
        });
        setAttachments((prev) => [...prev, attachment]);
      } catch (err) {
        console.error("Erro ao fazer upload:", err);
        alert("Erro ao fazer upload do arquivo.");
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm("Excluir este anexo?")) return;
    try {
      await api.adminDeleteAttachment(courseId, moduleId, lessonId, attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err) {
      console.error("Erro ao excluir anexo:", err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Texto & Arquivos da Aula</DialogTitle>
          <DialogDescription>Edite o conteúdo escrito e faça upload de arquivos para download — <strong>{lessonTitulo}</strong></DialogDescription>
        </DialogHeader>

        {loadingContent ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Rich Text Editor */}
            <div>
              <Label className="mb-2 block">Texto / Material de Apoio</Label>
              <RichTextEditor value={content} onChange={setContent} />
            </div>

            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Arquivos Anexos</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUploadAttachment}
                  disabled={uploading}
                >
                  <Paperclip className="mr-1 h-3 w-3" />
                  {uploading ? "Enviando..." : "Adicionar Arquivo"}
                </Button>
              </div>

              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 border rounded-md border-dashed">
                  Nenhum arquivo anexado ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-3 rounded-md border bg-muted/20"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{att.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {att.contentType} · {formatBytes(att.tamanhoBytes)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 shrink-0"
                        onClick={() => handleDeleteAttachment(att.id)}
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSaveContent} disabled={saving || loadingContent}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Conteúdo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────
export default function AdminCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<AdminCourseDetail | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planIds, setPlanIds] = useState<string[]>([]);
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

  const [uploadProgressMap, setUploadProgressMap] = useState<Record<string, number>>({});

  // Content editor dialog state
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<{
    moduleId: string;
    lessonId: string;
    titulo: string;
    conteudoTexto: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadCourse = useCallback(async () => {
    if (!id) return;
    try {
      const [data, plansData] = await Promise.all([
        api.adminGetCourse(id),
        api.adminGetPlans(),
      ]);
      setCourse(data);
      setPlans(plansData);
      setPlanIds((data.planAccess || []).map((item) => item.planId));
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
      await Promise.all([
        api.adminUpdateCourse(id, { titulo, descricao, status }),
        api.adminUpdateCoursePlanAccess(id, planIds),
      ]);
      await loadCourse();
    } finally {
      setSaving(false);
    }
  };

  const toggleFormPlan = (planId: string) => {
    setPlanIds((current) =>
      current.includes(planId)
        ? current.filter((id) => id !== planId)
        : [...current, planId],
    );
  };

  // ── Module drag end ──
  const handleModuleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !id) return;

    const oldIndex = moduleOrder.indexOf(String(active.id));
    const newIndex = moduleOrder.indexOf(String(over.id));
    const newOrder = arrayMove(moduleOrder, oldIndex, newIndex);

    setModuleOrder(newOrder);
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
        
        setUploadProgressMap((prev) => ({ ...prev, [lessonId]: 0 }));

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl, true);
          xhr.setRequestHeader("Content-Type", file.type);
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = (event.loaded / event.total) * 100;
              setUploadProgressMap((prev) => ({ ...prev, [lessonId]: progress }));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.send(file);
        });

        await api.adminUpdateLesson(id, moduleId, lessonId, { videoKey: key });
        await loadCourse();
      } catch (err) {
        console.error("Erro no upload:", err);
        alert("Erro ao fazer upload do vídeo.");
      } finally {
        setUploadProgressMap((prev) => {
          const newMap = { ...prev };
          delete newMap[lessonId];
          return newMap;
        });
      }
    };
    input.click();
  };

  // ── Remove video ──
  const handleRemoveVideo = async (moduleId: string, lessonId: string) => {
    if (!id) return;
    if (!confirm("Tem certeza que deseja remover o vídeo desta aula? Ele será deletado permanentemente.")) return;
    try {
      await api.adminUpdateLesson(id, moduleId, lessonId, { videoKey: null });
      await loadCourse();
    } catch (err) {
      console.error("Erro ao remover vídeo:", err);
      alert("Erro ao remover o vídeo.");
    }
  };

  // ── Module rename ──
  const handleRenameModule = async (moduleId: string, newTitulo: string) => {
    if (!id) return;
    try {
      await api.adminUpdateModule(id, moduleId, { titulo: newTitulo });
      // Update local state optimistically so the title shows immediately
      if (course) {
        const newModulos = course.modulos.map((m) =>
          m.id === moduleId ? { ...m, titulo: newTitulo } : m
        );
        setCourse({ ...course, modulos: newModulos });
      }
    } catch (err) {
      console.error("Erro ao renomear módulo:", err);
      // Reload to restore the original title if the request failed
      await loadCourse();
    }
  };

  // ── Lesson content edit ──
  const handleEditLessonContent = (moduleId: string, lessonId: string, titulo: string, conteudoTexto: string) => {
    setEditingLesson({ moduleId, lessonId, titulo, conteudoTexto });
    setContentDialogOpen(true);
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
          <div className="space-y-2">
            <Label>Acesso por plano</Label>
            <div className="grid gap-2 max-h-28 overflow-auto border rounded-md p-2">
              {plans.map((plan) => (
                <label key={plan.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={planIds.includes(plan.id)}
                    onChange={() => toggleFormPlan(plan.id)}
                  />
                  <span>{plan.name}</span>
                </label>
              ))}
            </div>
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
                    onRemoveVideo={handleRemoveVideo}
                    onLessonDragEnd={handleLessonDragEnd}
                    onEditLessonContent={handleEditLessonContent}
                    onRenameModule={handleRenameModule}
                    uploadProgressMap={uploadProgressMap}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Lesson Content Editor Dialog */}
      {editingLesson && (
        <LessonContentDialog
          key={editingLesson.lessonId}
          open={contentDialogOpen}
          onClose={() => {
            setContentDialogOpen(false);
            setEditingLesson(null);
          }}
          onSaved={loadCourse}
          courseId={id!}
          moduleId={editingLesson.moduleId}
          lessonId={editingLesson.lessonId}
          lessonTitulo={editingLesson.titulo}
          initialContent={editingLesson.conteudoTexto}
        />
      )}
    </div>
  );
}
