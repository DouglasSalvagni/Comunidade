import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const AdminDashboardPage = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Painel do Super Admin</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Planos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Criar e editar planos de assinatura.
            </p>
            <Link href="/admin/plans" className="text-sm font-medium text-primary hover:underline mt-4 block">
              Acessar
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Legal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Atualizar termos e política de privacidade.
            </p>
            <Link href="/admin/legal" className="text-sm font-medium text-primary hover:underline mt-4 block">
              Acessar
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Anti-Abuse</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Monitorar controles de prevenção a abuso.
            </p>
            <Link href="/admin/anti-abuse" className="text-sm font-medium text-primary hover:underline mt-4 block">
              Acessar
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Adicionar, editar ou remover usuários do sistema.
            </p>
            <Link href="/admin/users" className="text-sm font-medium text-primary hover:underline mt-4 block">
              Acessar
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Parcerias &amp; Cupons</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gerenciar campanhas, cupons e vínculos comerciais.
            </p>
            <Link href="/admin/partnerships" className="text-sm font-medium text-primary hover:underline mt-4 block">
              Acessar
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Afiliados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Administrar afiliados e dados de repasse.
            </p>
            <Link href="/admin/affiliates" className="text-sm font-medium text-primary hover:underline mt-4 block">
              Acessar
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>⚙️ White Label</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Personalizar nome, logo, cores e links da plataforma.
            </p>
            <Link href="/admin/settings" className="text-sm font-medium text-primary hover:underline mt-4 block">
              Acessar
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
