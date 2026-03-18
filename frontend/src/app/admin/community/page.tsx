"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, CommunityPost, CommunitySpace, Plan } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pin, PinOff, Plus, Save, Trash2 } from "lucide-react";

type SpaceForm = {
  name: string;
  slug: string;
  description: string;
  visibility: "public" | "restricted";
  isActive: boolean;
  sortOrder: number;
  planIds: string[];
};

const EMPTY_FORM: SpaceForm = {
  name: "",
  slug: "",
  description: "",
  visibility: "public",
  isActive: true,
  sortOrder: 0,
  planIds: [],
};

export default function AdminCommunityPage() {
  const [spaces, setSpaces] = useState<CommunitySpace[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [feed, setFeed] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SpaceForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const selectedSpace = useMemo(
    () => spaces.find((space) => space.id === selectedSpaceId) || null,
    [spaces, selectedSpaceId],
  );

  const load = async () => {
    setLoading(true);
    try {
      const [spacesData, plansData] = await Promise.all([
        api.adminGetCommunitySpaces(),
        api.adminGetPlans(),
      ]);
      setSpaces(spacesData);
      setPlans(plansData);
      const nextSelected = selectedSpaceId || spacesData[0]?.id || "";
      setSelectedSpaceId(nextSelected);
      if (nextSelected) {
        const posts = await api.getCommunitySpaceFeed(nextSelected, { limit: 50 });
        setFeed(posts);
      } else {
        setFeed([]);
      }
    } catch {
      toast.error("Não foi possível carregar a comunidade.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selectedSpaceId) return;
    api
      .getCommunitySpaceFeed(selectedSpaceId, { limit: 50 })
      .then(setFeed)
      .catch(() => setFeed([]));
  }, [selectedSpaceId]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const openEdit = async (spaceId: string) => {
    try {
      const detail = await api.adminGetCommunitySpace(spaceId);
      setEditingId(detail.id);
      setForm({
        name: detail.name,
        slug: detail.slug,
        description: detail.description || "",
        visibility: detail.visibility,
        isActive: detail.isActive,
        sortOrder: detail.sortOrder,
        planIds: (detail.planAccess || []).map((item) => item.planId),
      });
    } catch {
      toast.error("Não foi possível carregar o espaço.");
    }
  };

  const toggleFormPlan = (id: string) => {
    setForm((current) => ({
      ...current,
      planIds: current.planIds.includes(id) ? current.planIds.filter((planId) => planId !== id) : [...current.planIds, id],
    }));
  };

  const saveSpace = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Nome e slug são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.adminUpdateCommunitySpace(editingId, {
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description || "",
          visibility: form.visibility,
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder) || 0,
        });
        await Promise.all([
          api.adminUpdateCommunitySpacePlanAccess(editingId, form.planIds),
        ]);
        toast.success("Espaço atualizado.");
      } else {
        await api.adminCreateCommunitySpace({
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description || "",
          visibility: form.visibility,
          isActive: form.isActive,
          sortOrder: Number(form.sortOrder) || 0,
          planIds: form.planIds,
        });
        toast.success("Espaço criado.");
      }
      await load();
      openCreate();
    } catch {
      toast.error("Não foi possível salvar o espaço.");
    } finally {
      setSaving(false);
    }
  };

  const removeSpace = async (id: string) => {
    try {
      await api.adminDeleteCommunitySpace(id);
      toast.success("Espaço removido.");
      await load();
      if (editingId === id) {
        openCreate();
      }
    } catch {
      toast.error("Não foi possível remover o espaço.");
    }
  };

  const togglePin = async (post: CommunityPost) => {
    try {
      if (post.isPinned) {
        await api.adminUnpinCommunityPost(post.id);
      } else {
        await api.adminPinCommunityPost(post.id);
      }
      const posts = await api.getCommunitySpaceFeed(selectedSpaceId, { limit: 50 });
      setFeed(posts);
    } catch {
      toast.error("Não foi possível alterar fixação.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comunidade</h1>
        <p className="text-sm text-muted-foreground">Gerencie canais e modere posts fixados.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Espaços</CardTitle>
            <Button variant="outline" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Novo
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {spaces.map((space) => (
              <div key={space.id} className="rounded-md border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{space.name}</div>
                    <div className="text-xs text-muted-foreground">/{space.slug}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={space.isActive ? "default" : "secondary"}>
                      {space.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => openEdit(space.id)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => removeSpace(space.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{space.description || "Sem descrição."}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Editar espaço" : "Criar espaço"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Visibilidade</Label>
                <Select value={form.visibility} onValueChange={(value) => setForm((current) => ({ ...current, visibility: value as "public" | "restricted" }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Público</SelectItem>
                    <SelectItem value="restricted">Restrito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={String(form.sortOrder)}
                  onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))} />
              <Label>Ativo</Label>
            </div>

            <div className="space-y-2">
              <Label>Acesso por plano</Label>
              <div className="grid gap-2 max-h-28 overflow-auto border rounded-md p-2">
                {plans.map((plan) => (
                  <label key={plan.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.planIds.includes(plan.id)}
                      onChange={() => toggleFormPlan(plan.id)}
                    />
                    <span>{plan.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={saveSpace} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Moderação de posts</CardTitle>
          <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Selecione um espaço" />
            </SelectTrigger>
            <SelectContent>
              {spaces.map((space) => (
                <SelectItem key={space.id} value={space.id}>
                  {space.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-3">
          {!selectedSpace && <p className="text-sm text-muted-foreground">Nenhum espaço selecionado.</p>}
          {selectedSpace && feed.length === 0 && <p className="text-sm text-muted-foreground">Nenhum post neste espaço.</p>}
          {feed.map((post) => (
            <div key={post.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{post.title || "Post sem título"}</div>
                  <div className="text-xs text-muted-foreground">
                    {post.author?.name || "Membro"} • {new Date(post.createdAt).toLocaleString()}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => togglePin(post)}>
                  {post.isPinned ? (
                    <>
                      <PinOff className="h-4 w-4 mr-1" />
                      Desfixar
                    </>
                  ) : (
                    <>
                      <Pin className="h-4 w-4 mr-1" />
                      Fixar
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
