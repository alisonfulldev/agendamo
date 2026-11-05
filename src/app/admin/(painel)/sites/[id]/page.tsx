import Link from "next/link";
import { notFound } from "next/navigation";

import { getNiche } from "@/brands";
import { brandUrl } from "@/brands/urls";
import { CopyTextButton } from "@/components/panel/copy-text-button";
import { briefingSchema, briefingText } from "@/lib/custom-site/briefing";
import type { CustomSiteOrder } from "@/lib/custom-site/paid";
import { formatBRL } from "@/lib/money";
import { publicUrl } from "@/lib/storage/r2";
import { createAdminClient } from "@/lib/supabase/admin";

import { AdminSection } from "../../ui";
import { orderLate, orderStatus } from "../order-status";
import { OrderButton } from "./order-buttons";

const brDate = (iso: string | null) =>
  iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—";

/**
 * One custom site order: the briefing ready to paste in the chat with whoever builds the site (it
 * becomes a template of its own, src/components/business-site/custom), then the delivery steps.
 */
export default async function AdminCustomSiteOrderPage({ params }: PageProps<"/admin/sites/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data } = await createAdminClient()
    .from("custom_site_orders")
    .select("*, business:businesses(id, name, slug, brand_key)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const order = data as CustomSiteOrder & {
    business: { id: string; name: string; slug: string; brand_key: string };
  };
  const { data: page } = await createAdminClient()
    .from("page_settings")
    .select("city")
    .eq("business_id", order.business.id)
    .maybeSingle();
  const brand = getNiche(order.business.brand_key);
  const briefing = briefingSchema.parse(order.briefing ?? {});
  const photoUrls = briefing.photos.map((key) => publicUrl(key) ?? key);
  const site = brandUrl(brand, `/${order.business.slug}/site`);
  const text = briefingText(briefing, {
    business: order.business.name,
    niche: brand.niche?.name ?? "Outro",
    city: (page?.city as string | null) ?? null,
    site,
    photoUrls,
  });
  const forClaude = `${text}\n\nID do negócio (para o modelo exclusivo em src/components/business-site/custom): ${order.business.id}`;

  return (
    <>
      <p>
        <Link href="/admin/sites" className="text-sm text-primary">
          ← Sites personalizados
        </Link>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{order.business.name}</h1>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${orderLate(order) ? "bg-destructive text-destructive-foreground" : "bg-muted"}`}
        >
          {orderStatus(order)}
        </span>
      </div>
      <AdminSection title="Pedido">
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Valor</dt>
            <dd>
              {formatBRL(order.price_cents)} (
              {order.payment_kind === "with_plan" ? "com o 1º mês" : "só a criação"})
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Pago em</dt>
            <dd>{brDate(order.paid_at)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Briefing enviado em</dt>
            <dd>{brDate(order.briefing_sent_at)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Entrega prometida</dt>
            <dd>{brDate(order.due_at)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Site atual</dt>
            <dd>
              <a href={site} target="_blank" rel="noreferrer" className="text-primary underline">
                {site}
              </a>
            </dd>
          </div>
        </dl>
      </AdminSection>

      <AdminSection
        title="Briefing"
        description="Copie e cole no chat do Claude Code para fazer o site deste cliente."
      >
        <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">
          {forClaude}
        </pre>
        <div className="mt-3">
          <CopyTextButton text={forClaude} label="Copiar briefing" variant="default" />
        </div>
        {photoUrls.length ? (
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {photoUrls.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element -- R2 public URL */}
                  <img src={url} alt="" className="aspect-square w-full rounded-lg object-cover" />
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </AdminSection>

      {order.adjustment_requested_at ? (
        <AdminSection title={`Ajuste pedido em ${brDate(order.adjustment_requested_at)}`}>
          <p className="text-sm whitespace-pre-line">{order.adjustment_text}</p>
        </AdminSection>
      ) : null}

      {!order.finished_at && !order.cancelled_at ? (
        <AdminSection title="Entrega">
          <div className="flex flex-col gap-3">
            {order.paid_at && !order.delivered_at ? (
              <OrderButton
                id={order.id}
                step="deliver"
                label="Site publicado: marcar como entregue"
              />
            ) : null}
            {order.delivered_at ? (
              <OrderButton
                id={order.id}
                step="finish"
                label={
                  order.adjustment_requested_at
                    ? "Ajuste publicado: concluir"
                    : "Concluir sem ajuste"
                }
              />
            ) : null}
            <OrderButton id={order.id} step="cancel" label="Cancelar pedido" variant="ghost" />
          </div>
        </AdminSection>
      ) : null}
    </>
  );
}
