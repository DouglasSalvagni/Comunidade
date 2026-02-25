"use client";
import React from "react";
import { motion } from "framer-motion";
import printImage from "../../assets/print.jpg";

const AppleLogo = () => (
  <svg viewBox="0 0 384 512" width="28" height="28" fill="currentColor">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);

const GooglePlayLogo = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <mask id="mask0_87_8320" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="7" y="3" width="24" height="26">
      <path d="M30.0484 14.4004C31.3172 15.0986 31.3172 16.9014 30.0484 17.5996L9.75627 28.7659C8.52052 29.4459 7 28.5634 7 27.1663L7 4.83374C7 3.43657 8.52052 2.55415 9.75627 3.23415L30.0484 14.4004Z" fill="#C4C4C4"/>
    </mask>
    <g mask="url(#mask0_87_8320)">
      <path d="M7.63473 28.5466L20.2923 15.8179L7.84319 3.29883C7.34653 3.61721 7 4.1669 7 4.8339V27.1664C7 27.7355 7.25223 28.2191 7.63473 28.5466Z" fill="url(#paint0_linear_87_8320)"/>
      <path d="M30.048 14.4003C31.3169 15.0985 31.3169 16.9012 30.048 17.5994L24.9287 20.4165L20.292 15.8175L24.6923 11.4531L30.048 14.4003Z" fill="url(#paint1_linear_87_8320)"/>
      <path d="M24.9292 20.4168L20.2924 15.8179L7.63477 28.5466C8.19139 29.0232 9.02389 29.1691 9.75635 28.766L24.9292 20.4168Z" fill="url(#paint2_linear_87_8320)"/>
      <path d="M7.84277 3.29865L20.2919 15.8177L24.6922 11.4533L9.75583 3.23415C9.11003 2.87878 8.38646 2.95013 7.84277 3.29865Z" fill="url(#paint3_linear_87_8320)"/>
    </g>
    <defs>
      <linearGradient id="paint0_linear_87_8320" x1="15.6769" y1="10.874" x2="7.07106" y2="19.5506" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00C3FF"/>
        <stop offset="1" stopColor="#1BE2FA"/>
      </linearGradient>
      <linearGradient id="paint1_linear_87_8320" x1="20.292" y1="15.8176" x2="31.7381" y2="15.8176" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFCE00"/>
        <stop offset="1" stopColor="#FFEA00"/>
      </linearGradient>
      <linearGradient id="paint2_linear_87_8320" x1="7.36932" y1="30.1004" x2="22.595" y2="17.8937" gradientUnits="userSpaceOnUse">
        <stop stopColor="#DE2453"/>
        <stop offset="1" stopColor="#FE3944"/>
      </linearGradient>
      <linearGradient id="paint3_linear_87_8320" x1="8.10725" y1="1.90137" x2="22.5971" y2="13.7365" gradientUnits="userSpaceOnUse">
        <stop stopColor="#11D574"/>
        <stop offset="1" stopColor="#01F176"/>
      </linearGradient>
    </defs>
  </svg>
);

export const AppDownloadInspira: React.FC = () => {
  return (
    <section id="download" className="py-20 bg-brand-dark relative overflow-hidden">
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
                <div className="relative group cursor-not-allowed">
                  <div className="absolute -top-2 -right-2 z-20 bg-brand-orange text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg transform rotate-12">
                    EM BREVE
                  </div>
                  <motion.button 
                    disabled
                    className="flex items-center gap-3 bg-white/10 text-white/50 px-6 py-3 rounded-xl font-semibold border border-white/10 shadow-lg w-full"
                   >
                     <AppleLogo />
                     <div className="text-left">
                      <div className="text-xs">Baixar na</div>
                      <div className="text-lg leading-none">App Store</div>
                    </div>
                  </motion.button>
                </div>

                <a 
                  href="https://play.google.com/store/apps/details?id=com.wizer.ninaro.android&hl=pt_BR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-3 bg-transparent border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors shadow-lg w-full"
                  >
                    <GooglePlayLogo />
                    <div className="text-left">
                      <div className="text-xs">Disponível no</div>
                      <div className="text-lg leading-none">Google Play</div>
                    </div>
                  </motion.button>
                </a>
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
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%]">
                 <motion.div 
                   animate={{ 
                     opacity: [0.6, 0.9, 0.6],
                     scale: [1, 1.1, 1],
                   }}
                   transition={{ 
                     duration: 4, 
                     repeat: Infinity, 
                     ease: "easeInOut" 
                   }}
                   className="absolute inset-0 bg-gradient-to-tr from-brand-teal/30 via-brand-purple/30 to-brand-orange/20 rounded-full blur-[80px]"
                 />
                 <motion.div 
                   animate={{ 
                     rotate: 360,
                   }}
                   transition={{ 
                     duration: 20, 
                     repeat: Infinity, 
                     ease: "linear" 
                   }}
                   className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_deg,rgba(255,255,255,0.1)_180deg,transparent_360deg)] rounded-full blur-3xl opacity-30"
                 />
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AppDownloadInspira;
