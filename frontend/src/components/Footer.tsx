"use client";

import { Instagram } from "lucide-react";
import { useCookieConsent } from "@/context/CookieConsentContext";

const Footer = () => {
  const { openModal } = useCookieConsent();

  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold gradient-hero bg-clip-text">
              KidsVerse
            </h3>
            <p className="text-sm text-muted-foreground">
              Criando momentos especiais de aprendizado e diversão para famílias.
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/ninaroapp" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-smooth">
                <Instagram className="w-5 h-5 text-primary" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Conteúdo</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-smooth">Músicas</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Audiobooks</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Novidades</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-smooth">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Blog</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Carreiras</a></li>
              <li><a href="#" className="hover:text-primary transition-smooth">Contato</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Suporte</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-smooth">Central de Ajuda</a></li>
              <li><a href="/terms" className="hover:text-primary transition-smooth">Termos de Uso</a></li>
              <li><a href="/privacy" className="hover:text-primary transition-smooth">Privacidade</a></li>
              <li><button onClick={openModal} className="hover:text-primary transition-smooth text-left">Gerenciar Cookies</button></li>
              <li><a href="#" className="hover:text-primary transition-smooth">FAQ</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2024 KidsVerse. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
