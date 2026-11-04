import { formatInTimeZone } from "date-fns-tz";

import { getNiche } from "@/brands";
import { businessUrl } from "@/brands/urls";
import { ownerEmails } from "@/lib/admin-data";
import { daysAgoIso } from "@/lib/admin-metrics";
import type { Business, SiteOrder } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";

import { SiteDeliveredButton } from "../../site-actions";
import { AdminSection, StatTile } from "../ui";

const TZ = "America/Sao_Paulo";
const when = (iso: string | null) =>
  iso ? formatInTimeZone(new Date(iso), TZ, "EEE dd/MM HH:mm") : "—";
const CONSULTANT_PATH = "/oferta-site/consultor";

/** "Site + Agenda" orders: what to build, for whom and until when. */
export default async function AdminSitesPage() {
  const db = createAdminClient();
  const since = daysAgoIso(30);
  const [ordersResult, emails, consultantResult] = await Promise.all([
    db.from("site_orders").select("*").order("created_at", { ascending: false }).limit(500),
    ownerEmails(),
    db
      .from("site_events")
      .select("id", { count: "exact", head: true })
      .eq("type", "cta_click")
      .eq("path", CONSULTANT_PATH)
      .gte("created_at", since),
  ]);
  const orders = (ordersResult.data ?? []) as SiteOrder[];
  const ids = orders.map((o) => o.business_id);
  const [{ data: businessRows }, { data: pages }] = ids.length
    ? await Promise.all([
        db.from("businesses").select("*").in("id", ids),
        db.from("page_settings").select("business_id, whatsapp_number").in("business_id", ids),
      ])
    : [{ data: [] }, { data: [] }];
  const businesses = new Map(((businessRows ?? []) as Business[]).map((b) => [b.id, b]));
  const whatsapp = new Map(
    (pages ?? []).map((p) => [p.business_id as string, p.whatsapp_number as string | null]),
  );
  const now = new Date().getTime();
  const groups = [
    { key: "paid", title: "Para criar", items: orders.filter((o) => o.status === "paid") },
    {
      key: "awaiting_payment",
      title: "Aguardando pagamento",
      items: orders.filter((o) => o.status === "awaiting_payment"),
    },
    { key: "delivered", title: "Entregues", items: orders.filter((o) => o.status === "delivered") },
  ];
  // The ones to build first: closest deadline on top.
  groups[0]!.items.sort((a, b) => (a.due_at ?? "").localeCompare(b.due_at ?? ""));

  return (
    <>
      <h1 className="text-2xl font-bold">Sites a criar</h1>
      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Para criar" value={String(groups[0]!.items.length)} />
        <StatTile label="Aguardando pagamento" value={String(groups[1]!.items.length)} />
        <StatTile label="Entregues" value={String(groups[2]!.items.length)} />
        <StatTile
          label="Cliques no consultor (30 dias)"
          value={String(consultantResult.count ?? 0)}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Link da oferta: <code>meetchat.com.br/?criar=1&amp;oferta=site</code>
      </p>

      {groups.map((group) => (
        <AdminSection key={group.key} title={`${group.title} (${group.items.length})`}>
          {group.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-3 font-medium">Negócio</th>
                    <th className="py-2 pr-3 font-medium">Contato</th>
                    <th className="py-2 pr-3 font-medium">Domínio</th>
                    <th className="py-2 pr-3 font-medium">
                      {group.key === "delivered"
                        ? "Entregue"
                        : group.key === "paid"
                          ? "Entregar até"
                          : "Cadastro"}
                    </th>
                    <th className="py-2 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {group.items.map((order) => {
                    const business = businesses.get(order.business_id);
                    if (!business) return null;
                    const brand = getNiche(business.brand_key);
                    const late =
                      order.status === "paid" &&
                      order.due_at &&
                      new Date(order.due_at).getTime() - now < 6 * 3_600_000;
                    return (
                      <tr key={order.id} className="align-top">
                        <td className="py-2.5 pr-3">
                          <a
                            href={businessUrl(brand, `/${business.slug}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium hover:underline"
                          >
                            {business.name}
                          </a>
                          <span className="block text-xs text-muted-foreground">
                            {brand.niche?.name ?? "Outro / Geral"} · link do chat:{" "}
                            {businessUrl(brand, `/${business.slug}`)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-xs">
                          {emails.get(business.id) ?? "—"}
                          <span className="block">
                            {whatsapp.get(business.id) ?? "sem WhatsApp"}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3">
                          {order.wants_domain
                            ? (order.domain_name ?? "quer (nome a combinar)")
                            : "—"}
                        </td>
                        <td
                          className={`py-2.5 pr-3 whitespace-nowrap tabular-nums ${late ? "font-semibold text-destructive" : ""}`}
                        >
                          {group.key === "delivered"
                            ? when(order.delivered_at)
                            : group.key === "paid"
                              ? when(order.due_at)
                              : when(order.created_at)}
                        </td>
                        <td className="py-2.5">
                          {order.status !== "awaiting_payment" ? (
                            <SiteDeliveredButton
                              businessId={business.id}
                              delivered={order.status === "delivered"}
                            />
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </AdminSection>
      ))}
    </>
  );
}
