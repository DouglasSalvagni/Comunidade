"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, User, Subscription } from "@/services/api";
import Link from "next/link";
import { CreditCard, User as UserIcon, ShieldCheck, CalendarDays, ArrowRight, PlayCircle, MessagesSquare, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/context/SettingsContext";

const DashboardPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();

  const isSubscriptionsEnabled = process.env.NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS_FEATURE !== 'false';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [me, sub] = await Promise.all([
          api.getProfile(),
          isSubscriptionsEnabled ? api.getCurrentSubscription().catch(() => null) : Promise.resolve(null),
        ]);
        setUser(me);
        setSubscription(sub);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isSubscriptionsEnabled]);

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

  const supportEmail = settings.support_email;

  const isCoursesEnabled = process.env.NEXT_PUBLIC_ENABLE_COURSES_FEATURE !== 'false';
  const isCommunityEnabled = process.env.NEXT_PUBLIC_ENABLE_COMMUNITY_FEATURE !== 'false';

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Olá, <span className="font-semibold text-foreground">{loading ? "..." : getFirstName(user?.name)}</span>. Bem-vindo de volta!
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-full border">
          <CalendarDays className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow duration-300 border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Status da Conta</p>
              <ShieldCheck className={`h-4 w-4 ${user?.emailVerified ? "text-green-500" : "text-amber-500"}`} />
            </div>
            <div className="flex flex-col mt-2 gap-1">
              {loading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <div className={`text-2xl font-bold ${user?.emailVerified ? "text-green-600" : "text-amber-600"}`}>
                  {user?.emailVerified ? "Verificado" : "Pendente"}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {loading ? "..." : (user?.emailVerified ? "Acesso total liberado" : "Verifique seu email")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-300 border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Plano Atual</p>
              <CreditCard className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex flex-col mt-2 gap-1">
              {loading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <div className="text-2xl font-bold truncate text-blue-600">
                  {subscription?.plan?.name || "Gratuito"}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {loading ? "..." : (subscription?.status === 'active' ? "Assinatura ativa" : "Nenhuma assinatura ativa")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-300 border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Membro desde</p>
              <Clock className="h-4 w-4 text-purple-500" />
            </div>
            <div className="flex flex-col mt-2 gap-1">
              {loading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <div className="text-2xl font-bold text-purple-600">
                  {formatDate(user?.createdAt?.toString())}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Data de registro
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-300 border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">Tipo de Conta</p>
              <UserIcon className="h-4 w-4 text-orange-500" />
            </div>
            <div className="flex flex-col mt-2 gap-1">
              {loading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <div className="text-2xl font-bold capitalize text-orange-600">
                  {user?.role === 'admin' ? 'Admin' : 'Membro'}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Nível de acesso
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Actions */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-primary" />
            Acesso Rápido
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {isCoursesEnabled && (
              <Link href="/dashboard/courses" className="block group">
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50 group-hover:-translate-y-1">
                  <CardContent className="p-6 flex flex-col h-full justify-between">
                    <div className="space-y-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <PlayCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">Meus Cursos</h3>
                        <p className="text-sm text-muted-foreground">Continue assistindo suas aulas de onde parou</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400">
                      Acessar Cursos <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}

            {isCommunityEnabled && (
              <Link href="/dashboard/community" className="block group">
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50 group-hover:-translate-y-1">
                  <CardContent className="p-6 flex flex-col h-full justify-between">
                    <div className="space-y-4">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                        <MessagesSquare className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">Comunidade</h3>
                        <p className="text-sm text-muted-foreground">Interaja com outros membros e participe das discussões</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-medium text-green-600 dark:text-green-400">
                      Ir para Comunidade <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}

            <Link href="/dashboard/account" className="block group">
              <div className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/50 hover:border-primary/30 transition-all">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium group-hover:text-primary transition-colors">Meu Perfil</p>
                  <p className="text-xs text-muted-foreground">Gerenciar dados</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {isSubscriptionsEnabled && (
              <Link href="/dashboard/subscriptions" className="block group">
                <div className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/50 hover:border-primary/30 transition-all">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium group-hover:text-primary transition-colors">Assinatura</p>
                    <p className="text-xs text-muted-foreground">Planos e faturas</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {supportEmail && (
            <Card className="bg-primary/5 border-primary/20 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -mr-4 -mt-4" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Precisa de ajuda?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative">
                <p className="text-sm text-muted-foreground">
                  Se você tiver alguma dúvida ou problema com sua conta, nossa equipe de suporte está pronta para ajudar.
                </p>
                <Button className="w-full shadow-lg hover:shadow-xl transition-all" asChild>
                  <Link href={`mailto:${supportEmail}`}>Falar com Suporte</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Dicas Rápidas
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                Mantenha seu perfil atualizado para receber novidades.
              </li>
              {isCoursesEnabled && (
                <li className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Verifique os novos cursos adicionados mensalmente.
                </li>
              )}
              {isCommunityEnabled && (
                <li className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  Participe das discussões na comunidade para tirar dúvidas.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
