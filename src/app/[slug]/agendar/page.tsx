import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentBrand } from "@/brands/server";
import { getPlanFeatures } from "@/lib/plans";
import { getPublicPage } from "@/lib/public/page";
import { isValidSlugFormat } from "@/lib/slug";
import { publicUrl } from "@/lib/storage/r2";

import { EmbeddedChat } from "./embedded-chat";

export const metadata: Metadata = { title: "Agendar", robots: { index: false } };

/** Chat-only page, used by the external-site modal (the only route allowed in iframes). */
export default async function EmbeddedBookingPage({
  params,
  searchParams,
}: PageProps<"/[slug]/agendar">) {
  const { slug } = await params;
  const { embed } = await searchParams;
  if (!isValidSlugFormat(slug)) notFound();
  const brand = await getCurrentBrand();
  const page = await getPublicPage(brand.key, slug);
  if (!page || page.business.brand_key !== brand.key) notFound();
  // The chat on external sites is part of Agenda and Pro (not Grátis).
  const features = getPlanFeatures(page.business);

  if (!features.embed) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p>O agendamento online de {page.business.name} não está disponível aqui.</p>
        <Link href={`/${slug}`} target="_top" className="font-medium text-primary underline">
          Ver página
        </Link>
      </main>
    );
  }
  return (
    <EmbeddedChat
      slug={slug}
      businessId={page.business.id}
      businessName={page.business.name}
      avatarUrl={publicUrl(page.page?.avatar_key)}
      embedded={embed === "1"}
    />
  );
}
