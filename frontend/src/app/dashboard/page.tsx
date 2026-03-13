"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, User, Subscription } from "@/services/api";
import Link from "next/link";
import { CreditCard, User as UserIcon, ShieldCheck, CalendarDays, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const DashboardPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [me, sub] = await Promise.all([
          api.getProfile(),
          api.getCurrentSubscription().catch(() => null),
        ]);
        setUser(me);
        setSubscription(sub);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getFirstName = (fullName?: string) => {
    return fullName?.split(" ")[0] || "visitante";
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Olá, {loading ? "..." : getFirstName(user?.name)}. Bem-vindo de volta!
          </p>
        </div>
        <div className="flex gap-2">
          {/* Ações rápidas futuras podem vir aqui */}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status da Conta</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="flex items-center gap-2">
                <div className={`text-2xl font-bold ${user?.emailVerified ? "text-green-600" : "text-yellow-600"}`}>
                  {user?.emailVerified ? "Verificado" : "Pendente"}
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {loading ? "Carregando..." : (user?.emailVerified ? "Acesso total liberado" : "Verifique seu email")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plano Atual</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-2xl font-bold truncate">
                {subscription?.plan?.name || "Gratuito"}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {loading ? "Carregando..." : (subscription?.status === 'active' ? "Assinatura ativa" : "Nenhuma assinatura ativa")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membro desde</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                {formatDate(user?.createdAt?.toString())}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Data de registro
            </p>
          </CardContent>
        </Card>

        <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipo de Conta</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
               <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold capitalize">
                {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Nível de acesso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Link href="/dashboard/account" className="block group">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <p className="font-medium group-hover:text-primary transition-colors">Meu Perfil</p>
                  <p className="text-sm text-muted-foreground">Gerencie seus dados e senha</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            <Link href="/dashboard/subscriptions" className="block group">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <p className="font-medium group-hover:text-primary transition-colors">Assinatura</p>
                  <p className="text-sm text-muted-foreground">Ver planos e pagamentos</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            {/* Adicionar mais links aqui conforme necessário */}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Precisa de ajuda?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Se você tiver alguma dúvida ou problema com sua conta, entre em contato com nosso suporte.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="mailto:suporte@exemplo.com">Falar com Suporte</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
