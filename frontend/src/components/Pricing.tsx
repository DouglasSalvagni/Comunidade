import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Mensal",
    price: "29,90",
    period: "mês",
    features: [
      "Acesso ilimitado a todo conteúdo",
      "Até 3 perfis de crianças",
      "Downloads para modo offline",
      "Sem anúncios",
      "Novos conteúdos semanais",
      "Suporte prioritário",
    ],
    highlighted: false,
  },
  {
    name: "Anual",
    price: "19,90",
    period: "mês",
    savings: "Economize 33%",
    features: [
      "Todos os benefícios do plano mensal",
      "Até 5 perfis de crianças",
      "Acesso antecipado a novos conteúdos",
      "Eventos exclusivos online",
      "Suporte VIP 24/7",
      "2 meses grátis",
    ],
    highlighted: true,
  },
];

const Pricing = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Planos que cabem
            <span className="block gradient-hero bg-clip-text">
              no seu bolso
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o melhor plano para sua família e comece hoje mesmo
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`relative overflow-hidden ${
                plan.highlighted 
                  ? 'border-primary border-2 shadow-large' 
                  : 'border-2'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute top-0 right-0 gradient-hero text-white px-6 py-2 rounded-bl-2xl text-sm font-medium">
                  Mais Popular
                </div>
              )}
              
              <div className="p-8 space-y-8">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  {plan.savings && (
                    <div className="inline-block bg-accent/20 text-accent-foreground px-3 py-1 rounded-full text-sm font-medium">
                      {plan.savings}
                    </div>
                  )}
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                
                <Button 
                  className={`w-full ${
                    plan.highlighted 
                      ? 'gradient-hero text-white shadow-medium hover:shadow-large' 
                      : ''
                  }`}
                  size="lg"
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  Começar Agora
                </Button>
                
                <div className="space-y-4 pt-4">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-1 p-1 rounded-full bg-success/10 shrink-0">
                        <Check className="w-4 h-4 text-success" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Cancele a qualquer momento • Sem taxa de cancelamento • Garantia de 7 dias
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
