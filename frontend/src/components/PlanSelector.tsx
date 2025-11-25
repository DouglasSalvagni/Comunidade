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

const PlanSelector = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
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
        // Se for plano grátis, troca direto
        if (selectedPlan.priceCents === 0) {
          await api.changePlan(selectedPlan.id);
          setCurrentPlan(selectedPlan.id);
          setIsDialogOpen(false);
          setSelectedPlan(null);
          return;
        }

        // Se for plano pago, abre checkout do ASAAS em nova aba
        const { checkoutUrl } = await api.createCheckoutSession(selectedPlan.id);
        window.open(checkoutUrl, '_blank');
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

            return (
              <PricingCard
                key={plan.id}
                plan={formattedPlan}
                isCurrentPlan={plan.id === currentPlan}
                onSelectPlan={() => handleSelectPlan(plan)}
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
                  Tem certeza que deseja mudar para o plano <strong>{selectedPlan?.name}</strong>?
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