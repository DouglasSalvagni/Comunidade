"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api/v1";

export type PublicSettings = Record<string, string | null>;

interface SettingsContextValue {
  settings: PublicSettings;
  loading: boolean;
  reload: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: {},
  loading: true,
  reload: () => {},
});

export function SettingsProvider({ children, initialSettings = {} }: { children: ReactNode, initialSettings?: PublicSettings }) {
  const [settings, setSettings] = useState<PublicSettings>(initialSettings);
  const [loading, setLoading] = useState(Object.keys(initialSettings).length === 0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/settings/public`, { cache: "no-store" });
      if (res.ok) {
        const data: PublicSettings = await res.json();
        setSettings(data);
      }
    } catch {
      // Falha silenciosa — degradação graciosa para env vars e defaults estáticos
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    if (Object.keys(initialSettings).length === 0) {
      load(); 
    }
  }, [load, initialSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, reload: load }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
