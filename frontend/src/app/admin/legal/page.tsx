"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, LegalDocument } from "@/services/api";
import { toast } from "sonner";
import MarkdownRenderer from "@/components/MarkdownRenderer";

type DocType = 'PRIVACY_POLICY' | 'TERMS_OF_USE' | 'ALL';

const AdminLegalPage = () => {
  const [activeTab, setActiveTab] = useState<DocType>('PRIVACY_POLICY');
  const [docs, setDocs] = useState<LegalDocument[]>([]);
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);

  const loadDocs = async (type: DocType) => {
    try {
      const list = await api.adminListLegalDocuments(type === 'ALL' ? undefined : type);
      setDocs(list);
    } catch (e: any) {
      toast.error(e?.message || "Falha ao carregar documentos");
    }
  };

  useEffect(() => { loadDocs(activeTab); }, [activeTab]);

  const handleCreate = async (docType: 'PRIVACY_POLICY' | 'TERMS_OF_USE', makeActive: boolean) => {
    if (!content.trim()) return;
    try {
      const created = await api.adminCreateLegalDocument({ type: docType, content, isActive: makeActive });
      setContent("");
      setPreview(false);
      toast.success("Documento criado");
      await loadDocs(docType);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao criar documento");
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await api.adminActivateLegalDocument(id);
      toast.success("Documento ativado");
      await loadDocs(activeTab);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao ativar documento");
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Termos & Privacidade</h1>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DocType)}>
        <TabsList>
          <TabsTrigger value="PRIVACY_POLICY">Política de Privacidade</TabsTrigger>
          <TabsTrigger value="TERMS_OF_USE">Termos de Uso</TabsTrigger>
          <TabsTrigger value="ALL">Todos</TabsTrigger>
        </TabsList>
        <TabsContent value="PRIVACY_POLICY">
          <Card>
            <CardHeader>
              <CardTitle>Novo Documento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Conteúdo (Markdown)</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} className="font-mono text-sm" />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPreview(p => !p)}>{preview ? "Editar" : "Pré-visualizar"}</Button>
                  <Button onClick={() => handleCreate('PRIVACY_POLICY', false)}>Criar</Button>
                  <Button onClick={() => handleCreate('PRIVACY_POLICY', true)}>Criar e Ativar</Button>
                </div>
                {preview && (
                  <MarkdownRenderer content={content} className="border rounded-md p-4" />
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Criado Em</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.id}</TableCell>
                      <TableCell>{d.type === 'PRIVACY_POLICY' ? 'Privacidade' : 'Termos'}</TableCell>
                      <TableCell>{new Date(d.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{d.isActive ? "Sim" : "Não"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleActivate(d.id)} disabled={d.isActive}>Ativar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="TERMS_OF_USE">
          {/* Reusa o mesmo conteúdo para a aba de termos */}
          <Card>
            <CardHeader>
              <CardTitle>Novo Documento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Conteúdo (Markdown)</Label>
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} className="font-mono text-sm" />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPreview(p => !p)}>{preview ? "Editar" : "Pré-visualizar"}</Button>
                  <Button onClick={() => handleCreate('TERMS_OF_USE', false)}>Criar</Button>
                  <Button onClick={() => handleCreate('TERMS_OF_USE', true)}>Criar e Ativar</Button>
                </div>
                {preview && (
                  <MarkdownRenderer content={content} className="border rounded-md p-4" />
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Criado Em</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.id}</TableCell>
                      <TableCell>{d.type === 'PRIVACY_POLICY' ? 'Privacidade' : 'Termos'}</TableCell>
                      <TableCell>{new Date(d.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{d.isActive ? "Sim" : "Não"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleActivate(d.id)} disabled={d.isActive}>Ativar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ALL">
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Histórico (Todos os Tipos)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Criado Em</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.id}</TableCell>
                      <TableCell>{d.type === 'PRIVACY_POLICY' ? 'Privacidade' : 'Termos'}</TableCell>
                      <TableCell>{new Date(d.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{d.isActive ? 'Sim' : 'Não'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleActivate(d.id)} disabled={d.isActive}>Ativar</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLegalPage;
