import type { Metadata } from "next";

import { ActionButton } from "@/components/panel/action-button";
import { PageHeader, Section } from "@/components/panel/page-header";
import { UpgradeNotice } from "@/components/panel/upgrade-notice";
import { Button } from "@/components/ui/button";
import { requireBusiness } from "@/lib/business/context";
import { isGoogleConfigured } from "@/lib/google/client";
import { getPlanFeatures } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { disconnectGoogleAction } from "./actions";
import { EmbedSection } from "./embed";

export const metadata: Metadata = { title: "Integrações" };

const GOOGLE_MESSAGES: Record<string, string> = {
  conectado:
    "Google Agenda conectado. Seus compromissos pessoais passam a bloquear horários em poucos minutos.",
  erro: "Não foi possível conectar o Google Agenda. Tente de novo.",
  indisponivel: "Google Agenda ainda não está disponível.",
};

export default async function IntegrationsPage({ searchParams }: PageProps<"/painel/integracoes">) {
  const context = await requireBusiness();
  const { business, isOwner, professionalId } = context;
  const features = getPlanFeatures(business);
  const { google } = await searchParams;
  const supabase = await createClient();
  const { data: pros } = await supabase
    .from("professionals")
    .select("id, name")
    .eq("business_id", business.id)
    .eq("active", true)
    .order("position");
  const professionals = ((pros ?? []) as { id: string; name: string }[]).filter(
    (p) => isOwner || p.id === professionalId,
  );
  const { data: connections } = await createAdminClient()
    .from("calendar_connections")
    .select("professional_id, created_at")
    .eq("business_id", business.id);
  const connected = new Set((connections ?? []).map((c) => c.professional_id as string));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Integrações" />
      {typeof google === "string" && GOOGLE_MESSAGES[google] ? (
        <p role="status" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          {GOOGLE_MESSAGES[google]}
        </p>
      ) : null}

      <Section
        title="Google Agenda"
        description="Os agendamentos vão para o seu Google Agenda, e seus compromissos pessoais bloqueiam os horários do chat."
      >
        {!features.googleCalendar ? (
          <UpgradeNotice
            features={features}
            title="Conecte o Google Agenda"
            description="Disponível no plano Completo."
          />
        ) : !isGoogleConfigured() ? (
          <p className="text-sm text-muted-foreground">Integração ainda não configurada.</p>
        ) : (
          <ul className="divide-y text-sm">
            {professionals.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span>
                  {p.name} ·{" "}
                  {connected.has(p.id) ? (
                    <span className="text-primary">conectado</span>
                  ) : (
                    "não conectado"
                  )}
                </span>
                {connected.has(p.id) ? (
                  <ActionButton
                    size="sm"
                    variant="ghost"
                    confirmText="Desconectar e apagar os acessos ao Google Agenda?"
                    action={disconnectGoogleAction.bind(null, p.id)}
                  >
                    Desconectar
                  </ActionButton>
                ) : (
                  <Button asChild size="sm">
                    <a href={`/api/google/connect?profissional=${p.id}`}>Conectar Google Agenda</a>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {isOwner ? <EmbedSection /> : null}
    </div>
  );
}
