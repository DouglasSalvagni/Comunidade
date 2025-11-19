"use client";

import Link from "next/link";
import { Home, Users, Library, CreditCard, User } from "lucide-react";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Início" },
  { href: "/dashboard/account", icon: User, label: "Meu Perfil" },
  { href: "/dashboard/profiles", icon: Users, label: "Perfis" },
  { href: "/dashboard/catalog", icon: Library, label: "Catálogo" },
  { href: "/dashboard/subscriptions", icon: CreditCard, label: "Assinatura" },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-muted/40 p-6 flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-8 gradient-hero bg-clip-text">KidsVerse</h2>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isRoot = item.href === "/dashboard";
          const isActive = isRoot ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link 
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={
                `flex items-center gap-3 p-3 rounded-lg transition-smooth ` +
                (isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-primary")
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;