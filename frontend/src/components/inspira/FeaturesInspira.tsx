"use client";
import React from "react";
import { motion } from "framer-motion";
import { Headphones, Book, ShieldCheck, Clock, Download, Heart } from "lucide-react";

interface FeatureCardProps {
  icon: any;
  title: string;
  desc: string;
  color: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, desc, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -10 }}
    className="bg-brand-dark/50 backdrop-blur-md border border-white/5 p-8 rounded-3xl hover:border-white/20 transition-all shadow-xl group"
  >
    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
      <Icon className="w-8 h-8 text-white" />
    </div>
    <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{desc}</p>
  </motion.div>
);

export const FeaturesInspira: React.FC = () => {
  const features = [
    { icon: Headphones, title: "Áudio Imersivo", desc: "Design de som que transporta as crianças para dentro das histórias.", color: "bg-gradient-to-br from-pink-500 to-rose-500" },
    { icon: Book, title: "Contos Originais", desc: "Além de clássicos temos histórias exclusivas pensadas a servirem de estímulo e de aprendizado.", color: "bg-gradient-to-br from-brand-teal to-emerald-500" },
    { icon: ShieldCheck, title: "100% Seguro", desc: "Ambiente livre de anúncios e conteúdo curado para cada faixa etária.", color: "bg-gradient-to-br from-blue-500 to-indigo-600" },
    { icon: Clock, title: "Modo Soneca", desc: "Playlists especiais para ajudar na hora de dormir.", color: "bg-gradient-to-br from-brand-orange to-red-500" },
    { icon: Download, title: "Offline", desc: "Baixe seus favoritos para ouvir no carro ou em viagens sem internet.", color: "bg-gradient-to-br from-brand-yellow to-amber-600" },
    { icon: Heart, title: "Educação Emocional", desc: "Temas que ajudam a lidar com sentimentos e buscam o desenvolvimento emocional.", color: "bg-gradient-to-br from-purple-500 to-fuchsia-600" },
  ];

  return (
    <section id="features" className="py-20 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-bold mb-4">
            Por que as crianças <span className="text-brand-teal">amam</span> o Soundi?
          </motion.h2>
          <div className="w-20 h-1 bg-brand-orange mx-auto rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesInspira;

