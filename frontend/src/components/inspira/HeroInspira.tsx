"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Sparkles } from "lucide-react";

interface HangingPropProps {
  children: React.ReactNode;
  delay: number;
  duration: number;
  x: string;
  height: string;
  rotateRange?: number;
  overlap?: number;
}

const HangingProp: React.FC<HangingPropProps> = ({ children, delay, duration, x, height, rotateRange = 5, overlap = 10 }) => {
  return (
    <motion.div
      initial={{ rotate: -rotateRange }}
      animate={{ rotate: rotateRange }}
      transition={{ duration, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay }}
      style={{ left: x, top: -20, transformOrigin: "50% 0px" }}
      className="absolute z-20 flex flex-col items-center"
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] z-0"
        style={{
          height: `calc(${height} + ${overlap}px)`,
          background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.3) 100%)",
        }}
      ></div>
      <div style={{ marginTop: height }} className="relative z-10 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
        {children}
      </div>
    </motion.div>
  );
};

const MoonSVG = () => (
  <svg width="140" height="140" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="moonGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 100) rotate(45) scale(100)">
        <stop stopColor="#FEF3C7" />
        <stop offset="1" stopColor="#F59E0B" />
      </radialGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <path d="M160 100C160 144.183 124.183 180 80 180C65.62 180 52.11 176.2 40.4 169.5C57.2 165.5 70 150.5 70 132C70 110 52 92 30 92C24.5 92 19.2 93.2 14.4 95.4C23.8 62.8 53.8 40 88 40C127.76 40 160 66.86 160 100Z" fill="url(#moonGrad)" stroke="#FFFBEB" strokeWidth="2" filter="url(#glow)" />
    <circle cx="100" cy="80" r="8" fill="#D97706" fillOpacity="0.3" />
    <circle cx="130" cy="120" r="12" fill="#D97706" fillOpacity="0.3" />
    <circle cx="90" cy="140" r="5" fill="#D97706" fillOpacity="0.3" />
    <path d="M105 100 Q115 105 125 100" stroke="#D97706" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

const CastleSVG = () => (
  <svg width="220" height="220" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="castleBody" x1="100" y1="0" x2="100" y2="200" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8B5CF6" />
        <stop offset="1" stopColor="#4C1D95" />
      </linearGradient>
      <linearGradient id="roofGrad" x1="100" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F472B6" />
        <stop offset="1" stopColor="#DB2777" />
      </linearGradient>
    </defs>
    <rect x="20" y="100" width="40" height="100" rx="4" fill="url(#castleBody)" stroke="#C4B5FD" strokeWidth="2" />
    <path d="M15 100L40 60L65 100H15Z" fill="url(#roofGrad)" stroke="#FBCFE8" strokeWidth="2" />
    <rect x="140" y="100" width="40" height="100" rx="4" fill="url(#castleBody)" stroke="#C4B5FD" strokeWidth="2" />
    <path d="M135 100L160 60L185 100H135Z" fill="url(#roofGrad)" stroke="#FBCFE8" strokeWidth="2" />
    <rect x="60" y="80" width="80" height="120" rx="4" fill="url(#castleBody)" stroke="#C4B5FD" strokeWidth="2" />
    <path d="M50 80L100 30L150 80H50Z" fill="url(#roofGrad)" stroke="#FBCFE8" strokeWidth="2" />
    <path d="M80 200V150C80 138.954 88.9543 130 100 130C111.046 130 120 138.954 120 150V200H80Z" fill="#312E81" stroke="#C4B5FD" strokeWidth="2" />
    <rect x="90" y="90" width="20" height="25" rx="10" fill="#FDE047" />
    <rect x="32" y="120" width="16" height="20" rx="8" fill="#312E81" />
    <rect x="152" y="120" width="16" height="20" rx="8" fill="#312E81" />
    <path d="M100 30L100 10L120 20L100 30Z" fill="#F59E0B" />
    <path d="M40 60L40 45L55 52.5L40 60Z" fill="#F59E0B" />
    <path d="M160 60L160 45L175 52.5L160 60Z" fill="#F59E0B" />
  </svg>
);

  const TeddyBearSVG = () => (
    <svg width="220" height="240" viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bearFur" x1="100" y1="0" x2="100" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a16207" />
          <stop offset="1" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id="bearBelly" x1="100" y1="100" x2="100" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f5deb3" />
          <stop offset="1" stopColor="#e9cfa6" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="152" rx="40" ry="45" fill="url(#bearFur)" stroke="#5c3a1d" strokeWidth="2" />
      <ellipse cx="100" cy="162" rx="24" ry="18" fill="url(#bearBelly)" />
      <ellipse cx="82" cy="150" rx="14" ry="10" fill="#8b5a2b" stroke="#5c3a1d" strokeWidth="2" />
      <ellipse cx="118" cy="150" rx="14" ry="10" fill="#8b5a2b" stroke="#5c3a1d" strokeWidth="2" />
      <ellipse cx="80" cy="192" rx="12" ry="9" fill="#8b5a2b" stroke="#5c3a1d" strokeWidth="1.5" />
      <ellipse cx="120" cy="192" rx="12" ry="9" fill="#8b5a2b" stroke="#5c3a1d" strokeWidth="1.5" />
      <ellipse cx="60" cy="70" rx="18" ry="18" fill="#8b5a2b" stroke="#5c3a1d" strokeWidth="2" />
      <ellipse cx="140" cy="70" rx="18" ry="18" fill="#8b5a2b" stroke="#5c3a1d" strokeWidth="2" />
      <circle cx="100" cy="90" r="40" fill="url(#bearFur)" stroke="#5c3a1d" strokeWidth="2" />
      <ellipse cx="100" cy="110" rx="22" ry="16" fill="#d8b089" />
      <circle cx="88" cy="95" r="4" fill="#2b1b10" />
      <circle cx="112" cy="95" r="4" fill="#2b1b10" />
      <path d="M92 110 Q100 116 108 110" stroke="#5c3a1d" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="100" cy="105" r="5" fill="#2b1b10" />
      <circle cx="60" cy="70" r="6" fill="#d8b089" opacity="0.7" />
      <circle cx="140" cy="70" r="6" fill="#d8b089" opacity="0.7" />
    </svg>
  );

const MusicNoteSVG = () => (
  <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="noteGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F472B6" />
        <stop offset="1" stopColor="#9333EA" />
      </linearGradient>
    </defs>
    <g transform="translate(0, 0)">
      <circle cx="20" cy="80" r="15" fill="url(#noteGrad)" stroke="#FBCFE8" strokeWidth="2" />
      <circle cx="70" cy="70" r="15" fill="url(#noteGrad)" stroke="#FBCFE8" strokeWidth="2" />
      <path d="M30 80V30L80 20V70" stroke="url(#noteGrad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 40L80 30" stroke="#FBCFE8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="55" cy="25" r="2" fill="#FBCFE8" opacity="0.5" />
    </g>
  </svg>
);

const StarSVG = () => (
  <div className="filter drop-shadow-[0_0_8px_rgba(253,224,71,0.6)]">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="#FDE047" stroke="#F59E0B" strokeWidth="1" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" strokeLinejoin="round" />
    </svg>
  </div>
);

export const HeroInspira: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-[#4c1d95] via-[#1e1b4b] to-[#0f172a] z-0" />
      <div suppressHydrationWarning>
        {mounted && [...Array(60)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]"
            initial={{ opacity: Math.random() * 0.5 + 0.2, scale: Math.random() * 0.5 + 0.5 }}
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.5, 1, 0.5] }}
            transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, delay: Math.random() * 5, ease: "easeInOut" }}
            style={{
              width: Math.random() > 0.9 ? "3px" : "1.5px",
              height: Math.random() > 0.9 ? "3px" : "1.5px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
            }}
          />
        ))}
      </div>
      <motion.div
        className="absolute z-0 pointer-events-none"
        initial={{ left: "-10%", top: "40%", opacity: 0, scale: 0.5 }}
        animate={{ left: "110%", top: "70%", opacity: [0, 1, 1, 0], scale: 1 }}
        transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" }}
      >
        <div className="relative w-48 h-[1px] bg-gradient-to-r from-transparent via-blue-100 to-white transform rotate-12 opacity-60">
          <div className="absolute right-0 -top-[1.5px] w-[4px] h-[4px] bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,1)] animate-pulse"></div>
        </div>
      </motion.div>
      <div className="container mx-auto px-6 z-10 relative h-full flex flex-col lg:flex-row items-center">
        <div className="lg:w-1/2 text-center lg:text-left pt-10 lg:pt-0 relative z-30">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <span className="inline-block py-1 px-3 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-sm font-bold mb-6 backdrop-blur-sm">
              ✨ Aventuras Noturnas
            </span>
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-white to-teal-200 drop-shadow-sm">
              Histórias que ganham vida
            </h1>
            <p className="text-lg lg:text-xl text-indigo-200/80 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Um palco mágico onde músicas e contos de ninar se encontram para encantar as noites dos pequenos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-brand-orange hover:bg-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_25px_rgba(251,146,60,0.4)] flex items-center justify-center gap-2 transition-colors">
                <Play className="w-5 h-5 fill-current" />
                Ouvir Agora
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-colors">
                <Sparkles className="w-5 h-5" />
                Conhecer Personagens
              </motion.button>
            </div>
          </motion.div>
        </div>
        <div className="lg:w-1/2 h-[600px] w-full relative perspective-1000 pointer-events-none">
          <div className="absolute inset-0 w-full h-full">
            <HangingProp x="80%" height="80px" duration={6} delay={0} rotateRange={3} overlap={30}>
              <MoonSVG />
            </HangingProp>
            <HangingProp x="50%" height="240px" duration={8} delay={1} rotateRange={2} overlap={35}>
              <CastleSVG />
            </HangingProp>
            <HangingProp x="20%" height="210px" duration={7} delay={2} rotateRange={4} overlap={55}>
              <TeddyBearSVG />
            </HangingProp>
            <HangingProp x="5%" height="150px" duration={5} delay={0.5} rotateRange={5} overlap={26}>
              <MusicNoteSVG />
            </HangingProp>
            <HangingProp x="70%" height="100px" duration={4} delay={1.5} rotateRange={6} overlap={26}>
              <div className="transform scale-75">
                <MusicNoteSVG />
              </div>
            </HangingProp>
            <HangingProp x="42%" height="150px" duration={9} delay={3} rotateRange={8} overlap={5}>
              <StarSVG />
            </HangingProp>
            <HangingProp x="12%" height="90px" duration={7} delay={4} rotateRange={10} overlap={9}>
              <div className="transform scale-75">
                <StarSVG />
              </div>
            </HangingProp>
            <HangingProp x="92%" height="40px" duration={8} delay={2.5} rotateRange={6} overlap={4}>
              <div className="transform scale-90">
                <StarSVG />
              </div>
            </HangingProp>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-64 z-10">
            <div className="absolute bottom-0 w-full h-full from-brand-dark via-brand-dark/80 to-transparent"></div>
            <motion.div animate={{ x: [-50, 0, -50] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -bottom-10 left-0 w-[200%] h-48 bg-[url('https://www.transparenttextures.com/patterns/clouds.png')] opacity-20" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="fill-brand-dark block">
          <path fillOpacity="1" d="M0,160L48,176C96,192,192,224,288,229.3C384,235,480,213,576,181.3C672,149,768,107,864,112C960,117,1056,171,1152,186.7C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroInspira;
