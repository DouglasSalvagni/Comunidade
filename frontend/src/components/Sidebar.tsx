"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, CreditCard, User, BookOpen, MessagesSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import BrandLogo from "@/components/BrandLogo";
import { api, CommunitySpace } from "@/services/api";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Início" },
  { href: "/dashboard/courses", icon: BookOpen, label: "Cursos" },
  { href: "/dashboard/account", icon: User, label: "Meu Perfil" },
  { href: "/dashboard/subscriptions", icon: CreditCard, label: "Assinatura" },
];

const Sidebar = ({ className }: { className?: string }) => {
  const pathname = usePathname();
  const [spaces, setSpaces] = useState<CommunitySpace[]>([]);

  useEffect(() => {
    api.getCommunitySpaces().then(setSpaces).catch(() => setSpaces([]));
  }, []);

  return (
    <aside className={cn("w-64 bg-sidebar border-r border-sidebar-border p-6 flex flex-col h-full text-sidebar-foreground", className)}>
      <div className="mb-8 px-2">
        <Link href="/dashboard">
          <BrandLogo
            className="h-10 w-auto object-contain"
            width={160}
            height={48}
            priority
          />
        </Link>
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
        <Link
          href="/dashboard/community"
          aria-current={pathname.startsWith("/dashboard/community") ? "page" : undefined}
          className={
            `flex items-center gap-3 p-3 rounded-lg transition-smooth ` +
            (pathname.startsWith("/dashboard/community")
              ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")
          }
        >
          <MessagesSquare className="w-5 h-5" />
          <span>Comunidade</span>
        </Link>
        {spaces.slice(0, 8).map((space) => {
          const href = `/dashboard/community/${space.id}`;
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={space.id}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={
                `ml-8 flex items-center gap-2 py-1.5 px-2 rounded-md text-sm transition-smooth ` +
                (isActive
                  ? "bg-sidebar-primary/90 text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")
              }
            >
              <span className="truncate">{space.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
