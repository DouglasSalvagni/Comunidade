"use client";

import Image from "next/image";
import { useSettings } from "@/context/SettingsContext";

interface BrandLogoProps {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

/**
 * Componente centralizado de logo da marca.
 * Prioridade de resolução da URL:
 *  1. `logo_url` do banco (via SettingsContext → /settings/public)
 *  2. `NEXT_PUBLIC_LOGO_URL` (variável de ambiente)
 *  3. Fallback: nome da plataforma em texto
 */
const BrandLogo = ({
  className = "h-10 w-auto object-contain",
  width = 160,
  height = 48,
  priority = false,
}: BrandLogoProps) => {
  const { settings } = useSettings();

  const logoUrl =
    settings.logo_url ||
    process.env.NEXT_PUBLIC_LOGO_URL ||
    null;

  const appName =
    settings.platform_name ||
    process.env.NEXT_PUBLIC_APP_NAME ||
    "Comunidade";

  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={appName}
        width={width}
        height={height}
        className={className}
        priority={priority}
        unoptimized
      />
    );
  }

  return (
    <span
      className="text-2xl font-bold text-primary"
      style={{ letterSpacing: "-0.02em" }}
    >
      {appName}
    </span>
  );
};

export default BrandLogo;
