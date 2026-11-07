import Link from "next/link";

import { NICHES } from "@/brands";
import { CopyTextButton } from "@/components/panel/copy-text-button";
import { salesScript } from "@/content/sales-script";
import { siteUrl } from "@/lib/site-url";

import { AdminSection } from "../../ui";

/**
 * WhatsApp sales script: messages 1 to 4 of the niche (with its example sites), each with a copy
 * button. Messages 5 (Pix) and 6 (after payment) come ready on each sale's screen.
 */
export default async function AdminSalesScriptPage({
  searchParams,
}: PageProps<"/admin/vendas/roteiro">) {
  const { ramo } = await searchParams;
  const niches = [...NICHES].sort((a, b) => a.niche!.name.localeCompare(b.niche!.name, "pt-BR"));
  const niche =
    niches.find((b) => b.niche!.route === ramo) ?? niches.find((b) => b.key === "beauty")!;
  const origin = siteUrl("").replace(/\/$/, "");
  const messages = salesScript(niche, origin);

  return (
    <>
      <p>
        <Link href="/admin/vendas" className="text-sm text-primary">
          ← Vendas
        </Link>
      </p>
      <h1 className="text-2xl font-bold">Roteiro de mensagens</h1>
      <AdminSection title="Ramo do cliente">
        <ul className="flex flex-wrap gap-2">
          {niches.map((b) => (
            <li key={b.key}>
              <Link
                href={`/admin/vendas/roteiro?ramo=${b.niche!.route}`}
                aria-current={b.key === niche.key ? "page" : undefined}
                className={`inline-block rounded-full border px-3 py-1 text-sm ${b.key === niche.key ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {b.niche!.name}
              </Link>
            </li>
          ))}
        </ul>
      </AdminSection>
      <AdminSection title="Links para mandar">
        <ul className="flex flex-col gap-3 text-sm">
          {[
            ["Apresentação geral", `${origin}/apresentacao`],
            [
              `Apresentação de ${niche.niche!.name}`,
              `${origin}/apresentacao?ramo=${niche.niche!.route}`,
            ],
            ["Modelo 1 (Vibrante)", `${origin}/exemplo/${niche.niche!.route}`],
            ["Modelo 2 (Elegante)", `${origin}/exemplo/${niche.niche!.route}?modelo=elegante`],
            // "Site ou Loja" (sem agenda): the site templates in this niche's colors and photos.
            [
              "Site ou Loja · Impacto",
              `${origin}/exemplo/web/site_bold?ramo=${niche.niche!.route}`,
            ],
            ["Site ou Loja · Clean", `${origin}/exemplo/web/site_clean?ramo=${niche.niche!.route}`],
            ["Loja · Vitrine", `${origin}/exemplo/web/store_showcase`],
            ["Loja · Boutique", `${origin}/exemplo/web/store_clean`],
            ["Chat de venda do Site ou Loja", `${origin}/criar-site`],
          ].map(([label, url]) => (
            <li key={label} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="min-w-44 font-medium">{label}</span>
              <span className="min-w-0 flex-1 break-all text-muted-foreground">{url}</span>
              <CopyTextButton text={url!} label="Copiar" />
            </li>
          ))}
        </ul>
      </AdminSection>
      {messages.map((m) => (
        <AdminSection key={m.id} title={m.title}>
          <pre className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">{m.text}</pre>
          <div className="mt-3">
            <CopyTextButton text={m.text} label="Copiar" variant="default" />
          </div>
        </AdminSection>
      ))}
      <p className="text-sm text-muted-foreground">
        Com os dados do cliente, faça a{" "}
        <Link href="/admin/vendas" className="text-primary underline">
          Nova venda
        </Link>
        : as mensagens 5 (Pix) e 6 (depois do pagamento) aparecem prontas na tela da venda.
      </p>
    </>
  );
}
