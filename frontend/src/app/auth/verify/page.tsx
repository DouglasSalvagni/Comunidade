"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { toast } from "sonner";

const VerifyEmailPage = () => {
  const router = useRouter();
  const params = useSearchParams();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = params.get('token') || "";
    const e = params.get('email') || (typeof window !== 'undefined' ? window.localStorage.getItem('pendingEmail') || "" : "");
    setToken(t);
    setEmail(e);
    const run = async () => {
      if (!t) { setError("Token inválido"); setLoading(false); return; }
      try {
        await api.verifyEmail(t);
        toast.success("E-mail verificado e login realizado");
        if (typeof window !== 'undefined') window.localStorage.removeItem('pendingEmail');
        router.replace('/dashboard');
      } catch (e: any) {
        setError(e?.message || "Falha ao verificar e-mail");
      }
      setLoading(false);
    };
    run();
  }, [params, router]);

  const onResend = async () => {
    if (!email) { toast.error("Informe o e-mail"); return; }
    try {
      await api.requestEmailVerification(email);
      toast.success("Novo link de verificação enviado");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao reenviar verificação");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Verificando e-mail...</CardTitle>
          <CardDescription>{loading ? "Processando confirmação" : (error ? "Token inválido ou expirado" : "Concluído")}</CardDescription>
        </CardHeader>
        {!loading && error && (
          <CardContent>
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label>E-mail</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="m@example.com" />
              </div>
              <Button onClick={onResend} className="w-full">Reenviar verificação</Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default VerifyEmailPage;