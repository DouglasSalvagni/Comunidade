"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const ResetPasswordPage = () => {
  const router = useRouter();
  const params = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setToken(params.get('token') || "");
  }, [params]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password || password !== confirm) {
      toast.error("Verifique os dados informados.");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      toast.success("Senha redefinida. Faça login com a nova senha.");
      router.replace('/auth/login');
    } catch (e: any) {
      toast.error(e?.message || "Falha ao redefinir senha");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Redefinir senha</CardTitle>
          <CardDescription>Crie uma nova senha para sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label>Token</Label>
              <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Cole o token" />
            </div>
            <div className="grid gap-2">
              <Label>Nova senha</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(s => !s)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Confirmar senha</Label>
              <div className="relative">
                <Input type={showConfirm ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pr-10" />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowConfirm(s => !s)}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Salvando..." : "Redefinir"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;