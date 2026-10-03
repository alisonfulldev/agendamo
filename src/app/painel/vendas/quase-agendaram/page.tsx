import { formatInTimeZone } from "date-fns-tz";
import { MessageCircle } from "lucide-react";
import type { Metadata } from "next";

import { ActionButton } from "@/components/panel/action-button";
import { PageHeader, Section } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { requireOwner } from "@/lib/business/context";
import type { AbandonedBooking } from "@/lib/db/types";
import { formatBrPhone, whatsappLink } from "@/lib/phone";
import { loadMarketingSettings } from "@/lib/sales/load";
import { fillTemplate } from "@/lib/sales/settings";
import { createClient } from "@/lib/supabase/server";

import { resolveAbandonedAction } from "../actions";
import { TemplateEditor } from "../forms";

export const metadata: Metadata = { title: "Quase agendaram" };

export default async function AbandonedPage() {
  const { business, brand } = await requireOwner();
  const supabase = await createClient();
  const [{ data }, { data: services }, settings] = await Promise.all([
    supabase
      .from("abandoned_bookings")
      .select("*")
      .eq("business_id", business.id)
      .eq("status", "open")
      .order("created_at", { ascending: false }),
    supabase.from("services").select("id, name").eq("business_id", business.id),
    loadMarketingSettings(business.id, brand),
  ]);
  const names = new Map((services ?? []).map((s) => [s.id as string, s.name as string]));
  const rows = (data ?? []) as AbandonedBooking[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Quase agendaram"
        description="Pessoas que preencheram o contato no chat, autorizaram falar com elas e não concluíram. Os registros somem após 30 dias."
      />
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          Nenhum registro em aberto.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {rows.map((row) => {
            const service =
              row.service_ids
                .map((id) => names.get(id))
                .filter(Boolean)
                .join(" + ") || "um serviço";
            const message = fillTemplate(settings.templates.abandoned, {
              customerName: (row.customer_name ?? "").split(" ")[0],
              business: business.name,
              service,
            });
            return (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <span className="text-sm">
                  <span className="font-medium">{row.customer_name ?? "Sem nome"}</span> · olhou{" "}
                  {service}
                  {row.slot
                    ? ` para ${formatInTimeZone(new Date(row.slot), business.timezone, "dd/MM 'às' HH:mm")}`
                    : ""}
                  <span className="block text-muted-foreground">
                    {formatBrPhone(row.phone)} ·{" "}
                    {formatInTimeZone(new Date(row.created_at), business.timezone, "dd/MM HH:mm")}
                  </span>
                </span>
                <span className="flex gap-1">
                  {row.phone ? (
                    <Button asChild size="sm">
                      <a
                        href={whatsappLink(row.phone, message)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle /> WhatsApp
                      </a>
                    </Button>
                  ) : null}
                  <ActionButton
                    size="sm"
                    variant="ghost"
                    action={resolveAbandonedAction.bind(null, row.id)}
                  >
                    Resolvido
                  </ActionButton>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <Section title="Mensagem do WhatsApp">
        <TemplateEditor settings={settings} templateKey="abandoned" />
      </Section>
    </div>
  );
}
