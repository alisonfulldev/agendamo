"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AsaasError, isAsaasConfigured } from "@/lib/billing/asaas";
import { cancelAddon, cancelPlan, subscribeAddon, subscribePlan } from "@/lib/billing/service";
import { requireOwner } from "@/lib/business/context";
import { validCnpj, validCpf } from "@/lib/pix";
import { createAdminClient } from "@/lib/supabase/admin";

const payerSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome completo ou a razão social").max(120),
  cpfCnpj: z.string().transform((v, ctx) => {
    const digits = v.replace(/\D/g, "");
    if (!(validCpf(digits) || validCnpj(digits))) {
      ctx.addIssue({ code: "custom", message: "CPF ou CNPJ inválido" });
      return z.NEVER;
    }
    return digits;
  }),
});

type BillingResult =
  { ok: true; invoiceUrl: string | null; message: string } | { ok: false; message: string };

function billingError(error: unknown): BillingResult {
  if (error instanceof Error && error.message === "coupon_invalid")
    return { ok: false, message: "Cupom inválido ou esgotado." };
  if (error instanceof Error && error.message === "featured_exists")
    return { ok: false, message: "Você já tem Destaque nessa cidade." };
  if (error instanceof Error && error.message === "no_plan")
    return { ok: false, message: "Assine um plano antes de contratar adicionais." };
  if (error instanceof AsaasError)
    return { ok: false, message: `Não foi possível criar a cobrança: ${error.message}` };
  console.error("billing failed", error);
  return { ok: false, message: "Não foi possível concluir agora. Tente de novo." };
}

const checkoutSchema = payerSchema.extend({
  cycle: z.enum(["monthly", "yearly"]),
  extraProfessionals: z.number().int().min(0).max(49),
  coupon: z.string().trim().max(30).optional(),
});

export async function checkoutAction(input: unknown): Promise<BillingResult> {
  const { business, brand, user } = await requireOwner({ allowExpired: true });
  if (!isAsaasConfigured()) return { ok: false, message: "Cobrança ainda não configurada." };
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]!.message };
  try {
    const result = await subscribePlan({
      business,
      brand,
      userId: user.id,
      cycle: parsed.data.cycle,
      extraProfessionals: parsed.data.extraProfessionals,
      payer: { name: parsed.data.name, cpfCnpj: parsed.data.cpfCnpj, email: user.email },
      couponCode: parsed.data.coupon || null,
    });
    revalidatePath("/painel", "layout");
    return {
      ok: true,
      invoiceUrl: result.invoiceUrl,
      message: result.changed
        ? "Assinatura alterada."
        : "Assinatura criada. Pague a primeira cobrança para ativar.",
    };
  } catch (error) {
    return billingError(error);
  }
}

export async function previewPlatformCouponAction(code: string): Promise<number | null> {
  const { brand } = await requireOwner({ allowExpired: true });
  const parsed = z.string().trim().min(3).max(30).safeParse(code);
  if (!parsed.success) return null;
  const { data } = await createAdminClient().rpc("preview_platform_coupon", {
    p_code: parsed.data,
    p_brand_key: brand.key,
  });
  return (data as number | null) ?? null;
}

const addonSchema = payerSchema.extend({
  addon: z.enum(["featured", "custom_domain"]),
  city: z.string().trim().max(80).optional(),
});

export async function addonAction(input: unknown): Promise<BillingResult> {
  const { business, brand, user } = await requireOwner({ allowExpired: true });
  if (!isAsaasConfigured()) return { ok: false, message: "Cobrança ainda não configurada." };
  const parsed = addonSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]!.message };
  if (parsed.data.addon === "featured" && !parsed.data.city)
    return { ok: false, message: "Informe a cidade do Destaque." };
  try {
    const invoiceUrl = await subscribeAddon({
      business,
      brand,
      userId: user.id,
      addon: parsed.data.addon,
      city: parsed.data.city,
      payer: { name: parsed.data.name, cpfCnpj: parsed.data.cpfCnpj, email: user.email },
    });
    revalidatePath("/painel/plano");
    return { ok: true, invoiceUrl, message: "Adicional criado. Pague a cobrança para ativar." };
  } catch (error) {
    return billingError(error);
  }
}

export async function cancelPlanAction(): Promise<{ ok: boolean; message: string }> {
  const { business, user } = await requireOwner({ allowExpired: true });
  try {
    await cancelPlan(business, user.id);
    revalidatePath("/painel/plano");
    return {
      ok: true,
      message: "Assinatura cancelada. Tudo continua funcionando até o fim do período pago.",
    };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Não foi possível cancelar agora." };
  }
}

export async function cancelAddonAction(subscriptionId: string): Promise<{ ok: boolean }> {
  const { business, user } = await requireOwner({ allowExpired: true });
  try {
    await cancelAddon(business, user.id, z.string().min(1).max(100).parse(subscriptionId));
    revalidatePath("/painel/plano");
    return { ok: true };
  } catch (error) {
    console.error(error);
    return { ok: false };
  }
}
