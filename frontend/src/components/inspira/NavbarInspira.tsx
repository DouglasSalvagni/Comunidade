"use client";
import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import logo from "@/assets/logo-horizontal.webp";
import { motion, AnimatePresence } from "framer-motion";

export const NavbarInspira: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Histórias", href: "/#features" },
    { name: "Músicas", href: "/#preview" },
    { name: "Sobre", href: "/#footer" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-brand-dark/80 backdrop-blur-lg py-3 shadow-lg" : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <a href="/">
            <Image 
              src={logo} 
              alt="Logo" 
              className={`w-auto transition-all duration-300 ${isScrolled ? "h-10" : "h-20"}`} 
              priority 
            />
          </a>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a key={link.name} href={link.href} className="text-gray-200 hover:text-brand-teal transition-colors font-semibold">
              {link.name}
            </a>
          ))}
          <a href="/auth/login" className="bg-brand-orange hover:bg-orange-500 text-white px-6 py-2 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg">
            Entrar
          </a>
        </div>

        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-brand-dark/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium hover:text-brand-teal"
                >
                  {link.name}
                </a>
              ))}
              <a href="/auth/login" className="bg-brand-orange text-white px-6 py-3 rounded-full font-bold w-full mt-2 text-center block">Entrar</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default NavbarInspira;

