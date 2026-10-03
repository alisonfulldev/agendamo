import { Inter, Lora, Nunito, Oswald, Poppins } from "next/font/google";

import type { FontKey } from "./schema";

// Every FontKey in schema.ts must be loaded here with the matching CSS variable.
// preload is off so one brand does not download another brand's fonts.
const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  preload: false,
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  preload: false,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  preload: false,
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

const fonts: Record<FontKey, { variable: string }> = { poppins, oswald, inter, lora, nunito };

/** className that defines the CSS variables of the given fonts. */
export function fontVariables(keys: FontKey[]): string {
  return [...new Set(keys)].map((key) => fonts[key].variable).join(" ");
}
