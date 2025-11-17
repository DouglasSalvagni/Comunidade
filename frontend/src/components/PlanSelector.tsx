"use client";

import { useState } from "react";
import PricingCard from "./PricingCard";

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

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PricingCard
            key={plan.name}
            plan={plan}
            isCurrentPlan={plan.name === currentPlan}
            onSelectPlan={() => setCurrentPlan(plan.name)}
          />
        ))}
      </div>
    </div>
  );
};

export default PlanSelector;