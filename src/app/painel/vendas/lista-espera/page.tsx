import { MessageCircle } from "lucide-react";
import type { Metadata } from "next";

import { ActionButton } from "@/components/panel/action-button";
import { PageHeader } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { todayIn } from "@/lib/availability";
import { requireOwner } from "@/lib/business/context";
import type { WaitlistEntry } from "@/lib/db/types";
import { formatBrPhone, whatsappLink } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

import { setWaitlistStatusAction } from "../actions";

export const metadata: Metadata = { title: "Lista de espera" };

const STATUS = {
  waiting: "Aguardando",
  notified: "Avisada",
  booked: "Agendou",
  expired: "Expirada",
  removed: "Removida",
} as const;

export default async function WaitlistPage() {
  const { business } = await requireOwner();
  const supabase = await createClient();
  const { data } = await supabase
    .from("waitlist_entries")
    .select("*, service:services(name)")
    .eq("business_id", business.id)
    .gte("date", todayIn(business.timezone, new Date()))
    .neq("status", "removed")
    .order("date")
    .order("created_at");
  const entries = (data ?? []) as (WaitlistEntry & { service: { name: string } | null })[];

  return (
    <div>
      <PageHeader
        title="Lista de espera"
        description="Quando um horário é cancelado, a lista daquele dia e serviço recebe um e-mail na ordem de chegada. Quem confirmar primeiro leva."
      />
      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          Ninguém na lista de espera.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {entries.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <span className="text-sm">
                <span className="font-medium">{e.customer_name}</span> · {e.service?.name} ·{" "}
                {e.date.split("-").reverse().join("/")}
                <span className="block text-muted-foreground">
                  {formatBrPhone(e.phone)} · {STATUS[e.status]}
                </span>
              </span>
              <span className="flex gap-1">
                <Button asChild size="sm">
                  <a
                    href={whatsappLink(
                      e.phone,
                      `Oi, ${e.customer_name.split(" ")[0]}! Aqui é ${business.name}. Abriu um horário no dia que você queria!`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle /> WhatsApp
                  </a>
                </Button>
                <ActionButton
                  size="sm"
                  variant="ghost"
                  action={setWaitlistStatusAction.bind(null, e.id, "booked")}
                >
                  Agendou
                </ActionButton>
                <ActionButton
                  size="sm"
                  variant="ghost"
                  action={setWaitlistStatusAction.bind(null, e.id, "removed")}
                >
                  Remover
                </ActionButton>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
