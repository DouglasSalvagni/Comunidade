"use client";

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Users, Tag, FileText, Shield, CreditCard, BookOpen, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    if (pathname.startsWith('/admin/login')) {
      setVerifying(false);
      return;
    }
    const verify = async () => {
      try {
        const idToken = (session as any)?.idToken as string | undefined;
        if (idToken) {
          await api.loginWithGoogle(idToken);
        }
        const user = await api.getProfile();
        if (user.role !== 'admin') {
          router.replace('/admin/login');
          return;
        }
        setAuthorized(true);
      } catch {
        router.replace('/admin/login');
      }
      setVerifying(false);
    };
    verify();
  }, [router, pathname, (session as any)?.idToken]);

  if (verifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }
  if (pathname.startsWith('/admin/login')) {
    return <main className="p-4 md:p-6 w-full">{children}</main>;
  }
  if (!authorized) return null;

  const onLogout = () => {
    signOut({ redirect: false }).finally(() => {
      api.logout().finally(() => {
        router.replace('/admin/login');
      });
    });
  };

  const linkClass = (href: string, exact = false) => {
    const active = exact
      ? pathname === href || pathname === `${href}/`
      : pathname === href || pathname.startsWith(`${href}/`);
      
    return `flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
      active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'
    }`;
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 lg:block lg:sticky lg:top-0 h-screen">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
            <Link href="/admin" className="flex items-center gap-2 font-semibold">
              <span className="">Painel Admin</span>
            </Link>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              <div className="mb-2 mt-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Visão Geral
              </div>
              <Link href="/admin" className={linkClass('/admin', true)}>
                <Home className="h-4 w-4" />
                Dashboard
              </Link>

              <div className="mb-2 mt-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Comunidade & Conteúdo
              </div>
              <Link href="/admin/community/inbox" className={linkClass('/admin/community/inbox', true)}>
                <div className="relative">
                  <MessagesSquare className="h-4 w-4" />
                </div>
                Moderação
              </Link>
              <Link href="/admin/community" className={linkClass('/admin/community', true)}>
                <MessagesSquare className="h-4 w-4" />
                Espaços
              </Link>
              <Link href="/admin/courses" className={linkClass('/admin/courses')}>
                <BookOpen className="h-4 w-4" />
                Cursos
              </Link>

              <div className="mb-2 mt-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Vendas & Assinaturas
              </div>
              <Link href="/admin/plans" className={linkClass('/admin/plans')}>
                <CreditCard className="h-4 w-4" />
                Planos
              </Link>
              <Link href="/admin/partnerships" className={linkClass('/admin/partnerships')}>
                <Tag className="h-4 w-4" />
                Parcerias & Cupons
              </Link>
              <Link href="/admin/affiliates" className={linkClass('/admin/affiliates')}>
                <Users className="h-4 w-4" />
                Afiliados
              </Link>

              <div className="mb-2 mt-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Administração
              </div>
              <Link href="/admin/users" className={linkClass('/admin/users')}>
                <Users className="h-4 w-4" />
                Usuários
              </Link>
              <Link href="/admin/anti-abuse" className={linkClass('/admin/anti-abuse')}>
                <Shield className="h-4 w-4" />
                Anti-Abuse
              </Link>
              <Link href="/admin/legal" className={linkClass('/admin/legal')}>
                <FileText className="h-4 w-4" />
                Termos & Privacidade
              </Link>
              <Link href="/admin/settings" className={linkClass('/admin/settings')}>
                <Shield className="h-4 w-4" />
                Configurações
              </Link>
            </nav>
          </div>
          <div className="border-t p-4">
            <Button variant="outline" className="w-full" onClick={onLogout}>Sair</Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
