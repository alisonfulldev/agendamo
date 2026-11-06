import type { Metadata } from "next";

import { WebSalesChat } from "@/components/web-sales-chat/web-sales-chat";
import { exampleName } from "@/lib/public/example-site";

export const metadata: Metadata = {
  title: "Seu site profissional",
  description: "Veja como fica o seu site ou a sua loja, com todo botão indo para o seu WhatsApp.",
  // The link sent on the WhatsApp: out of search engines (the public page comes in its own phase).
  robots: { index: false, follow: false },
};

/**
 * Sales chat of "Site ou Loja" (2026-11-07): site or store for any business, paid right away
 * (no trial). ?nome= skips the business name.
 */
export default async function CreateSitePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { nome } = await searchParams;
  return (
    <main className="min-h-[100dvh] bg-muted">
      <WebSalesChat initialName={exampleName(nome)} />
    </main>
  );
}
