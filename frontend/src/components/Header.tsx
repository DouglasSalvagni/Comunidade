"use client";

import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, User as UserIcon } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { api, User } from "@/services/api";
import { signOut, useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useCallback } from "react";

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  user?: User | null;
}

const Header = ({ isSidebarOpen, setIsSidebarOpen, user: propUser }: HeaderProps) => {
  const router = useRouter();
  const { data: session } = useSession();
  const sessionUser = session?.user;
  
  // Prioritize propUser (from backend) over sessionUser (from next-auth session)
  // for avatarUrl, but fallback to session for name/email if needed
  const displayUser = {
    name: propUser?.name || sessionUser?.name,
    email: propUser?.email || sessionUser?.email,
    image: propUser?.avatarUrl || sessionUser?.image,
  };

  const onLogout = () => {
    signOut({ redirect: false }).finally(() => {
      api.logout().finally(() => {
        router.replace("/auth/login");
      });
    });
  };

  const getInitials = useCallback((name?: string | null) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, []);

  return (
    <header className="flex items-center justify-between p-4 border-b bg-background h-16">
      <div className="flex items-center gap-4">
        <div className="md:hidden">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-none bg-sidebar w-64">
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

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={displayUser.image || undefined} alt={displayUser.name || "Avatar"} />
                <AvatarFallback>{getInitials(displayUser.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none truncate">{displayUser.name}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {displayUser.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/account" className="cursor-pointer flex w-full items-center">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Meu Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
