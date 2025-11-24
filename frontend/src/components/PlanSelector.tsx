"use client";

import { useState } from "react";
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

const plans = [
  {
    name: "Grátis",
    price: "Grátis",
    features: [],
  },
  {
    name: "Mensal",
    price: "R$ 29,90/mês",
    features: [
      "Acesso a todo o catálogo",
      "Até 4 perfis",
      "Conteúdo offline",
      "Suporte prioritário",
    ],
  },
  {
    name: "Anual",
    price: "R$ 249,90/ano",
    features: [
      "Acesso a todo o catálogo",
      "Até 4 perfis",
      "Conteúdo offline",
      "Suporte prioritário",
    ],
  },
];

const PlanSelector = () => {
  const [currentPlan, setCurrentPlan] = useState("Mensal");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (planName: string) => {
    setSelectedPlan(planName);
    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    if (selectedPlan) {
      setCurrentPlan(selectedPlan);
      setIsDialogOpen(false);
      setSelectedPlan(null);
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setSelectedPlan(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              isCurrentPlan={plan.name === currentPlan}
              onSelectPlan={() => handleSelectPlan(plan.name)}
            />
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar mudança de plano</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja mudar para o plano <strong>{selectedPlan}</strong>?
              {selectedPlan !== "Grátis" && " Você será redirecionado para o pagamento."}
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