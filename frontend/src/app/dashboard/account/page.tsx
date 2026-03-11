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
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground mt-2">Gerencie suas informações pessoais e configurações de segurança.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Card className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-40" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </Card>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coluna Principal - Perfil */}
          <div className="lg:col-span-8 space-y-6">
            <Card>
              <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-2 border-muted">
                      <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || "Avatar"} className="object-cover" />
                      <AvatarFallback className="text-2xl">{getInitials(user?.name)}</AvatarFallback>
                    </Avatar>
                    <label 
                      htmlFor="avatar-upload" 
                      className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer shadow-sm hover:bg-primary/90 transition-colors"
                    >
                      <Loader2 className={`w-4 h-4 ${uploadingAvatar ? 'animate-spin' : ''}`} />
                      <span className="sr-only">Alterar avatar</span>
                    </label>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingAvatar}
                      onChange={(e) => onAvatarChange(e.target.files?.[0])}
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">Sua foto</h3>
                    <p className="text-sm text-muted-foreground">
                      Isso será exibido em seu perfil e em comentários.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome de exibição</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Biografia</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Conte um pouco sobre você..."
                      rows={4}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {bio.length}/500
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Links sociais</Label>
                    {links.map((link, index) => (
                      <div key={`link-${index}`} className="flex gap-2">
                        <Input
                          value={link.label}
                          onChange={(e) => updateLink(index, "label", e.target.value)}
                          placeholder="Título (ex: LinkedIn)"
                          className="w-1/3"
                        />
                        <Input
                          value={link.url}
                          onChange={(e) => updateLink(index, "url", e.target.value)}
                          placeholder="URL (https://...)"
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeLink(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Loader2 className="w-4 h-4 sr-only" /> 
                          {/* Hack to reuse icon sizing but show X */}
                          <span className="text-lg leading-none">&times;</span>
                        </Button>
                      </div>
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addLink}
                      className="w-full border-dashed"
                    >
                      Adicionar link
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t bg-muted/50 flex justify-end">
                <Button onClick={onSave} disabled={saving || !name}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar alterações
                </Button>
              </div>
            </Card>
          </div>

          {/* Coluna Lateral - Configurações */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <div className="p-6 space-y-4">
                <h3 className="font-semibold">Identificação</h3>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled className="bg-muted text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Para alterar seu email, entre em contato com o suporte.
                  </p>
                </div>
              </div>
            </Card>

            {user?.authProvider === 'local' && (
              <Card>
                <div className="p-6 space-y-4">
                  <h3 className="font-semibold">Segurança</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="current">Senha atual</Label>
                      <div className="relative">
                        <Input 
                          id="current" 
                          type={showCurrent ? "text" : "password"} 
                          value={currentPassword} 
                          onChange={(e) => setCurrentPassword(e.target.value)} 
                          className="pr-10" 
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowCurrent(s => !s)}>
                          {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new">Nova senha</Label>
                      <div className="relative">
                        <Input 
                          id="new" 
                          type={showNew ? "text" : "password"} 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          className="pr-10" 
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowNew(s => !s)}>
                          {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Confirmar nova senha</Label>
                      <div className="relative">
                        <Input 
                          id="confirm" 
                          type={showConfirm ? "text" : "password"} 
                          value={confirmNewPassword} 
                          onChange={(e) => setConfirmNewPassword(e.target.value)} 
                          className="pr-10" 
                        />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirm(s => !s)}>
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button 
                      onClick={onChangePassword} 
                      disabled={savingPwd || !currentPassword || !newPassword || newPassword !== confirmNewPassword}
                      className="w-full mt-2"
                      variant="secondary"
                    >
                      {savingPwd && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Atualizar senha
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <Card className="border-destructive/20">
              <div className="p-6 space-y-4">
                <h3 className="font-semibold text-destructive">Zona de Perigo</h3>
                <p className="text-sm text-muted-foreground">
                  A exclusão da conta é permanente e não pode ser desfeita.
                </p>
                
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full" disabled={deleting}>
                      Excluir minha conta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão da conta?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Todos os dados associados à sua conta serão removidos.
                      </AlertDialogDescription>
                      {hasActivePaidPlan ? (
                        <div className="text-sm text-muted-foreground space-y-2 bg-muted p-3 rounded-md mt-2">
                          <p className="font-medium text-foreground">Atenção:</p>
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
                            <Link href="/dashboard/subscriptions">Gerenciar Assinatura</Link>
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
                            className="bg-destructive hover:bg-destructive/90"
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
                          className="bg-destructive hover:bg-destructive/90"
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
                        Ao continuar, sua assinatura será cancelada imediatamente e sua conta será excluída permanentemente.
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
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {deleting ? "Processando..." : "Cancelar e excluir"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountPage;
