"use client";
import React from "react";
import { Instagram, Twitter, Facebook } from "lucide-react";
import Image from "next/image";
import logo from "@/assets/logoninaro.webp";

export const FooterInspira: React.FC = () => {
  return (
    <footer id="footer" className="bg-black/30 pt-20 pb-10 border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Image src={logo} alt="Logo Ninaro" className="h-32 w-auto" />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Criando momentos mágicos através do som. Ajudamos crianças a explorar novos mundos sem sair de casa.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Explorar</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-brand-teal">Histórias</a></li>
              <li><a href="#" className="hover:text-brand-teal">Músicas</a></li>
              <li><a href="#" className="hover:text-brand-teal">Personagens</a></li>
              <li><a href="#" className="hover:text-brand-teal">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Suporte</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-brand-teal">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-brand-teal">Para Escolas</a></li>
              <li><a href="#" className="hover:text-brand-teal">Privacidade</a></li>
              <li><a href="#" className="hover:text-brand-teal">Termos de Uso</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Siga a gente</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-teal hover:text-brand-dark transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-blue hover:text-white transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-teal hover:text-brand-dark transition-colors">
                <Twitter size={18} />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Ninaro Inc. Feito com magia ✨</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterInspira;

