import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "@/components/ClientProviders";
import {
  buildPrimaryVars,
  buildSecondaryVars,
  buildAccentVars,
  buildSidebarBgVars,
} from "@/lib/color-utils";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const appName    = process.env.NEXT_PUBLIC_APP_NAME        || "Comunidade";
const appDesc    = process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Plataforma de conteúdo digital";
const faviconUrl = process.env.NEXT_PUBLIC_FAVICON_URL     || "/favicon.ico";
const locale     = process.env.NEXT_PUBLIC_APP_LOCALE      || "pt-BR";

export const metadata: Metadata = {
  title: appName,
  description: appDesc,
  icons: { icon: faviconUrl, shortcut: faviconUrl },
  openGraph: { title: appName, description: appDesc, locale, type: "website" },
};

/**
 * Gera o CSS inline das cores de tema a partir das variáveis de ambiente.
 * Executado no servidor — resultado embutido no HTML inicial (zero FOUC).
 */
function buildInlineTheme(): string {
  const parts: string[] = [];
  const p = process.env.NEXT_PUBLIC_PRIMARY_COLOR;
  const s = process.env.NEXT_PUBLIC_SECONDARY_COLOR;
  const a = process.env.NEXT_PUBLIC_ACCENT_COLOR;
  const bg = process.env.NEXT_PUBLIC_SIDEBAR_BG_COLOR;
  if (p)  parts.push(buildPrimaryVars(p));
  if (s)  parts.push(buildSecondaryVars(s));
  if (a)  parts.push(buildAccentVars(a));
  if (bg) parts.push(buildSidebarBgVars(bg));
  const valid = parts.filter(Boolean);
  return valid.length ? `:root{${valid.join(";")}}` : "";
}

const inlineThemeCss = buildInlineTheme();

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={locale} suppressHydrationWarning>
      {/*
        <style> como filho direto de <html> é hoistado automaticamente para o <head>
        pelo Next.js App Router — sem declarar <head> explicitamente (evita hydration error).
        Isso garante zero FOUC: as cores já estão no HTML antes de qualquer JS rodar.
      */}
      {inlineThemeCss ? (
        // React 19: precedence + href são obrigatórios para hositar <style> para o <head>
        // sem declarar <head> explicitamente no layout (que causaria hydration error).
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore — precedence é uma prop do React 19 ainda não tipada em @types/react
        <style
          precedence="default"
          href="white-label-theme"
          dangerouslySetInnerHTML={{ __html: inlineThemeCss }}
        />
      ) : null}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
