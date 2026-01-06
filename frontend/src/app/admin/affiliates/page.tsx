"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { api, Affiliate } from "@/services/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const AdminAffiliatesPage = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [walletId, setWalletId] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const load = async () => {
    try {
      setLoading(true);
      const list = await api.adminGetAffiliates();
      setAffiliates(list);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao carregar afiliados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOpenDialog = (affiliate?: Affiliate) => {
    if (affiliate) {
      setEditingId(affiliate.id);
      setName(affiliate.name);
      setEmail(affiliate.email);
      setWalletId(affiliate.walletId);
      setStatus(affiliate.status);
    } else {
      setEditingId(null);
      setName("");
      setEmail("");
      setWalletId("");
      setStatus("ACTIVE");
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        name,
        email,
        walletId,
      };

      if (editingId) {
        payload.status = status;
        await api.adminUpdateAffiliate(editingId, payload);
        toast.success("Afiliado atualizado");
      } else {
        await api.adminCreateAffiliate(payload);
        toast.success("Afiliado criado");
      }
      setIsDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar afiliado");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gerenciar Afiliados</h1>
        <Button onClick={() => handleOpenDialog()}>Novo Afiliado</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Afiliados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Wallet ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {affiliates.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell className="font-mono text-xs">{a.walletId}</TableCell>
                  <TableCell>
                    <Badge variant={a.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {a.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(a)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {affiliates.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum afiliado encontrado.
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
            <DialogTitle>{editingId ? "Editar Afiliado" : "Novo Afiliado"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do Afiliado" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" type="email" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Wallet ID (Asaas)</label>
              <Input value={walletId} onChange={(e) => setWalletId(e.target.value)} placeholder="wallet_..." />
              <p className="text-xs text-muted-foreground">ID da carteira no Asaas para split de pagamento.</p>
            </div>
            
            {editingId && (
              <div className="flex items-center gap-2 pt-2">
                <Switch checked={status === 'ACTIVE'} onCheckedChange={(v) => setStatus(v ? 'ACTIVE' : 'INACTIVE')} />
                <label className="text-sm font-medium">Ativo</label>
              </div>
            )}
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

export default AdminAffiliatesPage;
