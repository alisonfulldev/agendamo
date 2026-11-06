import "server-only";

import { randomBytes } from "node:crypto";

import { getNiche } from "@/brands";
import { audit } from "@/lib/audit";
import { subscribePlan, type PixCharge } from "@/lib/billing/service";
import { DEFAULT_HOURS } from "@/lib/business/schemas";
import { checkSlug } from "@/lib/business/slug-check";
import type { Business, SiteTemplate, WebTemplate } from "@/lib/db/types";
import { PLAN_PRICES, type Cycle, type Tier } from "@/lib/plans";
import { slugify } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";

/** A WhatsApp sale (assisted_sales row). */
export interface AssistedSale {
  id: string;
  business_id: string;
  seller_id: string | null;
  token: string;
  tier: Tier;
  cycle: Cycle;
  value_cents: number;
  payer_name: string;
  payer_email: string;
  payer_whatsapp: string | null;
  status: "awaiting_payment" | "paid" | "cancelled";
  /** "admin": Admin › Vendas; "chat": the sales chat (/conheca). */
  source: "admin" | "chat";
  /** The chat logged the owner in right after paying (once). */
  auto_login_at: string | null;
  pix_payload: string | null;
  pix_image: string | null;
  pix_expires_at: string | null;
  coupon_code: string | null;
  domain: string | null;
  domain_cents: number;
  created_at: string;
  paid_at: string | null;
}

export interface NewSaleInput {
  businessName: string;
  nicheKey: string;
  payerName: string;
  email: string;
  whatsapp: string | null;
  cpfCnpj: string;
  tier: Tier;
  cycle: Cycle;
  template: SiteTemplate | WebTemplate;
  /** "Site ou Loja" (tier "web"): a site or a store, without booking. Absent: booking. */
  product?: "site" | "store";
  couponCode: string | null;
  /** Own .br domain (first year in the first Pix). */
  domain: string | null;
  /** Custom site (its creation in the first Pix; the customer fills the briefing in the panel). */
  customSite: boolean;
}

export type NewSaleResult =
  | { ok: true; saleId: string; token: string }
  | {
      ok: false;
      error: "has_business" | "has_account" | "coupon_invalid" | "domain_taken" | "failed";
    };

/** The custom site's creation: R$ 148 with "Site + Agenda", R$ 197 with "Site ou Loja". */
function customSitePrice(tier: AssistedSale["tier"]): number {
  return tier === "web" ? PLAN_PRICES.webCustomSite : PLAN_PRICES.customSite;
}

async function freeSlug(name: string): Promise<string> {
  const base = slugify(name) || "minha-agenda";
  const check = await checkSlug(base.length >= 3 ? base : `${base}-agenda`);
  if (check.available) return base;
  if (check.suggestion) return check.suggestion;
  return `${base.slice(0, 30)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * The person's account: created when the e-mail is new, else the existing one. `newOnly` (the
 * sales chat, where nobody checked the e-mail): an existing account is never used, so paying with
 * someone else's e-mail never opens their account.
 */
async function accountFor(
  email: string,
  newOnly = false,
): Promise<{ id: string } | { error: "has_account" | "failed" }> {
  const admin = createAdminClient();
  const { data: exists } = await admin.rpc("email_has_account", { p_email: email });
  if (exists && newOnly) return { error: "has_account" };
  if (!exists) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { password_set: false },
    });
    if (error || !data.user) {
      console.error("sale createUser failed", error?.message);
      return { error: "failed" };
    }
    return { id: data.user.id };
  }
  // The link is never sent: it only returns the existing user.
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.user) {
    console.error("sale user lookup failed", error?.message);
    return { error: "failed" };
  }
  return { id: data.user.id };
}

const PIX_FIELDS = (pix: PixCharge) => ({
  pix_payload: pix.payload,
  pix_image: pix.image,
  pix_expires_at: pix.expiresAt,
});

/**
 * Sale closed in the WhatsApp chat (2026-11-06): the admin creates the account and the business
 * (niche services and default hours, the chosen site template), with no trial, and the Pix of the
 * first payment (Pix Automático: paying it also authorizes the next ones). The business stays in
 * waiting mode until it is paid; the payment releases it (completeAssistedSale).
 */
export async function createAssistedSale(
  input: NewSaleInput,
  /** Admin who sold it; null = the sales chat (/conheca), only for a new e-mail. */
  seller: { id: string; email: string } | null,
): Promise<NewSaleResult> {
  const admin = createAdminClient();
  const email = input.email.trim().toLowerCase();
  if (input.domain) {
    const { data: used } = await admin
      .from("custom_domains")
      .select("id")
      .eq("domain", input.domain)
      .maybeSingle();
    if (used) return { ok: false, error: "domain_taken" };
  }
  const account = await accountFor(email, !seller);
  if ("error" in account) return { ok: false, error: account.error };
  const userId = account.id;
  // Who did it, in the audit log: the admin, or the new owner herself in the chat.
  const actor = seller ?? { id: userId, email };
  const via = seller ? "whatsapp_sale" : "sales_chat";

  const { data: membership } = await admin
    .from("members")
    .select("business_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (membership) return { ok: false, error: "has_business" };

  const niche = getNiche(input.nicheKey);
  const slug = await freeSlug(input.businessName);
  const { error } = await admin.rpc("create_business", {
    p_user_id: userId,
    p_payload: {
      name: input.businessName,
      slug,
      brand_key: niche.key,
      segment: niche.defaultSegment,
      timezone: "America/Sao_Paulo",
      page: { whatsapp_number: input.whatsapp },
      services: niche.suggestedServices.map((s) => ({
        name: s.name,
        duration_minutes: s.durationMinutes,
        price_cents: 0,
      })),
      hours: DEFAULT_HOURS.map((h) => ({
        weekday: h.weekday,
        start_time: h.start,
        end_time: h.end,
      })),
    },
  });
  if (error) {
    console.error("create_business (sale) failed", error.message);
    return { ok: false, error: "failed" };
  }
  const { data: created } = await admin.from("businesses").select("*").eq("slug", slug).single();
  const business = created as Business;
  if (input.product) {
    // "Site ou Loja": no booking services (create_business asks for them; removed right away).
    await admin.from("services").delete().eq("business_id", business.id);
    await admin.from("businesses").update({ product: input.product }).eq("id", business.id);
    business.product = input.product;
  }
  await admin.from("site_settings").upsert({
    business_id: business.id,
    template: input.template,
    updated_at: new Date().toISOString(),
  });
  if (input.domain) {
    await admin.from("custom_domains").insert({
      business_id: business.id,
      domain: input.domain,
      verified: false,
      status: "awaiting_payment",
    });
  }
  // First access opens the panel tutorial, like any new booking account.
  if (!input.product) {
    await admin.auth.admin.updateUserById(userId, { user_metadata: { tour_pending: true } });
  }
  await audit({
    businessId: business.id,
    userId: actor.id,
    action: "business.created",
    details: { via, by: actor.email },
  });

  let pix: PixCharge;
  try {
    const result = await subscribePlan({
      business,
      brand: niche,
      userId: actor.id,
      cycle: input.cycle,
      extraProfessionals: 0,
      tier: input.tier,
      payer: { name: input.payerName, cpfCnpj: input.cpfCnpj, email },
      couponCode: input.couponCode,
      firstExtraCents:
        (input.domain ? PLAN_PRICES.domainYearly : 0) +
        (input.customSite ? customSitePrice(input.tier) : 0),
    });
    if (result.kind !== "pix") throw new Error("unexpected_change");
    pix = result.pix;
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "";
    console.error("sale subscribe failed", message.slice(0, 120));
    // The business stays (in waiting mode); a new attempt from the sale screen can bill it.
    return { ok: false, error: message === "coupon_invalid" ? "coupon_invalid" : "failed" };
  }

  const saleToken = randomBytes(24).toString("base64url");
  const { data: sale, error: saleError } = await admin
    .from("assisted_sales")
    .insert({
      business_id: business.id,
      seller_id: seller?.id ?? null,
      source: seller ? "admin" : "chat",
      token: saleToken,
      tier: input.tier,
      cycle: input.cycle,
      value_cents: pix.valueCents,
      payer_name: input.payerName,
      payer_email: email,
      payer_whatsapp: input.whatsapp,
      coupon_code: input.couponCode,
      domain: input.domain,
      domain_cents: input.domain ? PLAN_PRICES.domainYearly : 0,
      ...PIX_FIELDS(pix),
    })
    .select("id")
    .single();
  if (saleError || !sale) {
    console.error("assisted sale insert failed", saleError?.message);
    return { ok: false, error: "failed" };
  }
  if (input.customSite) {
    // Paid with the first payment (markPlanOrderPaid); the briefing comes from the panel.
    await admin.from("custom_site_orders").insert({
      business_id: business.id,
      payment_kind: "with_plan",
      price_cents: PLAN_PRICES[input.tier].monthly + customSitePrice(input.tier),
      pix_payload: pix.payload,
      pix_expires_at: pix.expiresAt,
    });
  }
  await audit({
    businessId: business.id,
    userId: actor.id,
    action: seller ? "admin.sale_created" : "sale.chat_created",
    details: {
      tier: input.tier,
      cycle: input.cycle,
      value_cents: pix.valueCents,
      by: actor.email,
    },
  });
  return { ok: true, saleId: sale.id as string, token: saleToken };
}

/** New Pix for a sale whose Pix expired (same plan, same coupon; the payer is already known). */
export async function renewSalePix(
  saleId: string,
  /** Admin who asked for it; null = the sales chat (the sale's own owner). */
  seller: { id: string; email: string } | null,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("assisted_sales")
    .select("*")
    .eq("id", saleId)
    .maybeSingle();
  const sale = row as AssistedSale | null;
  if (!sale || sale.status !== "awaiting_payment") return false;
  const { data: business } = await admin
    .from("businesses")
    .select("*")
    .eq("id", sale.business_id)
    .single();
  // A custom site sold with it: its creation goes in the new Pix too.
  const { data: order } = await admin
    .from("custom_site_orders")
    .select("id")
    .eq("business_id", sale.business_id)
    .eq("payment_kind", "with_plan")
    .is("paid_at", null)
    .is("cancelled_at", null)
    .maybeSingle();
  const result = await subscribePlan({
    business: business as Business,
    brand: getNiche((business as Business).brand_key),
    userId: seller?.id ?? (await ownerOf(sale.business_id)) ?? "",
    cycle: sale.cycle,
    extraProfessionals: 0,
    tier: sale.tier,
    // The Asaas customer already exists: its document is not asked again.
    payer: { name: sale.payer_name, cpfCnpj: "", email: sale.payer_email },
    couponCode: sale.coupon_code,
    firstExtraCents: sale.domain_cents + (order ? customSitePrice(sale.tier) : 0),
  });
  if (result.kind !== "pix") return false;
  if (order) {
    await admin
      .from("custom_site_orders")
      .update({ pix_payload: result.pix.payload, pix_expires_at: result.pix.expiresAt })
      .eq("id", order.id);
  }
  await admin
    .from("assisted_sales")
    .update({ value_cents: result.pix.valueCents, ...PIX_FIELDS(result.pix) })
    .eq("id", sale.id);
  return true;
}

/** Owner of a business (the sales chat renews the Pix in her name). */
async function ownerOf(businessId: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .from("members")
    .select("user_id")
    .eq("business_id", businessId)
    .eq("role", "owner")
    .maybeSingle();
  return (data?.user_id as string | undefined) ?? null;
}

/** The Pix of an unpaid sale can no longer be paid (none yet, or past its 24 h). */
export function pixExpired(
  sale: Pick<AssistedSale, "status" | "pix_payload" | "pix_expires_at">,
  now = Date.now(),
): boolean {
  if (sale.status !== "awaiting_payment") return false;
  return (
    !sale.pix_payload || (sale.pix_expires_at !== null && Date.parse(sale.pix_expires_at) < now)
  );
}

/** The sale of a payment-page token (public page /pagar/<token>). */
export async function saleByToken(
  token: string,
): Promise<(AssistedSale & { business: Pick<Business, "name" | "slug" | "brand_key"> }) | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const { data } = await createAdminClient()
    .from("assisted_sales")
    .select("*, business:businesses(name, slug, brand_key)")
    .eq("token", token)
    .maybeSingle();
  return (
    (data as (AssistedSale & { business: Pick<Business, "name" | "slug" | "brand_key"> }) | null) ??
    null
  );
}
