"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { api } from "@/services/api";
import { useEffect } from "react";
import { useCookieConsent } from "@/context/CookieConsentContext";

const RegisterPage = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [legalLinks, setLegalLinks] = useState<{ hasPrivacy: boolean; hasTerms: boolean }>({ hasPrivacy: false, hasTerms: false });
  const { hasConsentedTo } = useCookieConsent();

  useEffect(() => {
    api.getActiveLegal().then((active) => {
      setLegalLinks({ hasPrivacy: !!active.privacy, hasTerms: !!active.terms });
    }).catch(() => {});
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!accepted) {
        setError("Você precisa aceitar os Termos de Uso e a Política de Privacidade.");
        setLoading(false);
        return;
      }
      const auth = await api.register(name, email, password, true);
      if (auth?.user?.authProvider === 'local' && auth?.user?.emailVerified === false) {
        await api.clearToken();
        if (typeof window !== 'undefined' && hasConsentedTo('functional')) window.localStorage.setItem('pendingEmail', email);
        router.push('/auth/pending');
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "Falha no cadastro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Cadastro</CardTitle>
          <CardDescription>
            Crie sua conta para começar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" placeholder="Seu Nome" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(s => !s)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex items-start gap-2">
              <Checkbox id="accepted" checked={accepted} onCheckedChange={(v) => setAccepted(!!v)} />
              <Label htmlFor="accepted" className="text-sm leading-tight">
            Eu li e aceito os {" "}
            <Link href="/terms" className="underline" target="_blank">Termos de Uso</Link> {" "}
            e {" "}
            <Link href="/privacy" className="underline" target="_blank">Política de Privacidade</Link>.
          </Label>
        </div>
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "Criando..." : "Criar Conta"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Já tem uma conta?{" "}
            <Link href="/auth/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;
