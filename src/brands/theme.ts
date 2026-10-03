import type { CSSProperties } from "react";

import { FONT_CSS_VARIABLES, type BrandConfig } from "./schema";

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

/** Picks the brand's text or background color, whichever reads better on `color`. */
export function readableOn(color: string, theme: BrandConfig["theme"]): string {
  return contrastRatio(color, theme.text) >= contrastRatio(color, theme.background)
    ? theme.text
    : theme.background;
}

/** Brand theme as CSS custom properties, applied on <html>. globals.css maps them to Tailwind/shadcn tokens. */
export function brandThemeStyle(brand: BrandConfig): CSSProperties {
  const { theme } = brand;
  return {
    "--brand-primary": theme.primary,
    "--brand-primary-foreground": readableOn(theme.primary, theme),
    "--brand-background": theme.background,
    "--brand-surface": theme.surface,
    "--brand-text": theme.text,
    "--brand-muted": theme.muted,
    "--brand-button": theme.button,
    "--brand-button-foreground": readableOn(theme.button, theme),
    "--brand-accent": theme.accent,
    "--brand-accent-foreground": readableOn(theme.accent, theme),
    "--brand-danger": theme.danger,
    "--brand-radius": theme.radius,
    "--brand-font-heading": `var(${FONT_CSS_VARIABLES[theme.headingFont]})`,
    "--brand-font-body": `var(${FONT_CSS_VARIABLES[theme.bodyFont]})`,
  } as CSSProperties;
}
