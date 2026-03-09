"use client";

import { useEffect } from "react";
import { useSettings } from "@/context/SettingsContext";

/**
 * ThemeProvider — responsável apenas por aplicações que só são possíveis no cliente:
 *
 *  1. Favicon dinâmico: injeta <link rel="icon"> com a URL do banco (logo_compact_url ou logo_url)
 *
 * As CORES são definidas exclusivamente pelas variáveis de ambiente (NEXT_PUBLIC_PRIMARY_COLOR, etc.)
 * e injetadas como <style> inline no servidor (layout.tsx) — garanti zero FOUC.
 * Não há sobrescrita de cores via banco de dados por design.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, loading } = useSettings();

  useEffect(() => {
    if (loading) return;

    // ── Favicon dinâmico ──────────────────────────────────────────────────
    // Usa logo_compact_url (ícone quadrado) como favicon; fallback para logo_url horizontal.
    const faviconUrl = settings.logo_compact_url || settings.logo_url;
    if (faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [settings, loading]);

  return <>{children}</>;
}
