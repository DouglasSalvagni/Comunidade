"use client";
import React from "react";
import { Check } from "lucide-react";

const PricingCard = ({ title, price, features, recommended = false }: { title: string; price: string; features: string[]; recommended?: boolean }) => (
  <div className={`relative p-8 rounded-3xl border ${recommended ? "bg-gradient-to-b from-brand-purple/80 to-brand-dark border-brand-teal" : "bg-white/5 border-white/10"} flex flex-col h-full transform transition-transform hover:scale-105`}>
    {recommended && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-brand-teal text-brand-dark font-bold px-4 py-1 rounded-full text-sm shadow-lg">Mais Popular</div>
    )}
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <div className={`mb-6 ${price === "Grátis" ? "invisible" : ""}`}>
      <span className="text-4xl font-bold">{price}</span>
      <span className="text-gray-400 text-sm">/mês</span>
    </div>
    <ul className="flex-1 space-y-4 mb-8">
      {features.map((feat, i) => (
        <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
          <div className="w-5 h-5 rounded-full bg-brand-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="w-3 h-3 text-brand-teal" />
          </div>
          {feat}
        </li>
      ))}
    </ul>
    <button className={`w-full py-3 rounded-full font-bold transition-all ${recommended ? "bg-brand-teal text-brand-dark hover:bg-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.4)]" : "bg-white text-brand-dark hover:bg-gray-100"}`}>Escolher Plano</button>
  </div>
);

export const PricingInspira: React.FC = () => {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Comece sua aventura hoje</h2>
          <p className="text-gray-400">Cancele quando quiser. Sem fidelidade.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <PricingCard title="Mensal" price="R$ 19,90" features={["Acesso ilimitado a histórias", "Músicas originais", "1 Conta Infantil", "Sem anúncios"]} />
          <PricingCard title="Família" price="R$ 29,90" recommended={true} features={["Tudo do plano Mensal", "Até 4 Contas Infantis", "Modo Offline (Baixar)", "Relatório de atividades para pais", "Qualidade de áudio HD"]} />
          <PricingCard title="Anual" price="R$ 199,90" features={["2 meses grátis", "Tudo do plano Família", "Kit de atividades para imprimir", "Acesso antecipado a lançamentos"]} />
        </div>
      </div>
    </section>
  );
};

export default PricingInspira;

