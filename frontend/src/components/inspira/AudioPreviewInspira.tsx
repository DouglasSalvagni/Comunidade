"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, Volume2 } from "lucide-react";

const MusicNoteAnimation = ({ isPlaying }: { isPlaying: boolean }) => {
  return (
    <div className="flex items-end gap-1 h-6">
      {[1, 2, 3, 4].map((bar) => (
        <motion.div
          key={bar}
          className="w-1.5 bg-white rounded-t-sm"
          animate={{ height: isPlaying ? [8, 24, 12, 20] : 8 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: bar * 0.1 }}
        />
      ))}
    </div>
  );
};

export const AudioPreviewInspira: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(30);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <section id="preview" className="py-20 bg-gradient-to-b from-brand-dark to-brand-purple/20 relative overflow-hidden">
      <div className="container mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
        <div className="lg:w-1/2 z-10">
          <h2 className="text-4xl font-bold mb-6">Ouça um pedacinho da magia</h2>
          <p className="text-gray-300 text-lg mb-8">
            De aventuras espaciais a contos de fadas modernos. Nosso catálogo cresce toda semana com produções de qualidade cinematográfica.
          </p>
          <ul className="space-y-4">
            {["O Dragão que Queria Cantar Jazz", "Viagem ao Planeta dos Doces", "A Orquestra da Floresta Encantada"].map((item, idx) => (
              <li key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5">
                <div className="w-10 h-10 rounded-full bg-brand-teal/20 flex items-center justify-center text-brand-teal font-bold">{idx + 1}</div>
                <span className="font-semibold text-lg">{item}</span>
                {idx === 0 && <div className="ml-auto text-xs bg-brand-orange px-2 py-1 rounded text-white font-bold">Tocando</div>}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:w-1/2 w-full max-w-md z-10">
          <motion.div whileHover={{ scale: 1.02 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div className="relative aspect-square rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-8 overflow-hidden shadow-inner group">
              <img src="https://picsum.photos/400/400?random=1" alt="Album Art" className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                  <MusicNoteAnimation isPlaying={isPlaying} />
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-1">O Dragão Cantor</h3>
              <p className="text-brand-teal font-medium">Contos da Floresta</p>
            </div>
            <div className="mb-8">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer">
                <motion.div className="h-full bg-gradient-to-r from-brand-teal to-brand-blue" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>0:45</span>
                <span>2:30</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button className="text-gray-400 hover:text-white transition-colors">
                <Volume2 size={20} />
              </button>
              <div className="flex items-center gap-6">
                <button className="text-white hover:text-brand-teal transition-colors">
                  <SkipBack size={28} />
                </button>
                <button onClick={() => setIsPlaying(!isPlaying)} className="w-16 h-16 rounded-full bg-brand-orange text-white flex items-center justify-center shadow-lg hover:bg-orange-500 transition-all transform hover:scale-110">
                  {isPlaying ? <Pause fill="white" /> : <Play fill="white" className="ml-1" />}
                </button>
                <button className="text-white hover:text-brand-teal transition-colors">
                  <SkipForward size={28} />
                </button>
              </div>
              <button className="text-gray-400 hover:text-white transition-colors text-xs font-bold border border-gray-600 px-2 rounded">1x</button>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-brand-teal/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-10 w-72 h-72 bg-brand-purple/20 rounded-full blur-3xl -z-10"></div>
    </section>
  );
};

export default AudioPreviewInspira;

