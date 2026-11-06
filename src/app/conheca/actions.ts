"use server";

import { z } from "zod";

import { NICHES } from "@/brands";
import { getNiche } from "@/brands";
import { businessUrl } from "@/brands/urls";
import { audit } from "@/lib/audit";
import { EMAIL_PATTERN } from "@/lib/email-typos";
import { normalizeBrPhone } from "@/lib/phone";
import { validCnpj, validCpf } from "@/lib/pix";
import { rateLimitRequest } from "@/lib/rate-limit";
import { createAssistedSale, pixExpired, renewSalePix, saleByToken } from "@/lib/sales/assisted";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Sales chat (/conheca, 2026-11-07): the person who arrived on the WhatsApp buys by herself. The
 * same sale as Admin › Vendas, with no seller and only for a new e-mail; the sale token stays in
 * her browser and is the only key to its status and to the one-time panel login after paying.
 */

const digits = (v: string) => v.replace(/\D/g, "");
const nicheKeys: [string, ...string[]] = ["general", ...NICHES.map((b) => b.key)];
const token = z.string().regex(/^[A-Za-z0-9_-]{20,64}$/);

const startSchema = z.object({
  businessName: z.string().trim().min(2).max(80),
  nicheKey: z.enum(nicheKeys),
  payerName: z.string().trim().min(3).max(120),
  email: z.string().trim().toLowerCase().max(254).regex(EMAIL_PATTERN),
  whatsapp: z
    .string()
    .trim()
    .max(30)
    .transform((v, ctx) => {
      const phone = normalizeBrPhone(v);
      if (!phone) {
        ctx.addIssue({ code: "custom", message: "phone" });
        return z.NEVER;
      }
      return phone;
    }),
  cpfCnpj: z.string().transform((v, ctx) => {
    const value = digits(v);
    if (!(validCpf(value) || validCnpj(value))) {
      ctx.addIssue({ code: "custom", message: "document" });
      return z.NEVER;
    }
    return value;
  }),
  tier: z.enum(["complete", "site"]),
  cycle: z.enum(["monthly", "yearly"]),
  template: z.enum(["vibrant", "elegant"]),
  acceptedTerms: z.literal(true),
});

export type ChatSaleError = "invalid" | "has_account" | "has_business" | "limit" | "failed";

export interface ChatPix {
  payload: string;
  image: string;
  valueCents: number;
  expiresAt: string | null;
}

export type StartChatSaleResult =
  { ok: true; token: string; pix: ChatPix } | { ok: false; error: ChatSaleError };

/** Creates the account, the business (waiting mode until paid) and the Pix of the first payment. */
export async function startChatSaleAction(input: unknown): Promise<StartChatSaleResult> {
  const parsed = startSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;
  if (!(await rateLimitRequest("chatSale", `email:${data.email}`))) {
    return { ok: false, error: "limit" };
  }
  const result = await createAssistedSale(
    {
      businessName: data.businessName,
      nicheKey: data.nicheKey,
      payerName: data.payerName,
      email: data.email,
      whatsapp: data.whatsapp,
      cpfCnpj: data.cpfCnpj,
      tier: data.tier,
      cycle: data.cycle,
      template: data.template,
      couponCode: null,
      domain: null,
      customSite: false,
    },
    null,
  ).catch((error) => {
    console.error("chat sale failed", error instanceof Error ? error.message.slice(0, 120) : "");
    return { ok: false as const, error: "failed" as const };
  });
  if (!result.ok) {
    const error = result.error;
    return {
      ok: false,
      error: error === "has_account" || error === "has_business" ? error : "failed",
    };
  }
  const sale = await saleByToken(result.token);
  if (!sale?.pix_payload || !sale.pix_image) return { ok: false, error: "failed" };
  return {
    ok: true,
    token: result.token,
    pix: {
      payload: sale.pix_payload,
      image: sale.pix_image,
      valueCents: sale.value_cents,
      expiresAt: sale.pix_expires_at,
    },
  };
}

export type ChatSaleStatus =
  | { status: "awaiting_payment"; expired: boolean; pix: ChatPix | null }
  | { status: "paid"; chatUrl: string; siteUrl: string | null; email: string }
  | { status: "unknown" };

/** Payment status of the chat's sale (polled while the Pix is shown). */
export async function chatSaleStatusAction(rawToken: unknown): Promise<ChatSaleStatus> {
  const parsed = token.safeParse(rawToken);
  if (!parsed.success) return { status: "unknown" };
  if (!(await rateLimitRequest("chatSaleStatus"))) return { status: "unknown" };
  const sale = await saleByToken(parsed.data);
  if (!sale || sale.source !== "chat" || sale.status === "cancelled") return { status: "unknown" };
  if (sale.status === "paid") {
    const brand = getNiche(sale.business.brand_key);
    return {
      status: "paid",
      chatUrl: businessUrl(brand, `/${sale.business.slug}`),
      // "Site ou Loja": the business link is the site itself.
      siteUrl:
        sale.tier === "site"
          ? businessUrl(brand, `/${sale.business.slug}/site`)
          : sale.tier === "web"
            ? businessUrl(brand, `/${sale.business.slug}`)
            : null,
      email: sale.payer_email,
    };
  }
  return {
    status: "awaiting_payment",
    expired: pixExpired(sale),
    pix:
      sale.pix_payload && sale.pix_image
        ? {
            payload: sale.pix_payload,
            image: sale.pix_image,
            valueCents: sale.value_cents,
            expiresAt: sale.pix_expires_at,
          }
        : null,
  };
}

/** A new Pix when the previous one expired (24 h). */
export async function renewChatSalePixAction(rawToken: unknown): Promise<ChatSaleStatus> {
  const parsed = token.safeParse(rawToken);
  if (!parsed.success) return { status: "unknown" };
  if (!(await rateLimitRequest("chatSale"))) return { status: "unknown" };
  const sale = await saleByToken(parsed.data);
  if (!sale || sale.source !== "chat" || !pixExpired(sale)) return chatSaleStatusAction(rawToken);
  await renewSalePix(sale.id, null).catch((error) =>
    console.error(
      "chat sale renew failed",
      error instanceof Error ? error.message.slice(0, 120) : "",
    ),
  );
  return chatSaleStatusAction(rawToken);
}

/** How long after paying the chat can still log the owner in directly. */
const AUTO_LOGIN_HOURS = 24;

/**
 * "Entrar no painel" right after paying: logs the new owner in on this device, once. Only for a
 * chat sale (its account was created by it, for a new e-mail) paid in the last 24 hours.
 */
export async function enterPanelAction(rawToken: unknown): Promise<{ ok: boolean }> {
  const parsed = token.safeParse(rawToken);
  if (!parsed.success) return { ok: false };
  if (!(await rateLimitRequest("chatSaleStatus"))) return { ok: false };
  const sale = await saleByToken(parsed.data);
  if (
    !sale ||
    sale.source !== "chat" ||
    sale.status !== "paid" ||
    sale.auto_login_at ||
    !sale.paid_at ||
    Date.now() - Date.parse(sale.paid_at) > AUTO_LOGIN_HOURS * 60 * 60 * 1000
  ) {
    return { ok: false };
  }
  const admin = createAdminClient();
  // Claimed first, so two taps never open two sessions.
  const { data: claimed } = await admin
    .from("assisted_sales")
    .update({ auto_login_at: new Date().toISOString() })
    .eq("id", sale.id)
    .is("auto_login_at", null)
    .select("id");
  if (!claimed?.length) return { ok: false };

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: sale.payer_email,
  });
  const hashed = data?.properties?.hashed_token;
  if (error || !hashed) {
    console.error("chat sale login link failed", error?.message);
    return { ok: false };
  }
  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: hashed,
    type: "magiclink",
  });
  if (verifyError) {
    console.error("chat sale login failed", verifyError.message);
    return { ok: false };
  }
  await audit({
    businessId: sale.business_id,
    userId: data.user?.id ?? null,
    action: "sale.chat_login",
    details: {},
  });
  return { ok: true };
}
