"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import { CreditCard, Calendar, CheckCircle2, Ticket, Receipt, AlertCircle, Loader2, ArrowRight, XCircle, Clock } from "lucide-react";

const SubscriptionPageContent = () => {
  const router = useRouter();
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
    const isSubscriptionsEnabled = process.env.NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS_FEATURE !== 'false';
    if (!isSubscriptionsEnabled) {
      router.push('/dashboard');
      return;
    }

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
  }, [router, checkout]);

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
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Carregando detalhes da assinatura...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-10 animate-in fade-in duration-500">
      <div className="border-b pb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Assinatura e Faturamento</h1>
        <p className="text-muted-foreground mt-2 text-lg">Visualize e gerencie seu plano, faturas e cupons de desconto.</p>
      </div>

      <div className="space-y-4">
        {checkout === 'success' && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl p-5 flex items-start gap-4 shadow-sm transition-all">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 text-lg">Pagamento iniciado</h3>
              <p className="text-emerald-700/90 dark:text-emerald-300/90 mt-1">Assim que o pagamento for confirmado, sua assinatura será ativada automaticamente.</p>
            </div>
          </div>
        )}

        {checkout === 'cancel' && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-5 flex items-start gap-4 shadow-sm transition-all">
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100 text-lg">Checkout cancelado</h3>
              <p className="text-red-700/90 dark:text-red-300/90 mt-1">Você pode tentar novamente quando quiser.</p>
            </div>
          </div>
        )}

        {checkout === 'expired' && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-5 flex items-start gap-4 shadow-sm transition-all">
            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-lg">Checkout expirado</h3>
              <p className="text-amber-700/90 dark:text-amber-300/90 mt-1">O link expirou. Gere um novo checkout para continuar.</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna 1: Plano Atual */}
        <div className="h-full">
          {subscription && subscription.plan ? (
            <Card className="relative overflow-hidden shadow-md border-primary/20 hover:border-primary/40 transition-colors h-full flex flex-col">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <CreditCard className="w-32 h-32" />
              </div>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <CardDescription className="font-medium flex items-center gap-2 text-primary">
                    <CheckCircle2 className="w-4 h-4" />
                    Seu Plano Atual
                  </CardDescription>
                  {(() => {
                    const isCourtesyPlan = subscription.plan.slug === 'plano-cortesia';
                    const isActiveOrCourtesy = subscription.status === "active" || (isCourtesyPlan && subscription.status === "expiring");
                    return (
                      <Badge variant={isActiveOrCourtesy ? "default" : "destructive"} className="shadow-sm capitalize px-3 py-1">
                        {getStatusLabel(subscription.status, isCourtesyPlan)}
                      </Badge>
                    );
                  })()}
                </div>
                <CardTitle className="text-3xl font-bold">{subscription.plan.name}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6 relative z-10 flex-grow">
                {(() => {
                  const isCourtesyPlan = subscription.plan.slug === 'plano-cortesia';
                  return (
                    <div className="">
                      {subscription.status === 'expiring' ? (
                        <div className="flex gap-3 items-start">
                          <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                          <div className="text-sm text-muted-foreground leading-relaxed">
                            {subscription.periodEnd ? (
                              isCourtesyPlan ? (
                                <p>Seu plano cortesia seguirá ativo até <strong className="text-foreground">{formatDate(subscription.periodEnd)}</strong>.</p>
                              ) : (
                                <p>Seu plano seguirá ativo até <strong className="text-foreground">{formatDate(subscription.periodEnd)}</strong>. Você não receberá cobranças novamente.</p>
                              )
                            ) : (
                              isCourtesyPlan ? (
                                <p>Seu plano cortesia está ativo.</p>
                              ) : (
                                <p>Plano será cancelado em breve.</p>
                              )
                            )}
                          </div>
                        </div>
                      ) : (
                        subscription.periodEnd && (
                          <div className="bg-primary/20 rounded-xl p-5 space-y-4 border border-primary">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-primary" />
                                <div className="space-y-1">
                                  <p className="text-sm text-primary font-medium leading-none">Próxima cobrança</p>
                                  <p className="text-sm text-primary text-muted-foreground">{formatDate(subscription.periodEnd)}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-primary">
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
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  );
                })()}
              </CardContent>
              <CardFooter className="pt-6 border-t bg-muted/10">
                {subscription.status === "active" && subscription.plan.priceCents > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setIsCancelDialogOpen(true)}
                    className="w-full sm:w-auto hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:border-red-900 transition-colors"
                  >
                    {isCancelling ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cancelando...</>
                    ) : (
                      'Cancelar Assinatura'
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center p-8 text-center shadow-sm border-dashed border-2">
              <CreditCard className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <CardTitle className="mb-2">Nenhuma Assinatura Ativa</CardTitle>
              <CardDescription className="text-base">Escolha um plano abaixo para começar a aproveitar os benefícios.</CardDescription>
            </Card>
          )}
        </div>

        {/* Coluna 2: Cupom */}
        <div className="h-full">
          <Card className="shadow-sm h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Ticket className="w-5 h-5 text-primary" />
                Cupom de Desconto
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {activeCoupon
                  ? "Você possui um cupom ativo para sua próxima assinatura ou renovação."
                  : "Tem um código promocional? Insira abaixo para ganhar descontos."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-center">
              {activeCoupon ? (
                <div className="flex items-center justify-between p-5 border rounded-xl bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-300 dark:border-green-800 font-mono text-sm px-2 py-0.5">
                        {activeCoupon.partnership.code}
                      </Badge>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wider">Ativo</span>
                    </div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
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
                  <Button variant="ghost" size="sm" onClick={handleRemoveCoupon} className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Ex: PROMO20"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-grow font-mono uppercase text-lg h-11"
                  />
                  <Button onClick={handleActivateCoupon} disabled={!couponCode.trim()} className="h-11 px-6 shadow-sm">
                    Aplicar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="pt-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Mudar de Plano</h2>
          <p className="text-muted-foreground mt-1">Explore nossas opções e escolha o plano que melhor se adapta às suas necessidades.</p>
        </div>
        <div className="bg-muted/30 rounded-2xl p-4 sm:p-8 border shadow-sm">
          <PlanSelector
            currentPlanId={subscription?.plan?.id}
            activeCoupon={activeCoupon}
          />
        </div>
      </div>

      <div className="pt-4">
        <Card className="shadow-sm border-border/50">
          <CardHeader className="border-b bg-muted/10 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Receipt className="w-5 h-5 text-primary" />
              Histórico de Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Receipt className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium">Nenhuma fatura encontrada</p>
                <p className="text-sm text-muted-foreground mt-1">Seu histórico de pagamentos aparecerá aqui.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-4 px-6 font-medium">Data de Criação</th>
                      <th className="text-left py-4 px-6 font-medium">Vencimento</th>
                      <th className="text-left py-4 px-6 font-medium">Status</th>
                      <th className="text-right py-4 px-6 font-medium">Valor</th>
                      <th className="text-right py-4 px-6 font-medium">Fatura</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-muted/20 transition-colors group">
                        <td className="py-4 px-6 text-foreground/80">{formatDate(invoice.createdAt)}</td>
                        <td className="py-4 px-6 text-foreground/80">{formatDate(invoice.dueDate)}</td>
                        <td className="py-4 px-6">
                          <Badge
                            variant={
                              invoice.status === 'CONFIRMED' ? 'default' :
                                invoice.status === 'OVERDUE' ? 'destructive' :
                                  invoice.status === 'PENDING' ? 'secondary' :
                                    'outline'
                            }
                            className={`px-2.5 py-0.5 shadow-sm font-medium ${invoice.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200 border-emerald-200' :
                                invoice.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 border-amber-200' :
                                  invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 border-red-200' :
                                    invoice.status === 'REFUNDED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 border-purple-200' :
                                      'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 border-slate-200'
                              }`}
                          >
                            {invoice.status === 'CONFIRMED' ? 'Pago' :
                              invoice.status === 'PENDING' ? 'Aberta' :
                                invoice.status === 'OVERDUE' ? 'Atrasada' :
                                  invoice.status === 'REFUNDED' ? 'Reembolsada' :
                                    'Cancelada'}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right font-medium">R$ {parseFloat(invoice.amount).toFixed(2).replace('.', ',')}</td>
                        <td className="py-4 px-6 text-right">
                          {invoice.invoiceUrl ? (
                            <a
                              href={invoice.invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                            >
                              Ver Fatura
                              <ArrowRight className="w-3 h-3 ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Cancelar Assinatura
            </DialogTitle>
            <DialogDescription className="pt-3 text-base">
              Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos benefícios premium ao final do ciclo atual.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              className="border-2 sm:flex-1"
            >
              Manter Assinatura
            </Button>
            <Button
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700 text-white sm:flex-1 shadow-sm"
            >
              {isCancelling ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cancelando...</>
              ) : (
                'Sim, cancelar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <XCircle className="w-5 h-5 text-red-500" />
              Erro no Cancelamento
            </DialogTitle>
            <DialogDescription className="pt-3 text-base">
              Não foi possível cancelar sua assinatura no momento. Por favor, tente novamente mais tarde ou contate o suporte.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              onClick={() => setIsErrorDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
