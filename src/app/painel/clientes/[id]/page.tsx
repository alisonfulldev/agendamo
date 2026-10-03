import { formatInTimeZone } from "date-fns-tz";
import { MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader, Section } from "@/components/panel/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireBusiness } from "@/lib/business/context";
import type { Customer } from "@/lib/db/types";
import { formatBRL } from "@/lib/money";
import { formatBrPhone, whatsappLink } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

import { STATUS_LABELS } from "../../agenda/types";
import { NotesForm, OwnerActions, SellPackage } from "./customer-actions";

export const metadata: Metadata = { title: "Cliente" };

export default async function CustomerPage({ params }: PageProps<"/painel/clientes/[id]">) {
  const { id } = await params;
  const { business, isOwner } = await requireBusiness();
  const supabase = await createClient();
  // RLS decides visibility (staff: only customers of their own professional).
  const { data } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  const customer = data as Customer | null;
  if (!customer) notFound();

  const [appointments, owned, packages] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, starts_at, status, discount_cents, appointment_services(name, price_cents), professional:professionals(name)",
      )
      .eq("customer_id", id)
      .order("starts_at", { ascending: false })
      .limit(100),
    supabase
      .from("customer_packages")
      .select("id, sessions_left, sold_at, package:packages(name, sessions)")
      .eq("customer_id", id),
    isOwner
      ? supabase
          .from("packages")
          .select("id, name")
          .eq("business_id", business.id)
          .eq("active", true)
      : Promise.resolve({ data: [] }),
  ]);

  const history = (appointments.data ?? []).map((a) => ({
    id: a.id as string,
    startsAt: a.starts_at as string,
    status: a.status as keyof typeof STATUS_LABELS,
    services: ((a.appointment_services as { name: string }[]) ?? []).map((s) => s.name).join(" + "),
    price:
      ((a.appointment_services as { price_cents: number }[]) ?? []).reduce(
        (s, l) => s + l.price_cents,
        0,
      ) - (a.discount_cents as number),
    professional: (a.professional as unknown as { name: string } | null)?.name ?? "",
  }));
  const now = new Date().toISOString();
  const spent = history.filter((h) => h.status === "completed").reduce((s, h) => s + h.price, 0);
  const expected = history
    .filter(
      (h) => ["confirmed", "pending", "awaiting_deposit"].includes(h.status) && h.startsAt > now,
    )
    .reduce((s, h) => s + h.price, 0);
  const lastVisit = history.find((h) => h.status === "completed");
  const fmt = (iso: string) =>
    formatInTimeZone(new Date(iso), business.timezone, "dd/MM/yyyy HH:mm");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={customer.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {formatBrPhone(customer.phone)} {customer.email ? `· ${customer.email}` : ""}
            {customer.blocked ? <Badge variant="destructive">Bloqueada</Badge> : null}
            {customer.marketing_opt_in ? <Badge variant="secondary">Aceita novidades</Badge> : null}
          </span>
        }
        actions={
          customer.phone ? (
            <Button asChild>
              <a href={whatsappLink(customer.phone)} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> WhatsApp
              </a>
            </Button>
          ) : null
        }
      />

      <dl className="grid gap-3 sm:grid-cols-4">
        {[
          ["Gasto (concluídos)", formatBRL(spent)],
          ["Previsto (futuros)", formatBRL(expected)],
          ["Última visita", lastVisit ? fmt(lastVisit.startsAt).slice(0, 10) : "—"],
          ["Faltas", String(customer.no_show_count)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-heading text-xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>

      <Section title="Histórico">
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum agendamento ainda.</p>
        ) : (
          <ul className="divide-y text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  {fmt(h.startsAt)} · {h.services}
                  {h.professional ? (
                    <span className="text-muted-foreground"> · {h.professional}</span>
                  ) : null}
                </span>
                <span className="text-muted-foreground">
                  {STATUS_LABELS[h.status]} · {formatBRL(h.price)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Pacotes">
        <ul className="mb-3 flex flex-col gap-1 text-sm">
          {(owned.data ?? []).map((p) => {
            const pack = p.package as unknown as { name: string; sessions: number };
            return (
              <li key={p.id as string}>
                {pack.name}: {p.sessions_left as number} de {pack.sessions} sessões restantes
              </li>
            );
          })}
          {(owned.data ?? []).length === 0 ? (
            <li className="text-muted-foreground">Nenhum pacote.</li>
          ) : null}
        </ul>
        {isOwner ? (
          <SellPackage
            customerId={customer.id}
            packages={(packages.data ?? []) as { id: string; name: string }[]}
          />
        ) : null}
      </Section>

      <Section title="Observações">
        <NotesForm
          id={customer.id}
          notes={customer.notes ?? ""}
          birthdate={customer.birthdate ?? ""}
        />
      </Section>

      {isOwner ? (
        <Section title="Ações">
          <OwnerActions
            id={customer.id}
            blocked={customer.blocked}
            optIn={customer.marketing_opt_in}
            slug={business.slug}
          />
        </Section>
      ) : null}
    </div>
  );
}
