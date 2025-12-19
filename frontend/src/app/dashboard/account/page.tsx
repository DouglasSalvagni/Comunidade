"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api, User } from "@/services/api";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const AccountPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await api.getProfile();
        setUser(me);
        setName(me.name || "");
      } catch (e: any) {
        toast.error(e?.message || "Falha ao carregar perfil");
      }
      setLoading(false);
    };
    load();
  }, []);

  const onSave = async () => {
    if (!name || !user) return;
    setSaving(true);
    try {
      const updated = await api.updateMyProfile({ name });
      setUser(updated);
      toast.success("Perfil atualizado");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao atualizar perfil");
    }
    setSaving(false);
  };

  const onChangePassword = async () => {
    if (!user || user.authProvider !== 'local') return;
    if (!currentPassword || !newPassword || newPassword !== confirmNewPassword) {
      toast.error("Verifique as senhas informadas.");
      return;
    }
    setSavingPwd(true);
    try {
      const updated = await api.changeMyPassword({ currentPassword, newPassword });
      setUser(updated);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success("Senha alterada com sucesso");
    } catch (e: any) {
      const msg = e?.message || "Falha ao alterar senha";
      toast.error(msg);
    }
    setSavingPwd(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground">Atualize seu nome de exibição.</p>
      </div>

      {loading ? (
        <Card className="p-6 max-w-lg space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="pt-6 space-y-4">
            <Skeleton className="h-7 w-40" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-44" />
          </div>
        </Card>
      ) : (
        <Card className="p-6 max-w-lg">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted text-muted-foreground" />
            </div>
            <div className="flex gap-2">
              <Button onClick={onSave} disabled={saving || !name}>Salvar</Button>
            </div>
            {user?.authProvider === 'local' ? (
              <div className="pt-6 space-y-3">
                <h3 className="text-lg font-semibold">Alterar Senha</h3>
                <div className="space-y-2">
                  <Label htmlFor="current">Senha atual</Label>
                  <div className="relative">
                    <Input id="current" type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="pr-10" />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowCurrent(s => !s)}>
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new">Nova senha</Label>
                  <div className="relative">
                    <Input id="new" type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pr-10" />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowNew(s => !s)}>
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmar nova senha</Label>
                  <div className="relative">
                    <Input id="confirm" type={showConfirm ? "text" : "password"} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="pr-10" />
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowConfirm(s => !s)}>
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Button onClick={onChangePassword} disabled={savingPwd || !currentPassword || !newPassword || newPassword !== confirmNewPassword}>Salvar nova senha</Button>
                </div>
              </div>
            ) : (
              <div className="pt-6">
                <p className="text-sm text-muted-foreground">Sua conta está conectada via login social (ex.: Google). Alteração de senha não está disponível.</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AccountPage;