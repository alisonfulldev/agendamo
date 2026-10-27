import { formatInTimeZone } from "date-fns-tz";
import Link from "next/link";

import { BRANDS, getNiche } from "@/brands";
import { businessUrl } from "@/brands/urls";
import { ownerEmails } from "@/lib/admin-data";
import {
  ADMIN_STATUS_LABEL,
  adminStatus,
  daysAgoIso,
  monthlyRevenue,
  type AdminStatus,
} from "@/lib/admin-metrics";
import type { Business, Subscription } from "@/lib/db/types";
import { formatBRL } from "@/lib/money";
import { signupOrigin, type SignupSource } from "@/lib/signup-origin";
import { createAdminClient } from "@/lib/supabase/admin";

import { BusinessActions } from "../../admin-actions";
import { AdminSection, StatusBadge } from "../ui";

const TZ = "America/Sao_Paulo";
const date = (iso: string | null | undefined) =>
  iso ? formatInTimeZone(new Date(iso), TZ, "dd/MM/yy") : "—";
const STATUSES: AdminStatus[] = ["trial", "subscribed", "waiting", "suspended"];

/** Businesses: search, filters by situation and niche, and the admin actions. */
export default async function AdminBusinessesPage({ searchParams }: PageProps<"/admin/negocios">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const status = STATUSES.find((s) => s === params.situacao) ?? null;
  const niche = typeof params.nicho === "string" ? params.nicho : "";
  const focus = typeof params.id === "string" ? params.id : "";

  const db = createAdminClient();
  const [
    businessesResult,
    subscriptionsResult,
    bookingsResult,
    viewsResult,
    emails,
    createdResult,
  ] = await Promise.all([
    db.from("businesses").select("*").order("created_at", { ascending: false }).limit(5000),
    db.from("subscriptions").select("*"),
    db.from("appointments").select("business_id").gte("created_at", daysAgoIso(30)).limit(50000),
    db
      .from("page_events")
      .select("business_id")
      .eq("type", "view")
      .gte("occurred_at", daysAgoIso(7))
      .limit(50000),
    ownerEmails(),
    // Where each account came from: saved with the sign-up in the conversation.
    db
      .from("audit_log")
      .select("business_id, details")
      .eq("action", "business.created")
      .limit(10000),
  ]);
  const origins = new Map<string, SignupSource>();
  for (const row of (createdResult.data ?? []) as {
    business_id: string;
    details: { source?: SignupSource | null } | null;
  }[]) {
    if (row.details?.source) origins.set(row.business_id, row.details.source);
  }
  const now = new Date();
  const subs = new Map(
    ((subscriptionsResult.data ?? []) as Subscription[]).map((s) => [s.business_id, s]),
  );
  const tally = (rows: { business_id: string }[] | null) => {
    const map = new Map<string, number>();
    for (const r of rows ?? []) map.set(r.business_id, (map.get(r.business_id) ?? 0) + 1);
    return map;
  };
  const bookings = tally(bookingsResult.data as { business_id: string }[] | null);
  const views = tally(viewsResult.data as { business_id: string }[] | null);

  const all = (businessesResult.data ?? []) as Business[];
  const listed = all.filter((b) => {
    if (focus) return b.id === focus;
    if (status && adminStatus(b, now) !== status) return false;
    if (niche && b.brand_key !== niche) return false;
    if (q) {
      const haystack = `${b.name} ${b.slug} ${emails.get(b.id) ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
  const counts = Object.fromEntries(
    STATUSES.map((s) => [s, all.filter((b) => adminStatus(b, now) === s).length]),
  ) as Record<AdminStatus, number>;
  const nicheOptions = BRANDS.filter((b) => b.niche).sort((a, b) =>
    a.niche!.name.localeCompare(b.niche!.name),
  );
  const link = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams();
    const merged = { q: q || null, situacao: status, nicho: niche || null, ...patch };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    const query = next.toString();
    return `/admin/negocios${query ? `?${query}` : ""}`;
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Negócios</h1>

      <AdminSection
        title={focus ? "Negócio" : `${listed.length} de ${all.length} negócios`}
        actions={
          focus ? (
            <Link href="/admin/negocios" className="text-sm text-primary underline">
              Ver todos
            </Link>
          ) : null
        }
      >
        {!focus ? (
          <div className="mb-4 flex flex-col gap-3">
            <form className="flex flex-wrap gap-2" action="/admin/negocios">
              {status ? <input type="hidden" name="situacao" value={status} /> : null}
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar por nome, link ou e-mail"
                aria-label="Buscar negócio"
                className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
              />
              <select
                name="nicho"
                defaultValue={niche}
                aria-label="Nicho"
                className="h-10 rounded-lg border border-input bg-background px-2 text-sm"
              >
                <option value="">Todos os nichos</option>
                {nicheOptions.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.niche!.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Filtrar
              </button>
            </form>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link
                href={link({ situacao: null })}
                className={`rounded-full border px-3 py-1 ${!status ? "border-primary bg-primary/10 font-medium" : ""}`}
              >
                Todos ({all.length})
              </Link>
              {STATUSES.map((s) => (
                <Link
                  key={s}
                  href={link({ situacao: s })}
                  className={`rounded-full border px-3 py-1 ${status === s ? "border-primary bg-primary/10 font-medium" : ""}`}
                >
                  {ADMIN_STATUS_LABEL[s]} ({counts[s]})
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {listed.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum negócio encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-3 font-medium">Negócio</th>
                  <th className="py-2 pr-3 font-medium">Situação</th>
                  <th className="py-2 pr-3 font-medium">Cadastro</th>
                  <th className="py-2 pr-3 font-medium">Origem</th>
                  <th className="py-2 pr-3 font-medium">Teste até / próxima cobrança</th>
                  <th className="py-2 pr-3 text-right font-medium">Agend. 30d</th>
                  <th className="py-2 pr-3 text-right font-medium">Visitas 7d</th>
                  <th className="py-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {listed.map((b) => {
                  const brand = getNiche(b.brand_key);
                  const sub = subs.get(b.id);
                  const situation = adminStatus(b, now);
                  const origin = signupOrigin(origins.get(b.id));
                  return (
                    <tr key={b.id} className="align-top">
                      <td className="max-w-[24rem] py-2.5 pr-3">
                        <a
                          href={businessUrl(brand, `/${b.slug}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium hover:underline"
                        >
                          {b.name}
                        </a>
                        <span className="block max-w-[22rem] truncate text-xs text-muted-foreground">
                          {brand.niche?.name ?? "Outro / Geral"} ·{" "}
                          {emails.get(b.id) ?? "sem e-mail"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <StatusBadge status={situation} />
                        {sub && (sub.status === "active" || sub.status === "overdue") ? (
                          <span className="mt-1 block text-xs whitespace-nowrap text-muted-foreground">
                            {formatBRL(monthlyRevenue(sub))}/mês
                            {sub.status === "overdue" ? " · em atraso" : ""}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">{date(b.created_at)}</td>
                      <td className="max-w-[14rem] py-2.5 pr-3">
                        <span className="font-medium">{origin.label}</span>
                        {origin.detail ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            {origin.detail}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums">
                        {situation === "subscribed"
                          ? date(sub?.current_period_end)
                          : date(b.trial_ends_at)}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">
                        {bookings.get(b.id) ?? 0}
                      </td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">
                        {views.get(b.id) ?? 0}
                      </td>
                      <td className="py-2.5">
                        <BusinessActions
                          id={b.id}
                          suspended={Boolean(b.suspended_at)}
                          canExtendTrial={situation !== "subscribed"}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminSection>
    </>
  );
}
