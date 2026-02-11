"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { api, User } from "@/services/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"user" | "admin" | "">("");
  const [editActive, setEditActive] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [courtesyAutoGrantEnabled, setCourtesyAutoGrantEnabled] = useState(false);
  const [courtesyLoading, setCourtesyLoading] = useState(true);
  const courtesySlug = "plano-cortesia";
  const freeSlug = "plano-gratuito";

  useEffect(() => {
    const load = async () => {
      try {
        const list = await api.adminGetUsers();
        setUsers(list);
      } catch (e: any) {
        toast.error(e?.message || "Falha ao carregar usuários");
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadCourtesyToggle = async () => {
      try {
        setCourtesyLoading(true);
        const data = await api.adminGetCourtesyAutoGrant();
        setCourtesyAutoGrantEnabled(!!data?.enabled);
      } catch (e: any) {
        toast.error(e?.message || "Falha ao carregar configuração de cortesia");
      } finally {
        setCourtesyLoading(false);
      }
    };
    loadCourtesyToggle();
  }, []);

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await api.adminToggleUserStatus(id);
      setUsers((prev) => prev.map(u => u.id === id ? updated : u));
    } catch (e: any) {
      toast.error(e?.message || "Erro ao atualizar status");
    }
  };

  const handleToggleCourtesyAutoGrant = async (enabled: boolean) => {
    try {
      setCourtesyAutoGrantEnabled(enabled);
      await api.adminUpdateCourtesyAutoGrant(enabled);
      toast.success(enabled ? "Cortesia automática ativada" : "Cortesia automática desativada");
    } catch (e: any) {
      setCourtesyAutoGrantEnabled((prev) => !prev);
      toast.error(e?.message || "Erro ao atualizar cortesia automática");
    }
  };

  const handleGrantCourtesy = async (userId: string) => {
    try {
      await api.adminGrantCourtesy(userId);
      toast.success("Plano cortesia concedido");
      const list = await api.adminGetUsers();
      setUsers(list);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao conceder cortesia");
    }
  };

  const handleRevokeCourtesy = async (userId: string) => {
    try {
      await api.adminRevokeCourtesy(userId);
      toast.success("Plano cortesia revogado");
      const list = await api.adminGetUsers();
      setUsers(list);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao revogar cortesia");
    }
  };

  const filteredUsers = useMemo(() => (users ?? []).filter(
    (user) =>
      (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  ), [users, searchTerm]);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>

      <Card>
        <CardHeader>
          <CardTitle>Plano cortesia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Conceder automaticamente no cadastro</p>
              <p className="text-xs text-muted-foreground">Ativa ou desativa a cortesia automática para novos usuários</p>
            </div>
            <Switch
              checked={courtesyAutoGrantEnabled}
              disabled={courtesyLoading}
              onCheckedChange={(v) => handleToggleCourtesyAutoGrant(!!v)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Switch checked={user.isActive} onCheckedChange={() => handleToggleStatus(user.id)} />
                  </TableCell>
                  <TableCell className="text-right">
                    {user.currentSubscription?.plan?.slug === courtesySlug ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mr-2"
                        onClick={() => handleRevokeCourtesy(user.id)}
                      >
                        Revogar cortesia
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mr-2"
                        disabled={!!user.currentSubscription && user.currentSubscription.plan?.slug !== freeSlug && user.currentSubscription.plan?.slug !== courtesySlug}
                        onClick={() => handleGrantCourtesy(user.id)}
                      >
                        Cortesia
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => {
                      setEditingUser(user);
                      setEditName(user.name || "");
                      setEditEmail(user.email || "");
                      setEditRole(user.role || "user");
                      setEditActive(!!user.isActive);
                    }}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => setRemoveId(user.id)}>Remover</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (currentPage > 1) paginate(currentPage - 1); }} />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink href="#" isActive={currentPage === i + 1} onClick={(e) => { e.preventDefault(); paginate(i + 1); }}>
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) paginate(currentPage + 1); }} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
      <Dialog open={!!editingUser} onOpenChange={(open) => { if (!open) setEditingUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="editName" className="text-sm font-medium">Nome</label>
              <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="editEmail" className="text-sm font-medium">Email</label>
              <Input id="editEmail" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Perfil</label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ativo</label>
              <Switch checked={editActive} onCheckedChange={(v) => setEditActive(!!v)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
            <Button onClick={async () => {
              if (!editingUser) return;
              try {
                const payload: any = {
                  name: editName || undefined,
                  email: editEmail || undefined,
                  role: editRole || undefined,
                  isActive: editActive,
                };
                const updated = await api.adminUpdateUser(editingUser.id, payload);
                setUsers((prev) => prev.map(u => u.id === updated.id ? updated : u));
                toast.success("Usuário atualizado");
                setEditingUser(null);
              } catch (e: any) {
                toast.error(e?.message || "Erro ao atualizar usuário");
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
          <p>Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => {
              if (!removeId) return;
              try {
                await api.adminDeleteUser(removeId);
                setUsers((prev) => prev.filter(u => u.id !== removeId));
                toast.success("Usuário removido");
              } catch (e: any) {
                toast.error(e?.message || "Erro ao remover usuário");
              }
              setRemoveId(null);
            }}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;
