"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOwner } from "@/lib/business/context";
import { invalidatePublicPage } from "@/lib/cache";
import { WEB_SITE_TEMPLATES, WEB_STORE_TEMPLATES } from "@/lib/db/types";
import { normalizeBrPhone } from "@/lib/phone";
import { deleteObject } from "@/lib/storage/r2";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATALOG_LIMIT, catalogKind } from "@/lib/web/catalog";

/**
 * "Site ou Loja" panel (2026-11-07): the site's texts, template and colors, the business data it
 * shows, and its services (site) or products (store). Owner only; written with the service role.
 */

export type WebResult = { ok: true; id?: string } | { ok: false; error: string };

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

function refresh(slug: string) {
  invalidatePublicPage(slug);
  revalidatePath("/painel/web", "layout");
}

const siteSchema = z.object({
  template: z.enum([...WEB_SITE_TEMPLATES, ...WEB_STORE_TEMPLATES]),
  primary_color: color,
  accent_color: color,
  hero_title: text(2, 90, "Título"),
  hero_subtitle: text(2, 240, "Subtítulo"),
  cta_label: text(2, 40, "Texto do botão"),
  whatsapp_message: text(2, 300, "Mensagem do WhatsApp"),
});

/** Template, colors and texts of the site. A site only uses site templates, a store store ones. */
export async function saveWebSiteAction(input: unknown): Promise<WebResult> {
  const { business } = await requireOwner({ web: true });
  const parsed = siteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Confira os campos." };
  }
  const allowed: readonly string[] =
    business.product === "store" ? WEB_STORE_TEMPLATES : WEB_SITE_TEMPLATES;
  if (!allowed.includes(parsed.data.template)) return { ok: false, error: "Modelo inválido." };
  const { error } = await createAdminClient()
    .from("site_settings")
    .upsert({ business_id: business.id, ...parsed.data, updated_at: new Date().toISOString() });
  if (error) {
    console.error("web site save failed", { business: business.id, code: error.code });
    return { ok: false, error: "Não foi possível salvar. Tente de novo." };
  }
  refresh(business.slug);
  return { ok: true };
}

const infoSchema = z.object({
  name: z.string().trim().min(2, "Nome: escreva um pouco mais.").max(80),
  bio: text(2, 1000, "Sobre"),
  whatsapp: z
    .string()
    .trim()
    .max(30)
    .transform((value, ctx) => {
      if (!value) return null;
      const phone = normalizeBrPhone(value);
      if (!phone) {
        ctx.addIssue({ code: "custom", message: "WhatsApp inválido. Use DDD + número." });
        return z.NEVER;
      }
      return phone;
    }),
  instagram: z
    .string()
    .trim()
    .max(60)
    .transform((value) => {
      const handle = value.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "");
      const clean = handle.replace(/\/.*$/, "");
      return clean ? `https://instagram.com/${clean}` : null;
    }),
  address: text(2, 200, "Endereço"),
  city: text(2, 80, "Cidade"),
});

/** The business data the site shows: name, about, WhatsApp, Instagram and address. */
export async function saveWebInfoAction(input: unknown): Promise<WebResult> {
  const { business } = await requireOwner({ web: true });
  const parsed = infoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Confira os campos." };
  }
  const { name, bio, whatsapp, instagram, address, city } = parsed.data;
  const admin = createAdminClient();
  const [named, page] = await Promise.all([
    admin.from("businesses").update({ name }).eq("id", business.id),
    admin.from("page_settings").upsert({
      business_id: business.id,
      bio,
      whatsapp_number: whatsapp,
      instagram_url: instagram,
      address,
      city,
      updated_at: new Date().toISOString(),
    }),
  ]);
  if (named.error || page.error) {
    console.error("web info save failed", { business: business.id });
    return { ok: false, error: "Não foi possível salvar. Tente de novo." };
  }
  refresh(business.slug);
  return { ok: true };
}

const priceSchema = z
  .string()
  .trim()
  .max(20)
  .transform((value, ctx) => {
    if (!value) return null;
    const normalized = value.replace(/[R$\s.]/g, "").replace(",", ".");
    const reais = Number(normalized);
    if (!Number.isFinite(reais) || reais < 0 || reais > 1_000_000) {
      ctx.addIssue({ code: "custom", message: "Preço inválido. Ex.: 49,90" });
      return z.NEVER;
    }
    return Math.round(reais * 100);
  });

const itemSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Dê um nome.").max(120),
  description: text(2, 1000, "Descrição"),
  price: priceSchema,
  category: text(1, 60, "Categoria"),
  active: z.boolean(),
});

/** Creates or updates a service (site) or product (store). */
export async function saveCatalogItemAction(input: unknown): Promise<WebResult> {
  const { business } = await requireOwner({ web: true });
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Confira os campos." };
  }
  const { id, name, description, price, category, active } = parsed.data;
  const admin = createAdminClient();
  const fields = {
    name,
    description,
    price_cents: price,
    category,
    active,
    updated_at: new Date().toISOString(),
  };
  if (id) {
    const { error } = await admin
      .from("catalog_items")
      .update(fields)
      .eq("id", id)
      .eq("business_id", business.id);
    if (error) return { ok: false, error: "Não foi possível salvar. Tente de novo." };
    refresh(business.slug);
    return { ok: true, id };
  }
  const { count } = await admin
    .from("catalog_items")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);
  if ((count ?? 0) >= CATALOG_LIMIT) {
    return { ok: false, error: `O limite é de ${CATALOG_LIMIT} itens.` };
  }
  const { data, error } = await admin
    .from("catalog_items")
    .insert({
      business_id: business.id,
      kind: catalogKind(business.product),
      position: count ?? 0,
      ...fields,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Não foi possível salvar. Tente de novo." };
  refresh(business.slug);
  return { ok: true, id: data.id as string };
}

/** Deletes a service or product and its photo. */
export async function deleteCatalogItemAction(id: unknown): Promise<WebResult> {
  const { business } = await requireOwner({ web: true });
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: "Item inválido." };
  const admin = createAdminClient();
  const { data } = await admin
    .from("catalog_items")
    .delete()
    .eq("id", parsed.data)
    .eq("business_id", business.id)
    .select("image_key");
  const key = data?.[0]?.image_key as string | null | undefined;
  if (key) await deleteObject(key).catch(() => undefined);
  refresh(business.slug);
  return { ok: true };
}

/** New order of the services or products (the ids in order). */
export async function reorderCatalogAction(ids: unknown): Promise<WebResult> {
  const { business } = await requireOwner({ web: true });
  const parsed = z.array(z.uuid()).max(CATALOG_LIMIT).safeParse(ids);
  if (!parsed.success) return { ok: false, error: "Ordem inválida." };
  const admin = createAdminClient();
  await Promise.all(
    parsed.data.map((id, position) =>
      admin.from("catalog_items").update({ position }).eq("id", id).eq("business_id", business.id),
    ),
  );
  refresh(business.slug);
  return { ok: true };
}

/** Removes the photo of a service or product. */
export async function removeCatalogPhotoAction(id: unknown): Promise<WebResult> {
  const { business } = await requireOwner({ web: true });
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: "Item inválido." };
  const admin = createAdminClient();
  const { data } = await admin
    .from("catalog_items")
    .select("image_key")
    .eq("id", parsed.data)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!data?.image_key) return { ok: true };
  await admin
    .from("catalog_items")
    .update({ image_key: null, updated_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("business_id", business.id);
  await deleteObject(data.image_key as string).catch(() => undefined);
  refresh(business.slug);
  return { ok: true };
}

/** Removes the site's top photo. */
export async function removeWebHeroAction(): Promise<WebResult> {
  const { business } = await requireOwner({ web: true });
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_settings")
    .select("hero_image_key")
    .eq("business_id", business.id)
    .maybeSingle();
  if (!data?.hero_image_key) return { ok: true };
  await admin
    .from("site_settings")
    .update({ hero_image_key: null, updated_at: new Date().toISOString() })
    .eq("business_id", business.id);
  await deleteObject(data.hero_image_key as string).catch(() => undefined);
  refresh(business.slug);
  return { ok: true };
}
