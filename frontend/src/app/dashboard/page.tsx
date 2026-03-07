"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { api, User } from "@/services/api";
import Link from "next/link";

const DashboardPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const me = await api.getProfile();
        setUser(me);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Boas-vindas</h1>
        <p className="text-muted-foreground mt-2">
          Aqui estão seus dados principais da conta.
        </p>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 w-40 bg-muted rounded" />
            <div className="h-4 w-64 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-semibold">{user?.name || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">{user?.email || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Verificação</p>
              <p className="font-semibold">{user?.emailVerified ? "Email verificado" : "Email pendente"}</p>
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard/account" className="block">
          <Card className="p-6 hover:border-primary transition-colors">
            <h2 className="text-lg font-semibold">Meu Perfil</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Atualize seus dados de conta e segurança.
            </p>
          </Card>
        </Link>
        <Link href="/dashboard/profiles" className="block">
          <Card className="p-6 hover:border-primary transition-colors">
            <h2 className="text-lg font-semibold">Perfis</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Gerencie os perfis das crianças.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
