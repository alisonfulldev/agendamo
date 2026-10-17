import { PLATFORM, type BrandConfig } from "@/brands";
import { CONTACT_EMAIL } from "@/content/contact";
import { PLAN_NAME, PLAN_PRICES } from "@/lib/plans";
import { siteUrl, withoutQuery } from "@/lib/site-url";

/**
 * Structured data (schema.org JSON-LD) of the public pages, from one place. Builders only emit
 * fields backed by real data: anything empty is dropped by `compact`, never filled in.
 * Nodes reference each other by @id, and a page renders them in one @graph (<JsonLd>).
 */
export type JsonLdNode = { "@type": string | string[]; "@id"?: string } & Record<string, unknown>;

/** Removes undefined, null, "" and empty arrays/objects, recursively. */
export function compact<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(compact).filter((v) => !isEmpty(v)) as T;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .map(([k, v]) => [k, compact(v)] as const)
      .filter(([, v]) => !isEmpty(v));
    return Object.fromEntries(entries) as T;
  }
  return value;
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value as object).length === 0;
  return false;
}

/** The page's @graph, ready for <script type="application/ld+json">. */
export function graph(nodes: (JsonLdNode | null | undefined | false)[]) {
  return compact({
    "@context": "https://schema.org",
    "@graph": nodes.filter(Boolean) as JsonLdNode[],
  });
}

const site = (path: string) => withoutQuery(siteUrl(path));
export const ORGANIZATION_ID = site("/#organization");
export const WEBSITE_ID = site("/#website");

// ---------------------------------------------------------------------------------- MeetChat

/**
 * MeetChat as an organization. Only data that exists: no CNPJ, address or phone yet; social
 * profiles come from the platform's socialLinks (src/brands/platform.ts) once they exist.
 */
export function organizationNode(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "MeetChat",
    url: site("/"),
    logo: { "@type": "ImageObject", url: site(PLATFORM.logo) },
    email: CONTACT_EMAIL,
    sameAs: Object.values(PLATFORM.socialLinks).filter(Boolean),
  };
}

export function websiteNode(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "MeetChat",
    url: site("/"),
    inLanguage: "pt-BR",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

const price = (cents: number) => (cents / 100).toFixed(2);

/** The two levels shown on /precos (D1): free WhatsApp mode and the paid plan, per month. */
export function pricingOffers(): JsonLdNode[] {
  return [
    {
      "@type": "Offer",
      name: "Grátis (modo WhatsApp)",
      price: "0",
      priceCurrency: "BRL",
      url: site("/precos"),
    },
    {
      "@type": "Offer",
      name: PLAN_NAME,
      price: price(PLAN_PRICES.complete.monthly),
      priceCurrency: "BRL",
      url: site("/precos"),
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: price(PLAN_PRICES.complete.monthly),
        priceCurrency: "BRL",
        unitText: "mês",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
      },
    },
  ];
}

/** MeetChat as a web app (home, niche pages, /precos). */
export function softwareApplicationNode({
  name = "MeetChat",
  url,
  description,
}: {
  name?: string;
  url: string;
  description: string;
}): JsonLdNode {
  return {
    "@type": "SoftwareApplication",
    "@id": `${url}#app`,
    name,
    url,
    description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "pt-BR",
    offers: pricingOffers(),
    publisher: { "@id": ORGANIZATION_ID },
  };
}

// ----------------------------------------------------------------------------------- Pages

export interface Crumb {
  name: string;
  /** Absolute URL. */
  url: string;
}

export function breadcrumbNode(trail: Crumb[]): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/**
 * FAQ shown on the page (only when the questions are visible there). Google limits the FAQ rich
 * result to a few sites: this is for understanding the page, not for a snippet.
 */
export function faqNode(items: readonly { question: string; answer: string }[]): JsonLdNode | null {
  if (items.length === 0) return null;
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/** Blog post or help article (Fase 7): real author and dates only. */
export function blogPostingNode(post: {
  url: string;
  title: string;
  description: string;
  author: { name: string; url?: string; type?: "Person" | "Organization" };
  /** YYYY-MM-DD. */
  datePublished: string;
  dateModified: string;
  image?: string;
  type?: "BlogPosting" | "Article";
}): JsonLdNode {
  return {
    "@type": post.type ?? "BlogPosting",
    "@id": `${post.url}#article`,
    headline: post.title,
    description: post.description,
    url: post.url,
    mainEntityOfPage: post.url,
    image: post.image,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    inLanguage: "pt-BR",
    author: { "@type": post.author.type ?? "Person", name: post.author.name, url: post.author.url },
    publisher: { "@id": ORGANIZATION_ID },
  };
}

// ----------------------------------------------------------------------- Business profiles

/** What a profile shows publicly (subset of PublicPage), with the URLs already resolved. */
export interface ProfileForSchema {
  name: string;
  bio: string | null;
  /** Canonical profile URL. */
  url: string;
  /** Chat URL, where the booking happens. */
  bookingUrl: string;
  /** Online booking on (trial or subscription); off = requests go to WhatsApp. */
  bookingOnline: boolean;
  images: string[];
  address: { street: string | null; neighborhood: string | null; city: string | null };
  instagramUrl: string | null;
  showPrices: boolean;
  services: { name: string; description: string | null; priceCents: number }[];
}

/**
 * The business on its profile: LocalBusiness subtype of its niche, services as offers (prices
 * only when the owner shows them) and the booking action. No rating: owners can hide reviews,
 * so the average is theirs to curate (Google treats it as self-serving).
 */
export function localBusinessNode(profile: ProfileForSchema, brand: BrandConfig): JsonLdNode {
  const { address } = profile;
  return {
    "@type": brand.niche?.schemaType ?? "LocalBusiness",
    "@id": `${profile.url}#business`,
    name: profile.name,
    description: profile.bio,
    url: profile.url,
    image: profile.images,
    address: address.city
      ? {
          "@type": "PostalAddress",
          streetAddress: address.street,
          addressLocality: address.neighborhood
            ? `${address.neighborhood}, ${address.city}`
            : address.city,
          addressCountry: "BR",
        }
      : undefined,
    sameAs: profile.instagramUrl ? [profile.instagramUrl] : undefined,
    makesOffer: profile.services.map((service) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: service.name, description: service.description },
      ...(profile.showPrices && service.priceCents > 0
        ? { price: price(service.priceCents), priceCurrency: "BRL" }
        : {}),
    })),
    potentialAction: profile.bookingOnline
      ? {
          "@type": "ReserveAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: profile.bookingUrl,
            inLanguage: "pt-BR",
            actionPlatform: [
              "https://schema.org/DesktopWebPlatform",
              "https://schema.org/MobileWebPlatform",
            ],
          },
          result: { "@type": "Reservation", name: "Agendamento" },
        }
      : undefined,
  };
}

// --------------------------------------------------------------------------- Directory

/** Ordered list of the businesses on a directory page (links to their profiles). */
export function itemListNode(items: { name: string; url: string }[]): JsonLdNode | null {
  if (items.length === 0) return null;
  return {
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

// ------------------------------------------------------------------------------- Tools

/** A free tool of the site (/ferramentas/…): runs in the browser, free, no sign-up. */
export function toolNode(tool: { name: string; url: string; description: string }): JsonLdNode {
  return {
    "@type": "WebApplication",
    "@id": `${tool.url}#tool`,
    name: tool.name,
    url: tool.url,
    description: tool.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: "pt-BR",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
    publisher: { "@id": ORGANIZATION_ID },
  };
}
