import { NICHES, type BrandConfig } from "@/brands";

import { HOME, type HomeContent } from "./home";
import { NICHE_SEO, type NicheSeo } from "./niche-seo";

/** Up to 6 niches of the same section (internal links between niche pages). */
function relatedNiches(brand: BrandConfig) {
  const group = brand.niche!.group;
  return NICHES.filter((b) => b.key !== brand.key && b.niche!.group === group).slice(0, 6);
}

/** "o cliente" in the shared texts follows the niche's term (paciente, aluno, tutor…). */
function withCustomerTerm(text: string, brand: BrandConfig): string {
  const { singular } = brand.terms.customer;
  return singular === "cliente" ? text : text.replace(/\bcliente\b/g, singular);
}

/**
 * Texts of a niche page: the home's structure with the niche's own copy (brand file) and the
 * niche's SEO texts (src/content/niche-seo.ts), so each page reads as made for that niche.
 */
export function nicheHomeContent(brand: BrandConfig): HomeContent {
  const niche = brand.niche!;
  const seo: NicheSeo = NICHE_SEO[brand.key] ?? {};
  const audience = niche.label.charAt(0).toLowerCase() + niche.label.slice(1);
  const { demo } = brand.sales;
  const services = brand.suggestedServices.map((s) => s.name);

  return {
    meta: {
      title: seo.title ?? `Agendamento por chat inteligente para ${audience} | MeetChat`,
      description: (seo.description ?? brand.sales.subtitle).slice(0, 160),
    },
    hero: {
      ...HOME.hero,
      badge: `Agendamento por chat inteligente para ${niche.name.toLowerCase()}`,
      title: seo.h1 ?? brand.sales.title,
      subtitle: seo.subtitle ?? brand.sales.subtitle,
    },
    intro: seo.intro,
    pains: {
      title: seo.painsTitle ?? HOME.pains.title,
      items: brand.sales.pains.map((text, i) => ({
        icon: (["moon", "ghost", "calendar-x"] as const)[i % 3]!,
        text,
      })),
    },
    steps: HOME.steps,
    gains: {
      title: HOME.gains.title,
      items: HOME.gains.items.map((item) => ({
        ...item,
        text: withCustomerTerm(item.text, brand),
      })),
    },
    audience: {
      title: "Também atendemos",
      chips: [
        ...relatedNiches(brand).map((b) => ({ label: b.niche!.name, href: `/${b.niche!.route}` })),
        { label: "Ver todas as áreas", href: "/comecar" },
      ],
    },
    pricing: HOME.pricing,
    faq: { title: HOME.faq.title, items: [...(seo.faq ?? []), ...brand.sales.faq] },
    closing: {
      title: `Seu link de agendamento para ${niche.name.toLowerCase()} pronto em 1 minuto.`,
      cta: HOME.closing.cta,
    },
    footer: HOME.footer,
    demo: [
      {
        business: demo.businessName,
        customer: demo.customerName,
        service: services[0] ?? "Atendimento",
        times: ["09:00", demo.time, "17:00"],
      },
      ...(seo.demo ?? []),
    ],
  };
}
