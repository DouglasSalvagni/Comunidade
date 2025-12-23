"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { api, Partnership, Affiliate } from "@/services/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash, Plus } from "lucide-react";

const AdminPartnershipsPage = () => {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [allAffiliates, setAllAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  // Affiliate Split states
  const [selectedAffiliates, setSelectedAffiliates] = useState<Array<{
    affiliateId: string;
    payoutType: 'PERCENT' | 'FIXED';
    payoutValue: string;
    name?: string;
  }>>([]);
  const [currentAffiliateId, setCurrentAffiliateId] = useState("");
  const [currentPayoutType, setCurrentPayoutType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [currentPayoutValue, setCurrentPayoutValue] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const [list, affiliatesList] = await Promise.all([
        api.adminGetPartnerships(),
        api.adminGetAffiliates()
      ]);
      setPartnerships(list);
      setAllAffiliates(affiliatesList);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenDialog = async (partnership?: Partnership) => {
    if (partnership) {
      setEditingId(partnership.id);
      setCode(partnership.code);
      setDiscountType(partnership.discountType);
      setDiscountValue(partnership.discountValue);
      setStatus(partnership.status);
      
      // Reset splits loading
      setSelectedAffiliates([]);
      setIsDialogOpen(true);

      try {
        const details = await api.adminGetPartnership(partnership.id);
        if (details && details.affiliates) {
          setSelectedAffiliates(details.affiliates.map((pa: any) => ({
            affiliateId: pa.affiliateId,
            payoutType: pa.payoutType,
            payoutValue: pa.payoutValue,
            name: pa.affiliateName
          })));
        }
      } catch (e) {
        console.error(e);
        toast.error("Erro ao carregar afiliados da parceria");
      }
    } else {
      setEditingId(null);
      setCode("");
      setDiscountType("PERCENT");
      setDiscountValue("");
      setStatus("ACTIVE");
      setSelectedAffiliates([]);
      setIsDialogOpen(true);
    }
    // Reset form de adição de afiliado
    setCurrentAffiliateId("");
    setCurrentPayoutType("PERCENT");
    setCurrentPayoutValue("");
  };

  const handleAddAffiliate = () => {
    if (!currentAffiliateId || !currentPayoutValue) return;
    
    const affiliate = allAffiliates.find(a => a.id === currentAffiliateId);
    if (!affiliate) return;

    // Evitar duplicados
    if (selectedAffiliates.some(sa => sa.affiliateId === currentAffiliateId)) {
      toast.error("Afiliado já adicionado");
      return;
    }

    setSelectedAffiliates([
      ...selectedAffiliates,
      {
        affiliateId: currentAffiliateId,
        payoutType: currentPayoutType,
        payoutValue: currentPayoutValue,
        name: affiliate.name
      }
    ]);

    // Limpar campos
    setCurrentAffiliateId("");
    setCurrentPayoutValue("");
  };

  const handleRemoveAffiliate = (affiliateId: string) => {
    setSelectedAffiliates(selectedAffiliates.filter(sa => sa.affiliateId !== affiliateId));
  };

  const handleSave = async () => {
    try {
      const payload = {
        code,
        discountType,
        discountValue: Number(discountValue),
        status,
        affiliates: selectedAffiliates.map(sa => ({
          affiliateId: sa.affiliateId,
          payoutType: sa.payoutType,
          payoutValue: Number(sa.payoutValue)
        }))
      };

      if (editingId) {
        await api.adminUpdatePartnership(editingId, payload);
        toast.success("Parceria atualizada");
      } else {
        await api.adminCreatePartnership(payload);
        toast.success("Parceria criada");
      }
      setIsDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar parceria");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gerenciar Parcerias</h1>
        <Button onClick={() => handleOpenDialog()}>Nova Parceria</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parcerias e Cupons</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partnerships.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-bold">{p.code}</TableCell>
                  <TableCell>
                    {p.discountType === 'PERCENT' ? `${p.discountValue}%` : `R$ ${p.discountValue}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {p.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(p)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {partnerships.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhuma parceria encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Parceria" : "Nova Parceria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Código do Cupom</label>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="EX: VERÃO2025" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Desconto</label>
                <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENT">Porcentagem (%)</SelectItem>
                    <SelectItem value="FIXED">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor</label>
                <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder="10" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={status === 'ACTIVE'} onCheckedChange={(v) => setStatus(v ? 'ACTIVE' : 'INACTIVE')} />
              <label className="text-sm font-medium">Ativo</label>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Afiliados (Split)</h3>
              <div className="flex gap-2 items-end mb-4">
                <div className="flex-1 space-y-2">
                  <label className="text-xs">Afiliado</label>
                  <Select value={currentAffiliateId} onValueChange={setCurrentAffiliateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allAffiliates.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name} ({a.walletId})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[120px] space-y-2">
                  <label className="text-xs">Tipo Split</label>
                  <Select value={currentPayoutType} onValueChange={(v) => setCurrentPayoutType(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENT">%</SelectItem>
                      <SelectItem value="FIXED">R$</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-[100px] space-y-2">
                  <label className="text-xs">Valor</label>
                  <Input type="number" value={currentPayoutValue} onChange={(e) => setCurrentPayoutValue(e.target.value)} placeholder="10" />
                </div>
                <Button size="icon" onClick={handleAddAffiliate} disabled={!currentAffiliateId || !currentPayoutValue}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {selectedAffiliates.map((sa) => (
                  <div key={sa.affiliateId} className="flex items-center justify-between bg-secondary/50 p-2 rounded text-sm">
                    <span>{sa.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="font-mono">
                        {sa.payoutType === 'PERCENT' ? `${sa.payoutValue}%` : `R$ ${sa.payoutValue}`}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveAffiliate(sa.affiliateId)}>
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {selectedAffiliates.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-2">
                    Nenhum afiliado vinculado
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPartnershipsPage;