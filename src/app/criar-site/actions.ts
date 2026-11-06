"use server";

import { z } from "zod";

import { EMAIL_PATTERN } from "@/lib/email-typos";
import { normalizeBrPhone } from "@/lib/phone";
import { validCnpj, validCpf } from "@/lib/pix";
import { rateLimitRequest } from "@/lib/rate-limit";
import { WEB_SITE_TEMPLATES, WEB_STORE_TEMPLATES } from "@/lib/db/types";
import { createAssistedSale, saleByToken } from "@/lib/sales/assisted";

import type { ChatPix, StartChatSaleResult } from "../conheca/actions";

/**
 * Sales chat of "Site ou Loja" (/criar-site, 2026-11-07): the same sale as /conheca (no seller,
 * only a new e-mail, the token stays in the browser), for a site or a store on the "web" plan,
 * optionally with the custom site made by a person (R$ 197 in the first Pix).
 */

const digits = (v: string) => v.replace(/\D/g, "");

const schema = z
  .object({
    product: z.enum(["site", "store"]),
    template: z.enum([...WEB_SITE_TEMPLATES, ...WEB_STORE_TEMPLATES]),
    customSite: z.boolean(),
    businessName: z.string().trim().min(2).max(80),
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
    cycle: z.enum(["monthly", "yearly"]),
    acceptedTerms: z.literal(true),
  })
  .refine((data) =>
    (data.product === "store"
      ? (WEB_STORE_TEMPLATES as readonly string[])
      : (WEB_SITE_TEMPLATES as readonly string[])
    ).includes(data.template),
  );

/** Creates the account, the site or store (waiting mode until paid) and the first Pix. */
export async function startWebSaleAction(input: unknown): Promise<StartChatSaleResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;
  if (!(await rateLimitRequest("chatSale", `email:${data.email}`))) {
    return { ok: false, error: "limit" };
  }
  const result = await createAssistedSale(
    {
      businessName: data.businessName,
      // Any business: the generic niche (texts and examples are the product's own).
      nicheKey: "general",
      payerName: data.payerName,
      email: data.email,
      whatsapp: data.whatsapp,
      cpfCnpj: data.cpfCnpj,
      tier: "web",
      cycle: data.cycle,
      template: data.template,
      product: data.product,
      couponCode: null,
      domain: null,
      customSite: data.customSite,
    },
    null,
  ).catch((error) => {
    console.error("web sale failed", error instanceof Error ? error.message.slice(0, 120) : "");
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
  const pix: ChatPix = {
    payload: sale.pix_payload,
    image: sale.pix_image,
    valueCents: sale.value_cents,
    expiresAt: sale.pix_expires_at,
  };
  return { ok: true, token: result.token, pix };
}
