"use client";

import { useState } from "react";
import PlanSelector from "@/components/PlanSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SubscriptionPage = () => {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const handleCancelSubscription = () => {
    setIsCancelDialogOpen(false);
    // Lógica de cancelamento aqui
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Gerenciamento de Assinatura</h1>
        <p className="text-muted-foreground">Visualize e gerencie seu plano e faturamento.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seu Plano Atual</CardTitle>
          <CardDescription>Plano Família - Anual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p>Status</p>
            <Badge variant="default">Ativo</Badge>
          </div>
          <div className="flex justify-between items-center">
            <p>Próxima cobrança em 15 de Julho de 2025</p>
            <p className="font-semibold">R$ 199,90</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => setIsCancelDialogOpen(true)}
            className="hover:bg-red-900 hover:text-white hover:border-red-900 transition-colors"
          >
            Cancelar Assinatura
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Assinatura</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos benefícios premium.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              className="border-2 px-16 transition duration-150 hover:bg-green-600/10 hover:border-green-600/10"
            >
              Não
            </Button>
            <Button
              onClick={handleCancelSubscription}
              className="bg-red-600 hover:bg-red-700 px-8"
            >
              Sim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div>
        <h2 className="text-2xl font-bold">Mudar de Plano</h2>
        <p className="text-muted-foreground">Escolha o plano que melhor se adapta às suas necessidades.</p>
      </div>
      <PlanSelector />

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Data</th>
                <th className="text-left py-2">Descrição</th>
                <th className="text-right py-2">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2">15/07/2024</td>
                <td>Plano Família - Anual</td>
                <td className="text-right">R$ 199,90</td>
              </tr>
              {/* Adicionar mais linhas de histórico aqui */}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionPage;