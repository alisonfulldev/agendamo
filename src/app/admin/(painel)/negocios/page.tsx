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
import {
  OUTREACH_LABELS,
  outreachMessage,
  outreachSituation,
  type OutreachSituation,
} from "@/content/admin-outreach";
import { whatsappLink } from "@/content/sales-script";
import { formatBRL } from "@/lib/money";
import { normalizeBrPhone } from "@/lib/phone";
import { HEARD_FROM, signupOrigin, type HeardFrom, type SignupSource } from "@/lib/signup-origin";
import { createAdminClient } from "@/lib/supabase/admin";

import { BusinessActions } from "../../admin-actions";
import { AdminSection, StatusBadge } from "../ui";

const TZ = "America/Sao_Paulo";
const date = (iso: string | null | undefined) =>
  iso ? formatInTimeZone(new Date(iso), TZ, "dd/MM/yy") : "—";
const STATUSES: AdminStatus[] = ["trial", "subscribed", "waiting", "suspended"];

/** "hoje", "ontem", "há 5 dias" (calendar days in São Paulo) + date and time. */
function lastSeen(iso: string | null, now: Date): { label: string; detail: string | null } {
  if (!iso) return { label: "—", detail: null };
  const day = (d: Date) => Date.parse(formatInTimeZone(d, TZ, "yyyy-MM-dd"));
  const days = Math.round((day(now) - day(new Date(iso))) / 86_400_000);
  return {
    label: days <= 0 ? "hoje" : days === 1 ? "ontem" : `há ${days} dias`,
    detail: formatInTimeZone(new Date(iso), TZ, "dd/MM/yy HH:mm"),
  };
}

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
    pagesResult,
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
    // Where each account came from: saved with the sign-up, plus "Como conheceu?" when answered.
    db
      .from("audit_log")
      .select("business_id, action, details")
      .in("action", ["business.created", "signup.heard_from"])
      .limit(20000),
    // WhatsApp and photo of each account, for "Chamar no WhatsApp".
    db.from("page_settings").select("business_id, whatsapp_number, avatar_key").limit(10000),
  ]);
  const pages = new Map(
    (
      (pagesResult.data ?? []) as {
        business_id: string;
        whatsapp_number: string | null;
        avatar_key: string | null;
      }[]
    ).map((p) => [p.business_id, p]),
  );
  const origins = new Map<string, SignupSource>();
  const heard = new Map<string, string>();
  for (const row of (createdResult.data ?? []) as {
    business_id: string;
    action: string;
    details: { source?: SignupSource | null; heard_from?: HeardFrom } | null;
  }[]) {
    if (row.details?.source) origins.set(row.business_id, row.details.source);
    const answer = row.details?.heard_from;
    if (answer && answer in HEARD_FROM) heard.set(row.business_id, HEARD_FROM[answer]);
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
                  <th className="py-2 pr-3 font-medium">Último acesso</th>
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
                  const seen = lastSeen(b.owner_last_seen_at, now);
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
                        <OutreachButton
                          business={b}
                          status={situation}
                          phone={pages.get(b.id)?.whatsapp_number ?? null}
                          hasPhoto={Boolean(pages.get(b.id)?.avatar_key)}
                          hasBooking={(bookings.get(b.id) ?? 0) > 0}
                          overdue={sub?.status === "overdue"}
                          link={businessUrl(brand, `/${b.slug}`)}
                          now={now}
                        />
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
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        <span className="font-medium">{seen.label}</span>
                        {seen.detail ? (
                          <span className="block text-xs text-muted-foreground tabular-nums">
                            {seen.detail}
                          </span>
                        ) : null}
                      </td>
                      <td className="max-w-[14rem] py-2.5 pr-3">
                        <span className="font-medium">{origin.label}</span>
                        {origin.detail ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            {origin.detail}
                          </span>
                        ) : null}
                        {heard.has(b.id) ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            Disse: {heard.get(b.id)}
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

/** "Chamar no WhatsApp": a personal message for the account's situation (src/content/admin-outreach). */
function OutreachButton({
  business,
  status,
  phone,
  hasPhoto,
  hasBooking,
  overdue,
  link,
  now,
}: {
  business: Business;
  status: AdminStatus;
  phone: string | null;
  hasPhoto: boolean;
  hasBooking: boolean;
  overdue: boolean;
  link: string;
  now: Date;
}) {
  const number = normalizeBrPhone(phone);
  const situation = outreachSituation(
    {
      status,
      createdAt: business.created_at,
      trialEndsAt: business.trial_ends_at,
      hasBooking,
      hasPhoto,
      overdue,
    },
    now,
  );
  if (!situation) return null;
  if (!number) {
    return <span className="mt-1.5 block text-xs text-muted-foreground">Sem WhatsApp</span>;
  }
  const href = (choice: OutreachSituation) =>
    whatsappLink(
      number,
      outreachMessage(
        choice,
        { businessName: business.name, link, trialEndsAt: business.trial_ends_at },
        now,
      ),
    );
  const others = (Object.keys(OUTREACH_LABELS) as OutreachSituation[]).filter(
    (choice) => choice !== situation,
  );
  return (
    <div className="mt-1.5">
      {/* The message of the account's current phase; the others stay one tap away. */}
      <a
        href={href(situation)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap hover:bg-muted"
      >
        Chamar no WhatsApp
        <span className="font-normal text-muted-foreground">· {OUTREACH_LABELS[situation]}</span>
      </a>
      <details className="mt-1 text-xs">
        <summary className="cursor-pointer text-muted-foreground">Outra mensagem</summary>
        <ul className="mt-1 flex flex-col gap-1">
          {others.map((choice) => (
            <li key={choice}>
              <a
                href={href(choice)}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                {OUTREACH_LABELS[choice]}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
