import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getBrand } from "@/brands";
import { getTopic } from "@/content/niche-guides";
import { getCityListing } from "@/lib/directory/data";

import { cityMetadata, NicheCityPage } from "./niche-city-page";
import { NicheTopicPage, topicMetadata } from "./niche-topic-page";

type Params = { params: Promise<{ parte: string }> };

/**
 * Second level of a niche page (/{nicho}/{parte}): a guide subpage when `parte` is one of the
 * niche's published topics (/barbearia/reduzir-faltas), otherwise a city of the directory
 * (/barbearia/campinas). Topic names win, so they never work as city slugs. Anything else: 404.
 * Each route file (src/app/<route>/[parte]/page.tsx) only names its niche.
 */
export function nicheSegmentRoute(brandKey: string) {
  async function resolve(parte: string) {
    const topic = getTopic(brandKey, parte);
    if (topic) return { kind: "topic", topic } as const;
    const brand = getBrand(brandKey);
    if (!brand?.niche || !/^[a-z0-9-]{1,80}$/.test(parte)) return null;
    const listing = await getCityListing(brandKey, parte);
    return listing ? ({ kind: "city", brand, listing } as const) : null;
  }

  return {
    generateMetadata: async ({ params }: Params): Promise<Metadata> => {
      const found = await resolve((await params).parte);
      if (!found) return {};
      return found.kind === "topic"
        ? topicMetadata(found.topic)
        : cityMetadata(found.brand, found.listing);
    },

    Page: async ({ params }: Params) => {
      const found = await resolve((await params).parte);
      if (!found) notFound();
      return found.kind === "topic" ? (
        <NicheTopicPage entry={found.topic} />
      ) : (
        <NicheCityPage brand={found.brand} listing={found.listing} />
      );
    },
  };
}
