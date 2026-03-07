"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, DevTheme } from "@/services/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

const AdminDevThemesPage = () => {
  const [themes, setThemes] = useState<DevTheme[]>([]);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editTheme, setEditTheme] = useState<DevTheme | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.adminGetDevThemes();
        setThemes(data);
      } catch (e: any) {
        toast.error(e?.message || "Falha ao carregar temas de desenvolvimento");
      }
    };
    load();
  }, []);

  const handleAdd = async () => {
    if (newName.trim() === "") return;
    try {
      const created = await api.adminCreateDevTheme({ name: newName, description: newDescription });
      setThemes([...themes, created]);
      setNewName("");
      setNewDescription("");
      toast.success("Tema criado");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao criar tema");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await api.adminDeleteDevTheme(id);
      setThemes(themes.filter((t) => t.id !== id));
      toast.success("Tema removido");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao remover tema");
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Temas de Desenvolvimento</h1>
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novo Tema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2 w-full">
              <Label htmlFor="themeName">Nome</Label>
              <Input
                id="themeName"
                placeholder="Digite o nome do tema"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2 w-full col-span-2">
              <Label htmlFor="themeDescription">Descrição</Label>
              <Textarea
                id="themeDescription"
                placeholder="Digite a descrição (opcional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAdd}>Adicionar Tema</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tema</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="editName">Nome</Label>
              <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="editDescription">Descrição</Label>
              <Textarea id="editDescription" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={async () => {
              if (!editTheme) return;
              try {
                const updated = await api.adminUpdateDevTheme(editTheme.id, { name: editName, description: editDescription });
                setThemes(themes.map(t => t.id === editTheme.id ? updated : t));
                setEditOpen(false);
                toast.success("Tema atualizado");
              } catch (e: any) {
                toast.error(e?.message || "Erro ao atualizar tema");
              }
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Temas Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {themes.map((theme) => (
                <TableRow key={theme.id}>
                  <TableCell className="font-medium">{theme.name}</TableCell>
                  <TableCell>{theme.description || ""}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => {
                      setEditTheme(theme);
                      setEditName(theme.name);
                      setEditDescription(theme.description || "");
                      setEditOpen(true);
                    }}>
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => { setDeleteId(theme.id); setConfirmOpen(true); }}>
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover tema?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é permanente e não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { handleRemove(deleteId); } setConfirmOpen(false); setDeleteId(null); }}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDevThemesPage;
