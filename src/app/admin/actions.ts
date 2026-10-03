"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { audit } from "@/lib/audit";
import { invalidatePublicPage } from "@/lib/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function extendTrialAction(
  businessId: string,
  days: number,
): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ businessId: z.uuid(), days: z.number().int().min(1).max(90) })
    .safeParse({ businessId, days });
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const db = createAdminClient();
  const { data: business } = await db
    .from("businesses")
    .select("slug, trial_started_at, trial_ends_at")
    .eq("id", businessId)
    .single();
  if (!business) return { ok: false, message: "Negócio não encontrado." };
  const base = Math.max(
    Date.now(),
    business.trial_ends_at ? new Date(business.trial_ends_at as string).getTime() : 0,
  );
  const ends = new Date(base + parsed.data.days * 86_400_000).toISOString();
  await db
    .from("businesses")
    .update({
      trial_started_at: business.trial_started_at ?? new Date().toISOString(),
      trial_ends_at: ends,
    })
    .eq("id", businessId);
  await audit({
    businessId,
    userId: admin.id,
    action: "plan.trial_extended",
    details: { days: parsed.data.days, ends_at: ends, by: admin.email },
  });
  invalidatePublicPage(business.slug as string);
  revalidatePath("/admin");
  return {
    ok: true,
    message: `Teste estendido até ${ends.slice(0, 10).split("-").reverse().join("/")}.`,
  };
}

export async function setSuspendedAction(
  businessId: string,
  suspended: boolean,
): Promise<{ ok: boolean }> {
  const admin = await requireAdmin();
  const id = z.uuid().parse(businessId);
  const db = createAdminClient();
  const { data } = await db
    .from("businesses")
    .update({ suspended_at: suspended ? new Date().toISOString() : null })
    .eq("id", id)
    .select("slug")
    .single();
  await audit({
    businessId: id,
    userId: admin.id,
    action: suspended ? "business.suspended" : "business.unsuspended",
    details: { by: admin.email },
  });
  if (data) invalidatePublicPage(data.slug as string);
  revalidatePath("/admin");
  return { ok: true };
}

const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,30}$/, "Use 3 a 30 letras, números, - ou _"),
  discountPercent: z.coerce.number().int().min(1).max(100),
  validUntil: z.preprocess((v) => (v === "" ? null : v), z.iso.date().nullable()),
  maxUses: z.preprocess((v) => (v === "" ? null : v), z.coerce.number().int().min(1).nullable()),
  brandKey: z.preprocess((v) => (v === "" ? null : v), z.string().nullable()),
});

export async function createCouponAction(
  input: unknown,
): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdmin();
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]!.message };
  const { error } = await createAdminClient()
    .from("platform_coupons")
    .insert({
      code: parsed.data.code,
      discount_percent: parsed.data.discountPercent,
      valid_until: parsed.data.validUntil ? `${parsed.data.validUntil}T23:59:59-03:00` : null,
      max_uses: parsed.data.maxUses,
      brand_key: parsed.data.brandKey,
    });
  if (error)
    return {
      ok: false,
      message: error.code === "23505" ? "Esse código já existe." : "Não foi possível criar.",
    };
  await audit({
    businessId: null,
    userId: admin.id,
    action: "admin.coupon_created",
    details: { ...parsed.data, by: admin.email },
  });
  revalidatePath("/admin");
  return { ok: true, message: `Cupom ${parsed.data.code} criado.` };
}
