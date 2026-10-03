import "server-only";

import { headers } from "next/headers";

import { getBrand, type BrandConfig } from "@/brands";
import { BRAND_HEADER, getBrandByHost } from "@/brands/resolve";
import { PATH_HEADER } from "@/lib/request-headers";

/** Brand of the current request, as resolved by the proxy. For Server Components, Actions and Route Handlers. */
export async function getCurrentBrand(): Promise<BrandConfig> {
  const requestHeaders = await headers();
  return getBrand(requestHeaders.get(BRAND_HEADER)) ?? getBrandByHost(requestHeaders.get("host"));
}

/** Origin the visitor is on (brand domain in production, localhost/preview otherwise). */
export async function getRequestOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const proto =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Pathname of the current request (set by the proxy). */
export async function getRequestPath(): Promise<string> {
  return (await headers()).get(PATH_HEADER) ?? "/";
}
