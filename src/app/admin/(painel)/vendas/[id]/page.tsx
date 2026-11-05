import { formatInTimeZone } from "date-fns-tz";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getNiche } from "@/brands";
import { brandUrl } from "@/brands/urls";
import { CopyTextButton } from "@/components/panel/copy-text-button";
import { Button } from "@/components/ui/button";
import { paidMessage, pixMessage, whatsappLink } from "@/content/sales-script";
import { formatBRL } from "@/lib/money";
import { TIER_NAME } from "@/lib/plans";
import type { AssistedSale } from "@/lib/sales/assisted";
import { siteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";

import { AdminSection } from "../../ui";
import { saleStatus } from "../sale-status";
import { RenewPixButton } from "./renew-pix";

const TZ = "America/Sao_Paulo";

/** One WhatsApp sale: the Pix to send, the payment link and, once paid, the next message. */
export default async function AdminSalePage({ params }: PageProps<"/admin/vendas/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data } = await createAdminClient()
    .from("assisted_sales")
    .select("*, business:businesses(name, slug, brand_key)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const sale = data as AssistedSale & {
    business: { name: string; slug: string; brand_key: string };
  };
  const brand = getNiche(sale.business.brand_key);
  const firstName = sale.payer_name.split(" ")[0]!;
  const status = saleStatus(sale);
  const expired = status === "Pix vencido";
  const payUrl = siteUrl(`/pagar/${sale.token}`);
  const chatUrl = brandUrl(brand, `/${sale.business.slug}`);
  const site = sale.tier === "site" ? brandUrl(brand, `/${sale.business.slug}/site`) : null;
  const pixText =
    sale.pix_payload && !expired
      ? pixMessage({
          firstName,
          valueCents: sale.value_cents,
          payload: sale.pix_payload,
          payUrl,
          termsUrl: siteUrl("/termos"),
          domain: sale.domain ? { name: sale.domain, cents: sale.domain_cents } : null,
        })
      : null;
  const afterText = paidMessage({ firstName, siteUrl: site, chatUrl });
  const when = (iso: string, pattern: string) => formatInTimeZone(new Date(iso), TZ, pattern);

  return (
    <>
      <p>
        <Link href="/admin/vendas" className="text-sm text-primary">
          ← Vendas
        </Link>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{sale.business.name}</h1>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${sale.status === "paid" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
        >
          {status}
        </span>
      </div>
      <AdminSection title="Venda">
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Cliente</dt>
            <dd>{sale.payer_name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">E-mail (login)</dt>
            <dd>{sale.payer_email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Plano</dt>
            <dd>
              {TIER_NAME[sale.tier]} · {sale.cycle === "yearly" ? "anual" : "mensal"} ·{" "}
              {formatBRL(sale.value_cents)}
              {sale.coupon_code ? ` (cupom ${sale.coupon_code})` : ""}
            </dd>
          </div>
          {sale.domain ? (
            <div>
              <dt className="text-muted-foreground">Domínio</dt>
              <dd>
                {sale.domain} ({formatBRL(sale.domain_cents)}/ano, incluso no 1º Pix) ·{" "}
                <Link href="/admin/vendas/dominios" className="text-primary underline">
                  Domínios
                </Link>
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-muted-foreground">Criada</dt>
            <dd>
              {when(sale.created_at, "dd/MM/yyyy HH:mm")}
              {sale.paid_at ? ` · paga em ${when(sale.paid_at, "dd/MM HH:mm")}` : ""}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Links</dt>
            <dd className="break-all">
              {chatUrl}
              {site ? ` · ${site}` : ""}
            </dd>
          </div>
        </dl>
      </AdminSection>

      {sale.status === "awaiting_payment" ? (
        <AdminSection
          title="5. Mandar o Pix"
          description="Copie e mande no WhatsApp. O Pix vale 24 horas; pago, a conta é liberada sozinha."
        >
          {pixText ? (
            <div className="flex flex-col gap-4 md:flex-row">
              {sale.pix_image ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URL from Asaas
                <img
                  src={sale.pix_image}
                  alt="QR code do Pix"
                  width={200}
                  height={200}
                  className="size-48 shrink-0 rounded-lg border"
                />
              ) : null}
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <pre className="max-h-48 overflow-auto rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">
                  {pixText}
                </pre>
                <div className="flex flex-wrap gap-2">
                  <CopyTextButton text={pixText} label="Copiar mensagem" variant="default" />
                  <CopyTextButton text={sale.pix_payload!} label="Copiar só o Pix" />
                  <CopyTextButton text={payUrl} label="Copiar link de pagamento" />
                  {sale.payer_whatsapp ? (
                    <Button asChild variant="outline">
                      <a
                        href={whatsappLink(sale.payer_whatsapp, pixText)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle /> Abrir WhatsApp
                      </a>
                    </Button>
                  ) : null}
                </div>
                {sale.pix_expires_at ? (
                  <p className="text-xs text-muted-foreground">
                    Vence em {when(sale.pix_expires_at, "dd/MM, HH:mm")}.
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                O Pix venceu. Gere um novo e mande de novo.
              </p>
              <RenewPixButton saleId={sale.id} />
            </div>
          )}
        </AdminSection>
      ) : null}

      {sale.status === "paid" ? (
        <AdminSection
          title="6. Depois do pagamento"
          description="A conta já foi liberada e o cliente recebeu o e-mail de acesso. Mande esta mensagem para fechar."
        >
          <pre className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">{afterText}</pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyTextButton text={afterText} label="Copiar mensagem" variant="default" />
            {sale.payer_whatsapp ? (
              <Button asChild variant="outline">
                <a
                  href={whatsappLink(sale.payer_whatsapp, afterText)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle /> Abrir WhatsApp
                </a>
              </Button>
            ) : null}
          </div>
        </AdminSection>
      ) : null}
    </>
  );
}
