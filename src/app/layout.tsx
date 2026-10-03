import type { Metadata, Viewport } from "next";
import Link from "next/link";

import { getBrandBaseUrl } from "@/brands";
import { fontVariables } from "@/brands/fonts";
import { getCurrentBrand } from "@/brands/server";
import { brandThemeStyle } from "@/brands/theme";
import { BrandProvider } from "@/components/brand-provider";
import { isDemoMode } from "@/lib/demo/mode";

import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getCurrentBrand();
  return {
    metadataBase: getBrandBaseUrl(brand),
    title: { default: brand.name, template: `%s · ${brand.name}` },
    description: brand.sales.subtitle,
    applicationName: brand.name,
    icons: { icon: brand.favicon, apple: "/icons/180" },
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: brand.name, statusBarStyle: "default" },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: brand.name,
      title: brand.sales.title,
      description: brand.sales.subtitle,
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const brand = await getCurrentBrand();
  return { themeColor: brand.theme.primary };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const brand = await getCurrentBrand();
  const { theme } = brand;

  return (
    <html
      lang="pt-BR"
      data-brand={brand.key}
      className={`${fontVariables([theme.headingFont, theme.bodyFont])} h-full antialiased`}
      style={brandThemeStyle(brand)}
    >
      <body className="flex min-h-full flex-col">
        <BrandProvider
          brand={{
            key: brand.key,
            name: brand.name,
            logo: brand.logo,
            terms: brand.terms,
            chatMessages: brand.chatMessages,
            socialLinks: brand.socialLinks,
          }}
        >
          {children}
        </BrandProvider>
        {isDemoMode() ? (
          <Link
            href="/demo"
            className="bg-foreground text-background fixed bottom-24 left-3 z-50 rounded-full px-3 py-1 text-xs font-medium opacity-80 shadow hover:opacity-100"
          >
            Modo demonstração
          </Link>
        ) : null}
      </body>
    </html>
  );
}
