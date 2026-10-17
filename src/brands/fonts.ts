import { Figtree, Fraunces, Inter, Lora, Nunito, Oswald, Poppins } from "next/font/google";

import type { FontKey } from "./schema";

// Every FontKey in schema.ts must be loaded here with the matching CSS variable.
// preload is off so one brand does not download another brand's fonts, except the MeetChat
// site's own pair (Fraunces + Figtree, the home) and Inter, the body font of most niches, so the
// title at the top paints early (Lighthouse LCP). Fallbacks are metric-adjusted (no layout shift).
const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  preload: false,
});

/**
 * Display serif of the MeetChat site's titles. One static weight (600, the only one used): the
 * variable file with the optical-size and softness axes was too heavy for the LCP (the H1).
 */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  weight: ["600"],
  subsets: ["latin"],
});

/** Body sans of the MeetChat site. */
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  preload: false,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  preload: false,
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  preload: false,
});

const fonts: Record<FontKey, { variable: string }> = {
  poppins,
  oswald,
  inter,
  lora,
  nunito,
  fraunces,
  figtree,
};

/** className that defines the CSS variables of the given fonts. */
export function fontVariables(keys: FontKey[]): string {
  return [...new Set(keys)].map((key) => fonts[key].variable).join(" ");
}
