"use client";
import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, HeartHandshake, BrainCircuit, EyeOff } from "lucide-react";

const VALUES = [
  {
    icon: EyeOff,
    title: "Proteção contra o excesso",
    description: "Filtramos o ruído. Nada de vídeos hipnotizantes ou algoritmos que prendem a atenção de forma agressiva. Aqui, a tecnologia serve à criança, e não o contrário."
  },
  {
    icon: BrainCircuit,
    title: "Respeito ao desenvolvimento",
    description: "Cada conteúdo é pensado para a etapa cognitiva correta. Evitamos a sobrecarga sensorial que gera ansiedade e priorizamos estímulos que nutrem a imaginação."
  },
  {
    icon: ShieldCheck,
    title: "Curadoria Humana e Especializada",
    description: "Não deixamos robôs decidirem o que seu filho consome. Nossa seleção passa pelo crivo de especialistas em infância, garantindo segurança e adequação total."
  },
  {
    icon: HeartHandshake,
    title: "Alternativa Consciente",
    description: "Entendemos a pressão da parentalidade moderna. Oferecemos um porto seguro onde você não precisa vigiar cada segundo, pois a confiança é a nossa base."
  }
];

export default function ManifestoInspira() {
  return (
    <section className="py-24 bg-gradient-to-b from-brand-dark to-[#0f1526] relative overflow-hidden">
      
      {/* Decorative subtle grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5"></div>

      <div className="container mx-auto px-6 relative z-10">
        
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          {/* Left Column: Text & Positioning */}
          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-brand-teal/30 bg-brand-teal/10">
                <span className="text-brand-teal text-sm font-semibold tracking-wide uppercase">Nosso Compromisso</span>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Em um mundo de excessos, escolhemos a <span className="text-brand-purple">serenidade</span>.
              </h2>
              
              <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
                <p>
                  Sabemos que educar hoje é um desafio. As telas estão em toda parte, muitas vezes repletas de conteúdos acelerados, comerciais disfarçados e estímulos que não respeitam o tempo da infância.
                </p>
                <p>
                  O <span className="font-bold text-white">Ninaro</span> nasceu de uma inquietação: a necessidade de um espaço digital que fosse, antes de tudo, humano. Não competimos pela atenção do seu filho a qualquer custo. 
                </p>
                <p className="border-l-4 border-brand-teal pl-6 italic text-gray-400">
                  "Nossa missão é ser um aliado dos pais que buscam qualidade, não quantidade. Oferecemos conteúdos que  ensinam e conectam."
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Values Grid */}
          <div className="lg:w-1/2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {VALUES.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:border-brand-purple/30 transition-colors group"
                >
                  <div className="mb-4 bg-gradient-to-br from-white/10 to-white/5 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    <item.icon className="w-6 h-6 text-brand-purple" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
