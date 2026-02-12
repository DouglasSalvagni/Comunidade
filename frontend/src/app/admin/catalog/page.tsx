"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { api, Tag, Work, DevTheme } from "@/services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const AdminCatalogPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [works, setWorks] = useState<Work[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const worksPerPage = 5;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("");
  const [minMonths, setMinMonths] = useState<string>("");
  const [maxMonths, setMaxMonths] = useState<string>("");
  const [ageLabel, setAgeLabel] = useState<string>("");
  const [artistName, setArtistName] = useState<string>("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [devThemes, setDevThemes] = useState<DevTheme[]>([]);
  const [selectedDevThemeIds, setSelectedDevThemeIds] = useState<string[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioInputKey, setAudioInputKey] = useState(0);
  const [thumbInputKey, setThumbInputKey] = useState(0);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState<string>("");
  const [editMinMonths, setEditMinMonths] = useState<string>("");
  const [editMaxMonths, setEditMaxMonths] = useState<string>("");
  const [editAgeLabel, setEditAgeLabel] = useState<string>("");
  const [editArtistName, setEditArtistName] = useState<string>("");
  const [editSelectedTagIds, setEditSelectedTagIds] = useState<string[]>([]);
  const [editSelectedDevThemeIds, setEditSelectedDevThemeIds] = useState<string[]>([]);
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null);
  const [editThumbInputKey, setEditThumbInputKey] = useState(0);
  const [editIsLandingSample, setEditIsLandingSample] = useState(false);
  const [editIsPremium, setEditIsPremium] = useState(false);
  const [isPremiumNew, setIsPremiumNew] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [tagsList, themesList, worksList] = await Promise.all([
          api.adminGetTags(),
          api.adminGetDevThemes(),
          api.adminGetWorks(),
        ]);
        setTags(tagsList);
        setDevThemes(themesList);
        setWorks(Array.isArray((worksList as any)?.data) ? (worksList as any).data : (Array.isArray(worksList as any) ? (worksList as any) : []));
      } catch (e: any) {
        toast.error(e?.message || "Falha ao carregar catálogo");
      }
    };
    load();
  }, []);

  const handleRemoveWork = async (id: string) => {
    try {
      await api.adminDeleteWork(id);
      setWorks(works.filter((work) => work.id !== id));
      toast.success("Obra removida");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao remover obra");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await api.adminToggleWorkStatus(id);
      setWorks(works.map(w => w.id === id ? updated : w));
    } catch (e: any) {
      toast.error(e?.message || "Erro ao atualizar status");
    }
  };

  const filteredWorks = useMemo(() => (works ?? []).filter((work) =>
    work.title.toLowerCase().includes(searchTerm.toLowerCase())
  ), [works, searchTerm]);

  const indexOfLastWork = currentPage * worksPerPage;
  const indexOfFirstWork = indexOfLastWork - worksPerPage;
  const currentWorks = filteredWorks.slice(indexOfFirstWork, indexOfLastWork);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Gerenciar Catálogo</h1>
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Nova Obra</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            if (!title || !type || !audioFile) {
              toast.error("Preencha título, tipo e selecione o arquivo de áudio");
              return;
            }
            try {
              setUploading(true);
              setUploadProgress(0);
              const { uploadUrl, storageKey } = await api.getUploadUrl({
                fileName: audioFile.name,
                fileType: audioFile.type || "audio/mpeg",
                fileSize: audioFile.size,
              });
              await axios.put(uploadUrl, audioFile, {
                headers: { "Content-Type": audioFile.type || "audio/mpeg" },
                onUploadProgress: (evt) => {
                  if (evt.total) {
                    const percent = Math.round((evt.loaded * 100) / evt.total);
                    setUploadProgress(percent);
                  }
                },
                withCredentials: false,
              });
              let coverUrl: string | undefined = undefined;
              let coverThumbUrl: string | undefined = undefined;
              if (thumbnailFile) {
                const { uploadUrl: thumbUrl, storageKey: thumbKey } = await api.getUploadUrl({
                  fileName: thumbnailFile.name,
                  fileType: thumbnailFile.type || "image/jpeg",
                  fileSize: thumbnailFile.size,
                });
                await axios.put(thumbUrl, thumbnailFile, {
                  headers: { "Content-Type": thumbnailFile.type || "image/jpeg" },
                  onUploadProgress: (evt) => {
                    if (evt.total) {
                      const percent = Math.round((evt.loaded * 100) / evt.total);
                      setUploadProgress(percent);
                    }
                  },
                  withCredentials: false,
                });
                const processed = await api.processMedia({ storageKey: thumbKey, type: "image" });
                coverUrl = processed.processedUrl;
                coverThumbUrl = (processed as any)?.metadata?.thumbUrl;
              }
              const workData = await api.adminCreateWork({
                title,
                description,
                type: type as Work["type"],
                recommendedMinMonths: Number(minMonths || 0),
                recommendedMaxMonths: Number(maxMonths || 0),
                recommendedAgeLabel: ageLabel || undefined,
                artistName: artistName || undefined,
                isPremium: isPremiumNew,
                tagIds: selectedTagIds,
                devThemeIds: selectedDevThemeIds,
                coverUrl,
                coverThumbUrl,
              });
              await api.adminCreateTrack(workData.id, {
                title,
                storageKey,
              });
              await api.processMedia({ storageKey, type: "audio", workId: workData.id });
              const refreshed = await api.adminGetWorks();
              setWorks(Array.isArray((refreshed as any)?.data) ? (refreshed as any).data : (Array.isArray(refreshed as any) ? (refreshed as any) : []));
              setTitle(""); setDescription(""); setType(""); setMinMonths(""); setMaxMonths(""); setAgeLabel(""); setArtistName(""); setSelectedTagIds([]); setSelectedDevThemeIds([]); setIsPremiumNew(false); setAudioFile(null); setThumbnailFile(null);
              setAudioInputKey((k) => k + 1);
              setThumbInputKey((k) => k + 1);
              setUploading(false);
              setUploadProgress(0);
              toast.success("Obra adicionada e processamento iniciado");
            } catch (e: any) {
              toast.error(e?.message || "Erro ao adicionar obra");
              setUploading(false);
            }
          }}>
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" placeholder="Digite o título" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" placeholder="Digite a descrição" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="artistName">Artista (opcional)</Label>
              <Input id="artistName" placeholder="Digite o nome do artista" value={artistName} onChange={(e) => setArtistName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="music">Música</SelectItem>
                    <SelectItem value="audiobook">Audiobook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Idade Recomendada</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="minMonths">Min (meses)</Label>
                    <Input id="minMonths" type="number" min={0} value={minMonths} onChange={(e) => setMinMonths(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxMonths">Max (meses)</Label>
                    <Input id="maxMonths" type="number" min={0} value={maxMonths} onChange={(e) => setMaxMonths(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ageLabel">Rótulo (opcional)</Label>
                    <Input id="ageLabel" placeholder="ex.: 3–5 anos" value={ageLabel} onChange={(e) => setAgeLabel(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="grid grid-cols-3 gap-2">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox id={`tag-${tag.id}`} checked={selectedTagIds.includes(tag.id)} onCheckedChange={(v) => {
                      setSelectedTagIds((prev) => v ? [...prev, tag.id] : prev.filter(id => id !== tag.id));
                    }} />
                    <Label htmlFor={`tag-${tag.id}`}>{tag.name}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Temas de Desenvolvimento</Label>
              <div className="grid grid-cols-3 gap-2">
                {devThemes.map((theme) => (
                  <div key={theme.id} className="flex items-center space-x-2">
                    <Checkbox id={`theme-${theme.id}`} checked={selectedDevThemeIds.includes(theme.id)} onCheckedChange={(v) => {
                      setSelectedDevThemeIds((prev) => v ? [...prev, theme.id] : prev.filter(id => id !== theme.id));
                    }} />
                    <Label htmlFor={`theme-${theme.id}`}>{theme.name}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 flex items-center space-x-2">
              <Switch id="premium-new-toggle" checked={isPremiumNew} onCheckedChange={setIsPremiumNew} />
              <Label htmlFor="premium-new-toggle">Obra Premium</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Arquivo da Obra</Label>
              <Input key={audioInputKey} id="file" type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Imagem Thumbnail (opcional)</Label>
              <Input key={thumbInputKey} id="thumbnail" type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} />
            </div>
            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
              </div>
            )}
            <Button type="submit" disabled={uploading}>{uploading ? "Enviando..." : "Adicionar Obra"}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Obras Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentWorks.map((work) => (
                <TableRow key={work.id}>
                  <TableCell className="font-medium">{work.title}</TableCell>
                  <TableCell>{work.type}</TableCell>
                  <TableCell>{work.isPremium ? <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-500 ring-1 ring-inset ring-amber-500/20">★ Premium</span> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                  <TableCell>{work.recommendedAgeLabel || (work.recommendedMinMonths !== undefined && work.recommendedMaxMonths !== undefined ? `${work.recommendedMinMonths}–${work.recommendedMaxMonths} meses` : "-")}</TableCell>
                  <TableCell>
                    <Switch checked={work.isActive} onCheckedChange={() => handleToggleStatus(work.id)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={async () => {
                      setEditingWork(work);
                      setEditTitle(work.title || "");
                      setEditDescription(work.description || "");
                      setEditType(work.type || "");
                      setEditMinMonths(String(work.recommendedMinMonths ?? ""));
                      setEditMaxMonths(String(work.recommendedMaxMonths ?? ""));
                      setEditAgeLabel(work.recommendedAgeLabel || "");
                      setEditArtistName((work as any).artistName || "");
                      setEditSelectedTagIds((work.tags || []).map(t => t.id));
                      setEditSelectedDevThemeIds((work.devThemes || []).map(t => t.id));
                      setEditIsPremium(!!work.isPremium);

                      try {
                        const fullWork = await api.adminGetWork(work.id);
                        setEditIsLandingSample(fullWork.isLandingSample);
                      } catch {
                        setEditIsLandingSample(false);
                      }
                    }}>
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRemoveId(work.id)}
                    >
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-center space-x-2 mt-4">
            {Array.from({ length: Math.ceil(filteredWorks.length / worksPerPage) }, (_, i) => (
              <Button
                key={i + 1}
                variant={currentPage === i + 1 ? "default" : "outline"}
                onClick={() => paginate(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      <Dialog open={!!editingWork} onOpenChange={(open) => {
        if (!open) setEditingWork(null);
      }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Obra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Título</Label>
              <Input id="editTitle" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">Descrição</Label>
              <Textarea id="editDescription" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editArtistName">Artista (opcional)</Label>
              <Input id="editArtistName" value={editArtistName} onChange={(e) => setEditArtistName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editType">Tipo</Label>
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="music">Música</SelectItem>
                    <SelectItem value="audiobook">Audiobook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Idade Recomendada</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="editMinMonths">Min (meses)</Label>
                    <Input id="editMinMonths" type="number" min={0} value={editMinMonths} onChange={(e) => setEditMinMonths(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editMaxMonths">Max (meses)</Label>
                    <Input id="editMaxMonths" type="number" min={0} value={editMaxMonths} onChange={(e) => setEditMaxMonths(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editAgeLabel">Rótulo (opcional)</Label>
                    <Input id="editAgeLabel" placeholder="ex.: 3–5 anos" value={editAgeLabel} onChange={(e) => setEditAgeLabel(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="grid grid-cols-3 gap-2">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox id={`edit-tag-${tag.id}`} checked={editSelectedTagIds.includes(tag.id)} onCheckedChange={(v) => {
                      setEditSelectedTagIds((prev) => v ? [...prev, tag.id] : prev.filter(id => id !== tag.id));
                    }} />
                    <Label htmlFor={`edit-tag-${tag.id}`}>{tag.name}</Label>
                  </div>
                ))}
              </div>
              <div className="pt-2 flex items-center space-x-2">
                <Switch
                  id="landing-sample-toggle"
                  checked={editIsLandingSample}
                  onCheckedChange={async (checked) => {
                    if (!editingWork) return;
                    try {
                      if (checked) {
                        // Check if HLS is ready
                        const hasHls = (editingWork.tracks || []).some(t => !!(t.hlsMasterKey || t.hlsManifestStorageKey));
                        if (!hasHls) {
                          toast.error('Esta obra ainda não está processada em HLS. Processe o áudio antes de ativar na Landing.');
                          return;
                        }
                        // Check limit
                        const currentSamples = await api.getLandingSamples(100);
                        if (currentSamples.length >= 3) {
                          toast.error('Limite de 3 amostras na landing atingido');
                          return;
                        }
                        await api.adminAddLandingSample(editingWork.id);
                        setEditIsLandingSample(true);
                        toast.success('Adicionado à Landing Page');
                      } else {
                        await api.adminRemoveLandingSample(editingWork.id);
                        setEditIsLandingSample(false);
                        toast.success('Removido da Landing Page');
                      }
                    } catch (e: any) {
                      toast.error(e?.message || "Erro ao atualizar status de amostra");
                    }
                  }}
                />
                <Label htmlFor="landing-sample-toggle">Música de Amostra (Landing Page)</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Temas de Desenvolvimento</Label>
              <div className="grid grid-cols-3 gap-2">
                {devThemes.map((theme) => (
                  <div key={theme.id} className="flex items-center space-x-2">
                    <Checkbox id={`edit-theme-${theme.id}`} checked={editSelectedDevThemeIds.includes(theme.id)} onCheckedChange={(v) => {
                      setEditSelectedDevThemeIds((prev) => v ? [...prev, theme.id] : prev.filter(id => id !== theme.id));
                    }} />
                    <Label htmlFor={`edit-theme-${theme.id}`}>{theme.name}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 flex items-center space-x-2">
              <Switch id="edit-premium-toggle" checked={editIsPremium} onCheckedChange={setEditIsPremium} />
              <Label htmlFor="edit-premium-toggle">Obra Premium</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editThumbnail">Imagem Thumbnail (opcional)</Label>
              <Input key={editThumbInputKey} id="editThumbnail" type="file" accept="image/*" onChange={(e) => setEditThumbnailFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingWork(null)}>Cancelar</Button>
            <Button onClick={async () => {
              if (!editingWork) return;
              try {
                let coverUrl: string | undefined = undefined;
                let coverThumbUrl: string | undefined = undefined;
                if (editThumbnailFile) {
                  const { uploadUrl: thumbUrl, storageKey: thumbKey } = await api.getUploadUrl({
                    fileName: editThumbnailFile.name,
                    fileType: editThumbnailFile.type || "image/jpeg",
                    fileSize: editThumbnailFile.size,
                  });
                  await axios.put(thumbUrl, editThumbnailFile, { headers: { "Content-Type": editThumbnailFile.type || "image/jpeg" }, withCredentials: false });
                  const processed = await api.processMedia({ storageKey: thumbKey, type: "image" });
                  coverUrl = processed.processedUrl;
                  coverThumbUrl = (processed as any)?.metadata?.thumbUrl;
                  setEditThumbInputKey((k) => k + 1);
                  setEditThumbnailFile(null);
                }
                const payload: any = {
                  title: editTitle,
                  description: editDescription,
                  type: editType || undefined,
                  recommendedMinMonths: editMinMonths ? Number(editMinMonths) : undefined,
                  recommendedMaxMonths: editMaxMonths ? Number(editMaxMonths) : undefined,
                  recommendedAgeLabel: editAgeLabel || undefined,
                  artistName: editArtistName || undefined,
                  isPremium: editIsPremium,
                  tagIds: editSelectedTagIds,
                  devThemeIds: editSelectedDevThemeIds,
                };
                if (coverUrl) payload.coverUrl = coverUrl;
                if (coverThumbUrl) payload.coverThumbUrl = coverThumbUrl;
                const updated = await api.adminUpdateWork(editingWork.id, payload);
                setWorks((prev) => prev.map(w => w.id === updated.id ? { ...w, ...updated } : w));
                toast.success("Obra atualizada");
                setEditingWork(null);
              } catch (e: any) {
                toast.error(e?.message || "Erro ao atualizar obra");
              }
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!removeId} onOpenChange={(open) => { if (!open) setRemoveId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar remoção</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja remover esta obra? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => {
              if (!removeId) return;
              await handleRemoveWork(removeId);
              setRemoveId(null);
            }}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCatalogPage;
