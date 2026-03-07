import { Shield, Heart, Sparkles, Users } from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "100% Seguro",
    description: "Conteúdo revisado e apropriado para cada faixa etária",
  },
  {
    icon: Heart,
    title: "Desenvolvido com Amor",
    description: "Cada conteúdo é escolhido pensando no desenvolvimento infantil",
  },
  {
    icon: Sparkles,
    title: "Sempre Novo",
    description: "Novos conteúdos adicionados semanalmente",
  },
  {
    icon: Users,
    title: "Para Toda Família",
    description: "Perfis personalizados para cada criança",
  },
];

const Benefits = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Por que pais confiam
            <span className="block gradient-hero bg-clip-text">
              na KidsVerse?
            </span>
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div 
                key={index}
                className="text-center space-y-4 p-6 rounded-2xl hover:bg-card transition-smooth"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-hero shadow-soft">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
