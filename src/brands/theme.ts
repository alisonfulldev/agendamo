import type { CSSProperties } from "react";

import { LANDING_HIGHLIGHT } from "./platform";
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

/** The theme's darkest and lightest colors (text/background), for content over photos. */
export function themeInk(theme: BrandConfig["theme"]): { dark: string; light: string } {
  return relativeLuminance(theme.text) <= relativeLuminance(theme.background)
    ? { dark: theme.text, light: theme.background }
    : { dark: theme.background, light: theme.text };
}

/** Brand theme as CSS custom properties, applied on <html>. globals.css maps them to Tailwind/shadcn tokens. */
export function brandThemeStyle(brand: BrandConfig): CSSProperties {
  const { theme } = brand;
  // Brands without their own bright color use the MeetChat lime.
  const highlight = theme.highlight ?? LANDING_HIGHLIGHT;
  const ink = themeInk(theme);
  const onPrimary = readableOn(theme.primary, theme);
  return {
    // Landing blocks (globals.css .lp-lime/.lp-deep/.lp-brand): the bright color, the darkest
    // block and a title color that reads on the brand color (the highlight when it contrasts).
    "--brand-highlight": highlight,
    "--brand-ink-dark": ink.dark,
    "--brand-ink-light": ink.light,
    ...(theme.deep ? { "--brand-deep": theme.deep } : {}),
    "--brand-on-primary-heading":
      contrastRatio(highlight, theme.primary) >= 3 ? highlight : onPrimary,
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
    ...(theme.success ? { "--brand-success": theme.success } : {}),
    ...(theme.warning ? { "--brand-warning": theme.warning } : {}),
    "--brand-radius": theme.radius,
    "--brand-font-heading": `var(${FONT_CSS_VARIABLES[theme.headingFont]})`,
    "--brand-font-body": `var(${FONT_CSS_VARIABLES[theme.bodyFont]})`,
  } as CSSProperties;
}
