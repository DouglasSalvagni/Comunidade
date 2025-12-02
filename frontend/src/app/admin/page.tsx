import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const AdminDashboardPage = () => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Painel do Super Admin</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Catálogo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Adicionar, editar ou remover obras do catálogo.
            </p>
            <Link href="/admin/catalog" className="text-sm font-medium text-primary hover:underline mt-4 block">
              Acessar
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Adicionar, editar ou remover tags do sistema.
            </p>
            <Link href="/admin/tags" className="text-sm font-medium text-primary hover:underline mt-4 block">
              Acessar
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Temas de Desenvolvimento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cadastrar, editar e remover temas de desenvolvimento.
            </p>
            <Link href="/admin/dev-themes" className="text-sm font-medium text-primary hover:underline mt-4 block">
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
      </div>
    </div>
  );
};

export default AdminDashboardPage;
