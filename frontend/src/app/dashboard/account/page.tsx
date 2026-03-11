"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api, Subscription, User } from "@/services/api";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut } from "next-auth/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AccountPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState<Array<{ label: string; url: string }>>([]);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCancelAndDeleteDialogOpen, setIsCancelAndDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [me, currentSubscription] = await Promise.all([
          api.getProfile(),
          api.getCurrentSubscription().catch(() => null),
        ]);
        setUser(me);
        setName(me.name || "");
        setBio(me.bio || "");
        setLinks(Array.isArray(me.profileLinks) ? me.profileLinks : []);
        setSubscription(currentSubscription);
      } catch (e: any) {
        toast.error(e?.message || "Falha ao carregar perfil");
      }
      setLoading(false);
    };
    load();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const dateOnly = dateString.split("T")[0];
    const [year, month, day] = dateOnly.split("-");
    if (!year || !month || !day) return "Data inválida";
    return `${day}/${month}/${year}`;
  };

  const subscriptionSlug = subscription?.plan?.slug;
  const isFreeOrCourtesyPlan = subscriptionSlug === "plano-gratuito" || subscriptionSlug === "plano-cortesia";
  const hasActivePaidPlan = !!subscription?.plan && !isFreeOrCourtesyPlan;

  const onSave = async () => {
    if (!name || !user) return;
    setSaving(true);
    try {
      const normalizedLinks = links
        .map((link) => ({ label: (link.label || "").trim(), url: (link.url || "").trim() }))
        .filter((link) => link.label && link.url);
      const updated = await api.updateMyProfile({ name, bio, profileLinks: normalizedLinks });
      setUser(updated);
      setBio(updated.bio || "");
      setLinks(Array.isArray(updated.profileLinks) ? updated.profileLinks : []);
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

  const onDeleteAccount = async (withCancellation: boolean) => {
    setDeleting(true);
    try {
      if (withCancellation) {
        await api.cancelSubscription();
      }
      await api.deleteMyAccount();
      await Promise.allSettled([signOut({ redirect: false }), api.clearToken()]);
      router.replace("/auth/login?accountDeleted=1");
    } catch (e: any) {
      toast.error(e?.message || (withCancellation ? "Falha ao cancelar assinatura e excluir conta" : "Falha ao excluir conta"));
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
      setIsCancelAndDeleteDialogOpen(false);
    }
  };

  const getInitials = (fullName?: string) => {
    const cleaned = (fullName || "").trim();
    if (!cleaned) return "U";
    const parts = cleaned.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  const onAvatarChange = async (file?: File) => {
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const { uploadUrl, key } = await api.getMyAvatarUploadUrl(
        file.name,
        file.type || "application/octet-stream",
      );
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!uploadResponse.ok) {
        throw new Error("Falha no upload do avatar");
      }
      const updated = await api.updateMyAvatar(key);
      setUser(updated);
      toast.success("Avatar atualizado");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao atualizar avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const updateLink = (index: number, key: "label" | "url", value: string) => {
    setLinks((prev) => prev.map((link, i) => (i === index ? { ...link, [key]: value } : link)));
  };

  const addLink = () => {
    setLinks((prev) => [...prev, { label: "", url: "" }]);
  };

  const removeLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
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
              <Label>Avatar</Label>
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || "Avatar"} />
                  <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={uploadingAvatar}
                    onChange={(e) => onAvatarChange(e.target.files?.[0])}
                  />
                  {uploadingAvatar ? (
                    <p className="mt-1 text-xs text-muted-foreground">Enviando avatar...</p>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Escreva uma bio curta"
                rows={4}
              />
            </div>
            <div className="space-y-3">
              <Label>Links do perfil</Label>
              {links.map((link, index) => (
                <div key={`link-${index}`} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
                  <Input
                    value={link.label}
                    onChange={(e) => updateLink(index, "label", e.target.value)}
                    placeholder="Rótulo"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => updateLink(index, "url", e.target.value)}
                    placeholder="https://..."
                  />
                  <Button type="button" variant="outline" onClick={() => removeLink(index)}>
                    Remover
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addLink}>
                Adicionar link
              </Button>
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

            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold text-red-600">Excluir conta</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-3">
                Esta ação é permanente e remove seu acesso à plataforma.
              </p>
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={deleting}>
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Excluir conta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão da conta?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Todos os dados associados à sua conta serão removidos.
                    </AlertDialogDescription>
                    {hasActivePaidPlan ? (
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>
                          Seu plano pago está ativo
                          {subscription?.periodEnd ? ` até ${formatDate(subscription.periodEnd)}.` : "."}
                        </p>
                        <p>Você pode cancelar sua assinatura antes de excluir a conta.</p>
                      </div>
                    ) : null}
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                    {hasActivePaidPlan ? (
                      <>
                        <Button asChild variant="outline" disabled={deleting}>
                          <Link href="/dashboard/subscriptions">Ir para Assinatura</Link>
                        </Button>
                        <AlertDialogAction
                          onClick={(event) => {
                            event.preventDefault();
                            if (!deleting) {
                              setIsDeleteDialogOpen(false);
                              setIsCancelAndDeleteDialogOpen(true);
                            }
                          }}
                          disabled={deleting}
                        >
                          Excluir mesmo assim
                        </AlertDialogAction>
                      </>
                    ) : (
                      <AlertDialogAction
                        onClick={(event) => {
                          event.preventDefault();
                          if (!deleting) {
                            onDeleteAccount(false);
                          }
                        }}
                        disabled={deleting}
                      >
                        {deleting ? "Excluindo..." : "Confirmar exclusão"}
                      </AlertDialogAction>
                    )}
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog open={isCancelAndDeleteDialogOpen} onOpenChange={setIsCancelAndDeleteDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar assinatura e excluir conta?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ao continuar, sua assinatura será cancelada e, em seguida, sua conta será excluída permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Voltar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(event) => {
                        event.preventDefault();
                        if (!deleting) {
                          onDeleteAccount(true);
                        }
                      }}
                      disabled={deleting}
                    >
                      {deleting ? "Processando..." : "Cancelar assinatura e excluir"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AccountPage;
