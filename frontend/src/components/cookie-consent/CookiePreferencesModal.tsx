"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useCookieConsent } from "@/context/CookieConsentContext";

export const CookiePreferencesModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const { savePreferences, consent } = useCookieConsent();
  const [functional, setFunctional] = useState(false);

  // Sync with context when opening
  useEffect(() => {
    if (open) {
      setFunctional(consent?.functional ?? false);
    }
  }, [open, consent]);

  const handleSave = () => {
    savePreferences(functional);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] z-[150]">
        <DialogHeader>
          <DialogTitle>Preferências de Cookies</DialogTitle>
          <DialogDescription>
            Gerencie suas preferências de privacidade.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-1">
              <Label htmlFor="necessary" className="text-base font-semibold">Estritamente Necessários</Label>
              <p className="text-sm text-muted-foreground">
                Essenciais para autenticação, segurança e funcionamento básico. Não podem ser desativados.
              </p>
            </div>
            <Switch id="necessary" checked disabled />
          </div>
          <div className="flex items-center justify-between space-x-4">
            <div className="space-y-1">
              <Label htmlFor="functional" className="text-base font-semibold">Funcionais</Label>
              <p className="text-sm text-muted-foreground">
                Lembram suas escolhas, como o perfil infantil ativo e estado do menu lateral.
              </p>
            </div>
            <Switch id="functional" checked={functional} onCheckedChange={setFunctional} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Preferências</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
