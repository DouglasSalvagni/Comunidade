"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, Tag } from "@/services/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const AdminTagsPage = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#000000");
  const [editOpen, setEditOpen] = useState(false);
  const [editTag, setEditTag] = useState<Tag | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#000000");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.adminGetTags();
        setTags(data);
      } catch (e: any) {
        toast.error(e?.message || "Falha ao carregar tags");
      }
    };
    load();
  }, []);

  const handleAddTag = async () => {
    if (newTagName.trim() === "") return;
    try {
      const created = await api.adminCreateTag({ name: newTagName, color: newTagColor });
      setTags([...tags, created]);
      setNewTagName("");
      setNewTagColor("#000000");
      toast.success("Tag criada");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao criar tag");
    }
  };

  const handleRemoveTag = async (id: string) => {
    try {
      await api.adminDeleteTag(id);
      setTags(tags.filter((tag) => tag.id !== id));
      toast.success("Tag removida");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao remover tag");
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Gerenciar Tags</h1>
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Nova Tag</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2 w-full">
              <Label htmlFor="tagName">Nome da Tag</Label>
              <Input
                id="tagName"
                placeholder="Digite o nome da tag"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
            </div>
            <div className="space-y-2 w-full">
              <Label htmlFor="tagColor">Cor</Label>
              <Input id="tagColor" type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddTag}>
                Adicionar Tag
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tag</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="editName">Nome</Label>
              <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editColor">Cor</Label>
              <Input id="editColor" type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={async () => {
              if (!editTag) return;
              try {
                const updated = await api.adminUpdateTag(editTag.id, { name: editName, color: editColor });
                setTags(tags.map(t => t.id === editTag.id ? updated : t));
                setEditOpen(false);
                toast.success("Tag atualizada");
              } catch (e: any) {
                toast.error(e?.message || "Erro ao atualizar tag");
              }
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Tags Existentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell><span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: tag.color }} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => {
                      setEditTag(tag);
                      setEditName(tag.name);
                      setEditColor(tag.color);
                      setEditOpen(true);
                    }}>
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveTag(tag.id)}
                    >
                      Remover
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTagsPage;
