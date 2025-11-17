"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

interface PricingCardProps {
  plan: {
    name: string;
    price: string;
    features: string[];
  };
  isCurrentPlan: boolean;
  onSelectPlan: () => void;
}

const PricingCard = ({ plan, isCurrentPlan, onSelectPlan }: PricingCardProps) => {
  return (
    <Card className={(isCurrentPlan ? "border-primary " : "") + "flex flex-col h-full"}>
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.price}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 flex-1">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            <Check className="w-4 h-4 text-primary" />
            <span>{feature}</span>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button onClick={onSelectPlan} disabled={isCurrentPlan} className="w-full">
          {isCurrentPlan ? "Plano Atual" : "Selecionar Plano"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PricingCard;