import React from "react";
import NavbarInspira from "@/components/inspira/NavbarInspira";
import FooterInspira from "@/components/inspira/FooterInspira";
import { Card } from "@/components/ui/card";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export default async function TermsPage() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
  let doc: any = null;
  try {
    const res = await fetch(`${API_BASE_URL}/legal/active`, { cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    doc = (json as any)?.terms || null;
  } catch {}

  return (
    <div className="min-h-screen bg-brand-dark text-white selection:bg-brand-teal selection:text-brand-dark font-sans">
      <NavbarInspira />
      <main className="pt-32 pb-20 container mx-auto px-6">
        <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-sm text-gray-200">
          <h1 className="text-3xl font-bold mb-6 text-white">Termos de Uso</h1>
          
          <div className="space-y-4 leading-relaxed">
            {doc ? (
              <MarkdownRenderer content={doc.content} proseClassName="prose-invert" />
            ) : (
              <p className="text-gray-300">Nenhum documento ativo.</p>
            )}
          </div>
        </Card>
      </main>
      <FooterInspira />
    </div>
  );
}
