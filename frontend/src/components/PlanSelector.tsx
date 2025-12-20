"use client";

import { useState, useEffect } from "react";
import PricingCard from "./PricingCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api, Plan } from "@/services/api";

interface PlanSelectorProps {
  currentPlanId?: string | null;
}

const PlanSelector = ({ currentPlanId }: PlanSelectorProps) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const plansData = await api.getPlans();
        setPlans(plansData);
      } catch (error) {
        console.error("Erro ao buscar planos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (selectedPlan) {
      try {
        // Se for plano grátis, funciona como cancelamento
        if (selectedPlan.priceCents === 0) {
          try {
            await api.cancelSubscription();
            setIsDialogOpen(false);
            setSelectedPlan(null);
            console.log('Assinatura marcada para expiração.');
            // Aguarda 3s para dar tempo do webhook processar, depois recarrega
            setTimeout(() => window.location.reload(), 3000);
            return;
          } catch (err: any) {
            console.error('Erro ao cancelar assinatura (plano grátis):', err);
            console.log(err?.message || 'Erro ao cancelar assinatura');
            setIsErrorDialogOpen(true);
            setIsDialogOpen(false);
            return;
          }
        }

        // Se for plano pago, redireciona para o checkout do ASAAS
        const { checkoutUrl } = await api.createCheckoutSession(selectedPlan.id);
        window.location.href = checkoutUrl;
        setIsDialogOpen(false);
        setSelectedPlan(null);
      } catch (error) {
        console.error("Erro ao processar mudança de plano:", error);
        setIsDialogOpen(false);
        setIsErrorDialogOpen(true);
      }
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setSelectedPlan(null);
  };

  if (loading) {
    return <div className="text-center py-8">Carregando planos...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const formattedPlan = {
              name: plan.name,
              price: plan.priceCents === 0 ? "Grátis" : `R$ ${(plan.priceCents / 100).toFixed(2).replace('.', ',')}/${plan.billingPeriod === 'monthly' ? 'mês' : 'ano'}`,
              features: plan.features,
            };

            const isCurrentPlan = plan.id === currentPlanId;
            const canSelect = plan.canSelect ?? true;
            const isPlanDisabled = !canSelect;

            return (
              <PricingCard
                key={plan.id}
                plan={formattedPlan}
                isCurrentPlan={isCurrentPlan}
                onSelectPlan={() => !isCurrentPlan && !isPlanDisabled && handleSelectPlan(plan)}
                disabled={isPlanDisabled}
              />
            );
          })}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar mudança de plano</DialogTitle>
            <DialogDescription>
              {selectedPlan?.priceCents === 0 ? (
                <>
                  Ao mudar para o plano gratuito, sua assinatura premium será cancelada.
                  Você perderá acesso aos benefícios premium. Deseja continuar?
                </>
              ) : (
                <>
                  Você será redirecionado para o checkout do ASAAS para concluir o pagamento do plano <strong>{selectedPlan?.name}</strong>.
                  Após a confirmação do pagamento, sua assinatura será ativada automaticamente.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-2 px-8 transition duration-150 hover:bg-red-600/10 hover:border-red-600/10"
            >
              Não
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-green-600 hover:bg-green-700 px-8"
            >
              Sim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erro ao processar pedido</DialogTitle>
            <DialogDescription>
              Não foi possível preparar o seu pedido. Tente novamente mais tarde.
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
    </>
  );
};

export default PlanSelector;
