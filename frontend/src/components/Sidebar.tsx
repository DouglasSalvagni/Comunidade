"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Home, CreditCard, User as UserIcon, BookOpen, MessagesSquare, ChevronRight, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import BrandLogo from "@/components/BrandLogo";
import { api, CommunitySpace, User } from "@/services/api";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Início" },
  { href: "/dashboard/courses", icon: BookOpen, label: "Cursos" },
  { href: "/dashboard/community", icon: MessagesSquare, label: "Comunidade" },
  { href: "/dashboard/account", icon: UserIcon, label: "Meu Perfil" },
  { href: "/dashboard/subscriptions", icon: CreditCard, label: "Assinatura" },
];

const Sidebar = ({ className }: { className?: string }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [spaces, setSpaces] = useState<CommunitySpace[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.getCommunitySpaces().then(setSpaces).catch(() => setSpaces([]));
    api.getProfile().then(setUser).catch(() => setUser(null));
  }, []);

  const displayUser = {
    name: user?.name || session?.user?.name || "Usuário",
    email: user?.email || session?.user?.email || "",
    image: user?.avatarUrl || session?.user?.image,
  };

  const getInitials = useCallback((name?: string | null) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, []);

  return (
    <aside className={cn("w-72 bg-sidebar border-r border-sidebar-border flex flex-col h-full text-sidebar-foreground transition-all duration-300 ease-in-out", className)}>
      {/* Header Section */}
      <div className="p-6 pb-2">
        <Link href="/dashboard" className="flex items-center px-2 mb-8 group">
          <BrandLogo
            className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            width={140}
            height={40}
            priority
          />
        </Link>

        {/* Profile Card */}
         <div className="mb-6 px-2">
           <Link 
            href="/dashboard/account"
            className="flex items-center gap-3 p-3 rounded-2xl bg-sidebar-accent/30 border border-sidebar-border/50 shadow-sm hover:bg-sidebar-accent/50 transition-all duration-300 group"
           >
             <Avatar className="h-10 w-10 border-2 border-sidebar-primary/20 ring-2 ring-sidebar-primary/10 transition-transform duration-300 group-hover:scale-105">
               <AvatarImage src={displayUser.image || undefined} alt={displayUser.name} />
               <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary font-bold">
                 {getInitials(displayUser.name)}
               </AvatarFallback>
             </Avatar>
             <div className="flex flex-col min-w-0">
               <span className="text-sm font-semibold truncate text-sidebar-foreground group-hover:text-sidebar-primary transition-colors">
                 {displayUser.name}
               </span>
               <span className="text-xs text-sidebar-foreground/50 truncate">
                 {displayUser.email}
               </span>
             </div>
           </Link>
         </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto px-4 space-y-8 py-2 pb-6 custom-scrollbar">
        <div>
          <p className="px-4 mb-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
            Menu Principal
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isRoot = item.href === "/dashboard";
              const isActive = isRoot ? pathname === item.href : pathname.startsWith(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-r from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 transition-all duration-300 group-hover:scale-110",
                    isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/40 group-hover:text-sidebar-primary"
                  )} />
                  <span className="flex-1 tracking-tight">{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="absolute -left-1 w-1.5 h-6 bg-sidebar-primary rounded-full shadow-[0_0_10px_rgba(var(--sidebar-primary),0.5)]"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Spaces Section */}
        {spaces.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-4 mb-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
                Espaços da Comunidade
              </p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sidebar-accent/50 text-sidebar-foreground/60 font-medium">
                {spaces.length}
              </span>
            </div>
            <div className="space-y-1">
               {spaces.slice(0, 12).map((space) => {
                 const href = `/dashboard/community/${space.id}`;
                 const isActive = pathname.startsWith(href);
                 return (
                   <Link
                     key={space.id}
                     href={href}
                     className={cn(
                       "group flex items-center gap-3 px-4 py-2 rounded-xl text-sm transition-all duration-300",
                       isActive
                         ? "bg-sidebar-accent/80 text-sidebar-foreground font-semibold shadow-sm"
                         : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
                     )}
                   >
                     <div className={cn(
                       "flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-bold transition-all duration-300",
                       isActive 
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm scale-110" 
                        : "bg-sidebar-accent/60 text-sidebar-foreground/40 group-hover:bg-sidebar-primary/20 group-hover:text-sidebar-primary"
                     )}>
                       {space.name.charAt(0).toUpperCase()}
                     </div>
                     <span className="truncate flex-1 tracking-tight">{space.name}</span>
                     <ChevronRight className={cn(
                       "w-3.5 h-3.5 opacity-0 -translate-x-2 transition-all duration-300",
                       isActive ? "opacity-100 translate-x-0" : "group-hover:opacity-40 group-hover:translate-x-0"
                     )} />
                   </Link>
                 );
               })}
             </div>
          </div>
        )}
      </div>


    </aside>
  );
};

export default Sidebar;
