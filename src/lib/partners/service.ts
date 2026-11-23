import "server-only";

import { cookies } from "next/headers";

import { audit } from "@/lib/audit";
import { decrypt } from "@/lib/crypto";
import { PLAN_PRICES } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { claimHash } from "@/lib/trial";

import {
  HOLD_DAYS,
  PARTNER_COOKIE,
  balanceOf,
  commissionFor,
  isPartnerCode,
  type Balance,
} from "./rules";

export interface Partner {
  id: string;
  user_id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  cpf_encrypted: string;
  pix_key_encrypted: string;
  email_hash: string;
  phone_hash: string | null;
  cpf_hash: string;
  status: "active" | "blocked";
  created_at: string;
}

export async function partnerOfUser(userId: string): Promise<Partner | null> {
  const { data } = await createAdminClient()
    .from("partners")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as Partner | null) ?? null;
}

async function activePartnerByCode(code: string): Promise<Partner | null> {
  const { data } = await createAdminClient()
    .from("partners")
    .select("*")
    .eq("code", code)
    .eq("status", "active")
    .maybeSingle();
  return (data as Partner | null) ?? null;
}

/** Same person as the partner (own account): never earns a commission. */
function isSelf(
  partner: Partner,
  identity: { userId?: string | null; email?: string | null; phone?: string | null },
): boolean {
  if (identity.userId && identity.userId === partner.user_id) return true;
  const email = identity.email ? claimHash("email", identity.email) : null;
  if (email && email === partner.email_hash) return true;
  const phone = identity.phone ? claimHash("phone", identity.phone) : null;
  return Boolean(phone && partner.phone_hash && phone === partner.phone_hash);
}

/**
 * Links a new business to the partner whose link the person visited (cookie set by the proxy).
 * Never fails the sign-up: errors are only logged.
 */
export async function attachPartnerFromCookie(
  businessId: string,
  identity: { userId?: string | null; email?: string | null; phone?: string | null },
): Promise<void> {
  try {
    const code = (await cookies()).get(PARTNER_COOKIE)?.value;
    if (!isPartnerCode(code)) return;
    const partner = await activePartnerByCode(code);
    if (!partner || isSelf(partner, identity)) return;
    await createAdminClient()
      .from("businesses")
      .update({ partner_id: partner.id, partner_attributed_at: new Date().toISOString() })
      .eq("id", businessId)
      .is("partner_id", null);
  } catch (error) {
    console.error("partner attribution failed", error);
  }
}

/**
 * Commission of a confirmed plan payment of a business that came through a partner: the first
 * payment (up to one month) and 20% of the next ones. Idempotent by the Asaas payment id.
 */
export async function recordPartnerCommission(input: {
  businessId: string;
  paymentId: string;
  paymentCents: number;
}): Promise<void> {
  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, partner_id, plan_tier")
    .eq("id", input.businessId)
    .maybeSingle();
  if (!business?.partner_id || input.paymentCents <= 0) return;
  const { data: partnerRow } = await admin
    .from("partners")
    .select("*")
    .eq("id", business.partner_id)
    .maybeSingle();
  const partner = partnerRow as Partner | null;
  if (!partner || partner.status !== "active") return;

  // The partner's own CPF, e-mail or phone used in this account: no commission.
  const { data: claims } = await admin
    .from("trial_claims")
    .select("value_hash")
    .eq("business_id", input.businessId);
  const ownHashes = new Set([partner.cpf_hash, partner.email_hash, partner.phone_hash]);
  if ((claims ?? []).some((c) => ownHashes.has(c.value_hash as string))) return;

  const { count } = await admin
    .from("partner_commissions")
    .select("id", { count: "exact", head: true })
    .eq("business_id", input.businessId)
    .neq("status", "cancelled");
  const first = (count ?? 0) === 0;
  const tier = (business.plan_tier as keyof typeof PLAN_PRICES | null) ?? "complete";
  const monthly = PLAN_PRICES[tier === "site" || tier === "web" ? tier : "complete"].monthly;
  const amount = commissionFor({
    paymentCents: input.paymentCents,
    monthlyPriceCents: monthly,
    first,
  });
  const { error } = await admin.from("partner_commissions").upsert(
    {
      partner_id: partner.id,
      business_id: input.businessId,
      provider_payment_id: input.paymentId,
      kind: first ? "first" : "recurring",
      payment_cents: Math.round(input.paymentCents),
      amount_cents: amount,
      available_at: new Date(Date.now() + HOLD_DAYS * 86_400_000).toISOString(),
    },
    { onConflict: "provider_payment_id", ignoreDuplicates: true },
  );
  if (error) console.error("partner commission failed", error.message);
}

/** Refund or chargeback of the client's payment: the commission is not paid. */
export async function cancelPartnerCommission(paymentId: string): Promise<void> {
  await createAdminClient()
    .from("partner_commissions")
    .update({ status: "cancelled" })
    .eq("provider_payment_id", paymentId)
    .eq("status", "pending");
}

export interface CommissionRow {
  id: string;
  business_id: string;
  kind: "first" | "recurring";
  payment_cents: number;
  amount_cents: number;
  status: "pending" | "paid" | "cancelled";
  available_at: string;
  created_at: string;
}

export async function partnerCommissions(partnerId: string): Promise<CommissionRow[]> {
  const { data } = await createAdminClient()
    .from("partner_commissions")
    .select("id, business_id, kind, payment_cents, amount_cents, status, available_at, created_at")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });
  return (data ?? []) as CommissionRow[];
}

export async function partnerBalance(partnerId: string): Promise<Balance> {
  return balanceOf(await partnerCommissions(partnerId));
}

/** Records the Pix the admin sent: every available commission becomes paid. */
export async function payPartner(
  partnerId: string,
  adminUserId: string,
): Promise<{ ok: true; amountCents: number } | { ok: false }> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data: rows } = await admin
    .from("partner_commissions")
    .select("id, amount_cents")
    .eq("partner_id", partnerId)
    .eq("status", "pending")
    .lte("available_at", now);
  const amount = (rows ?? []).reduce((sum, r) => sum + (r.amount_cents as number), 0);
  if (!rows?.length || amount <= 0) return { ok: false };
  const { data: payout, error } = await admin
    .from("partner_payouts")
    .insert({ partner_id: partnerId, amount_cents: amount, paid_by: adminUserId })
    .select("id")
    .single();
  if (error || !payout) throw new Error(`partner payout failed: ${error?.message}`);
  await admin
    .from("partner_commissions")
    .update({ status: "paid", payout_id: payout.id })
    .in(
      "id",
      rows.map((r) => r.id as string),
    )
    .eq("status", "pending");
  await audit({
    businessId: null,
    userId: adminUserId,
    action: "admin.partner_paid",
    details: { partner_id: partnerId, amount_cents: amount, payout_id: payout.id },
  });
  return { ok: true, amountCents: amount };
}

export function partnerPixKey(partner: Pick<Partner, "pix_key_encrypted">): string {
  try {
    return decrypt(partner.pix_key_encrypted);
  } catch {
    return "(não foi possível ler)";
  }
}
