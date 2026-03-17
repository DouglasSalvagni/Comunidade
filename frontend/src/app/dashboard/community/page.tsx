"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, CommunitySpace } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessagesSquare, ArrowRight } from "lucide-react";

export default function DashboardCommunityPage() {
  const [spaces, setSpaces] = useState<CommunitySpace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getCommunitySpaces()
      .then(setSpaces)
      .catch(() => setSpaces([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (spaces.length === 0) {
    return (
      <Card>
        <CardContent className="py-14 text-center space-y-3">
          <MessagesSquare className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Nenhum canal disponível</h2>
          <p className="text-sm text-muted-foreground">Assim que houver espaços ativos para você, eles aparecerão aqui.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comunidade</h1>
        <p className="text-sm text-muted-foreground">Escolha um canal para acompanhar o feed e interagir.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {spaces.map((space) => (
          <Card key={space.id} className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{space.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-3">{space.description || "Sem descrição."}</p>
              <Button asChild className="w-full">
                <Link href={`/dashboard/community/${space.id}`}>
                  Abrir canal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
