import type { Metadata } from "next";
import Link from "next/link";

import { BRANDS } from "@/brands";
import { requireAdmin } from "@/lib/admin";
import { computeMetrics, daysAgoIso, type BrandMetrics } from "@/lib/admin-metrics";
import type { Business, Subscription } from "@/lib/db/types";
import { formatBRL } from "@/lib/money";
import { getPlanFeatures, planLabel } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

import { BusinessActions, CouponForm } from "./admin-actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

function MetricsCard({ title, metrics }: { title: string; metrics: BrandMetrics }) {
  const max = Math.max(1, ...metrics.signupsByWeek.map((w) => w.count));
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="font-semibold">{title}</h2>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Negócios</dt>
          <dd className="text-lg font-bold">{metrics.businesses}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Ativação</dt>
          <dd className="text-lg font-bold">
            {metrics.businesses ? Math.round((metrics.activated / metrics.businesses) * 100) : 0}%
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Testes (ativos)</dt>
          <dd className="text-lg font-bold">
            {metrics.trials} ({metrics.activeTrials})
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Assinantes</dt>
          <dd className="text-lg font-bold">{metrics.subscribers}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Cancelamentos</dt>
          <dd className="text-lg font-bold">{metrics.cancellations}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Receita mensal</dt>
          <dd className="text-lg font-bold">{formatBRL(metrics.mrrCents)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Cadastros: Grátis / teste Agenda / teste Pro</dt>
          <dd className="text-lg font-bold">
            {metrics.signupsByChoice.free} / {metrics.signupsByChoice.trialAgenda} /{" "}
            {metrics.signupsByChoice.trialPro}
          </dd>
        </div>
        {(["agenda", "pro"] as const).map((plan) => {
          const c = metrics.trialConversion[plan];
          return (
            <div key={plan}>
              <dt className="text-muted-foreground">
                Teste → pago ({plan === "agenda" ? "Agenda" : "Pro"})
              </dt>
              <dd className="text-lg font-bold">
                {c.finished ? Math.round((c.paid / c.finished) * 100) : 0}%{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {c.paid} de {c.finished}
                </span>
              </dd>
            </div>
          );
        })}
        <div>
          <dt className="text-muted-foreground">Caíram no Grátis</dt>
          <dd className="text-lg font-bold">{metrics.fellToFree}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Upgrades (Agenda → Pro)</dt>
          <dd className="text-lg font-bold">{metrics.upgrades}</dd>
        </div>
      </dl>
      <div className="mt-4">
        <p className="mb-1 text-xs text-muted-foreground">Cadastros por semana</p>
        <div
          className="flex h-16 items-end gap-1"
          role="img"
          aria-label={metrics.signupsByWeek.map((w) => `${w.week}: ${w.count}`).join(", ")}
        >
          {metrics.signupsByWeek.map((w) => (
            <div key={w.week} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-primary"
                style={{ height: `${(w.count / max) * 100}%`, minHeight: w.count ? 4 : 0 }}
              />
              <span className="text-[10px] text-muted-foreground">
                {w.week.slice(8, 10)}/{w.week.slice(5, 7)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const { marca } = await searchParams;
  const brandFilter =
    typeof marca === "string" && BRANDS.some((b) => b.key === marca) ? marca : null;
  const db = createAdminClient();
  const weekAgo = daysAgoIso(7);

  const [businesses, subscriptions, views, appointments, activated, upgraded] = await Promise.all([
    db.from("businesses").select("*").order("created_at", { ascending: false }).limit(1000),
    db.from("subscriptions").select("*"),
    db
      .from("page_events")
      .select("business_id")
      .eq("type", "view")
      .gte("occurred_at", weekAgo)
      .limit(50000),
    db.from("appointments").select("business_id").gte("created_at", weekAgo).limit(50000),
    db.from("page_stats_daily").select("business_id").limit(50000),
    db.from("audit_log").select("business_id").eq("action", "plan.upgraded").limit(50000),
  ]);
  const upgradedIds = new Set((upgraded.data ?? []).map((r) => r.business_id as string));
  const allBusinesses = (businesses.data ?? []) as Business[];
  const allSubs = (subscriptions.data ?? []) as Subscription[];
  const activatedIds = new Set((activated.data ?? []).map((r) => r.business_id as string));
  const count = (rows: { business_id: string }[] | null) => {
    const map = new Map<string, number>();
    for (const r of rows ?? []) map.set(r.business_id, (map.get(r.business_id) ?? 0) + 1);
    return map;
  };
  const weekViews = count(views.data as { business_id: string }[] | null);
  const weekAppointments = count(appointments.data as { business_id: string }[] | null);
  const subsByBusiness = new Map(allSubs.map((s) => [s.business_id, s]));
  const listed = brandFilter
    ? allBusinesses.filter((b) => b.brand_key === brandFilter)
    : allBusinesses;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Administração</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <MetricsCard
          title="Total"
          metrics={computeMetrics(allBusinesses, allSubs, activatedIds, new Date(), 8, upgradedIds)}
        />
        {BRANDS.map((brand) => (
          <MetricsCard
            key={brand.key}
            title={brand.name}
            metrics={computeMetrics(
              allBusinesses.filter((b) => b.brand_key === brand.key),
              allSubs,
              activatedIds,
              new Date(),
              8,
              upgradedIds,
            )}
          />
        ))}
      </div>

      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 font-semibold">Cupons da plataforma</h2>
        <CouponForm brands={BRANDS.map((b) => ({ key: b.key, name: b.name }))} />
      </section>

      <section className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Negócios ({listed.length})</h2>
          <nav aria-label="Filtrar por marca" className="flex flex-wrap gap-2 text-sm">
            <Link href="/admin" className={!brandFilter ? "font-semibold text-primary" : ""}>
              Todas
            </Link>
            {BRANDS.map((b) => (
              <Link
                key={b.key}
                href={`/admin?marca=${b.key}`}
                className={brandFilter === b.key ? "font-semibold text-primary" : ""}
              >
                {b.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="p-2">Negócio</th>
                <th className="p-2">Marca</th>
                <th className="p-2">Plano</th>
                <th className="p-2">Teste até</th>
                <th className="p-2">Adicionais</th>
                <th className="p-2">Cadastro</th>
                <th className="p-2">Visitas 7d</th>
                <th className="p-2">Agend. 7d</th>
                <th className="p-2">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {listed.map((b) => {
                const sub = subsByBusiness.get(b.id);
                const addons = [
                  ...(sub?.addons.featured ?? [])
                    .filter((f) => f.status === "active")
                    .map((f) => `Destaque ${f.city}`),
                  ...(sub?.addons.custom_domain?.status === "active" ? ["Domínio"] : []),
                ];
                return (
                  <tr key={b.id} className={b.suspended_at ? "opacity-60" : ""}>
                    <td className="p-2">
                      <a
                        href={`/${b.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium hover:underline"
                      >
                        {b.name}
                      </a>
                      {b.suspended_at ? (
                        <span className="ml-1 text-destructive">(suspenso)</span>
                      ) : null}
                    </td>
                    <td className="p-2">
                      {BRANDS.find((x) => x.key === b.brand_key)?.name ?? b.brand_key}
                    </td>
                    <td className="p-2">
                      {planLabel(getPlanFeatures(b))}
                      {sub ? ` · ${sub.status}` : ""}
                    </td>
                    <td className="p-2">
                      {b.trial_ends_at
                        ? b.trial_ends_at.slice(0, 10).split("-").reverse().join("/")
                        : "—"}
                    </td>
                    <td className="p-2">{addons.join(", ") || "—"}</td>
                    <td className="p-2">
                      {b.created_at.slice(0, 10).split("-").reverse().join("/")}
                    </td>
                    <td className="p-2">{weekViews.get(b.id) ?? 0}</td>
                    <td className="p-2">{weekAppointments.get(b.id) ?? 0}</td>
                    <td className="p-2">
                      <BusinessActions id={b.id} suspended={Boolean(b.suspended_at)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
