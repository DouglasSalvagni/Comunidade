import PlanSelector from "@/components/PlanSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SubscriptionPage = () => {
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
          <Button variant="outline">Cancelar Assinatura</Button>
        </CardFooter>
      </Card>

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