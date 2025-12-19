"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, AntiAbuseSnapshot } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const AdminAntiAbusePage = () => {
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<AntiAbuseSnapshot | null>(null);

  const getErrorMessage = (err: unknown) => {
    if (err && typeof err === "object" && "message" in err) {
      const message = (err as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
    return "Falha ao carregar snapshot";
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.adminGetAntiAbuseSnapshot();
      setSnapshot(data);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Anti-Abuse</h1>
          <p className="text-sm text-muted-foreground">
            Snapshot atual do rate limit, falhas e cooldowns.
          </p>
        </div>
        <Button onClick={load} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>

      {snapshot && (
        <div className="text-sm text-muted-foreground">
          Atualizado em: {new Date(snapshot.now).toLocaleString()} | Counters: {snapshot.totals.counters} | Cooldowns:{" "}
          {snapshot.totals.cooldowns} | Distinct: {snapshot.totals.distinctKeys}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Counters</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Expira Em</TableHead>
                <TableHead>Restante (ms)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(snapshot?.counters || []).map((c) => (
                <TableRow key={c.key}>
                  <TableCell className="font-mono text-xs">{c.key}</TableCell>
                  <TableCell>{c.count}</TableCell>
                  <TableCell>{new Date(c.expiresAt).toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-xs">{c.remainingMs}</TableCell>
                </TableRow>
              ))}
              {(snapshot?.counters?.length || 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-muted-foreground">
                    Sem counters no momento.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cooldowns</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Até</TableHead>
                <TableHead>Restante (ms)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(snapshot?.cooldowns || []).map((c) => (
                <TableRow key={c.key}>
                  <TableCell className="font-mono text-xs">{c.key}</TableCell>
                  <TableCell>{new Date(c.until).toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-xs">{c.remainingMs}</TableCell>
                </TableRow>
              ))}
              {(snapshot?.cooldowns?.length || 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-sm text-muted-foreground">
                    Sem cooldowns no momento.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distinct</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Tamanho</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(snapshot?.distinct || []).map((d) => (
                <TableRow key={d.key}>
                  <TableCell className="font-mono text-xs">{d.key}</TableCell>
                  <TableCell>{d.size}</TableCell>
                </TableRow>
              ))}
              {(snapshot?.distinct?.length || 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-sm text-muted-foreground">
                    Sem buckets de distinct no momento.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAntiAbusePage;
