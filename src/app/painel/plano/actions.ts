"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AsaasError, isAsaasConfigured } from "@/lib/billing/asaas";
import {
  cancelAddon,
  cancelPlan,
  pendingPix,
  subscribeAddon,
  subscribePlan,
  syncPixAutomatic,
  type PixCharge,
} from "@/lib/billing/service";
import { requireOwner } from "@/lib/business/context";
import { validCnpj, validCpf } from "@/lib/pix";
import { rateLimitRequest } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

/*
 * Own checkout, Pix only (2026-10-28): the first payment's QR also authorizes the Pix Automático,
 * so the next charges are debited by themselves. Errors are mapped to friendly messages.
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

export type CheckoutResult =
  | { ok: true; kind: "changed"; message: string }
  | { ok: true; kind: "pix"; pix: PixCharge; message: string }
  | { ok: false; message: string };

function billingError(error: unknown): { ok: false; message: string } {
  if (error instanceof Error && error.message === "coupon_invalid")
    return { ok: false, message: "Cupom inválido ou esgotado." };
  if (error instanceof Error && error.message === "featured_exists")
    return { ok: false, message: "Você já tem Destaque nessa cidade." };
  if (error instanceof Error && error.message === "no_plan")
    return { ok: false, message: "Assine antes de contratar adicionais." };
  if (error instanceof Error && error.message === "automatic_pending")
    return {
      ok: false,
      message:
        "Seu banco ainda está confirmando o Pix Automático. Tente de novo em alguns minutos.",
    };
  if (error instanceof AsaasError)
    return { ok: false, message: `Não foi possível gerar o Pix: ${error.message}` };
  console.error("billing failed", error instanceof Error ? error.message : "unknown error");
  return { ok: false, message: "Não foi possível concluir agora. Tente de novo." };
}

// Name and CPF/CNPJ are asked only for a new subscription (a change keeps the Asaas customer).
const checkoutSchema = z.object({
  name: z.string().max(120).default(""),
  cpfCnpj: z.string().max(30).default(""),
  cycle: z.enum(["monthly", "yearly"]),
  extraProfessionals: z.number().int().min(0).max(49),
  coupon: z.string().trim().max(30).optional(),
});

export async function checkoutAction(input: unknown): Promise<CheckoutResult> {
  const { business, brand, user } = await requireOwner({ allowWaiting: true });
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
  }
  try {
    const result = await subscribePlan({
      business,
      brand,
      userId: user.id,
      cycle: data.cycle,
      extraProfessionals: data.extraProfessionals,
      payer: { name: data.name, cpfCnpj: data.cpfCnpj, email: user.email },
      couponCode: data.coupon || null,
    });
    revalidatePath("/painel", "layout");
    if (result.kind === "pix")
      return {
        ok: true,
        kind: "pix",
        pix: result.pix,
        message:
          "Pague pelo app do banco e confirme o Pix Automático. A assinatura ativa assim que o pagamento cair.",
      };
    return {
      ok: true,
      kind: "changed",
      message: result.reauthorize
        ? "Assinatura alterada. O novo valor vale a partir da próxima mensalidade: ela aparece aqui para pagar pelo Pix, e ao pagar você confirma o Pix Automático com o novo valor."
        : "Assinatura alterada. O novo valor vale a partir da próxima cobrança.",
    };
  } catch (error) {
    return billingError(error);
  }
}

/** Pix of the open charge (renewal or overdue); without the automatic debit, it also authorizes it. */
export async function pendingPixAction(): Promise<PixCharge | null> {
  const { business, brand } = await requireOwner({ allowWaiting: true });
  if (!isAsaasConfigured()) return null;
  if (!(await rateLimitRequest("publicAction", `checkout:${business.id}`))) return null;
  try {
    return await pendingPix(business.id, brand.name);
  } catch (error) {
    console.error("pending pix failed", error instanceof Error ? error.message : "unknown");
    return null;
  }
}

/** Polled by the checkout while waiting for the payment (the webhook updates the status). */
export async function subscriptionStatusAction(): Promise<string | null> {
  const { business } = await requireOwner({ allowWaiting: true });
  // Does not depend only on the webhook: the bank's confirmation is read from Asaas too.
  await syncPixAutomatic(business.id).catch((error) =>
    console.error("pix automatic sync failed", error instanceof Error ? error.message : "unknown"),
  );
  const { data } = await createAdminClient()
    .from("subscriptions")
    .select("status")
    .eq("business_id", business.id)
    .maybeSingle();
  return (data?.status as string | undefined) ?? null;
}

export async function previewPlatformCouponAction(code: string): Promise<number | null> {
  const { brand } = await requireOwner({ allowWaiting: true });
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
  const { business, brand, user } = await requireOwner({ allowWaiting: true });
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
  const { business, user } = await requireOwner({ allowWaiting: true });
  try {
    await cancelPlan(business, user.id);
    revalidatePath("/painel/plano");
    return {
      ok: true,
      message:
        "Assinatura cancelada. Tudo continua funcionando até o fim do período pago; depois, o link continua no ar com os pedidos indo para o seu WhatsApp.",
    };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Não foi possível cancelar agora." };
  }
}

export async function cancelAddonAction(subscriptionId: string): Promise<{ ok: boolean }> {
  const { business, user } = await requireOwner({ allowWaiting: true });
  try {
    await cancelAddon(business, user.id, z.string().min(1).max(100).parse(subscriptionId));
    revalidatePath("/painel/plano");
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false };
  }
}
