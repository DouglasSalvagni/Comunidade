"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, Plan } from "@/services/api";
import { toast } from "sonner";

const courtesySlug = "plano-cortesia";

const featuresToText = (features?: string[]) => {
  if (!features || features.length === 0) return "";
  return features.join("\n");
};

const textToFeatures = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const AdminPlansPage = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [priceCents, setPriceCents] = useState("1990");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [description, setDescription] = useState("");
  const [featuresText, setFeaturesText] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isCourtesy, setIsCourtesy] = useState(false);
  const [courtesyDurationMonths, setCourtesyDurationMonths] = useState<string>("");

  const [editOpen, setEditOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editPriceCents, setEditPriceCents] = useState("1990");
  const [editBillingPeriod, setEditBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [editDescription, setEditDescription] = useState("");
  const [editFeaturesText, setEditFeaturesText] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editIsCourtesy, setEditIsCourtesy] = useState(false);
  const [editCourtesyDurationMonths, setEditCourtesyDurationMonths] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.adminGetPlans();
        setPlans(data);
      } catch (e: any) {
        toast.error(e?.message || "Falha ao carregar planos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const courtesyExists = useMemo(
    () => plans.some((p) => p.slug === courtesySlug),
    [plans],
  );

  const resetForm = () => {
    setName("");
    setSlug("");
    setPriceCents("1990");
    setBillingPeriod("monthly");
    setDescription("");
    setFeaturesText("");
    setIsActive(true);
    setIsCourtesy(false);
    setCourtesyDurationMonths("");
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!isCourtesy && !slug.trim()) {
      toast.error("Slug é obrigatório");
      return;
    }
    if (isCourtesy && courtesyExists) {
      toast.error("Já existe um plano cortesia");
      return;
    }
    const price = Number(priceCents);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Preço inválido");
      return;
    }
    const duration = courtesyDurationMonths.trim() === "" ? null : Number(courtesyDurationMonths);
    if (duration !== null && (!Number.isFinite(duration) || duration <= 0)) {
      toast.error("Duração inválida");
      return;
    }
    try {
      const created = await api.adminCreatePlan({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        priceCents: price,
        billingPeriod,
        features: textToFeatures(featuresText),
        isActive,
        isCourtesy,
        courtesyDurationMonths: duration,
      });
      setPlans([...plans, created].sort((a, b) => a.priceCents - b.priceCents));
      resetForm();
      toast.success("Plano criado");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao criar plano");
    }
  };

  const openEdit = (plan: Plan) => {
    setEditPlan(plan);
    setEditName(plan.name);
    setEditSlug(plan.slug || "");
    setEditPriceCents(String(plan.priceCents));
    setEditBillingPeriod(plan.billingPeriod);
    setEditDescription(plan.description || "");
    setEditFeaturesText(featuresToText(plan.features));
    setEditIsActive(plan.isActive !== false);
    setEditIsCourtesy(plan.slug === courtesySlug);
    setEditCourtesyDurationMonths(
      plan.courtesyDurationMonths !== null && plan.courtesyDurationMonths !== undefined
        ? String(plan.courtesyDurationMonths)
        : "",
    );
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editPlan) return;
    if (!editName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!editIsCourtesy && !editSlug.trim()) {
      toast.error("Slug é obrigatório");
      return;
    }
    if (editIsCourtesy && courtesyExists && editPlan.slug !== courtesySlug) {
      toast.error("Já existe um plano cortesia");
      return;
    }
    const price = Number(editPriceCents);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Preço inválido");
      return;
    }
    const duration = editCourtesyDurationMonths.trim() === "" ? null : Number(editCourtesyDurationMonths);
    if (duration !== null && (!Number.isFinite(duration) || duration <= 0)) {
      toast.error("Duração inválida");
      return;
    }
    try {
      const updated = await api.adminUpdatePlan(editPlan.id, {
        name: editName.trim(),
        slug: editSlug.trim(),
        description: editDescription.trim() || undefined,
        priceCents: price,
        billingPeriod: editBillingPeriod,
        features: textToFeatures(editFeaturesText),
        isActive: editIsActive,
        isCourtesy: editIsCourtesy,
        courtesyDurationMonths: duration,
      });
      setPlans(plans.map((p) => (p.id === editPlan.id ? updated : p)));
      setEditOpen(false);
      toast.success("Plano atualizado");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao atualizar plano");
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Gerenciar Planos</h1>

      <Card>
        <CardHeader>
          <CardTitle>Novo Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={isCourtesy ? courtesySlug : slug} onChange={(e) => setSlug(e.target.value)} disabled={isCourtesy} />
            </div>
            <div className="space-y-2">
              <Label>Preço (centavos)</Label>
              <Input type="number" value={priceCents} onChange={(e) => setPriceCents(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Ciclo</Label>
              <Select value={billingPeriod} onValueChange={(value) => setBillingPeriod(value as "monthly" | "yearly")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Features (uma por linha)</Label>
              <Textarea value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Ativo</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={isCourtesy}
                onCheckedChange={(value) => {
                  if (value && courtesyExists) {
                    toast.error("Já existe um plano cortesia");
                    return;
                  }
                  setIsCourtesy(value);
                  if (value) {
                    setSlug(courtesySlug);
                  }
                }}
              />
              <Label>Plano cortesia</Label>
            </div>
            <div className="space-y-2">
              <Label>Duração da cortesia (meses)</Label>
              <Input
                type="number"
                value={courtesyDurationMonths}
                onChange={(e) => setCourtesyDurationMonths(e.target.value)}
                disabled={!isCourtesy}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreate}>Criar Plano</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={editIsCourtesy ? courtesySlug : editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                disabled={editIsCourtesy}
              />
            </div>
            <div className="space-y-2">
              <Label>Preço (centavos)</Label>
              <Input type="number" value={editPriceCents} onChange={(e) => setEditPriceCents(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Ciclo</Label>
              <Select value={editBillingPeriod} onValueChange={(value) => setEditBillingPeriod(value as "monthly" | "yearly")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Descrição</Label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Features (uma por linha)</Label>
              <Textarea value={editFeaturesText} onChange={(e) => setEditFeaturesText(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={editIsActive} onCheckedChange={setEditIsActive} />
              <Label>Ativo</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={editIsCourtesy}
                onCheckedChange={(value) => {
                  if (value && courtesyExists && editPlan?.slug !== courtesySlug) {
                    toast.error("Já existe um plano cortesia");
                    return;
                  }
                  setEditIsCourtesy(value);
                  if (value) {
                    setEditSlug(courtesySlug);
                  }
                }}
              />
              <Label>Plano cortesia</Label>
            </div>
            <div className="space-y-2">
              <Label>Duração da cortesia (meses)</Label>
              <Input
                type="number"
                value={editCourtesyDurationMonths}
                onChange={(e) => setEditCourtesyDurationMonths(e.target.value)}
                disabled={!editIsCourtesy}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Planos Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead>Cortesia</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell className="font-mono text-xs">{plan.slug}</TableCell>
                  <TableCell>{(plan.priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                  <TableCell>{plan.billingPeriod === "monthly" ? "Mensal" : "Anual"}</TableCell>
                  <TableCell>{plan.isActive ? "Sim" : "Não"}</TableCell>
                  <TableCell>{plan.slug === courtesySlug ? "Sim" : "Não"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openEdit(plan)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {plans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    Nenhum plano cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPlansPage;
