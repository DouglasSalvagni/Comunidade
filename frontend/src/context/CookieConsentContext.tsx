"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CookiePreferencesModal } from "@/components/cookie-consent/CookiePreferencesModal";

// Cookie name
const COOKIE_NAME = "cookie_consent_config";
const COOKIE_VERSION = "1.0";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export interface ConsentConfig {
  necessary: boolean;
  functional: boolean;
  version: string;
  timestamp: string;
}

interface CookieConsentContextType {
  consent: ConsentConfig | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  acceptAll: () => void;
  rejectOptional: () => void;
  savePreferences: (functional: boolean) => void;
  resetConsent: () => void;
  hasConsentedTo: (category: 'necessary' | 'functional') => boolean;
  openModal: () => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | null>(null);

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within a CookieConsentProvider");
  }
  return context;
};

export const CookieConsentProvider = ({ children }: { children: React.ReactNode }) => {
  const [consent, setConsent] = useState<ConsentConfig | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = getCookie(COOKIE_NAME);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check version if needed, for now accept any valid JSON
        setConsent(parsed);
      } catch {
        // Invalid cookie, show banner
        setIsOpen(true);
      }
    } else {
      // No cookie, show banner
      // Delay slightly to avoid flash or hydration mismatch if possible, but for UX better to show
      // We rely on isMounted to render the banner only on client
      setIsOpen(true);
    }
  }, []);

  const saveCookie = (config: ConsentConfig) => {
    const value = JSON.stringify(config);
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    setConsent(config);
    setIsOpen(false);
    setIsModalOpen(false);
    
    // Dispatch event for non-react listeners if needed
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cookie-consent-update', { detail: config }));
    }
  };

  const acceptAll = () => {
    saveCookie({
      necessary: true,
      functional: true,
      version: COOKIE_VERSION,
      timestamp: new Date().toISOString(),
    });
  };

  const rejectOptional = () => {
    saveCookie({
      necessary: true,
      functional: false,
      version: COOKIE_VERSION,
      timestamp: new Date().toISOString(),
    });
  };

  const savePreferences = (functional: boolean) => {
    saveCookie({
      necessary: true,
      functional,
      version: COOKIE_VERSION,
      timestamp: new Date().toISOString(),
    });
  };

  const resetConsent = () => {
    setConsent(null);
    setIsOpen(true);
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  };

  const hasConsentedTo = (category: 'necessary' | 'functional') => {
    if (category === 'necessary') return true;
    return consent?.functional === true;
  };

  const openModal = () => setIsModalOpen(true);

  // Helper to get cookie
  function getCookie(name: string) {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(";").shift() || "");
    return null;
  }

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        isOpen,
        setIsOpen,
        acceptAll,
        rejectOptional,
        savePreferences,
        resetConsent,
        hasConsentedTo,
        openModal,
        isModalOpen,
        setIsModalOpen,
      }}
    >
      {children}
      <CookiePreferencesModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </CookieConsentContext.Provider>
  );
};
