import { CheckCircle2, Clock, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { requireOwner } from "@/lib/business/context";
import { briefingSchema } from "@/lib/custom-site/briefing";
import { customSiteOffer, ensureOrder } from "@/lib/custom-site/orders";
import { DELIVERY_BUSINESS_DAYS, orderPixValid } from "@/lib/custom-site/paid";
import { formatBRL } from "@/lib/money";
import { PLAN_PRICES } from "@/lib/plans";
import { publicUrl } from "@/lib/storage/r2";

import { AdjustmentForm, BriefingForm, CustomSitePayment } from "./forms";

export const metadata: Metadata = { title: "Site personalizado" };

const brDate = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");

/**
 * Custom site (2026-11-06): the owner fills the briefing, pays (R$ 148 for "Site + Agenda"
 * subscribers, R$ 197 with the first month otherwise) and follows the order until it is delivered;
 * then one adjustment.
 */
export default async function CustomSitePage() {
  const { business } = await requireOwner({ anyProduct: true });
  const offer = customSiteOffer(business);

  const header = (
    <PageHeader
      title="Site personalizado"
      description={
        <p className="text-sm">
          Um site feito sob medida, com a sua cara, a partir das suas respostas. Pronto em até{" "}
          {DELIVERY_BUSINESS_DAYS} dias úteis depois do pagamento e do briefing, com 1 rodada de
          ajustes. Serviços, preços, avaliações e agendamento continuam funcionando sozinhos.
        </p>
      }
    />
  );

  if (offer.kind === "upgrade_first") {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        {header}
        <div className="flex flex-col items-start gap-3 rounded-xl border bg-card p-6">
          <p>
            O site personalizado faz parte do plano <strong>Site + Agenda</strong>. Mude de plano
            primeiro; depois, a criação sai por {formatBRL(PLAN_PRICES.customSite)}.
          </p>
          <Button asChild>
            <Link href="/painel/plano#assinar">Mudar para Site + Agenda</Link>
          </Button>
        </div>
      </div>
    );
  }

  const order = await ensureOrder(business);
  if (!order) return header;
  const briefing = briefingSchema.parse(order.briefing ?? {});
  const priceLabel = formatBRL(order.price_cents);
  const photos = briefing.photos.map((key) => ({ key, url: publicUrl(key) ?? "" }));

  let body: React.ReactNode;
  if (order.delivered_at) {
    body = (
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-6">
        <p className="flex items-center gap-2 text-lg font-semibold">
          <CheckCircle2 className="size-6 text-primary" aria-hidden /> Seu site personalizado está
          no ar
        </p>
        <Button asChild variant="outline" className="self-start">
          <Link href="/painel/site">Ver em Meu site</Link>
        </Button>
        {order.adjustment_requested_at ? (
          <p className="text-sm text-muted-foreground">
            Ajuste pedido em {brDate(order.adjustment_requested_at)}: “{order.adjustment_text}”.
            Você recebe um aviso quando ficar pronto.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Quer mudar alguma coisa? Você tem 1 rodada de ajustes incluída.
            </p>
            <AdjustmentForm />
          </>
        )}
      </section>
    );
  } else if (!order.briefing_sent_at) {
    body = (
      <>
        {order.paid_at ? (
          <p
            role="status"
            className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"
          >
            Pagamento confirmado. Agora responda o briefing para começarmos.
          </p>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border bg-card p-5">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <p className="text-sm">
              <strong>{priceLabel}</strong>
              {order.payment_kind === "with_plan"
                ? ` com o 1º mês do Site + Agenda incluso (depois, ${formatBRL(PLAN_PRICES.site.monthly)}/mês).`
                : " pela criação, uma vez só."}{" "}
              Responda com calma: dá para salvar e continuar depois. O pagamento vem no fim.
            </p>
          </div>
        )}
        <BriefingForm initial={briefing} photos={photos} />
      </>
    );
  } else if (!order.paid_at) {
    body = (
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-6">
        <p className="font-semibold">Briefing recebido! Falta só o pagamento.</p>
        <p className="text-sm text-muted-foreground">
          {order.payment_kind === "with_plan"
            ? `${priceLabel}: a criação do site + o 1º mês do Site + Agenda. As próximas mensalidades (${formatBRL(PLAN_PRICES.site.monthly)}) saem sozinhas pelo Pix Automático, sem fidelidade.`
            : `${priceLabel} pela criação, uma vez só.`}
        </p>
        <CustomSitePayment
          askPayer={order.payment_kind === "with_plan"}
          current={
            orderPixValid(order)
              ? {
                  image: order.pix_image!,
                  payload: order.pix_payload!,
                  expiresAt: order.pix_expires_at ?? "",
                  valueCents: order.price_cents,
                  automatic: order.payment_kind === "with_plan",
                }
              : null
          }
          priceLabel={priceLabel}
        />
      </section>
    );
  } else {
    body = (
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-6">
        <p className="flex items-center gap-2 text-lg font-semibold">
          <Clock className="size-6 text-primary" aria-hidden /> Seu site está em produção
        </p>
        <p className="text-muted-foreground">
          {order.due_at ? `Entrega até ${brDate(order.due_at)}. ` : ""}Você recebe um e-mail e um
          aviso no celular quando ficar pronto.
        </p>
      </section>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {header}
      {body}
    </div>
  );
}
