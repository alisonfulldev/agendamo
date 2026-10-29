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

/** The theme's darkest and lightest colors (text/background), for content over photos. */
export function themeInk(theme: BrandConfig["theme"]): { dark: string; light: string } {
  return relativeLuminance(theme.text) <= relativeLuminance(theme.background)
    ? { dark: theme.text, light: theme.background }
    : { dark: theme.background, light: theme.text };
}

/** Mixes two #RRGGBB colors in sRGB (`amount` of `a`). */
export function mixHex(a: string, b: string, amount: number): string {
  const channel = (hex: string, start: number) => parseInt(hex.slice(start, start + 2), 16);
  return `#${[1, 3, 5]
    .map((start) =>
      Math.round(channel(a, start) * amount + channel(b, start) * (1 - amount))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/**
 * Colors of the landing color blocks (globals.css .lp-lime/.lp-deep/.lp-brand/.lp-hero), always
 * from the brand's own palette: a light tint and a dark shade of its color, unless the brand sets
 * them (MeetChat: lime + deep indigo; the lime never shows on a niche page).
 */
export function landingColors(theme: BrandConfig["theme"]) {
  const ink = themeInk(theme);
  const highlight = theme.highlight ?? mixHex(theme.primary, ink.light, 0.28);
  const deep = theme.deep ?? mixHex(theme.primary, ink.dark, 0.42);
  const onPrimary = readableOn(theme.primary, theme);
  return {
    highlight,
    deep,
    ink,
    // Titles on the brand color: the highlight when it reads well there.
    onPrimaryHeading: contrastRatio(highlight, theme.primary) >= 4.5 ? highlight : onPrimary,
  };
}

/** Brand theme as CSS custom properties, applied on <html>. globals.css maps them to Tailwind/shadcn tokens. */
export function brandThemeStyle(brand: BrandConfig): CSSProperties {
  const { theme } = brand;
  const landing = landingColors(theme);
  return {
    "--brand-highlight": landing.highlight,
    "--brand-deep": landing.deep,
    "--brand-ink-dark": landing.ink.dark,
    "--brand-ink-light": landing.ink.light,
    "--brand-on-primary-heading": landing.onPrimaryHeading,
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
