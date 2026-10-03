import type { Metadata } from "next";

import { PageHeader, Section } from "@/components/panel/page-header";
import { UpgradeNotice } from "@/components/panel/upgrade-notice";
import { ImageUploadButton } from "@/components/uploads/image-upload-button";
import { localToUtc, todayIn } from "@/lib/availability";
import { requireOwner } from "@/lib/business/context";
import type { Professional, ProfessionalService, Service, WorkingHours } from "@/lib/db/types";
import { formatBRL } from "@/lib/money";
import { getPlanFeatures } from "@/lib/plans";
import { publicUrl } from "@/lib/storage/r2";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { HoursForm } from "../configuracoes/forms";
import {
  NewProfessionalButton,
  ProfessionalHeader,
  ProfessionalServices,
  ResourcesEditor,
  StaffAccess,
} from "./team-forms";

export const metadata: Metadata = { title: "Equipe" };

export default async function TeamPage() {
  const { business } = await requireOwner();
  const features = getPlanFeatures(business);
  const supabase = await createClient();
  const [pros, services, links, hours, members, resources, serviceResources] = await Promise.all([
    supabase.from("professionals").select("*").eq("business_id", business.id).order("position"),
    supabase
      .from("services")
      .select("*")
      .eq("business_id", business.id)
      .eq("active", true)
      .order("position"),
    supabase.from("professional_services").select("*").eq("business_id", business.id),
    supabase.from("working_hours").select("*").eq("business_id", business.id),
    supabase
      .from("members")
      .select("id, user_id, role, professional_id")
      .eq("business_id", business.id)
      .eq("role", "staff"),
    supabase.from("resources").select("*").eq("business_id", business.id).order("created_at"),
    supabase.from("service_resources").select("*").eq("business_id", business.id),
  ]);

  const professionals = (pros.data ?? []) as Professional[];
  const serviceList = (services.data ?? []) as Service[];
  const linkList = (links.data ?? []) as ProfessionalService[];
  const hourList = (hours.data ?? []) as WorkingHours[];
  const activeCount = professionals.filter((p) => p.active).length;

  // Staff e-mails (auth users are only readable with the service role).
  const admin = createAdminClient();
  const staff = await Promise.all(
    (members.data ?? []).map(async (m) => {
      const { data } = await admin.auth.admin.getUserById(m.user_id as string);
      return {
        id: m.id as string,
        professionalId: m.professional_id as string,
        email: data.user?.email ?? "",
      };
    }),
  );

  // Report for the current month (Team plan).
  const today = todayIn(business.timezone, new Date());
  const monthStart = `${today.slice(0, 8)}01`;
  const report = features.reportsByProfessional
    ? await admin
        .from("appointments")
        .select("professional_id, status, discount_cents, appointment_services(price_cents)")
        .eq("business_id", business.id)
        .gte("starts_at", localToUtc(monthStart, "00:00", business.timezone).toISOString())
    : { data: [] };
  const byPro = new Map<
    string,
    { total: number; completed: number; noShow: number; revenue: number }
  >();
  for (const row of report.data ?? []) {
    const entry = byPro.get(row.professional_id as string) ?? {
      total: 0,
      completed: 0,
      noShow: 0,
      revenue: 0,
    };
    const price =
      ((row.appointment_services as { price_cents: number }[]) ?? []).reduce(
        (s, l) => s + l.price_cents,
        0,
      ) - (row.discount_cents as number);
    if (row.status !== "cancelled") entry.total++;
    if (row.status === "completed") entry.completed++;
    if (row.status === "no_show") entry.noShow++;
    if (["confirmed", "pending", "awaiting_deposit", "completed"].includes(row.status as string))
      entry.revenue += price;
    byPro.set(row.professional_id as string, entry);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Equipe"
        description={`${activeCount} de ${features.professionalLimit} profissional(is) ativo(s) no seu plano.`}
        actions={<NewProfessionalButton disabled={activeCount >= features.professionalLimit} />}
      />
      {!features.anyProfessional ? (
        <UpgradeNotice
          team
          features={features}
          title="Monte sua equipe"
          description="No plano Equipe você cadastra até 5 profissionais, cada um com agenda, serviços e preços próprios."
          bullets={[
            "Cliente escolhe o profissional ou “qualquer profissional”",
            "Cada profissional acessa só a própria agenda",
            "Salas e macas compartilhadas sem conflito",
            "Relatório por profissional",
          ]}
        />
      ) : null}

      {professionals.map((pro) => (
        <Section
          key={pro.id}
          title={pro.name}
          description={pro.active ? undefined : "Inativo: não aparece no chat nem no perfil."}
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-start gap-4">
              <div className="size-16 overflow-hidden rounded-full bg-muted">
                {pro.photo_key ? (
                  // eslint-disable-next-line @next/next/no-img-element -- R2 public URL
                  <img
                    src={publicUrl(pro.photo_key) ?? ""}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <ProfessionalHeader id={pro.id} name={pro.name} active={pro.active} />
                <ImageUploadButton kind="professional" professionalId={pro.id}>
                  Foto
                </ImageUploadButton>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Serviços</h3>
              <ProfessionalServices
                professionalId={pro.id}
                services={serviceList.map((s) => ({
                  id: s.id,
                  name: s.name,
                  durationMinutes: s.duration_minutes,
                  priceCents: s.price_cents,
                }))}
                links={linkList
                  .filter((l) => l.professional_id === pro.id)
                  .map((l) => ({
                    serviceId: l.service_id,
                    durationOverride: l.duration_override,
                    priceOverride: l.price_override,
                  }))}
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Expediente</h3>
              <HoursForm
                professionals={[
                  {
                    id: pro.id,
                    name: pro.name,
                    hours: hourList
                      .filter((h) => h.professional_id === pro.id)
                      .map((h) => ({
                        weekday: h.weekday,
                        start: h.start_time.slice(0, 5),
                        end: h.end_time.slice(0, 5),
                      })),
                  },
                ]}
              />
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Acesso ao painel</h3>
              <StaffAccess
                professionalId={pro.id}
                member={staff.find((s) => s.professionalId === pro.id) ?? null}
                enabled={features.teamPermissions}
              />
            </div>
          </div>
        </Section>
      ))}

      {features.resources ? (
        <Section
          title="Salas e macas"
          description="Um recurso ocupado bloqueia o horário de quem precisa dele, mesmo com o profissional livre."
        >
          <ResourcesEditor
            resources={(resources.data ?? []).map((r) => ({
              id: r.id as string,
              name: r.name as string,
              serviceIds: (serviceResources.data ?? [])
                .filter((sr) => sr.resource_id === r.id)
                .map((sr) => sr.service_id as string),
            }))}
            services={serviceList.map((s) => ({ id: s.id, name: s.name }))}
          />
        </Section>
      ) : null}

      {features.reportsByProfessional ? (
        <Section title="Relatório do mês" description="Desde o dia 1º, por profissional.">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2">Profissional</th>
                <th className="py-2">Agendamentos</th>
                <th className="py-2">Concluídos</th>
                <th className="py-2">Faltas</th>
                <th className="py-2">Faturamento previsto</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {professionals.map((pro) => {
                const r = byPro.get(pro.id) ?? { total: 0, completed: 0, noShow: 0, revenue: 0 };
                return (
                  <tr key={pro.id}>
                    <td className="py-2">{pro.name}</td>
                    <td className="py-2">{r.total}</td>
                    <td className="py-2">{r.completed}</td>
                    <td className="py-2">{r.noShow}</td>
                    <td className="py-2">{formatBRL(r.revenue)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>
      ) : null}
    </div>
  );
}
