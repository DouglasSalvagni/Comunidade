"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/services/api";
import { Loader2 } from "lucide-react";

const getAppleUserIdFromToken = (token: string): string | null => {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(window.atob(padded));
    const sub = payload?.sub;
    return typeof sub === "string" && sub.length > 0 ? sub : null;
  } catch {
    return null;
  }
};

const getProviderFromToken = (token: string): "apple" | "google" | null => {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(window.atob(padded));
    return payload?.iss === "https://appleid.apple.com" ? "apple" : "google";
  } catch {
    return null;
  }
};

const AuthCallbackContent = () => {
  const router = useRouter();
  const params = useSearchParams();
  const nextParam = params.get('next');
  const safeNext = nextParam && nextParam.startsWith('/dashboard') ? nextParam : null;
  const { data: session } = useSession();

  useEffect(() => {
    const run = async () => {
      try {
        const idToken = (session as any)?.idToken as string | undefined;
        const oauthProvider = (session as any)?.oauthProvider as string | undefined;
        if (idToken) {
          const resolvedProvider = oauthProvider === "apple" || oauthProvider === "google"
            ? oauthProvider
            : getProviderFromToken(idToken);
          let auth;
          if (resolvedProvider === "apple") {
            const appleUserId = getAppleUserIdFromToken(idToken);
            if (!appleUserId) throw new Error("Apple user inválido");
            auth = await api.loginWithApple(idToken, appleUserId);
          } else if (resolvedProvider === "google") {
            auth = await api.loginWithGoogle(idToken);
          } else {
            throw new Error("Provider OAuth inválido");
          }
          if (auth?.user?.role === "admin") {
            router.replace("/admin");
          } else {
            const accepted = !!(auth?.user as any)?.acceptedLegal;
            router.replace(accepted ? (safeNext ?? "/dashboard") : "/auth/legal");
          }
        }
      } catch {
        router.replace("/auth/login");
      }
    };
    run();
  }, [(session as any)?.idToken, (session as any)?.oauthProvider, router, safeNext]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Concluindo login...</p>
      </div>
    </div>
  );
};

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackContent />
    </Suspense>
  );
}

