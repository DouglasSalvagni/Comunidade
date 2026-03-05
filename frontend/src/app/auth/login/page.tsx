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

const LoginPageContent = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const params = useSearchParams();
  const nextParam = params.get('next');
  const safeNext = nextParam && nextParam.startsWith('/dashboard') ? nextParam : null;

  

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
        let auth;
        if (oauthProvider === "apple") {
          const appleUserId = getAppleUserIdFromToken(idToken);
          if (!appleUserId) throw new Error("Apple user inválido");
          auth = await api.loginWithApple(idToken, appleUserId);
        } else {
          auth = await api.loginWithGoogle(idToken);
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
            <Button type="button" variant="outline" className="w-full" onClick={() => signIn('google', { callbackUrl: safeNext ? `/auth/callback?next=${encodeURIComponent(safeNext)}` : '/auth/callback' })}>
              Login com Google
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => signIn('apple', { callbackUrl: safeNext ? `/auth/callback?next=${encodeURIComponent(safeNext)}` : '/auth/callback' })}>
              Login com Apple
            </Button>
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
