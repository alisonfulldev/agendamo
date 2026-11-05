"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOwner } from "@/lib/business/context";
import { invalidatePublicPage } from "@/lib/cache";
import { SITE_TEMPLATES } from "@/lib/db/types";
import { getPlanFeatures } from "@/lib/plans";
import { SITE_SECTION_KEYS } from "@/lib/public/site";
import { notifyProfileChanged } from "@/lib/seo/profile-indexnow";
import { deleteObject } from "@/lib/storage/r2";
import { createAdminClient } from "@/lib/supabase/admin";

export type SiteResult = { ok: true } | { ok: false; error: string };

const NOT_ENTITLED = "O site faz parte do plano Site + Agenda.";

const color = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .nullable();

/** Optional text: empty means "use the default" (null). */
const text = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label}: até ${max} caracteres.`)
    .transform((value) => (value === "" ? null : value))
    .refine((value) => value === null || value.length >= min, `${label}: escreva um pouco mais.`);

const siteSchema = z.object({
  template: z.enum(SITE_TEMPLATES),
  primary_color: color,
  accent_color: color,
  hero_title: text(2, 90, "Título"),
  hero_subtitle: text(2, 240, "Subtítulo"),
  cta_label: text(2, 40, "Texto do botão"),
  sections: z
    .array(
      z.object({ key: z.enum(SITE_SECTION_KEYS as [string, ...string[]]), visible: z.boolean() }),
    )
    .max(SITE_SECTION_KEYS.length)
    .refine((list) => new Set(list.map((s) => s.key)).size === list.length),
});

/** Site edited: fresh public page and panel, and IndexNow when the profile is complete. */
function refresh(business: { slug: string; brand_key: string | null }) {
  invalidatePublicPage(business.slug);
  revalidatePath("/painel/site");
  notifyProfileChanged(business);
}

/** Saves the owner's site edits (colors, texts, sections). Only with the site (rule 6). */
export async function saveSiteAction(input: unknown): Promise<SiteResult> {
  const { business } = await requireOwner();
  if (!getPlanFeatures(business).site) return { ok: false, error: NOT_ENTITLED };
  const parsed = siteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Confira os campos." };
  }
  const { error } = await createAdminClient()
    .from("site_settings")
    .upsert({ business_id: business.id, ...parsed.data, updated_at: new Date().toISOString() });
  if (error) {
    console.error("site save failed", { business: business.id, code: error.code });
    return { ok: false, error: "Não foi possível salvar. Tente de novo." };
  }
  refresh(business);
  return { ok: true };
}

/** Removes the site's own top photo (the site then uses the cover or the profile photo). */
export async function removeSiteHeroAction(): Promise<SiteResult> {
  const { business } = await requireOwner();
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_settings")
    .select("hero_image_key")
    .eq("business_id", business.id)
    .maybeSingle();
  if (!data?.hero_image_key) return { ok: true };
  const { error } = await admin
    .from("site_settings")
    .update({ hero_image_key: null, updated_at: new Date().toISOString() })
    .eq("business_id", business.id);
  if (error) return { ok: false, error: "Não foi possível remover. Tente de novo." };
  await deleteObject(data.hero_image_key as string);
  refresh(business);
  return { ok: true };
}
