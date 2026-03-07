"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PlanSelector from "@/components/PlanSelector";
import { api, Subscription, Invoice, ActiveCoupon } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SubscriptionPageContent = () => {
  const searchParams = useSearchParams();
  const checkout = searchParams.get('checkout');

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeCoupon, setActiveCoupon] = useState<ActiveCoupon | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (checkout === 'cancel' || checkout === 'expired') {
          try {
            await api.checkoutFailed();
          } catch { }
        }
        const [subscriptionData, invoicesData, activeCouponData] = await Promise.all([
          api.getCurrentSubscription(),
          api.getInvoices(),
          api.getActiveCoupon(),
        ]);
        setSubscription(subscriptionData);
        setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
        setActiveCoupon(activeCouponData);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        setInvoices([]); // Garante que seja array vazio em caso de erro
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCancelSubscription = async () => {
    try {
      console.log('Iniciando cancelamento de assinatura...');
      setIsCancelling(true);
      const resp = await api.cancelSubscription();
      setIsCancelDialogOpen(false);
      // Aguarda 3s para dar tempo do webhook processar, depois recarrega
      setTimeout(() => window.location.reload(), 3000);
    } catch (error: any) {
      console.error('Erro ao cancelar assinatura:', error);
      console.log('Erro ao cancelar assinatura:', error?.message || error);
      setIsErrorDialogOpen(true);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleActivateCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const coupon = await api.activateCoupon(couponCode);
      setActiveCoupon(coupon);
      toast.success("Cupom ativado com sucesso!");
      setCouponCode("");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao ativar cupom");
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await api.cancelActiveCoupon();
      setActiveCoupon(null);
      toast.success("Cupom removido");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao remover cupom");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";

    // Remove timestamp se existir, pega apenas YYYY-MM-DD
    const dateOnly = dateString.split('T')[0];

    // Parse manual para evitar timezone (formato: YYYY-MM-DD)
    const [year, month, day] = dateOnly.split('-');

    if (!year || !month || !day) {
      return "Data inválida";
    }

    // Retorna no formato dd/MM/yyyy sem usar Date
    return `${day}/${month}/${year}`;
  }; const formatPrice = (cents: number) => {
    return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
  };

  const getStatusLabel = (status: string, isCourtesy: boolean) => {
    if (isCourtesy && status === 'expiring') {
      return 'Cortesia ativa';
    }
    const labels: Record<string, string> = {
      active: "Ativo",
      expiring: "Cancelado",
      canceled: "Cancelado",
      past_due: "Vencido",
      unpaid: "Não pago",
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="text-center py-8">Carregando assinatura...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Gerenciamento de Assinatura</h1>
        <p className="text-muted-foreground">Visualize e gerencie seu plano e faturamento.</p>
      </div>

      {checkout === 'success' && (
        <Card className="bg-success text-white border-none">
          <CardHeader>
            <CardTitle className="text-white">Pagamento iniciado</CardTitle>
            <CardDescription className="text-white/90">
              Assim que o pagamento for confirmado, sua assinatura será ativada automaticamente.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {checkout === 'cancel' && (
        <Card className="bg-red-600 text-white border-none">
          <CardHeader>
            <CardTitle className="text-white">Checkout cancelado</CardTitle>
            <CardDescription className="text-white/90">
              Você pode tentar novamente quando quiser.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {checkout === 'expired' && (
        <Card className="bg-red-600 text-white border-none">
          <CardHeader>
            <CardTitle className="text-white">Checkout expirado</CardTitle>
            <CardDescription className="text-white/90">
              O link expirou. Gere um novo checkout para continuar.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {subscription && subscription.plan ? (
        <Card>
          <CardHeader>
            <CardDescription>Seu Plano Atual</CardDescription>
            <CardTitle>{subscription.plan.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const isCourtesyPlan = subscription.plan.slug === 'plano-cortesia';
              const isActiveOrCourtesy = subscription.status === "active" || (isCourtesyPlan && subscription.status === "expiring");
              return (
                <>
            <div className="flex gap-4 items-center">
              <p>Status</p>
              <Badge variant={isActiveOrCourtesy ? "default" : "destructive"}>
                {getStatusLabel(subscription.status, isCourtesyPlan)}
              </Badge>
            </div>
            {subscription.status === 'expiring' ? (
              <div className="text-sm text-muted-foreground">
                {subscription.periodEnd ? (
                  isCourtesyPlan ? (
                    <p>Seu plano cortesia seguirá ativo até {formatDate(subscription.periodEnd)}.</p>
                  ) : (
                    <p>Seu plano seguirá ativo até {formatDate(subscription.periodEnd)}. Você não receberá cobranças novamente.</p>
                  )
                ) : (
                  isCourtesyPlan ? (
                    <p>Seu plano cortesia está ativo.</p>
                  ) : (
                    <p>Plano será cancelado em breve.</p>
                  )
                )}
              </div>
            ) : (
              subscription.periodEnd && (
                <div className="flex gap-4 items-center">
                  <p>Próxima cobrança em {formatDate(subscription.periodEnd)}</p>
                  <p className="font-semibold">
                    {(() => {
                      const relevant = invoices
                        .filter((inv) =>
                          inv.subscriptionId === subscription.id &&
                          (inv.status === 'CONFIRMED' || inv.status === 'PENDING' || inv.status === 'OVERDUE'),
                        )
                        .sort((a, b) => {
                          const aDate = (a.dueDate || a.createdAt || '').localeCompare(b.dueDate || b.createdAt || '');
                          return aDate;
                        });

                      const last = relevant.length ? relevant[relevant.length - 1] : null;
                      if (!last) return formatPrice(subscription.plan.priceCents);

                      const value = parseFloat(String(last.amount || '0'));
                      if (!Number.isFinite(value) || value <= 0) return formatPrice(subscription.plan.priceCents);
                      return `R$ ${value.toFixed(2).replace(".", ",")}`;
                    })()}
                  </p>
                </div>
              )
            )}
                </>
              );
            })()}
          </CardContent>
          <CardFooter>
            {subscription.status === "active" && subscription.plan.priceCents > 0 && (
              <Button
                variant="outline"
                onClick={() => setIsCancelDialogOpen(true)}
                className="hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
              >
                {isCancelling ? 'Cancelando...' : 'Cancelar Assinatura'}
              </Button>
            )}
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma Assinatura Ativa</CardTitle>
            <CardDescription>Escolha um plano abaixo para começar</CardDescription>
          </CardHeader>
        </Card>
      )}

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

      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erro</DialogTitle>
            <DialogDescription>
              Não foi possível cancelar sua assinatura no momento. Tente novamente mais tarde.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setIsErrorDialogOpen(false)}
              className="bg-blue-600 hover:bg-blue-700 px-8"
            >
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Cupom de Desconto</CardTitle>
          <CardDescription>
            {activeCoupon 
              ? "Você possui um cupom ativo para sua próxima assinatura ou renovação." 
              : "Insira um código de cupom para ganhar desconto."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeCoupon ? (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
              <div>
                <p className="font-bold text-green-800">{activeCoupon.partnership.code}</p>
                <p className="text-sm text-green-700">
                  Desconto de {activeCoupon.partnership.discountType === 'PERCENT'
                    ? `${(() => {
                      const value = parseFloat(String(activeCoupon.partnership.discountValue || '0'));
                      if (!Number.isFinite(value)) return String(activeCoupon.partnership.discountValue);
                      const isInt = Math.abs(value - Math.round(value)) < 1e-9;
                      return isInt ? String(Math.round(value)) : String(value).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
                    })()}%`
                    : `R$ ${activeCoupon.partnership.discountValue}`}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleRemoveCoupon} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                Remover
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input 
                placeholder="Código do cupom" 
                value={couponCode} 
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="max-w-xs"
              />
              <Button onClick={handleActivateCoupon} disabled={!couponCode.trim()}>
                Aplicar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold">Mudar de Plano</h2>
        <p className="text-muted-foreground">Escolha o plano que melhor se adapta às suas necessidades.</p>
      </div>
      <PlanSelector
        currentPlanId={subscription?.plan?.id}
        activeCoupon={activeCoupon}
      />

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma fatura encontrada</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Criação</th>
                  <th className="text-center py-2">Validade</th>
                  <th className="text-center py-2">Status</th>
                  <th className="text-center py-2">Valor</th>
                  <th className="text-right py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b">
                    <td className="text-left py-2">{formatDate(invoice.createdAt)}</td>
                    <td className="text-center py-2">{formatDate(invoice.dueDate)}</td>
                    <td className="text-center py-2">
                      <Badge
                        variant={
                          invoice.status === 'CONFIRMED' ? 'default' :
                            invoice.status === 'OVERDUE' ? 'destructive' :
                              invoice.status === 'PENDING' ? 'secondary' :
                                'outline'
                        }
                        className={
                          invoice.status === 'CONFIRMED' ? 'bg-green-600 hover:bg-green-700' :
                            invoice.status === 'PENDING' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' :
                              invoice.status === 'OVERDUE' ? 'bg-red-600 hover:bg-red-700' :
                                invoice.status === 'REFUNDED' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                                  'bg-gray-400 hover:bg-gray-500 text-white'
                        }
                      >
                        {invoice.status === 'CONFIRMED' ? 'Pago' :
                          invoice.status === 'PENDING' ? 'Aberta' :
                            invoice.status === 'OVERDUE' ? 'Atrasada' :
                              invoice.status === 'REFUNDED' ? 'Reembolsada' :
                                'Cancelada'}
                      </Badge>
                    </td>
                    <td className="text-center py-2">R$ {parseFloat(invoice.amount).toFixed(2).replace('.', ',')}</td>
                    <td className="text-right py-2">
                      {invoice.invoiceUrl ? (
                        <a href={invoice.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Ver Fatura
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const SubscriptionPage = () => {
  return (
    <Suspense>
      <SubscriptionPageContent />
    </Suspense>
  );
};

export default SubscriptionPage;
