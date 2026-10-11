import { formatInTimeZone } from "date-fns-tz";
import type { Metadata } from "next";
import Link from "next/link";

import { GENERAL_NICHE } from "@/brands";
import { brandUrl } from "@/brands/urls";
import { CopyLink } from "@/components/panel/copy-link";
import { nichesByGroup } from "@/components/sales/niche-cards";
import { PageHeader, Section } from "@/components/panel/page-header";
import { requireOwner } from "@/lib/business/context";
import type { PageSettings, Professional, Service, TimeOff, WorkingHours } from "@/lib/db/types";
import { depositReadyText, depositSetup } from "@/lib/deposits/setup";
import { getPlanFeatures } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

import { DepositServicesForm } from "./deposit-services";
import { BusinessSettingsForm, HoursForm, PixForm, TimeOffForm } from "./forms";
import { NicheForm, type NicheOption } from "./niche-form";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const { business, brand } = await requireOwner();
  const supabase = await createClient();
  const [professionals, hours, timeOff, settings, servicesResult] = await Promise.all([
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
    supabase.from("services").select("*").eq("business_id", business.id).order("position"),
  ]);
  const services = ((servicesResult.data ?? []) as Service[]).filter((s) => s.active);
  const pageSettings = settings.data as PageSettings | null;
  const setup = depositSetup(pageSettings?.pix_key ?? null, services);

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
          id="sinal"
          title="Sinal pelo Pix"
          description="O cliente paga o sinal (ou o valor total) pelo Pix direto para você e avisa no chat (o comprovante é opcional). Você procura no extrato o valor com centavos e confirma."
        >
          <div className="flex flex-col gap-6">
            {setup.ready ? (
              <p
                role="status"
                className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
              >
                ✅ {depositReadyText(setup)}
              </p>
            ) : (
              <div role="status" className="rounded-lg border border-primary/40 p-3 text-sm">
                <p className="font-medium">Para o chat pedir o comprovante, falta:</p>
                <ol className="mt-1 list-decimal pl-5">
                  {setup.missing.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>
            )}
            <div>
              <h3 className="mb-3 font-semibold">1. Sua chave Pix</h3>
              <PixForm settings={pageSettings} />
            </div>
            <div>
              <h3 className="mb-3 font-semibold">2. Serviços que pedem sinal</h3>
              <DepositServicesForm
                services={services.map((s) => ({
                  id: s.id,
                  name: s.name,
                  price_cents: s.price_cents,
                  deposit_type: s.deposit_type,
                  deposit_value: s.deposit_value,
                }))}
              />
            </div>
          </div>
        </Section>
      ) : (
        <Section
          title="Sinal pelo Pix"
          description="Disponível no plano Completo: o cliente paga o sinal ou o valor total pelo Pix ao agendar e avisa no chat."
        >
          <Link href="/painel/plano" className="text-sm font-medium text-primary underline">
            Assinar o Completo
          </Link>
        </Section>
      )}
    </div>
  );
}
