"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const nextPath = `${pathname}${search ? `?${search}` : ""}`;
  const { data: session } = useSession();

  useEffect(() => {
    const verify = async () => {
      try {
        const me = await api.getProfile();
        if (me?.authProvider === 'local' && me?.emailVerified === false) {
          router.replace('/auth/pending');
          setAuthorized(false);
        } else if (me?.role !== 'admin' && !(me as any)?.acceptedLegal) {
          if ((me as any)?.hasAcceptedAnyRequired) {
            setAuthorized(true);
          } else {
            router.replace('/auth/legal');
            setAuthorized(false);
          }
        } else {
          setAuthorized(true);
        }
      } catch (e: any) {
        const next = nextPath.startsWith("/dashboard") ? nextPath : "/dashboard";
        router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
      }
      setVerifying(false);
    };
    verify();
  }, [router]);

  return (
    <div className="flex min-h-screen">
      {verifying && (
        <div className="flex items-center justify-center w-full">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Verificando acesso...</p>
          </div>
        </div>
      )}
      {!verifying && authorized && (
        <>
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <div className="flex flex-col flex-1">
            <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            <main className="flex-1 p-4 md:p-8">
              {children}
            </main>
          </div>
        </>
      )}
    </div>
  );
}
