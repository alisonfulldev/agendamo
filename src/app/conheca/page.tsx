import type { Metadata } from "next";

import { getBrand, NICHES } from "@/brands";
import { SalesChat } from "@/components/sales-chat/sales-chat";
import { exampleName } from "@/lib/public/example-site";

export const metadata: Metadata = {
  title: "Seu site + agenda online",
  description: "Veja como fica o seu site com agenda online, onde o cliente marca sozinho, 24h.",
  // Only for whoever gets the link on the WhatsApp: out of search engines and of the site's menus.
  robots: { index: false, follow: false },
};

/**
 * Sales chat (2026-11-07): the link sent to whoever arrives on the WhatsApp (/conheca). Buys by
 * herself, with no trial; ?nome= and ?ramo= skip the first questions.
 */
export default async function SalesChatPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { nome, ramo } = await searchParams;
  const niche =
    typeof ramo === "string"
      ? (getBrand(ramo)?.key ?? NICHES.find((b) => b.niche!.route === ramo)?.key ?? null)
      : null;
  return (
    <main className="min-h-[100dvh] bg-muted">
      <SalesChat initialName={exampleName(nome)} initialNiche={niche} />
    </main>
  );
}
