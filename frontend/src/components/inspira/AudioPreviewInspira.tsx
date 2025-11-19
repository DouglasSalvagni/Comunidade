"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";
import Hls from "hls.js";
import { api } from "@/services/api";

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
  const [progress, setProgress] = useState(0);
  const [samples, setSamples] = useState<Array<{ id: string; title: string; coverUrl?: string; hlsUrl?: string }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await api.getLandingSamples(3);
        setSamples(Array.isArray(list) ? list : []);
        setCurrentIndex(0);
      } catch {}
    };
    load();
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    const item = samples[currentIndex];
    if (!el || !item?.hlsUrl) return;
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const url = item.hlsUrl;
    if (url && url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(el);
      hls.on(Hls.Events.LEVEL_LOADED, (_evt, data: any) => {
        const d = data?.details;
        if (d && d.live === false && typeof d.totalduration === 'number') {
          const total = d.totalduration || 0;
          setDurationSeconds(total);
          const onTime = () => {
            const pos = el.currentTime || 0;
            const pct = total ? Math.min(100, (pos / total) * 100) : 0;
            setProgress(pct);
            setCurrentSeconds(pos);
          };
          el.addEventListener('timeupdate', onTime);
        }
      });
    } else {
      el.src = url;
      const onMeta = () => {
        const dur = el.duration || 0;
        setDurationSeconds(dur);
      };
      el.addEventListener('loadedmetadata', onMeta);
      const onTime = () => {
        const dur = el.duration || 0;
        const pos = el.currentTime || 0;
        setProgress(dur ? Math.min(100, (pos / dur) * 100) : 0);
        setCurrentSeconds(pos);
      };
      el.addEventListener('timeupdate', onTime);
    }
    setIsPlaying(false);
    setCurrentSeconds(0);
  }, [samples, currentIndex]);

  const formatTime = (s: number) => {
    const sec = Math.max(0, Math.floor(s || 0));
    const m = Math.floor(sec / 60);
    const r = sec % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  };

  return (
    <section id="preview" className="py-20 bg-gradient-to-b from-brand-dark to-brand-purple/20 relative overflow-hidden">
      <div className="container mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
        <div className="lg:w-1/2 z-10">
          <h2 className="text-4xl font-bold mb-6">Ouça um pedacinho da magia</h2>
          <p className="text-gray-300 text-lg mb-8">
            De aventuras espaciais a contos de fadas. Nosso catálogo cresce toda semana com produções de alta qualidade.
          </p>
          <ul className="space-y-4">
            {(((Array.isArray(samples) ? samples : [])).length ? samples : []).map((item, idx) => (
              <li key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5" onClick={() => setCurrentIndex(idx)}>
                <div className="w-10 h-10 rounded-full bg-brand-teal/20 flex items-center justify-center text-brand-teal font-bold">{idx + 1}</div>
                <span className="font-semibold text-lg">{item.title}</span>
                {idx === currentIndex && <div className="ml-auto text-xs bg-brand-orange px-2 py-1 rounded text-white font-bold">Tocando</div>}
              </li>
            ))}
            {(!samples || samples.length === 0) && (
              <li className="p-4 rounded-xl bg-white/5 border border-white/5 text-sm text-gray-300">Sem amostras disponíveis no momento</li>
            )}
          </ul>
        </div>

        <div className="lg:w-1/2 w-full max-w-md z-10">
          <motion.div whileHover={{ scale: 1.02 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div className="relative aspect-square rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-8 overflow-hidden shadow-inner group">
              <img src={samples[currentIndex]?.coverUrl || "https://picsum.photos/400/400?random=1"} alt="Album Art" className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                  <MusicNoteAnimation isPlaying={isPlaying} />
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-1">{samples[currentIndex]?.title || "Amostra"}</h3>
              <p className="text-brand-teal font-medium">Amostra da plataforma</p>
            </div>
            
            
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-6">
                <button className="text-white hover:text-brand-teal transition-colors" onClick={() => setCurrentIndex(idx => Math.max(0, idx - 1))}>
                  <SkipBack size={28} />
                </button>
                <button onClick={() => {
                  const el = audioRef.current; if (!el) return;
                  if (isPlaying) { el.pause(); setIsPlaying(false); } else { el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false)); }
                }} className="w-16 h-16 rounded-full bg-brand-orange text-white flex items-center justify-center shadow-lg hover:bg-orange-500 transition-all transform hover:scale-110">
                  {isPlaying ? <Pause fill="white" /> : <Play fill="white" className="ml-1" />}
                </button>
                <button className="text-white hover:text-brand-teal transition-colors" onClick={() => setCurrentIndex(idx => Math.min((samples.length || 1) - 1, idx + 1))}>
                  <SkipForward size={28} />
                </button>
              </div>
            </div>
            <audio ref={audioRef} className="hidden" />
          </motion.div>
        </div>
      </div>
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-brand-teal/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-10 w-72 h-72 bg-brand-purple/20 rounded-full blur-3xl -z-10"></div>
    </section>
  );
};

export default AudioPreviewInspira;

