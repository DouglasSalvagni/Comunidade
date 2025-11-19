"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { toast } from "sonner";

const ForgotPasswordPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.requestPasswordReset(email);
      setSent(true);
      toast.success("Se o e-mail existir, enviaremos instruções.");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao enviar");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Recuperar senha</CardTitle>
          <CardDescription>Informe seu e-mail para receber um link de redefinição.</CardDescription>
        </CardHeader>
        <CardContent>
          {!sent ? (
            <form className="grid gap-4" onSubmit={onSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Enviando..." : "Enviar"}</Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Verifique seu e-mail e siga as instruções.</p>
              <Button variant="outline" className="w-full" onClick={() => router.push('/auth/login')}>Voltar ao Login</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;