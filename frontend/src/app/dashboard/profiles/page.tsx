"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { api, Profile } from "@/services/api";
import { toast } from "sonner";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

const ProfilesPage = () => {
  const [items, setItems] = useState<Profile[]>([]);
  const [newName, setNewName] = useState("");
  const [newBirthDate, setNewBirthDate] = useState<string>("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editBirthDate, setEditBirthDate] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try { const list = await api.getProfiles(); setItems(list); } catch (e: any) { toast.error(e?.message || "Falha ao carregar perfis"); }
    };
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Gerenciamento de Perfis</h1>
        <p className="text-muted-foreground">Adicione e gerencie os perfis das crianças.</p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Perfis</h2>
        <div className="space-y-3">
          {items.map((p, i) => (
            <div key={i} className="flex items-center gap-3 border rounded-md p-3">
              {editIndex === i ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nome"
                    className="max-w-xs"
                  />
                  <Input
                    type="date"
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    placeholder="Data de nascimento"
                    className="w-44"
                  />
                  <div className="ml-auto flex gap-2">
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          const payload: any = { name: editName };
                          if (editBirthDate && /^\d{4}-\d{2}-\d{2}$/.test(editBirthDate)) payload.birthDate = editBirthDate;
                          const updated = await api.updateProfile(p.id, payload);
                          setItems((prev) => prev.map((it, idx) => (idx === i ? updated : it)));
                          setEditIndex(null);
                          setEditName("");
                          setEditBirthDate("");
                        } catch (e: any) { toast.error(e?.message || "Falha ao atualizar"); }
                      }}
                    >
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditIndex(null);
                        setEditName("");
                        setEditBirthDate("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground">{p.birthDate || "-"}</div>
                  <div className="ml-auto flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditIndex(i);
                        setEditName(p.name);
                        setEditBirthDate(p.birthDate || "");
                      }}
                    >
                      Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">Excluir</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir perfil?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita. Confirme para remover o perfil.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={async () => {
                            try { await api.deleteProfile(p.id); setItems((prev) => prev.filter((_, idx) => idx !== i)); }
                            catch (e: any) { toast.error(e?.message || "Falha ao excluir"); }
                          }}>Confirmar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Adicionar novo perfil</h2>
        <div className="space-y-4 max-w-sm">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" placeholder="Nome da criança" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Data de nascimento</Label>
            <Input type="date" value={newBirthDate} onChange={(e) => setNewBirthDate(e.target.value)} />
          </div>
          <Button
            onClick={async () => {
              if (!newName) return;
              try {
                const payload: any = { name: newName };
                if (newBirthDate && /^\d{4}-\d{2}-\d{2}$/.test(newBirthDate)) payload.birthDate = newBirthDate;
                const created = await api.createProfile(payload);
                setItems((prev) => [...prev, created]);
                setNewName("");
                setNewBirthDate("");
              } catch (e: any) { toast.error(e?.message || "Falha ao criar perfil"); }
            }}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Adicionar Perfil
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProfilesPage;
