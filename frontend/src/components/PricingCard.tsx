"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

interface PricingCardProps {
  plan: {
    name: string;
    price: string;
    originalPrice?: string;
    discountedPrice?: string;
    features: string[];
  };
  isCurrentPlan: boolean;
  disabled?: boolean;
  onSelectPlan: () => void;
}

const PricingCard = ({ plan, isCurrentPlan, disabled = false, onSelectPlan }: PricingCardProps) => {
  return (
    <Card className={(isCurrentPlan ? "border-primary " : "") + "flex flex-col h-full"}>
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>
          {plan.originalPrice && plan.discountedPrice ? (
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground line-through">{plan.originalPrice}</div>
              <div className="text-2xl font-bold text-foreground">{plan.discountedPrice}</div>
            </div>
          ) : (
            <div className="text-2xl font-bold text-foreground">{plan.price}</div>
          )}
        </CardDescription>
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
        <Button onClick={onSelectPlan} disabled={isCurrentPlan || disabled} className="w-full">
          {isCurrentPlan ? "Plano Atual" : "Selecionar Plano"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PricingCard;
