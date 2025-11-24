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
        await api.changePlan(selectedPlan.id);
        setCurrentPlan(selectedPlan.id);
        setIsDialogOpen(false);
        setSelectedPlan(null);
      } catch (error) {
        console.error("Erro ao mudar plano:", error);
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
              Tem certeza que deseja mudar para o plano <strong>{selectedPlan?.name}</strong>?
              {selectedPlan?.priceCents !== 0 && " Você será redirecionado para o pagamento."}
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
    </>
  );
};

export default PlanSelector;