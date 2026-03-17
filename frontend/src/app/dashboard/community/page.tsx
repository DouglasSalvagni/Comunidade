"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, CommunitySpace } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessagesSquare, ArrowRight, Hash } from "lucide-react";

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
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      <div className="pb-4 border-b">
        <h1 className="text-3xl font-extrabold tracking-tight">Comunidade</h1>
        <p className="text-base text-muted-foreground mt-2">Escolha um canal para acompanhar o feed e interagir com outros membros.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {spaces.map((space) => (
          <Card key={space.id} className="h-full flex flex-col hover:shadow-md transition-shadow border-muted/60 group">
            <CardHeader className="pb-3 pt-6 px-6">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-105 transition-transform">
                <Hash className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl font-bold tracking-tight">{space.name}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 flex-1">
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {space.description || "Canal de discussão da comunidade. Participe das conversas!"}
              </p>
            </CardContent>
            <CardFooter className="px-6 pb-6 pt-0">
              <Button asChild className="w-full rounded-xl" variant="secondary">
                <Link href={`/dashboard/community/${space.id}`}>
                  Acessar canal
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
