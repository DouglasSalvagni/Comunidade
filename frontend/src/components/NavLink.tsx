import Link from "next/link";
import { forwardRef } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLinkProps extends Omit<React.ComponentProps<typeof Link>, "className"> {
  className?: string;
  activeClassName?: string;
  href: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(({ className, activeClassName, href, ...props }, ref) => {
  const pathname = usePathname();
  const isActive = typeof href === 'string' ? (pathname === href || pathname.startsWith(href)) : false;
  return (
    <Link ref={ref as any} href={href} className={cn(className, isActive && activeClassName)} {...props} />
  );
});

NavLink.displayName = "NavLink";

export { NavLink };
