"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/services/api";

export default function LegalAcceptPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRenewal, setIsRenewal] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const me = await api.getProfile();
        if (me.role === 'admin') {
          router.replace('/admin');
          return;
        }
        if (me.acceptedLegal) {
          router.replace('/dashboard');
          return;
        }
        setIsRenewal(!!(me as any)?.hasAcceptedAnyRequired);
      } catch {
        router.replace('/auth/login');
      }
    };
    check();
  }, [router]);

  const onAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!accepted) throw new Error('Você precisa aceitar os Termos e a Política');
      await api.acceptLegal();
      router.replace('/dashboard');
    } catch (e: any) {
      setError(e?.message || 'Falha ao registrar aceite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{isRenewal ? 'Novos Termos e Política' : 'Aceite Necessário'}</CardTitle>
          <CardDescription>
            {isRenewal ? 'Atualizamos nossos Termos de Uso e Política de Privacidade. Para continuar, você pode revisar e aceitar agora. Caso prefira, poderá continuar sem aceitar e será lembrado em seu próximo login.' : 'Para continuar, é preciso aceitar os documentos legais.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Eu li e aceito os <Link href="/terms" className="underline">Termos de Uso</Link> e a <Link href="/privacy" className="underline">Política de Privacidade</Link>.
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox id="accept" checked={accepted} onCheckedChange={(v) => setAccepted(!!v)} />
              <label htmlFor="accept" className="text-sm">Confirmo o aceite</label>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button onClick={onAccept} disabled={!accepted || loading} className="w-full">
              {loading ? 'Salvando...' : 'Aceitar e continuar'}
            </Button>
            {isRenewal && (
              <Button variant="outline" className="w-full" onClick={() => router.replace('/dashboard')}>Continuar sem aceitar</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
