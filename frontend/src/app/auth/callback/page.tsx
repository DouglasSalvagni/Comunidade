"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/services/api";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const run = async () => {
      try {
        const idToken = (session as any)?.idToken as string | undefined;
        if (idToken) {
          const auth = await api.loginWithGoogle(idToken);
          if (auth?.user?.role === "admin") {
            router.replace("/admin");
          } else {
            const accepted = !!(auth?.user as any)?.acceptedLegal;
            router.replace(accepted ? "/dashboard" : "/auth/legal");
          }
        }
      } catch {
        router.replace("/auth/login");
      }
    };
    run();
  }, [(session as any)?.idToken, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Concluindo login...</p>
      </div>
    </div>
  );
}

