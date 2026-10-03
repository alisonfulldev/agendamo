import { formatInTimeZone } from "date-fns-tz";
import { MessageCircle } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader, Section } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { todayIn } from "@/lib/availability";
import { requireOwner } from "@/lib/business/context";
import { whatsappLink } from "@/lib/phone";
import {
  hasBirthdayInMonth,
  isDueToReturn,
  isInactive,
  type CustomerActivity,
} from "@/lib/sales/activity";
import { loadMarketingSettings } from "@/lib/sales/load";
import { fillTemplate } from "@/lib/sales/settings";
import { createAdminClient } from "@/lib/supabase/admin";

import { MarketingSettingsForm } from "../forms";

export const metadata: Metadata = { title: "Reativação e retorno" };

function CustomerList({
  items,
  template,
  businessName,
  empty,
  extra,
}: {
  items: CustomerActivity[];
  template: string;
  businessName: string;
  empty: string;
  extra: (c: CustomerActivity) => string;
}) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="divide-y text-sm">
      {items.slice(0, 100).map((c) => (
        <li key={c.customer_id} className="flex flex-wrap items-center justify-between gap-2 py-2">
          <span>
            <span className="font-medium">{c.name}</span>
            <span className="block text-muted-foreground">{extra(c)}</span>
          </span>
          {c.phone ? (
            <Button asChild size="sm">
              <a
                href={whatsappLink(
                  c.phone,
                  fillTemplate(template, {
                    customerName: c.name.split(" ")[0],
                    business: businessName,
                    service: c.last_service_name ?? "",
                  }),
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle /> WhatsApp
              </a>
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default async function ReactivationPage() {
  const { business, brand } = await requireOwner();
  const settings = await loadMarketingSettings(business.id, brand);
  const { data } = await createAdminClient().rpc("customer_activity", {
    p_business_id: business.id,
  });
  const activity = (data ?? []) as CustomerActivity[];
  const today = todayIn(business.timezone, new Date());
  const lastVisit = (c: CustomerActivity) =>
    c.last_completed_at
      ? `Última visita: ${formatInTimeZone(new Date(c.last_completed_at), business.timezone, "dd/MM/yyyy")}`
      : "";

  const inactive = activity.filter((c) => isInactive(c, today, settings.inactive_days));
  const dueToReturn = activity.filter((c) => isDueToReturn(c, today));
  const birthdays = activity
    .filter((c) => hasBirthdayInMonth(c, today.slice(5, 7)))
    .sort((a, b) => (a.birthdate ?? "").slice(8).localeCompare((b.birthdate ?? "").slice(8)));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reativação e retorno"
        description="Quem sumiu, quem está na hora de voltar e quem faz aniversário este mês."
      />
      <Section
        title={`Clientes que sumiram (${inactive.length})`}
        description={`Sem visita há ${settings.inactive_days} dias ou mais e sem horário marcado.`}
      >
        <CustomerList
          items={inactive}
          template={settings.templates.reactivation}
          businessName={business.name}
          empty="Ninguém sumido. 🎉"
          extra={lastVisit}
        />
      </Section>
      <Section
        title={`Hora de voltar (${dueToReturn.length})`}
        description="Pelo intervalo de retorno de cada serviço (configure no serviço, em Meu perfil)."
      >
        <CustomerList
          items={dueToReturn}
          template={settings.templates.return}
          businessName={business.name}
          empty="Ninguém na hora de voltar hoje."
          extra={(c) => `${c.last_service_name ?? ""} · ${lastVisit(c)}`}
        />
      </Section>
      <Section title={`Aniversariantes do mês (${birthdays.length})`}>
        <CustomerList
          items={birthdays}
          template={settings.templates.birthday}
          businessName={business.name}
          empty="Nenhum aniversário cadastrado neste mês."
          extra={(c) =>
            `Dia ${c.birthdate?.slice(8, 10)}${c.marketing_opt_in ? " · aceita novidades" : ""}`
          }
        />
      </Section>
      <Section title="Configurações e mensagens">
        <MarketingSettingsForm settings={settings} section="reactivation" />
      </Section>
    </div>
  );
}
