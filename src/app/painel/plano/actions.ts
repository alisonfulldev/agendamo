"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AsaasError, isAsaasConfigured } from "@/lib/billing/asaas";
import {
  cancelAddon,
  cancelPlan,
  changePaymentMethod,
  pendingPix,
  subscribeAddon,
  subscribePlan,
  type PixCharge,
} from "@/lib/billing/service";
import { requireOwner } from "@/lib/business/context";
import { validCnpj, validCpf } from "@/lib/pix";
import { getClientIp, rateLimitRequest } from "@/lib/rate-limit";
import { paidPlanOf } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { startTrial } from "@/lib/trial";

/*
 * Own checkout: card data goes from this server straight to Asaas (tokenization) and is never
 * stored, logged or returned. Errors are mapped to friendly messages without the input.
 */

const digits = (v: string) => v.replace(/\D/g, "");

const payerSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome completo ou a razão social").max(120),
  cpfCnpj: z.string().transform((v, ctx) => {
    const value = digits(v);
    if (!(validCpf(value) || validCnpj(value))) {
      ctx.addIssue({ code: "custom", message: "CPF ou CNPJ inválido" });
      return z.NEVER;
    }
    return value;
  }),
});

function luhn(number: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = number.length - 1; i >= 0; i--) {
    let d = Number(number[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

const cardSchema = z.object({
  holderName: z.string().trim().min(3, "Nome como está no cartão").max(80),
  number: z
    .string()
    .transform(digits)
    .refine((v) => v.length >= 13 && v.length <= 19 && luhn(v), "Número do cartão inválido"),
  expiry: z.string().transform((v, ctx) => {
    const match = /^(\d{2})\s*\/\s*(\d{2}|\d{4})$/.exec(v.trim());
    const month = match ? Number(match[1]) : 0;
    const year = match ? Number(match[2]!.length === 2 ? `20${match[2]}` : match[2]) : 0;
    const now = new Date();
    const expired =
      year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1);
    if (!match || month < 1 || month > 12 || expired) {
      ctx.addIssue({ code: "custom", message: "Validade inválida (MM/AA)" });
      return z.NEVER;
    }
    return { month: String(month).padStart(2, "0"), year: String(year) };
  }),
  ccv: z.string().regex(/^\d{3,4}$/, "Código de segurança inválido"),
  postalCode: z
    .string()
    .transform(digits)
    .refine((v) => v.length === 8, "CEP inválido"),
  addressNumber: z.string().trim().min(1, "Número do endereço").max(10),
  phone: z
    .string()
    .transform(digits)
    .refine((v) => v.length >= 10 && v.length <= 11, "Telefone com DDD"),
});

function cardPayment(card: z.infer<typeof cardSchema>) {
  return {
    card: {
      holderName: card.holderName,
      number: card.number,
      expiryMonth: card.expiry.month,
      expiryYear: card.expiry.year,
      ccv: card.ccv,
    },
    holder: { postalCode: card.postalCode, addressNumber: card.addressNumber, phone: card.phone },
  };
}

export type CheckoutResult =
  | { ok: true; kind: "changed" | "card" | "method_changed"; message: string }
  | { ok: true; kind: "pix"; pix: PixCharge; message: string }
  | { ok: false; message: string };

function billingError(error: unknown): { ok: false; message: string } {
  if (error instanceof Error && error.message === "coupon_invalid")
    return { ok: false, message: "Cupom inválido ou esgotado." };
  if (error instanceof Error && error.message === "featured_exists")
    return { ok: false, message: "Você já tem Destaque nessa cidade." };
  if (error instanceof Error && error.message === "no_plan")
    return { ok: false, message: "Assine antes de contratar adicionais." };
  if (error instanceof AsaasError)
    return { ok: false, message: `Não foi possível concluir o pagamento: ${error.message}` };
  console.error("billing failed", error instanceof Error ? error.message : "unknown error");
  return { ok: false, message: "Não foi possível concluir agora. Tente de novo." };
}

// Name and CPF/CNPJ are asked only for a new subscription (a change keeps the Asaas customer).
const checkoutSchema = z.object({
  name: z.string().max(120).default(""),
  cpfCnpj: z.string().max(30).default(""),
  plan: z.enum(["agenda", "pro"]).default("agenda"),
  cycle: z.enum(["monthly", "yearly"]),
  extraProfessionals: z.number().int().min(0).max(49),
  paymentMethod: z.enum(["pix", "credit_card"]).default("pix"),
  card: cardSchema.optional(),
  coupon: z.string().trim().max(30).optional(),
});

export async function checkoutAction(input: unknown): Promise<CheckoutResult> {
  const { business, brand, user } = await requireOwner();
  if (!isAsaasConfigured()) return { ok: false, message: "Cobrança ainda não configurada." };
  if (!(await rateLimitRequest("publicAction", `checkout:${business.id}`)))
    return { ok: false, message: "Muitas tentativas. Espere um pouco e tente de novo." };
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]!.message };
  const data = parsed.data;
  const { data: current } = await createAdminClient()
    .from("subscriptions")
    .select("status")
    .eq("business_id", business.id)
    .maybeSingle();
  const changing = current?.status === "active" || current?.status === "overdue";
  if (!changing) {
    const payer = payerSchema.safeParse({ name: data.name, cpfCnpj: data.cpfCnpj });
    if (!payer.success) return { ok: false, message: payer.error.issues[0]!.message };
    data.name = payer.data.name;
    data.cpfCnpj = payer.data.cpfCnpj;
    if (data.paymentMethod === "credit_card" && !data.card)
      return { ok: false, message: "Preencha os dados do cartão." };
  }
  try {
    const result = await subscribePlan({
      business,
      brand,
      userId: user.id,
      plan: data.plan,
      cycle: data.cycle,
      extraProfessionals: data.extraProfessionals,
      payer: { name: data.name, cpfCnpj: data.cpfCnpj, email: user.email },
      paymentMethod: data.paymentMethod,
      cardPayment: data.card ? cardPayment(data.card) : undefined,
      remoteIp: await getClientIp(),
      couponCode: data.coupon || null,
    });
    revalidatePath("/painel", "layout");
    if (result.kind === "pix")
      return {
        ok: true,
        kind: "pix",
        pix: result.pix,
        message: "Pague o Pix abaixo. A assinatura ativa assim que o pagamento cair.",
      };
    if (result.kind === "card")
      return {
        ok: true,
        kind: "card",
        message: `Cartão ${result.brand} final ${result.last4} cadastrado. Estamos confirmando o pagamento…`,
      };
    const current = paidPlanOf(business.plan);
    return {
      ok: true,
      kind: "changed",
      message:
        current === "agenda" && data.plan === "pro"
          ? "Pronto: o Pro já está liberado. O novo valor vale a partir da próxima cobrança."
          : current === "pro" && data.plan === "agenda"
            ? "Combinado: você continua no Pro até o fim do período pago e depois passa para o Agenda."
            : "Assinatura alterada.",
    };
  } catch (error) {
    return billingError(error);
  }
}

const methodSchema = payerSchema.extend({
  paymentMethod: z.enum(["pix", "credit_card"]),
  card: cardSchema.optional(),
});

/** Switch between Pix and card (or a new card) on an active subscription. */
export async function changePaymentMethodAction(input: unknown): Promise<CheckoutResult> {
  const { business, user } = await requireOwner();
  if (!isAsaasConfigured()) return { ok: false, message: "Cobrança ainda não configurada." };
  if (!(await rateLimitRequest("publicAction", `checkout:${business.id}`)))
    return { ok: false, message: "Muitas tentativas. Espere um pouco e tente de novo." };
  const parsed = methodSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]!.message };
  const data = parsed.data;
  if (data.paymentMethod === "credit_card" && !data.card)
    return { ok: false, message: "Preencha os dados do cartão." };
  try {
    await changePaymentMethod({
      business,
      userId: user.id,
      payer: { name: data.name, email: user.email, cpfCnpj: data.cpfCnpj },
      paymentMethod: data.paymentMethod,
      cardPayment: data.card ? cardPayment(data.card) : undefined,
      remoteIp: await getClientIp(),
    });
    revalidatePath("/painel/plano");
    return {
      ok: true,
      kind: "method_changed",
      message:
        data.paymentMethod === "pix"
          ? "Pronto: as próximas mensalidades serão por Pix."
          : "Pronto: as próximas mensalidades serão no novo cartão.",
    };
  } catch (error) {
    return billingError(error);
  }
}

/** Pix of the open charge (first payment, renewal or overdue). */
export async function pendingPixAction(): Promise<PixCharge | null> {
  const { business } = await requireOwner();
  if (!isAsaasConfigured()) return null;
  try {
    return await pendingPix(business.id);
  } catch (error) {
    console.error("pending pix failed", error instanceof Error ? error.message : "unknown");
    return null;
  }
}

/** Polled by the checkout while waiting for the payment (the webhook updates the status). */
export async function subscriptionStatusAction(): Promise<string | null> {
  const { business } = await requireOwner();
  const { data } = await createAdminClient()
    .from("subscriptions")
    .select("status")
    .eq("business_id", business.id)
    .maybeSingle();
  return (data?.status as string | undefined) ?? null;
}

export async function previewPlatformCouponAction(code: string): Promise<number | null> {
  const { brand } = await requireOwner();
  const parsed = z.string().trim().min(3).max(30).safeParse(code);
  if (!parsed.success) return null;
  const { data } = await createAdminClient().rpc("preview_platform_coupon", {
    p_code: parsed.data,
    p_brand_key: brand.key,
  });
  return (data as number | null) ?? null;
}

const addonSchema = payerSchema.extend({
  // Only the portal highlight is sold (no custom domain since 2026-10-06).
  addon: z.enum(["featured"]),
  city: z.string().trim().max(80).optional(),
});

export async function addonAction(input: unknown): Promise<CheckoutResult> {
  const { business, brand, user } = await requireOwner();
  if (!isAsaasConfigured()) return { ok: false, message: "Cobrança ainda não configurada." };
  const parsed = addonSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]!.message };
  if (parsed.data.addon === "featured" && !parsed.data.city)
    return { ok: false, message: "Informe a cidade do Destaque." };
  try {
    const pix = await subscribeAddon({
      business,
      brand,
      userId: user.id,
      addon: parsed.data.addon,
      city: parsed.data.city,
      payer: { name: parsed.data.name, cpfCnpj: parsed.data.cpfCnpj, email: user.email },
    });
    revalidatePath("/painel/plano");
    if (!pix) return { ok: false, message: "Não foi possível gerar o Pix agora." };
    return { ok: true, kind: "pix", pix, message: "Pague o Pix para ativar o adicional." };
  } catch (error) {
    return billingError(error);
  }
}

export async function cancelPlanAction(): Promise<{ ok: boolean; message: string }> {
  const { business, user } = await requireOwner();
  try {
    await cancelPlan(business, user.id);
    revalidatePath("/painel/plano");
    return {
      ok: true,
      message:
        "Assinatura cancelada. Tudo continua funcionando até o fim do período pago; depois, a conta volta para o Grátis.",
    };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Não foi possível cancelar agora." };
  }
}

export async function cancelAddonAction(subscriptionId: string): Promise<{ ok: boolean }> {
  const { business, user } = await requireOwner();
  try {
    await cancelAddon(business, user.id, z.string().min(1).max(100).parse(subscriptionId));
    revalidatePath("/painel/plano");
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false };
  }
}

/** "Testar 7 dias": once per account and per person (Grátis plan only). */
export async function startTrialAction(plan: unknown): Promise<{ ok: boolean; message: string }> {
  const { business, user } = await requireOwner();
  const parsed = z.enum(["agenda", "pro"]).safeParse(plan);
  if (!parsed.success) return { ok: false, message: "Escolha o plano." };
  const { data: page } = await createAdminClient()
    .from("page_settings")
    .select("whatsapp_number")
    .eq("business_id", business.id)
    .maybeSingle();
  const result = await startTrial({
    business,
    plan: parsed.data,
    identity: { email: user.email, phone: (page?.whatsapp_number as string | null) ?? null },
    userId: user.id,
    via: "panel",
  });
  if (!result.ok) {
    return {
      ok: false,
      message:
        result.error === "subscribed"
          ? "Você já é assinante."
          : "O teste grátis já foi usado nesta conta (ou com este e-mail ou telefone).",
    };
  }
  revalidatePath("/painel", "layout");
  return { ok: true, message: "Teste iniciado! Tudo liberado por 7 dias." };
}
