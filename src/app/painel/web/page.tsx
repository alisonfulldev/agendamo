import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { businessUrl } from "@/brands/urls";
import { CopyLink } from "@/components/panel/copy-link";
import { PageHeader, Section } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { addDaysToDate } from "@/lib/availability";
import { requireOwner } from "@/lib/business/context";
import { formatBRL } from "@/lib/money";
import { getPlanFeatures, PLAN_PRICES, planLabel } from "@/lib/plans";
import { displayCount } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import { formatInTimeZone } from "date-fns-tz";

import { DomainRequest } from "./domain-request";

export const metadata: Metadata = { title: "Início" };

/** Sum of an event in the daily stats from a date on ("YYYY-MM-DD"). */
function total(
  rows: { date: string; counts: Record<string, number> | null }[],
  key: string,
  from: string,
): number {
  return rows.filter((r) => r.date >= from).reduce((sum, r) => sum + (r.counts?.[key] ?? 0), 0);
}

/**
 * Home of a "Site ou Loja" account (2026-11-07): the site's link to share, and how many people
 * visited it and tapped the WhatsApp (counts only, under 5 shown as "menos de 5", rule 5).
 */
export default async function WebHomePage() {
  const { business, brand } = await requireOwner({ web: true });
  const features = getPlanFeatures(business);
  const siteLink = businessUrl(brand, `/${business.slug}`);
  const store = business.product === "store";

  const today = formatInTimeZone(new Date(), business.timezone, "yyyy-MM-dd");
  const week = addDaysToDate(today, -6);
  const month = addDaysToDate(today, -29);
  const { data } = await (
    await createClient()
  )
    .from("page_stats_daily")
    .select("date, counts")
    .eq("business_id", business.id)
    .gte("date", month);
  const rows = (data ?? []) as { date: string; counts: Record<string, number> | null }[];
  const numbers = [
    {
      label: "Visitas no site",
      week: total(rows, "view", week),
      month: total(rows, "view", month),
    },
    {
      label: store ? "Pedidos e conversas no WhatsApp" : "Cliques no WhatsApp",
      week: total(rows, "click_whatsapp", week),
      month: total(rows, "click_whatsapp", month),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={business.name}
        description={`${store ? "Sua loja" : "Seu site"} · ${planLabel(features)}`}
        actions={
          <Button asChild variant="outline">
            <Link href={`/${business.slug}`} target="_blank">
              <ExternalLink aria-hidden />
              {store ? "Ver loja" : "Ver site"}
            </Link>
          </Button>
        }
      />

      <Section
        title={store ? "O link da sua loja" : "O link do seu site"}
        description="Coloque na bio do Instagram, no WhatsApp e no Google. Todo botão leva o cliente para o seu WhatsApp."
      >
        <CopyLink url={siteLink} tour={false} />
      </Section>

      <Section title="Seus números" description="Hoje e os 6 dias antes; e os últimos 30 dias.">
        <ul className="grid gap-3 sm:grid-cols-2">
          {numbers.map((n) => (
            <li key={n.label} className="flex flex-col gap-1 rounded-xl border bg-card p-4">
              <span className="text-sm text-muted-foreground">{n.label}</span>
              <span className="font-heading text-3xl font-bold">{displayCount(n.week)}</span>
              <span className="text-xs text-muted-foreground">
                Últimos 30 dias: {displayCount(n.month)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Por privacidade, números abaixo de 5 aparecem como “menos de 5”. Suas próprias visitas não
          são contadas.
        </p>
      </Section>

      <Section
        title="Seu próprio endereço (opcional)"
        description={`Em vez do link do MeetChat, um endereço só seu, tipo seunegocio.com.br: ${formatBRL(PLAN_PRICES.webDomainYearly)} por ano, registrado no seu nome. Pode deixar para depois.`}
      >
        <DomainRequest price={formatBRL(PLAN_PRICES.webDomainYearly)} />
      </Section>

      <Section title="Deixe o site com a sua cara">
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/painel/web/site">Editar meu site</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/painel/web/catalogo">
              {store ? "Cadastrar produtos" : "Cadastrar serviços"}
            </Link>
          </Button>
        </div>
      </Section>
    </div>
  );
}
