import type { CSSProperties, ReactNode } from "react";

import type { BrandConfig } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";

import { BrandProvider, type ClientBrand } from "./brand-provider";

/** Brand data passed to Client Components (sales copy stays on the server). */
export function toClientBrand(brand: BrandConfig): ClientBrand {
  return {
    key: brand.key,
    name: brand.name,
    logo: brand.logo,
    terms: brand.terms,
    chatMessages: brand.chatMessages,
    socialLinks: brand.socialLinks,
  };
}

/**
 * Shows a part of the page in another brand than the request's (a business page on the shared
 * domain): its theme, recomputed tokens (data-theme-scope) and terms for Client Components.
 */
export function BrandScope({
  brand,
  current,
  style,
  className,
  children,
}: {
  brand: BrandConfig;
  /** Brand of the request (layout): nothing to change when it is the same. */
  current: BrandConfig;
  /** Extra variables on top (the owner's own color). */
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
}) {
  const other = brand.key !== current.key;
  const scoped = other || Boolean(style);
  return (
    <div
      data-theme-scope={scoped ? "" : undefined}
      style={scoped ? { ...(other ? brandThemeStyle(brand) : {}), ...style } : undefined}
      className={className}
    >
      {other ? <BrandProvider brand={toClientBrand(brand)}>{children}</BrandProvider> : children}
    </div>
  );
}
