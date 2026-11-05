import "server-only";

import { PLATFORM } from "@/brands";
import { sendEmail } from "@/lib/email/send";
import { getServerEnv } from "@/lib/env";
import { siteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";

import type { Briefing } from "./briefing";

export interface CustomSiteOrder {
  id: string;
  business_id: string;
  briefing: Briefing;
  briefing_sent_at: string | null;
  payment_kind: "with_plan" | "single";
  price_cents: number;
  payment_id: string | null;
  pix_payload: string | null;
  pix_image: string | null;
  pix_expires_at: string | null;
  paid_at: string | null;
  due_at: string | null;
  delivered_at: string | null;
  adjustment_text: string | null;
  adjustment_requested_at: string | null;
  finished_at: string | null;
  cancelled_at: string | null;
  created_at: string;
}

/** Delivery promise: 5 business days (Monday to Friday; holidays are not counted). */
export function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from);
  let left = days;
  while (left > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) left--;
  }
  return date;
}

export const DELIVERY_BUSINESS_DAYS = 5;

/** The open order of a business (not finished nor cancelled), if any. */
export async function openOrderOf(businessId: string): Promise<CustomSiteOrder | null> {
  const { data } = await createAdminClient()
    .from("custom_site_orders")
    .select("*")
    .eq("business_id", businessId)
    .is("finished_at", null)
    .is("cancelled_at", null)
    .maybeSingle();
  return (data as CustomSiteOrder | null) ?? null;
}

async function notifyAdmins(subject: string, heading: string, paragraphs: string[], path: string) {
  const admins = getServerEnv().ADMIN_EMAILS;
  if (!admins.length) return;
  await sendEmail({
    brand: PLATFORM,
    to: admins,
    subject,
    content: { heading, paragraphs, cta: { label: "Abrir no admin", url: siteUrl(path) } },
  }).catch((error) => console.error("custom site admin e-mail failed", error));
}

/**
 * With both the payment and the briefing, the order goes into production: the deadline starts and
 * the admins are told. Called when either one arrives last. Idempotent (due_at set once).
 */
export async function startProductionIfReady(orderId: string): Promise<void> {
  const admin = createAdminClient();
  const due = addBusinessDays(new Date(), DELIVERY_BUSINESS_DAYS).toISOString();
  const { data } = await admin
    .from("custom_site_orders")
    .update({ due_at: due, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .not("paid_at", "is", null)
    .not("briefing_sent_at", "is", null)
    .is("due_at", null)
    .select("id, business:businesses(name)");
  const row = data?.[0] as { id: string; business: { name: string } } | undefined;
  if (!row) return;
  await notifyAdmins(
    `Novo site personalizado: ${row.business.name}`,
    "Novo site personalizado para fazer 🎨",
    [
      `${row.business.name} pagou e mandou o briefing.`,
      `Entrega prometida: até ${due.slice(0, 10).split("-").reverse().join("/")} (${DELIVERY_BUSINESS_DAYS} dias úteis).`,
    ],
    `/admin/sites/${row.id}`,
  );
}

async function markPaid(filter: { column: string; value: string }[]): Promise<number> {
  let query = createAdminClient()
    .from("custom_site_orders")
    .update({ paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .is("paid_at", null)
    .is("cancelled_at", null);
  for (const f of filter) query = query.eq(f.column, f.value);
  const { data } = await query.select("id");
  for (const row of data ?? []) await startProductionIfReady(row.id as string);
  return data?.length ?? 0;
}

/**
 * First payment of the subscription arrived: an open "with_plan" order whose Pix was the one paid
 * (pix_payload set when it was started) is paid too.
 */
export async function markPlanOrderPaid(businessId: string): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("custom_site_orders")
    .select("id")
    .eq("business_id", businessId)
    .eq("payment_kind", "with_plan")
    .not("pix_payload", "is", null)
    .is("paid_at", null)
    .is("cancelled_at", null)
    .maybeSingle();
  if (data) await markPaid([{ column: "id", value: data.id as string }]);
}

/** One-off Pix of a subscriber's order paid (Asaas payment without subscription). */
export async function markSingleOrderPaid(paymentId: string): Promise<boolean> {
  return (await markPaid([{ column: "payment_id", value: paymentId }])) > 0;
}

/** The plan was paid without this order (a normal checkout): its Pix no longer counts. */
export async function forgetPlanOrderPix(businessId: string): Promise<void> {
  await createAdminClient()
    .from("custom_site_orders")
    .update({ pix_payload: null, pix_image: null, pix_expires_at: null })
    .eq("business_id", businessId)
    .eq("payment_kind", "with_plan")
    .is("paid_at", null);
}

export { notifyAdmins as notifyCustomSiteAdmins };

/** The order's Pix can still be paid (generated and not past its expiration). */
export function orderPixValid(
  order: Pick<CustomSiteOrder, "pix_payload" | "pix_expires_at">,
  now = Date.now(),
): boolean {
  return Boolean(
    order.pix_payload && (!order.pix_expires_at || Date.parse(order.pix_expires_at) > now),
  );
}
