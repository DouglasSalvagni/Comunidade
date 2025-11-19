"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/services/api";
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const [showPassword, setShowPassword] = useState(false);

  

  useEffect(() => {
    const ensureNotLogged = async () => {
      try {
        const me = await api.getProfile();
        if (me && me.id) {
          router.replace('/dashboard');
          return;
        }
      } catch {}
    };
    ensureNotLogged();
    const exchangeGoogle = async () => {
      const idToken = (session as any)?.idToken as string | undefined;
      if (!idToken) return;
      try {
        const auth = await api.loginWithGoogle(idToken);
        if (auth?.user?.role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/dashboard");
        }
      } catch (err: any) {
        // Se falhar, permanece na página de login
      }
    };
    exchangeGoogle();
    }, [(session as any)?.idToken, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = await api.login(email, password);
      if (auth.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
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
            <Button type="button" variant="outline" className="w-full" onClick={() => signIn('google', { callbackUrl: '/auth/callback' })}>
              Login com Google
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

export default LoginPage;
