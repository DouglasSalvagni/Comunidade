"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsentProvider } from "@/context/CookieConsentContext";
import { CookieBanner } from "@/components/cookie-consent/CookieBanner";
import { SettingsProvider } from "@/context/SettingsContext";
import { ThemeProvider } from "@/components/ThemeProvider";

/**
 * Wrapper 'use client' que agrupa todos os providers que precisam de React Context.
 * Ordem dos Providers (de fora para dentro):
 *  CookieConsentProvider → SessionProvider → SettingsProvider → ThemeProvider → app
 *
 * SettingsProvider faz o fetch de /settings/public uma única vez e distribui para:
 *  - ThemeProvider (injeta CSS vars + favicon)
 *  - BrandLogo (logo_url e platform_name)
 */
export function ClientProviders({ children, initialSettings = {} }: { children: React.ReactNode, initialSettings?: Record<string, string | null> }) {
  return (
    <CookieConsentProvider>
      <SessionProvider>
        <SettingsProvider initialSettings={initialSettings}>
          <ThemeProvider>
            {children}
            <Toaster richColors position="top-right" />
            <CookieBanner />
          </ThemeProvider>
        </SettingsProvider>
      </SessionProvider>
    </CookieConsentProvider>
  );
}
