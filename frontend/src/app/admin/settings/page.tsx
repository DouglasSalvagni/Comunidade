"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save, RefreshCw } from "lucide-react";
import { ImageUploadCrop } from "@/components/ImageUploadCrop";

const SETTING_META: Record<string, { label: string; description: string; type?: "url" | "email" | "text" | "image" }> = {
  platform_name:        { label: "Nome da Plataforma", description: "Exibido no título, e-mails e metatags.", type: "text" },
  platform_description: { label: "Descrição da Plataforma", description: "Subtítulo/tagline usado em SEO.", type: "text" },
  logo_url:             { label: "URL do Logo (horizontal)", description: "Exibido na Sidebar e Header.", type: "image" },
  logo_compact_url:     { label: "URL do Logo Compacto / Ícone", description: "Usado como versão mobile.", type: "image" },
  favicon_url:          { label: "URL do Favicon", description: "Ícone da aba do navegador.", type: "image" },
  support_email:        { label: "E-mail de Suporte", description: "E-mail exibido nos e-mails transacionais.", type: "email" },
};

const SECTIONS = [
  {
    title: "🏷️ Identidade",
    description: "Nome, descrição e logos da plataforma.",
    keys: ["platform_name", "platform_description", "logo_url", "logo_compact_url", "favicon_url"],
  },
  {
    title: "📧 Suporte",
    description: "Informações exibidas nos e-mails transacionais.",
    keys: ["support_email"],
  },
];

// Chaves gerenciadas por aqui — as demais (cores, etc.) são somente via variável de ambiente
const MANAGED_KEYS = SECTIONS.flatMap((s) => s.keys);

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.adminListSettings();
      const map: Record<string, string> = {};
      for (const s of list) {
        if (MANAGED_KEYS.includes(s.key)) map[s.key] = s.value ?? "";
      }
      setSettings(map);
      setDirty({});
    } catch {
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty((prev) => ({ ...prev, [key]: true }));
  };

  const handleSave = async (key: string) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      await api.adminUpsertSetting(key, settings[key] ?? null);
      setDirty((prev) => ({ ...prev, [key]: false }));
      toast.success(`"${SETTING_META[key]?.label ?? key}" salvo`);
    } catch {
      toast.error(`Erro ao salvar "${key}"`);
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configurações da Plataforma</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Identidade e conteúdo dinâmico da plataforma. Cores são configuradas via variáveis de ambiente.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Recarregar
        </Button>
      </div>

      {SECTIONS.map((section) => (
        <Card key={section.title}>
          <CardHeader className="pb-3">
            <h2 className="text-base font-semibold">{section.title}</h2>
            <p className="text-xs text-muted-foreground">{section.description}</p>
          </CardHeader>
          <CardContent className="space-y-5">
            {section.keys.map((key) => {
              const meta = SETTING_META[key] ?? { label: key, description: "", type: "text" };
              const value = settings[key] ?? "";
              const isDirty = !!dirty[key];
              const isSaving = !!saving[key];

              return (
                <div key={key} className="space-y-1.5">
                  <label
                    htmlFor={`setting-${key}`}
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    {meta.label}
                    {isDirty && (
                      <span className="text-xs text-amber-500 font-normal">• não salvo</span>
                    )}
                  </label>
                  {meta.description && (
                    <p className="text-xs text-muted-foreground">{meta.description}</p>
                  )}
                  {meta.type === "image" ? (
                    <div className="flex flex-col gap-2">
                      <ImageUploadCrop
                        label={meta.label}
                        value={value}
                        onChange={(url) => {
                          handleChange(key, url);
                          // Auto save when upload finishes
                          setSettings((prev) => {
                            const newSettings = { ...prev, [key]: url };
                            api.adminUpsertSetting(key, url).then(() => {
                              setDirty((d) => ({ ...d, [key]: false }));
                              toast.success(`"${meta.label}" salvo com sucesso!`);
                            }).catch(() => toast.error(`Erro ao salvar "${key}"`));
                            return newSettings;
                          });
                        }}
                        uploadType={key === 'favicon_url' ? 'favicon' : key === 'logo_compact_url' ? 'logo_compact' : 'logo'}
                        aspectRatio={key === 'favicon_url' || key === 'logo_compact_url' ? 1 : undefined}
                      />
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-muted-foreground">Ou URL:</span>
                        <Input
                          id={`setting-${key}`}
                          type="text"
                          value={value}
                          onChange={(e) => handleChange(key, e.target.value)}
                          placeholder="https://"
                          className="flex-1 text-xs h-8"
                        />
                        <Button
                          size="sm"
                          disabled={!isDirty || isSaving}
                          onClick={() => handleSave(key)}
                          className="shrink-0 gap-1.5 h-8"
                        >
                          {isSaving ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Save className="w-3 h-3" />
                          )}
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        id={`setting-${key}`}
                        type={meta.type === "email" ? "email" : "text"}
                        value={value}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={meta.type === "url" ? "https://" : ""}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        disabled={!isDirty || isSaving}
                        onClick={() => handleSave(key)}
                        className="shrink-0 gap-1.5"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Salvar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
