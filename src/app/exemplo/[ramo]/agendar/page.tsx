import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NICHES } from "@/brands";
import { getCurrentBrand } from "@/brands/server";
import { BrandScope } from "@/components/brand-scope";
import { ExampleBookingChat } from "@/components/business-site/example-booking-chat";
import { examplePage } from "@/lib/public/example-site";

export const metadata: Metadata = { title: "Agendamento de exemplo", robots: { index: false } };

/**
 * Booking chat of an example site (2026-11-06): what a customer of that niche sees when tapping
 * "Agendar". Nothing is saved; "Voltar ao site" returns to the example (same template).
 */
export default async function ExampleBookingPage({
  params,
  searchParams,
}: PageProps<"/exemplo/[ramo]/agendar">) {
  const { ramo } = await params;
  const { modelo } = await searchParams;
  const niche = NICHES.find((b) => b.niche!.route === ramo);
  if (!niche) notFound();
  const data = examplePage(niche);
  const domainBrand = await getCurrentBrand();

  return (
    <BrandScope brand={niche} current={domainBrand}>
      <main className="mx-auto h-[100dvh] max-w-xl">
        <ExampleBookingChat
          data={{
            businessName: data.business.name,
            avatarUrl: `/examples/${niche.key}.webp`,
            services: data.services.map((s) => ({
              name: s.name,
              durationMinutes: s.duration_minutes,
              priceCents: s.price_cents,
            })),
            messages: {
              greeting: niche.chatMessages.greeting,
              askDate: niche.chatMessages.askDate,
              askTime: niche.chatMessages.askTime,
              askName: niche.chatMessages.askName,
              successConfirmed: niche.chatMessages.successConfirmed,
            },
            siteHref: `/exemplo/${ramo}${modelo === "elegante" ? "?modelo=elegante" : ""}`,
          }}
        />
      </main>
    </BrandScope>
  );
}
