"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/services/api";
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import { getAuthProvidersStatus } from "../actions";

export const dynamic = "force-dynamic";

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

const GoogleIcon = () => (
  <svg className="h-4 w-4 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
    <path fill="#4285F4" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
  </svg>
);

const AppleIcon = () => (
  <svg className="h-4 w-4 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="apple" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
    <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-31.4-57.3-114.8-57.3-114.8zm-65.2-193.8c15.5-18.8 25.9-45.1 25.9-71 0-4-.3-8-.9-12-26.7 1.1-54 18-73.1 40.2-16.1 18.8-28.1 47.3-28.1 72.6 0 4.1.4 8.2 1 12.1 29.8-1.1 59.7-19.1 75.2-40.9z"></path>
  </svg>
);

const LoginPageContent = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [hasGoogle, setHasGoogle] = useState(false);
  const [hasApple, setHasApple] = useState(false);
  const params = useSearchParams();
  const nextParam = params.get('next');
  const safeNext = nextParam && nextParam.startsWith('/dashboard') ? nextParam : null;
  const accountDeleted = params.get('accountDeleted') === '1';

  useEffect(() => {
    getAuthProvidersStatus().then((status) => {
      setHasGoogle(status.hasGoogle);
      setHasApple(status.hasApple);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const ensureNotLogged = async () => {
      try {
        const me = await api.getProfile();
        if (me && me.id) {
          if (me.role === 'admin') {
            router.replace('/admin');
          } else {
            const accepted = !!(me as any)?.acceptedLegal;
            router.replace(accepted ? (safeNext ?? '/dashboard') : '/auth/legal');
          }
          return;
        }
      } catch {}
    };
    ensureNotLogged();
    const exchangeSocial = async () => {
      const idToken = (session as any)?.idToken as string | undefined;
      const oauthProvider = (session as any)?.oauthProvider as string | undefined;
      if (!idToken) return;
      try {
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
      } catch (err: any) {
        // Se falhar, permanece na página de login
      }
    };
    exchangeSocial();
    }, [(session as any)?.idToken, (session as any)?.oauthProvider, router, safeNext]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = await api.login(email, password);
      if (auth.user.role === "admin") {
        router.push("/admin");
      } else {
        const accepted = !!(auth?.user as any)?.acceptedLegal;
        router.push(accepted ? (safeNext ?? "/dashboard") : "/auth/legal");
      }
    } catch (err: any) {
      setError(err?.message || "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Digite seu e-mail abaixo para fazer login em sua conta.
          </CardDescription>
          {accountDeleted ? (
            <p className="text-sm text-green-600">
              Conta excluída com sucesso.
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
                <Link href="/auth/forgot" className="ml-auto inline-block text-sm underline">
                  Esqueceu sua senha?
                </Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(s => !s)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Login"}
            </Button>
            {hasGoogle && (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full flex items-center justify-center" 
                onClick={() => signIn('google', { callbackUrl: safeNext ? `/auth/callback?next=${encodeURIComponent(safeNext)}` : '/auth/callback' })}
              >
                <GoogleIcon />
                Login com Google
              </Button>
            )}
            {hasApple && (
              <Button 
                type="button" 
                className="w-full flex items-center justify-center bg-black text-white hover:bg-black/90" 
                onClick={() => signIn('apple', { callbackUrl: safeNext ? `/auth/callback?next=${encodeURIComponent(safeNext)}` : '/auth/callback' })}
              >
                <AppleIcon />
                Login com Apple
              </Button>
            )}
          </form>
          <div className="mt-4 text-center text-sm">
            Não tem uma conta?{" "}
            <Link href="/auth/register" className="underline">
              Inscreva-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const LoginPage = () => {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
};

export default LoginPage;
