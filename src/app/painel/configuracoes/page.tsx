import { formatInTimeZone } from "date-fns-tz";
import type { Metadata } from "next";
import Link from "next/link";

import { GENERAL_NICHE } from "@/brands";
import { brandUrl } from "@/brands/urls";
import { CopyLink } from "@/components/panel/copy-link";
import { nichesByGroup } from "@/components/sales/niche-cards";
import { PageHeader, Section } from "@/components/panel/page-header";
import { requireOwner } from "@/lib/business/context";
import type { PageSettings, Professional, TimeOff, WorkingHours } from "@/lib/db/types";
import { getPlanFeatures } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

import { BusinessSettingsForm, HoursForm, PixForm, TimeOffForm } from "./forms";
import { NicheForm, type NicheOption } from "./niche-form";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const { business, brand } = await requireOwner();
  const supabase = await createClient();
  const [professionals, hours, timeOff, settings] = await Promise.all([
    supabase
      .from("professionals")
      .select("*")
      .eq("business_id", business.id)
      .eq("active", true)
      .order("position"),
    supabase.from("working_hours").select("*").eq("business_id", business.id),
    supabase
      .from("time_off")
      .select("*")
      .eq("business_id", business.id)
      .gte("ends_at", new Date().toISOString())
      .order("starts_at"),
    supabase.from("page_settings").select("*").eq("business_id", business.id).maybeSingle(),
  ]);

  const pros = (professionals.data ?? []) as Professional[];
  const toOption = (niche: typeof brand, label: string): NicheOption => ({
    key: niche.key,
    label,
    services: niche.suggestedServices.map((s) => s.name),
  });
  const nicheGroups = [
    ...nichesByGroup().map((section) => ({
      label: section.label,
      options: section.niches.map((niche) => toOption(niche, niche.niche!.name)),
    })),
    { label: "Outro", options: [toOption(GENERAL_NICHE, "Outro / Geral")] },
  ];
  const ranges = (hours.data ?? []) as WorkingHours[];
  const fmt = (iso: string) =>
    formatInTimeZone(new Date(iso), business.timezone, "dd/MM/yyyy HH:mm");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configurações"
        description={<CopyLink url={brandUrl(brand, `/${business.slug}`)} />}
      />

      <Section title="Negócio e agendamento">
        <BusinessSettingsForm business={business} />
      </Section>

      <Section title="Seu ramo">
        <NicheForm current={brand.key} groups={nicheGroups} />
      </Section>

      <div data-tour="hours">
        <Section
          title="Expediente"
          description="Várias faixas por dia: o espaço entre elas vira pausa (ex.: almoço)."
        >
          <HoursForm
            professionals={pros.map((p) => ({
              id: p.id,
              name: p.name,
              hours: ranges
                .filter((r) => r.professional_id === p.id)
                .map((r) => ({
                  weekday: r.weekday,
                  start: r.start_time.slice(0, 5),
                  end: r.end_time.slice(0, 5),
                })),
            }))}
          />
        </Section>
      </div>

      <Section title="Bloqueios" description="Folgas, férias ou horários em que você não atende.">
        <TimeOffForm
          professionals={pros.map((p) => ({ id: p.id, name: p.name }))}
          entries={((timeOff.data ?? []) as TimeOff[]).map((t) => ({
            id: t.id,
            label: `${fmt(t.starts_at)} até ${fmt(t.ends_at)}${t.reason ? ` · ${t.reason}` : ""}`,
            professional: pros.find((p) => p.id === t.professional_id)?.name ?? "",
          }))}
        />
      </Section>

      {getPlanFeatures(business).deposits ? (
        <Section
          title="Sinal pelo Pix"
          description="Quando um serviço pede sinal ou pagamento total, o cliente paga pelo Pix direto para você e envia o comprovante no chat. Você confere no banco e confirma."
        >
          <PixForm settings={settings.data as PageSettings | null} />
        </Section>
      ) : (
        <Section
          title="Sinal pelo Pix"
          description="Disponível no plano Pro: o cliente paga o sinal ou o valor total pelo Pix ao agendar e envia o comprovante no chat."
        >
          <Link href="/painel/plano" className="text-sm font-medium text-primary underline">
            Ver o plano Pro
          </Link>
        </Section>
      )}
    </div>
  );
}
