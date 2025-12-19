"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { toast } from "sonner";

const PendingVerificationPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const e = window.localStorage.getItem('pendingEmail') || "";
      setEmail(e);
    }
  }, []);

  const onResend = async () => {
    if (!email) { toast.error("Informe o e-mail"); return; }
    try {
      await api.requestEmailVerification(email);
      toast.success("Enviamos um novo link de verificação para seu e-mail");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao enviar verificação");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Aguardando confirmação de e-mail</CardTitle>
          <CardDescription>
            Confirme seu e-mail para acessar a plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>E-mail</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="m@example.com" />
            </div>
            <Button onClick={onResend} className="w-full">Reenviar verificação</Button>
            <Button variant="outline" onClick={() => router.push('/auth/login')} className="w-full">Voltar para Login</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingVerificationPage;