"use client";

import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { api } from "@/services/api";
import { signOut } from "next-auth/react";

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const Header = ({ isSidebarOpen, setIsSidebarOpen }: HeaderProps) => {
  const router = useRouter();
  const onLogout = () => {
    signOut({ redirect: false }).finally(() => {
      api.logout().finally(() => {
        router.replace("/auth/login");
      });
    });
  };
  return (
    <header className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-4">
        <div className="md:hidden">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-none bg-sidebar">
              <SheetHeader className="sr-only">
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>Navegação principal</SheetDescription>
              </SheetHeader>
              <Sidebar className="w-full border-none" />
            </SheetContent>
          </Sheet>
        </div>
        <h1 className="text-xl font-semibold hidden md:block">Dashboard</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onLogout}>Sair</Button>
      </div>
    </header>
  );
};

export default Header;
