"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOwner } from "@/lib/business/context";
import { invalidatePublicPage } from "@/lib/cache";
import { invalid, type FormState } from "@/lib/forms";
import { parseBRL } from "@/lib/money";
import { normalizeBrPhone } from "@/lib/phone";
import { normalizeInstagram } from "@/lib/social";
import { createClient } from "@/lib/supabase/server";

function refresh(slug: string) {
  invalidatePublicPage(slug);
  revalidatePath("/painel/pagina");
}

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const pageInfoSchema = z.object({
  bio: z.preprocess(emptyToNull, z.string().trim().max(500, "Até 500 caracteres").nullable()),
  whatsapp: z.preprocess(
    emptyToNull,
    z
      .string()
      .nullable()
      .transform((v, ctx) => {
        if (!v) return null;
        const phone = normalizeBrPhone(v);
        if (!phone) {
          ctx.addIssue({ code: "custom", message: "WhatsApp inválido. Use DDD + número." });
          return z.NEVER;
        }
        return phone;
      }),
  ),
  instagram: z.preprocess(
    emptyToNull,
    z
      .string()
      .nullable()
      .transform((v, ctx) => {
        if (!v) return null;
        const url = normalizeInstagram(v);
        if (!url) {
          ctx.addIssue({ code: "custom", message: "Instagram inválido. Use @seuperfil." });
          return z.NEVER;
        }
        return url;
      }),
  ),
  address: z.preprocess(emptyToNull, z.string().trim().max(200).nullable()),
  city: z.preprocess(emptyToNull, z.string().trim().max(80).nullable()),
  neighborhood: z.preprocess(emptyToNull, z.string().trim().max(80).nullable()),
  google_review_url: z.preprocess(
    emptyToNull,
    z
      .url({ protocol: /^https$/, error: "Use um link https://" })
      .max(500)
      .nullable(),
  ),
  show_prices: z.preprocess((v) => v === "on", z.boolean()),
  primary_color_override: z.preprocess(
    emptyToNull,
    z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida")
      .nullable(),
  ),
});

export async function savePageInfoAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireOwner();
  const parsed = pageInfoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { whatsapp, instagram, ...rest } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("page_settings").upsert({
    business_id: business.id,
    ...rest,
    whatsapp_number: whatsapp,
    instagram_url: instagram,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, message: "Não foi possível salvar. Tente de novo." };
  refresh(business.slug);
  return { ok: true, message: "Perfil atualizado." };
}

// ---------------------------------------------------------------------------
// Links

const linksSchema = z
  .array(
    z.object({
      label: z.string().trim().min(1, "Dê um nome ao link").max(60),
      url: z.url({ protocol: /^https?$/, error: "Link inválido (use https://)" }).max(500),
    }),
  )
  .max(20);

export async function saveLinksAction(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const { business } = await requireOwner();
  const parsed = linksSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]!.message };

  const supabase = await createClient();
  const removed = await supabase.from("page_links").delete().eq("business_id", business.id);
  if (removed.error) return { ok: false, error: "Não foi possível salvar." };
  if (parsed.data.length > 0) {
    const { error } = await supabase
      .from("page_links")
      .insert(
        parsed.data.map((link, position) => ({ business_id: business.id, ...link, position })),
      );
    if (error) return { ok: false, error: "Não foi possível salvar." };
  }
  refresh(business.slug);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Services

const serviceSchema = z
  .object({
    id: z.preprocess(emptyToNull, z.uuid().nullable()),
    name: z.string().trim().min(1, "Dê um nome ao serviço").max(100),
    description: z.preprocess(emptyToNull, z.string().trim().max(1000).nullable()),
    duration_minutes: z.coerce.number().int().min(5).max(720).multipleOf(5, "Use múltiplos de 5"),
    buffer_minutes: z.coerce.number().int().min(0).max(240),
    price: z.string().transform((v, ctx) => {
      const cents = parseBRL(v || "0");
      if (cents === null) {
        ctx.addIssue({ code: "custom", message: "Preço inválido" });
        return z.NEVER;
      }
      return cents;
    }),
    deposit_type: z.enum(["none", "fixed", "percent"]).default("none"),
    deposit_value: z.string().optional(),
    return_after_days: z.preprocess(
      emptyToNull,
      z.coerce.number().int().min(1).max(730).nullable(),
    ),
    active: z.preprocess((v) => v === "on", z.boolean()),
  })
  .transform((v, ctx) => {
    let deposit = 0;
    if (v.deposit_type === "fixed") {
      deposit = parseBRL(v.deposit_value ?? "") ?? 0;
      if (deposit <= 0)
        ctx.addIssue({
          code: "custom",
          path: ["deposit_value"],
          message: "Informe o valor do sinal",
        });
    } else if (v.deposit_type === "percent") {
      deposit = Number(v.deposit_value);
      if (!Number.isInteger(deposit) || deposit < 1 || deposit > 100) {
        ctx.addIssue({ code: "custom", path: ["deposit_value"], message: "Use de 1 a 100%" });
      }
    }
    return { ...v, deposit_value: deposit };
  });

export async function saveServiceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireOwner();
  const parsed = serviceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { id, price, ...fields } = parsed.data;
  const row = { ...fields, price_cents: price, business_id: business.id };

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase
      .from("services")
      .update(row)
      .eq("id", id)
      .eq("business_id", business.id);
    if (error) return { ok: false, message: "Não foi possível salvar o serviço." };
  } else {
    const { data: last } = await supabase
      .from("services")
      .select("position")
      .eq("business_id", business.id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: created, error } = await supabase
      .from("services")
      .insert({ ...row, position: ((last?.position as number | undefined) ?? -1) + 1 })
      .select("id")
      .single();
    if (error || !created) return { ok: false, message: "Não foi possível criar o serviço." };
    // New services are offered by every active professional (adjust per professional in Equipe).
    const { data: professionals } = await supabase
      .from("professionals")
      .select("id")
      .eq("business_id", business.id)
      .eq("active", true);
    if (professionals?.length) {
      await supabase.from("professional_services").insert(
        professionals.map((p) => ({
          business_id: business.id,
          professional_id: p.id,
          service_id: created.id,
        })),
      );
    }
  }
  refresh(business.slug);
  return { ok: true, message: "Serviço salvo." };
}

export async function deleteServiceAction(
  serviceId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { business } = await requireOwner();
  const supabase = await createClient();
  const { count } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("active", true);
  if ((count ?? 0) <= 1) return { ok: false, error: "Mantenha pelo menos 1 serviço ativo." };
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId)
    .eq("business_id", business.id);
  if (error)
    return { ok: false, error: "Não foi possível excluir. Desative o serviço em vez disso." };
  refresh(business.slug);
  return { ok: true };
}

export async function reorderServicesAction(orderedIds: string[]): Promise<{ ok: boolean }> {
  const { business } = await requireOwner();
  const ids = z.array(z.uuid()).max(100).parse(orderedIds);
  const supabase = await createClient();
  await Promise.all(
    ids.map((id, position) =>
      supabase.from("services").update({ position }).eq("id", id).eq("business_id", business.id),
    ),
  );
  refresh(business.slug);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Combos

const comboSchema = z.object({
  id: z.uuid().nullable(),
  name: z.string().trim().min(1, "Dê um nome ao combo").max(100),
  price: z.string(),
  serviceIds: z.array(z.uuid()).min(2, "Escolha pelo menos 2 serviços").max(6),
  active: z.boolean(),
});

export async function saveComboAction(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const { business } = await requireOwner();
  const parsed = comboSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]!.message };
  const price = parseBRL(parsed.data.price);
  if (price === null) return { ok: false, error: "Preço inválido" };

  const supabase = await createClient();
  const { data: owned } = await supabase
    .from("services")
    .select("id")
    .eq("business_id", business.id)
    .in("id", parsed.data.serviceIds);
  if ((owned?.length ?? 0) !== parsed.data.serviceIds.length)
    return { ok: false, error: "Serviço inválido" };

  let comboId = parsed.data.id;
  const row = {
    business_id: business.id,
    name: parsed.data.name,
    price_cents: price,
    active: parsed.data.active,
  };
  if (comboId) {
    const { error } = await supabase
      .from("combos")
      .update(row)
      .eq("id", comboId)
      .eq("business_id", business.id);
    if (error) return { ok: false, error: "Não foi possível salvar." };
    await supabase
      .from("combo_services")
      .delete()
      .eq("combo_id", comboId)
      .eq("business_id", business.id);
  } else {
    const { data, error } = await supabase.from("combos").insert(row).select("id").single();
    if (error || !data) return { ok: false, error: "Não foi possível criar." };
    comboId = data.id as string;
  }
  const { error } = await supabase.from("combo_services").insert(
    parsed.data.serviceIds.map((serviceId, position) => ({
      business_id: business.id,
      combo_id: comboId,
      service_id: serviceId,
      position,
    })),
  );
  if (error) return { ok: false, error: "Não foi possível salvar os serviços do combo." };
  refresh(business.slug);
  return { ok: true };
}

export async function deleteComboAction(comboId: string): Promise<{ ok: boolean }> {
  const { business } = await requireOwner();
  const supabase = await createClient();
  await supabase.from("combos").delete().eq("id", comboId).eq("business_id", business.id);
  refresh(business.slug);
  return { ok: true };
}
