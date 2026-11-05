import Link from "next/link";

import type { CustomSiteOrder } from "@/lib/custom-site/paid";
import { formatBRL } from "@/lib/money";
import { createAdminClient } from "@/lib/supabase/admin";

import { AdminSection } from "../ui";
import { orderLate, orderStatus } from "./order-status";

const brDate = (iso: string | null) =>
  iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—";

/** Custom sites (2026-11-06): orders to make, with the promised date. */
export default async function AdminCustomSitesPage() {
  const { data } = await createAdminClient()
    .from("custom_site_orders")
    .select("*, business:businesses(name)")
    .is("cancelled_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  const orders = (data ?? []) as (CustomSiteOrder & { business: { name: string } | null })[];
  const todo = orders.filter((o) => o.paid_at && !o.finished_at);
  const rest = orders.filter((o) => !todo.includes(o));

  const list = (items: typeof orders) => (
    <ul className="divide-y">
      {items.map((order) => (
        <li key={order.id}>
          <Link
            href={`/admin/sites/${order.id}`}
            className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:bg-muted"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{order.business?.name ?? "—"}</span>
              <span className="block text-sm text-muted-foreground">
                {formatBRL(order.price_cents)} · entrega até {brDate(order.due_at)}
              </span>
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${orderLate(order) ? "bg-destructive text-destructive-foreground" : "bg-muted"}`}
            >
              {orderStatus(order)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <h1 className="text-2xl font-bold">Sites personalizados</h1>
      <AdminSection
        title={`Para fazer (${todo.length})`}
        description="Pagos. Em vermelho: falta menos de 1 dia para a data prometida."
      >
        {todo.length ? list(todo) : <p className="text-sm text-muted-foreground">Nenhum agora.</p>}
      </AdminSection>
      <AdminSection title="Outros pedidos">
        {rest.length ? list(rest) : <p className="text-sm text-muted-foreground">Nenhum.</p>}
      </AdminSection>
    </>
  );
}
