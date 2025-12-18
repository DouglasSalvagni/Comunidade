"use client";
import { useEffect, useState } from "react";
import { api, LegalDocument } from "@/services/api";

const TermsPage = () => {
  const [doc, setDoc] = useState<LegalDocument | null>(null);
  useEffect(() => {
    api.getActiveLegal().then((res) => setDoc(res.terms || null)).catch(() => setDoc(null));
  }, []);
  return (
    <div className="container mx-auto max-w-3xl p-6 prose">
      <h1>Termos de Uso</h1>
      {doc ? (
        <div dangerouslySetInnerHTML={{ __html: doc.content }} />
      ) : (
        <p>Nenhum documento ativo.</p>
      )}
    </div>
  );
};

export default TermsPage;

