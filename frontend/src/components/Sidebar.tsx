"use client";

import Link from "next/link";
import Image from "next/image";
import { Home, CreditCard, User } from "lucide-react";
import { usePathname } from "next/navigation";
import logoHorizontal from "../assets/logo-horizontal.webp";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Início" },
  { href: "/dashboard/account", icon: User, label: "Meu Perfil" },
  { href: "/dashboard/subscriptions", icon: CreditCard, label: "Assinatura" },
];

import { cn } from "@/lib/utils";

const Sidebar = ({ className }: { className?: string }) => {
  const pathname = usePathname();

  return (
    <aside className={cn("w-64 bg-sidebar border-r border-sidebar-border p-6 flex flex-col h-full text-sidebar-foreground", className)}>
      <div className="mb-8 px-2">
        <Image
          src={logoHorizontal}
          alt="BabyTune"
          width={160}
          height={48}
          className="h-10 w-auto object-contain"
          priority
        />
      </div>
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
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")
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
