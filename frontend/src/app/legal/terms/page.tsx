"use client";
import { useEffect, useState } from "react";
import { api, LegalDocument } from "@/services/api";
import MarkdownRenderer from "@/components/MarkdownRenderer";

const TermsPage = () => {
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  useEffect(() => {
    api.getActiveLegal().then((res) => setDoc(res.terms || null)).catch(() => setDoc(null));
  }, []);
  return (
    <div className="container mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold mb-6">Termos de Uso</h1>
      {doc ? (
        <MarkdownRenderer content={doc.content} />
      ) : (
        <p>Nenhum documento ativo.</p>
      )}
    </div>
  );
};

export default TermsPage;

