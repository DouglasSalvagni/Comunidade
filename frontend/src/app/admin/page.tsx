import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { MessagesSquare, BookOpen, CreditCard, Tag, Users, Shield, FileText, Settings } from "lucide-react";

const AdminDashboardPage = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Painel do Super Admin</h1>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Comunidade & Conteúdo</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-primary bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <MessagesSquare className="h-5 w-5 text-primary" />
                Moderação da Comunidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Inbox de posts pendentes que precisam de resposta do administrador.
              </p>
              <Link href="/admin/community/inbox" className="text-sm font-medium text-primary hover:underline block">
                Acessar Inbox
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <MessagesSquare className="h-5 w-5" />
                Espaços da Comunidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Gerenciar espaços, permissões e fixar posts.
              </p>
              <Link href="/admin/community" className="text-sm font-medium text-primary hover:underline block">
                Gerenciar Espaços
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Cursos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Criar e editar cursos, módulos e aulas.
              </p>
              <Link href="/admin/courses" className="text-sm font-medium text-primary hover:underline block">
                Acessar Cursos
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Vendas & Assinaturas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Planos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Criar e editar planos de assinatura.
              </p>
              <Link href="/admin/plans" className="text-sm font-medium text-primary hover:underline block">
                Gerenciar Planos
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Parcerias & Cupons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Gerenciar campanhas, cupons e vínculos comerciais.
              </p>
              <Link href="/admin/partnerships" className="text-sm font-medium text-primary hover:underline block">
                Acessar
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Afiliados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Administrar afiliados e dados de repasse.
              </p>
              <Link href="/admin/affiliates" className="text-sm font-medium text-primary hover:underline block">
                Acessar
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Administração</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gerenciar Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Adicionar, editar ou remover usuários do sistema.
              </p>
              <Link href="/admin/users" className="text-sm font-medium text-primary hover:underline block">
                Acessar
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Anti-Abuse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Monitorar controles de prevenção a abuso.
              </p>
              <Link href="/admin/anti-abuse" className="text-sm font-medium text-primary hover:underline block">
                Acessar
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Gerenciar Legal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Atualizar termos e política de privacidade.
              </p>
              <Link href="/admin/legal" className="text-sm font-medium text-primary hover:underline block">
                Acessar
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                White Label
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Personalizar nome, logo, cores e links da plataforma.
              </p>
              <Link href="/admin/settings" className="text-sm font-medium text-primary hover:underline block">
                Acessar
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
