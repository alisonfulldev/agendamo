"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOwner, type BusinessContext } from "@/lib/business/context";
import { parseBRL } from "@/lib/money";
import { getPlanFeatures } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; message?: string };

async function requireSales(): Promise<BusinessContext> {
  const context = await requireOwner();
  if (!getPlanFeatures(context.business).salesTools)
    throw new Error("Ferramentas de venda estão no Pro e no Equipe.");
  return context;
}

// ---- Packages (Prompt 27) ---------------------------------------------------

const packageSchema = z.object({
  serviceId: z.uuid(),
  name: z.string().trim().min(1, "Dê um nome").max(100),
  sessions: z.coerce.number().int().min(2, "Mínimo de 2 sessões").max(100),
  price: z.string(),
});

export async function createPackageAction(input: unknown): Promise<Result> {
  const { business } = await requireSales();
  const parsed = packageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]!.message };
  const price = parseBRL(parsed.data.price);
  if (price === null) return { ok: false, message: "Preço inválido" };
  const supabase = await createClient();
  const { error } = await supabase.from("packages").insert({
    business_id: business.id,
    service_id: parsed.data.serviceId,
    name: parsed.data.name,
    sessions: parsed.data.sessions,
    price_cents: price,
  });
  revalidatePath("/painel/vendas/pacotes");
  return error ? { ok: false, message: "Não foi possível criar." } : { ok: true };
}

export async function togglePackageAction(id: string, active: boolean): Promise<Result> {
  const { business } = await requireSales();
  const supabase = await createClient();
  await supabase
    .from("packages")
    .update({ active })
    .eq("id", z.uuid().parse(id))
    .eq("business_id", business.id);
  revalidatePath("/painel/vendas/pacotes");
  return { ok: true };
}

// ---- Business coupons (Prompt 33) -------------------------------------------

const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,30}$/, "Use 3 a 30 letras, números, - ou _"),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.string(),
  validUntil: z.preprocess((v) => (v === "" ? null : v), z.iso.date().nullable()),
  maxUses: z.preprocess((v) => (v === "" ? null : v), z.coerce.number().int().min(1).nullable()),
});

export async function createCouponAction(input: unknown): Promise<Result> {
  const { business } = await requireSales();
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]!.message };
  const { discountType, discountValue } = parsed.data;
  const value = discountType === "percent" ? Number(discountValue) : parseBRL(discountValue);
  if (
    !value ||
    value <= 0 ||
    (discountType === "percent" && (value > 100 || !Number.isInteger(value)))
  ) {
    return {
      ok: false,
      message: discountType === "percent" ? "Use de 1 a 100%" : "Valor inválido",
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("business_coupons").insert({
    business_id: business.id,
    code: parsed.data.code,
    discount_type: discountType,
    discount_value: value,
    valid_until: parsed.data.validUntil ? `${parsed.data.validUntil}T23:59:59-03:00` : null,
    max_uses: parsed.data.maxUses,
  });
  revalidatePath("/painel/vendas/cupons");
  if (error)
    return {
      ok: false,
      message:
        error.code === "23505"
          ? "Você já tem um cupom com esse código."
          : "Não foi possível criar.",
    };
  return { ok: true };
}

export async function deleteCouponAction(id: string): Promise<Result> {
  const { business } = await requireSales();
  const supabase = await createClient();
  await supabase
    .from("business_coupons")
    .delete()
    .eq("id", z.uuid().parse(id))
    .eq("business_id", business.id);
  revalidatePath("/painel/vendas/cupons");
  return { ok: true };
}

// ---- Waitlist, abandoned, referrals -----------------------------------------

export async function setWaitlistStatusAction(
  id: string,
  status: "removed" | "booked",
): Promise<Result> {
  const { business } = await requireOwner();
  const supabase = await createClient();
  await supabase
    .from("waitlist_entries")
    .update({ status: z.enum(["removed", "booked"]).parse(status) })
    .eq("id", z.uuid().parse(id))
    .eq("business_id", business.id);
  revalidatePath("/painel/vendas/lista-espera");
  return { ok: true };
}

export async function resolveAbandonedAction(id: string): Promise<Result> {
  const { business } = await requireOwner();
  const supabase = await createClient();
  await supabase
    .from("abandoned_bookings")
    .update({ status: "resolved" })
    .eq("id", z.uuid().parse(id))
    .eq("business_id", business.id);
  revalidatePath("/painel/vendas/quase-agendaram");
  return { ok: true };
}

export async function setRewardAppliedAction(id: string, applied: boolean): Promise<Result> {
  const { business } = await requireOwner();
  const supabase = await createClient();
  await supabase
    .from("referrals")
    .update({ reward_applied: applied })
    .eq("id", z.uuid().parse(id))
    .eq("business_id", business.id);
  revalidatePath("/painel/vendas/indicacoes");
  return { ok: true };
}

// ---- Marketing settings (Prompts 30, 32, 33) --------------------------------

const settingsSchema = z.object({
  inactive_days: z.coerce.number().int().min(15).max(730).optional(),
  return_email_enabled: z.boolean().optional(),
  birthday_email_enabled: z.boolean().optional(),
  birthday_coupon_code: z.string().trim().toUpperCase().max(30).nullable().optional(),
  referral_reward_text: z.string().trim().max(200).nullable().optional(),
  empty_slots_threshold: z.coerce.number().int().min(1).max(50).optional(),
  templates: z
    .record(
      z.enum(["reactivation", "return", "birthday", "abandoned"]),
      z.string().trim().min(1).max(500),
    )
    .optional(),
});

export async function saveMarketingSettingsAction(input: unknown): Promise<Result> {
  const { business } = await requireOwner();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]!.message };
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("marketing_settings")
    .select("templates")
    .eq("business_id", business.id)
    .maybeSingle();
  const { error } = await supabase.from("marketing_settings").upsert({
    business_id: business.id,
    ...parsed.data,
    birthday_coupon_code: parsed.data.birthday_coupon_code || null,
    templates: { ...((current?.templates as object) ?? {}), ...(parsed.data.templates ?? {}) },
    updated_at: new Date().toISOString(),
  });
  revalidatePath("/painel/vendas", "layout");
  return error
    ? { ok: false, message: "Não foi possível salvar." }
    : { ok: true, message: "Salvo." };
}
