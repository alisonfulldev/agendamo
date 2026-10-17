import { afterEach, describe, expect, it, vi } from "vitest";

import { getBrand, NICHES } from "@/brands";
import { SCHEMA_BUSINESS_TYPES } from "@/brands/schema";
import { nicheHomeContent } from "@/content/niche-pages";
import { HOME } from "@/content/home";
import { PRICING } from "@/content/pricing";
import { PLAN_PRICES } from "@/lib/plans";

import { jsonLdHtml } from "./json-ld";
import {
  blogPostingNode,
  breadcrumbNode,
  compact,
  faqNode,
  graph,
  localBusinessNode,
  organizationNode,
  pricingOffers,
  softwareApplicationNode,
  websiteNode,
  type JsonLdNode,
  type ProfileForSchema,
} from "./structured-data";

afterEach(() => vi.unstubAllEnvs());

const ABSOLUTE = /^https?:\/\//;

/** Fields each type must carry to be useful (Google's required properties where they exist). */
const REQUIRED: Record<string, string[]> = {
  Organization: ["name", "url", "logo"],
  WebSite: ["name", "url"],
  SoftwareApplication: ["name", "url", "applicationCategory", "operatingSystem", "offers"],
  BreadcrumbList: ["itemListElement"],
  FAQPage: ["mainEntity"],
  BlogPosting: ["headline", "datePublished", "dateModified", "author", "url"],
  Offer: ["priceCurrency", "price"],
};

/** Checks a rendered @graph: parses back, no "undefined", required fields per type. */
function validate(nodes: (JsonLdNode | null)[]) {
  const html = jsonLdHtml(graph(nodes));
  expect(html).not.toMatch(/undefined|NaN/);
  const parsed = JSON.parse(html) as { "@context": string; "@graph": JsonLdNode[] };
  expect(parsed["@context"]).toBe("https://schema.org");
  for (const node of parsed["@graph"]) {
    const type = String(node["@type"]);
    for (const field of REQUIRED[type] ?? [])
      expect(node, `${type}.${field}`).toHaveProperty(field);
    if (type === "BreadcrumbList") {
      const items = node.itemListElement as { position: number; item: string }[];
      items.forEach((item, index) => {
        expect(item.position).toBe(index + 1);
        expect(item.item).toMatch(ABSOLUTE);
      });
    }
    if (type === "SoftwareApplication") {
      for (const offer of node.offers as JsonLdNode[]) {
        for (const field of REQUIRED.Offer!) expect(offer).toHaveProperty(field);
      }
    }
  }
  return parsed["@graph"];
}

describe("compact", () => {
  it("drops empty values recursively and keeps zero and false", () => {
    expect(
      compact({ a: undefined, b: null, c: "", d: [], e: {}, f: { g: undefined }, h: 0, i: false }),
    ).toEqual({ h: 0, i: false });
  });
});

describe("MeetChat pages", () => {
  it("home graph is valid", () => {
    const nodes = validate([
      organizationNode(),
      websiteNode(),
      softwareApplicationNode({
        url: "https://meetchat.com.br/",
        description: HOME.meta.description,
      }),
      faqNode(HOME.faq.items),
    ]);
    expect(nodes.map((n) => n["@type"])).toEqual([
      "Organization",
      "WebSite",
      "SoftwareApplication",
      "FAQPage",
    ]);
  });

  it.each(NICHES.map((b) => [b.key, b] as const))("%s niche graph is valid", (_key, brand) => {
    const content = nicheHomeContent(brand);
    validate([
      organizationNode(),
      softwareApplicationNode({
        url: "https://meetchat.com.br/x",
        description: content.meta.description,
      }),
      faqNode(content.faq.items),
      breadcrumbNode([
        { name: "Início", url: "https://meetchat.com.br/" },
        { name: brand.niche!.name, url: `https://meetchat.com.br/${brand.niche!.route}` },
      ]),
    ]);
  });

  it("offers mirror /precos: free WhatsApp mode and the plan's monthly price from the config", () => {
    const [free, paid] = pricingOffers();
    expect(free).toMatchObject({ price: "0", priceCurrency: "BRL" });
    expect(paid).toMatchObject({ price: (PLAN_PRICES.complete.monthly / 100).toFixed(2) });
    expect(PRICING.tiers.map((t) => t.name)).toEqual([free!.name, paid!.name]);
  });

  it("organization never invents social profiles", () => {
    const org = compact(organizationNode());
    expect(org.sameAs ?? []).toEqual(expect.any(Array));
    for (const url of (org.sameAs as string[] | undefined) ?? []) expect(url).toMatch(ABSOLUTE);
  });

  it("FAQ is left out when there are no questions", () => {
    expect(faqNode([])).toBeNull();
  });

  it("blog posts carry real author and dates", () => {
    validate([
      blogPostingNode({
        url: "https://meetchat.com.br/recursos/x",
        title: "Título",
        description: "Descrição",
        author: { name: "Equipe MeetChat" },
        datePublished: "2026-10-16",
        dateModified: "2026-10-16",
      }),
    ]);
  });
});

describe("localBusinessNode", () => {
  const profile: ProfileForSchema = {
    name: "Espaço Escuta",
    bio: "Psicoterapia individual presencial e online.",
    url: "https://meetchat.com.br/escuta/perfil",
    bookingUrl: "https://meetchat.com.br/escuta",
    bookingOnline: true,
    images: ["https://img.example/a.webp"],
    address: { street: null, neighborhood: "Centro", city: "Campinas" },
    instagramUrl: null,
    showPrices: true,
    services: [
      { name: "Sessão individual", description: null, priceCents: 18000 },
      { name: "Primeira conversa", description: "30 minutos", priceCents: 0 },
    ],
  };

  it("uses the niche's schema.org type and only real fields", () => {
    const node = compact(localBusinessNode(profile, getBrand("psychology")!));
    expect(node["@type"]).toBe("MedicalBusiness");
    expect(SCHEMA_BUSINESS_TYPES).toContain(node["@type"]);
    expect(node).not.toHaveProperty("aggregateRating");
    expect(node).not.toHaveProperty("sameAs");
    expect(node.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "Centro, Campinas",
      addressCountry: "BR",
    });
    const offers = node.makesOffer as JsonLdNode[];
    expect(offers[0]).toMatchObject({ price: "180.00", priceCurrency: "BRL" });
    expect(offers[1]).not.toHaveProperty("price");
    expect(node.potentialAction).toMatchObject({
      "@type": "ReserveAction",
      target: { urlTemplate: "https://meetchat.com.br/escuta" },
    });
    validate([localBusinessNode(profile, getBrand("psychology")!)]);
  });

  it("hides prices the owner hides and drops the booking action in WhatsApp mode", () => {
    const node = compact(
      localBusinessNode(
        { ...profile, showPrices: false, bookingOnline: false },
        getBrand("barber")!,
      ),
    );
    expect(node["@type"]).toBe("HairSalon");
    for (const offer of node.makesOffer as JsonLdNode[]) expect(offer).not.toHaveProperty("price");
    expect(node).not.toHaveProperty("potentialAction");
  });

  it("every niche has a valid business type", () => {
    for (const brand of NICHES) expect(SCHEMA_BUSINESS_TYPES).toContain(brand.niche!.schemaType);
  });
});
