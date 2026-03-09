/**
 * Utilitários de cor — pure TypeScript, funciona tanto no servidor (layout.tsx)
 * quanto no cliente (ThemeProvider). Sem dependências de browser.
 */

/** Converte hex (#rrggbb ou #rgb) → "H S% L%" (formato Tailwind/shadcn) */
export function hexToHslComponents(hex: string): string | null {
  const cleaned = hex.replace("#", "");
  const full =
    cleaned.length === 3
      ? cleaned.split("").map((c) => c + c).join("")
      : cleaned;
  if (full.length !== 6) return null;

  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Branco ou preto com base na luminância relativa */
export function contrastForeground(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 0.45
    ? "220 20% 20%"
    : "0 0% 100%";
}

/** Gera o bloco de CSS vars para a cor primária (inclui sidebar-primary, ring, sidebar-accent hover) */
export function buildPrimaryVars(hex: string): string {
  const hsl = hexToHslComponents(hex);
  if (!hsl) return "";
  const fg = contrastForeground(hex);
  const [hDeg, sRaw] = hsl.split(" ");
  const sNum = parseFloat(sRaw);
  const sReduced = Math.round(sNum * 0.45);
  return [
    `--primary:${hsl}`,
    `--primary-foreground:${fg}`,
    `--ring:${hsl}`,
    `--sidebar-primary:${hsl}`,
    `--sidebar-primary-foreground:${fg}`,
    `--sidebar-ring:${hsl}`,
    `--sidebar-accent:${hDeg} ${sReduced}% 28%`,
    `--sidebar-accent-foreground:210 40% 98%`,
  ].join(";");
}

/** Gera o bloco de CSS vars para o background da sidebar */
export function buildSidebarBgVars(hex: string): string {
  const hsl = hexToHslComponents(hex);
  if (!hsl) return "";
  const [h, , lRaw] = hsl.split(" ");
  const lNum = parseFloat(lRaw);
  return [
    `--sidebar-background:${hsl}`,
    `--sidebar-border:${h} 20% ${Math.min(lNum + 10, 95)}%`,
  ].join(";");
}

/** Gera o bloco de CSS vars para cor secundária */
export function buildSecondaryVars(hex: string): string {
  const hsl = hexToHslComponents(hex);
  if (!hsl) return "";
  const fg = contrastForeground(hex);
  return `--secondary:${hsl};--secondary-foreground:${fg}`;
}

/** Gera o bloco de CSS vars para cor de destaque */
export function buildAccentVars(hex: string): string {
  const hsl = hexToHslComponents(hex);
  if (!hsl) return "";
  const fg = contrastForeground(hex);
  return `--accent:${hsl};--accent-foreground:${fg}`;
}
