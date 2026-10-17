import type { Metadata } from "next";

import type { BrandConfig } from "@/brands";
import { canonicalUrl } from "@/brands/urls";
import { siteUrl, withoutQuery } from "@/lib/site-url";

/** Name of the product on every marketing page, whatever brand the visitor's cookie holds. */
export const SITE_NAME = "MeetChat";

/** Default share image of the MeetChat site (src/app/og). */
const DEFAULT_IMAGE = { url: "/og", width: 1200, height: 630 };

export interface PageSeo {
  /** Full <title>, used as is (no template): unique per URL, main search first, ~60 characters. */
  title: string;
  /** Meta description: unique per URL, ~155 characters. */
  description: string;
  /** Clean path of the page ("/barbearia"). Parameters and fragments never reach the canonical. */
  path: string;
  /** Brand whose domain owns the URL (a business profile). Default: the shared MeetChat site. */
  brand?: BrandConfig;
  /** og:site_name. Default: MeetChat. */
  siteName?: string;
  /** Title for social cards when it should differ from <title> (e.g. the H1). */
  socialTitle?: string;
  image?: { url: string; width?: number; height?: number; alt?: string } | null;
  type?: "website" | "article" | "profile";
  /** False: noindex, follow (thin pages, private states). Default true. */
  index?: boolean;
}

/**
 * Metadata of a public page from one place: title, description, self-referencing canonical
 * without parameters, Open Graph, Twitter and robots. Every public template goes through it.
 */
export function pageMetadata(seo: PageSeo): Metadata {
  const url = seo.brand ? canonicalUrl(seo.brand, seo.path) : withoutQuery(siteUrl(seo.path));
  const image = seo.image === undefined ? DEFAULT_IMAGE : seo.image;
  const socialTitle = seo.socialTitle ?? seo.title;
  return {
    title: { absolute: seo.title },
    description: seo.description,
    alternates: { canonical: url },
    robots: seo.index === false ? { index: false, follow: true } : undefined,
    openGraph: {
      title: socialTitle,
      description: seo.description,
      url,
      siteName: seo.siteName ?? SITE_NAME,
      locale: "pt_BR",
      type: seo.type ?? "website",
      images: image ? [image] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: socialTitle,
      description: seo.description,
      images: image ? [image.url] : undefined,
    },
  };
}
