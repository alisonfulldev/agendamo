import { getNiche } from "@/brands";
import type { WebSiteData } from "@/components/web-site/types";
import { EXAMPLE_GALLERY } from "@/content/site-examples";
import { webSections } from "@/content/web-site-sections";
import { WEB_STORE_TEMPLATES, type WebTemplate } from "@/lib/db/types";

import { webDefaults } from "./texts";

const gallery = (name: string) => `/examples/gallery/${name}.webp`;

/** Photos of a niche (public/examples): the top one and up to three for the gallery. */
export function nichePhotos(nicheKey: string): { hero: string; gallery: string[] } | null {
  const count = EXAMPLE_GALLERY[nicheKey];
  if (!count) return null;
  return {
    hero: `/examples/${nicheKey}.webp`,
    gallery: Array.from({ length: Math.min(3, count) }, (_, i) => gallery(`${nicheKey}-${i + 1}`)),
  };
}

/**
 * Example of a "Site ou Loja" template with the person's business name (2026-11-07), for the
 * sales chat (/criar-site). With her niche (2026-11-07): its photos, a line about what it does and
 * its services (a tattoo studio sees tattoos); without one, a generic example. Nothing is stored;
 * the WhatsApp buttons point nowhere.
 */
export function webExample(
  template: WebTemplate,
  name: string,
  nicheKey: string | null = null,
): WebSiteData {
  const store = (WEB_STORE_TEMPLATES as readonly string[]).includes(template);
  const niche = nicheKey ? getNiche(nicheKey) : null;
  const own = niche && niche.niche ? niche : null;
  const photos = own ? nichePhotos(own.key) : null;
  const bio = own
    ? `${own.sales.demo.bio} Na ${name}, cada cliente é atendido com atenção, do primeiro contato ao resultado.`
    : store
      ? `A ${name} nasceu para facilitar a sua vida: produtos escolhidos a dedo, preço justo e atendimento de verdade, direto pelo WhatsApp.`
      : `A ${name} atende com atenção a cada detalhe. Experiência, responsabilidade e um atendimento próximo, do primeiro contato até o resultado.`;
  // The subtitle tells what her niche does ("Tatuagem fineline, blackwork e piercing.").
  const texts = webDefaults({ name, bio: own?.sales.demo.bio ?? null, city: null, store });
  const site: Omit<WebSiteData, "sections"> = {
    businessId: "example",
    slug: "exemplo",
    name,
    store,
    template,
    texts,
    whatsappHref: "#contato",
    phone: null,
    logoUrl: null,
    heroUrl: photos?.hero ?? gallery(store ? "nails-1" : "consulting-1"),
    bio,
    instagramUrl: null,
    place: "Sua cidade",
    photos: (
      photos?.gallery ??
      (store
        ? ["beauty-1", "beauty-2", "nails-3"]
        : ["consulting-2", "consulting-3", "consulting-4"]
      ).map(gallery)
    ).map((url) => ({ url, width: 800, height: 800 })),
    items: store
      ? [
          ["Produto em destaque", 8990, "Novidades", "nails-2"],
          ["Mais vendido", 4990, "Novidades", "nails-4"],
          ["Kit presente", 12990, "Kits", "beauty-3"],
          ["Linha completa", 6990, "Kits", "beauty-4"],
          ["Lançamento", 3990, "Novidades", "nails-5"],
          ["Promoção da semana", 2990, "Promoções", "nails-6"],
        ].map(([title, price, category, photo], i) => ({
          id: `example-${i}`,
          name: title as string,
          description: "Descreva aqui o seu produto: tamanho, cor, material.",
          priceCents: price as number,
          category: category as string,
          imageUrl: gallery(photo as string),
          linkUrl: null,
        }))
      : own
        ? own.suggestedServices.slice(0, 6).map((service, i) => ({
            id: `example-${i}`,
            name: service.name,
            description: null,
            priceCents: null,
            category: null,
            imageUrl: null,
            linkUrl: null,
          }))
        : [
            ["Consultoria", "Uma conversa para entender o que você precisa e o melhor caminho."],
            ["Serviço principal", "Explique aqui o que você faz e como ajuda o seu cliente."],
            ["Atendimento para empresas", "Soluções sob medida para pequenos e médios negócios."],
            ["Orçamento sem compromisso", "Mande uma mensagem e receba um orçamento rápido."],
          ].map(([title, description], i) => ({
            id: `example-${i}`,
            name: title!,
            description: description!,
            priceCents: null,
            category: null,
            imageUrl: null,
            linkUrl: null,
          })),
  };
  return {
    ...site,
    sections: webSections({
      name: site.name,
      store: site.store,
      place: site.place,
      externalLinks: site.items.some((item) => item.linkUrl),
    }),
  };
}
