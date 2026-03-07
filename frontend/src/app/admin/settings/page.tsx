"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const SETTINGS_KEY = "asaas.itemImageBase64";

const AdminSettingsPage = () => {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const setting = await api.adminGetSetting(SETTINGS_KEY);
      setValue(setting.value ?? "");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao carregar configuração");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSave = async () => {
    setSaving(true);
    try {
      await api.adminSetSetting(SETTINGS_KEY, value.length ? value : null);
      toast.success("Configuração salva");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
      <Card>
        <CardHeader>
          <CardTitle>Imagem do item Asaas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Base64</Label>
            <Textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="min-h-[220px]"
              placeholder="Cole o base64 da imagem"
              disabled={loading || saving}
            />
          </div>
          <Button onClick={onSave} disabled={loading || saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsPage;
