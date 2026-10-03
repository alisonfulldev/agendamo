"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { BrandConfig } from "@/brands";

/** Brand data available to Client Components (sales copy stays on the server). */
export type ClientBrand = Pick<
  BrandConfig,
  "key" | "name" | "logo" | "terms" | "chatMessages" | "socialLinks"
>;

const BrandContext = createContext<ClientBrand | null>(null);

export function BrandProvider({ brand, children }: { brand: ClientBrand; children: ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): ClientBrand {
  const brand = useContext(BrandContext);
  if (!brand) throw new Error("useBrand() must be used inside <BrandProvider>");
  return brand;
}
