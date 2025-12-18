"use client";
import React from "react";
import { motion } from "framer-motion";
import { Apple, Play, Smartphone } from "lucide-react";
import printImage from "../../assets/print.jpg";

export const AppDownloadInspira: React.FC = () => {
  return (
    <section className="py-20 bg-brand-dark relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-purple/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-teal/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          
          {/* Text Content */}
          <div className="lg:w-1/2 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                Leve a magia para <span className="text-brand-teal">qualquer lugar</span>
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Baixe o aplicativo Ninaro e tenha acesso a todas as histórias e músicas, mesmo offline. Perfeito para viagens e momentos de desconexão.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                >
                  <Apple className="w-8 h-8" />
                  <div className="text-left">
                    <div className="text-xs">Baixar na</div>
                    <div className="text-lg leading-none">App Store</div>
                  </div>
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 bg-transparent border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors shadow-lg"
                >
                  <Play className="w-7 h-7 fill-current" />
                  <div className="text-left">
                    <div className="text-xs">Disponível no</div>
                    <div className="text-lg leading-none">Google Play</div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Visual / Phone Mockup */}
          <div className="lg:w-1/2 flex justify-center">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Abstract Phone Shape */}
              <div className="relative w-[275px] h-[610px] bg-black border-[8px] border-gray-800 rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-white/20">

                
                {/* Screen Content - Image */}
                <div className="absolute inset-0 bg-black">
                  <img 
                    src={printImage.src} 
                    alt="Ninaro App Screenshot" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* Decorative Elements behind phone */}
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[600px] bg-gradient-to-tr from-brand-teal/20 to-brand-purple/20 rounded-full blur-2xl"></div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AppDownloadInspira;
