"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-2">
            <div className="text-3xl">🎨</div>
            <span className="text-2xl font-bold gradient-hero bg-clip-text">
              KidsVerse
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-foreground hover:text-primary transition-smooth font-medium">
              Dashboard
            </Link>
            <a href="#conteudo" className="text-foreground hover:text-primary transition-smooth font-medium">
              Conteúdo
            </a>
            <a href="#planos" className="text-foreground hover:text-primary transition-smooth font-medium">
              Planos
            </a>
            <a href="#sobre" className="text-foreground hover:text-primary transition-smooth font-medium">
              Sobre
            </a>
            <a href="#contato" className="text-foreground hover:text-primary transition-smooth font-medium">
              Contato
            </a>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">
                Entrar
              </Button>
            </Link>
            <Button className="gradient-hero text-white shadow-medium hover:shadow-large transition-smooth">
              Começar Grátis
            </Button>
          </div>
          
          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
        
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t">
            <Link href="/dashboard" className="block py-2 hover:text-primary transition-smooth">
              Dashboard
            </Link>
            <a href="#conteudo" className="block py-2 hover:text-primary transition-smooth">
              Conteúdo
            </a>
            <a href="#planos" className="block py-2 hover:text-primary transition-smooth">
              Planos
            </a>
            <a href="#sobre" className="block py-2 hover:text-primary transition-smooth">
              Sobre
            </a>
            <a href="#contato" className="block py-2 hover:text-primary transition-smooth">
              Contato
            </a>
            <div className="flex flex-col gap-2 pt-4">
              <Link href="/login" className="w-full">
                <Button variant="ghost" className="w-full">
                  Entrar
                </Button>
              </Link>
              <Button className="w-full gradient-hero text-white">
                Começar Grátis
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
