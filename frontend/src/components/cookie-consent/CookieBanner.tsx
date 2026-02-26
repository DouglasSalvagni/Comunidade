"use client";

import { useCookieConsent } from "@/context/CookieConsentContext";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export const CookieBanner = () => {
  const { isOpen, acceptAll, rejectOptional, openModal } = useCookieConsent();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 bg-background/95 backdrop-blur-md border-t border-border shadow-2xl"
        >
          <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Cookie className="h-5 w-5" />
                <h3 className="font-semibold text-lg tracking-tight">Gerenciamento de Cookies</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                Utilizamos cookies essenciais para garantir o funcionamento do site e cookies funcionais para lembrar suas preferências (como o perfil ativo e o estado do menu). Você pode personalizar suas escolhas a qualquer momento.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <Button variant="outline" onClick={openModal} className="whitespace-nowrap">
                Preferências
              </Button>
              <Button variant="secondary" onClick={rejectOptional} className="whitespace-nowrap">
                Rejeitar Opcionais
              </Button>
              <Button onClick={acceptAll} className="whitespace-nowrap font-medium">
                Aceitar Todos
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
