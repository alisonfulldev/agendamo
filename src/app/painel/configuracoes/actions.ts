"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getBrand } from "@/brands";
import { audit } from "@/lib/audit";
import { localToUtc } from "@/lib/availability";
import { requireOwner } from "@/lib/business/context";
import { slugSchema, weeklyHoursSchema } from "@/lib/business/schemas";
import { invalidatePublicPage } from "@/lib/cache";
import { formValues, invalid, type FormState } from "@/lib/forms";
import { normalizePixKey, pixText } from "@/lib/pix";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { BR_TIMEZONE_VALUES } from "@/lib/timezones";

function refresh(slug: string) {
  invalidatePublicPage(slug);
  revalidatePath("/painel", "layout");
}

const businessSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(120),
  slug: slugSchema,
  timezone: z.enum(BR_TIMEZONE_VALUES),
  slot_interval_minutes: z.coerce
    .number()
    .pipe(z.union([z.literal(15), z.literal(30), z.literal(60)])),
  min_notice_minutes: z.coerce.number().int().min(0).max(43200),
  max_days_ahead: z.coerce.number().int().min(1).max(365),
  booking_confirmation: z.enum(["auto", "manual"]),
  no_show_limit: z.preprocess(
    (v) => (v === "" ? null : v),
    z.coerce.number().int().min(1).max(20).nullable(),
  ),
  portal_opt_out: z.preprocess((v) => v === "on", z.boolean()),
});

const nicheSchema = z.object({
  brandKey: z.string().refine((key) => Boolean(getBrand(key)), "Ramo inválido"),
  replaceServices: z.boolean(),
});

/**
 * Changes the business's niche: theme, chat texts and suggested services follow it. With
 * `replaceServices`, the current services are deactivated (never deleted: past appointments keep
 * them) and the niche's default services are created.
 */
export async function changeNicheAction(input: unknown): Promise<{ ok: boolean; message: string }> {
  const { business, user } = await requireOwner();
  const parsed = nicheSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Escolha um ramo da lista." };
  const niche = getBrand(parsed.data.brandKey)!;
  const admin = createAdminClient();

  const { error } = await admin
    .from("businesses")
    .update({ brand_key: niche.key, segment: niche.defaultSegment })
    .eq("id", business.id);
  if (error) return { ok: false, message: "Não foi possível trocar o ramo. Tente de novo." };

  if (parsed.data.replaceServices) {
    await admin.from("services").update({ active: false }).eq("business_id", business.id);
    const { data: created } = await admin
      .from("services")
      .insert(
        niche.suggestedServices.map((service, position) => ({
          business_id: business.id,
          name: service.name,
          duration_minutes: service.durationMinutes,
          position,
        })),
      )
      .select("id");
    // Every active professional offers the new services.
    const { data: professionals } = await admin
      .from("professionals")
      .select("id")
      .eq("business_id", business.id)
      .eq("active", true);
    const links = (professionals ?? []).flatMap((p) =>
      (created ?? []).map((s) => ({
        business_id: business.id,
        professional_id: p.id as string,
        service_id: s.id as string,
      })),
    );
    if (links.length) await admin.from("professional_services").insert(links);
  }

  await audit({
    businessId: business.id,
    userId: user.id,
    action: "business.niche_changed",
    details: {
      from: business.brand_key,
      to: niche.key,
      replaceServices: parsed.data.replaceServices,
    },
  });
  refresh(business.slug);
  return {
    ok: true,
    message: parsed.data.replaceServices
      ? "Ramo trocado. Os serviços padrão já estão no seu chat: ajuste preços em Meu perfil."
      : "Ramo trocado. Seus serviços continuam os mesmos.",
  };
}

export async function saveBusinessAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireOwner();
  const parsed = businessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);

  if (parsed.data.slug !== business.slug) {
    const { data: available } = await createAdminClient().rpc("slug_is_available", {
      p_slug: parsed.data.slug,
    });
    if (!available) {
      return { ok: false, errors: { slug: "Endereço indisponível" }, values: formValues(formData) };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("businesses").update(parsed.data).eq("id", business.id);
  if (error)
    return {
      ok: false,
      message: "Não foi possível salvar. Tente de novo.",
      values: formValues(formData),
    };
  refresh(business.slug);
  if (parsed.data.slug !== business.slug) invalidatePublicPage(parsed.data.slug);
  return { ok: true, message: "Configurações salvas." };
}

// ---------------------------------------------------------------------------

export async function saveHoursAction(input: {
  professionalId: string;
  ranges: unknown;
}): Promise<{ ok: boolean; error?: string }> {
  const { business } = await requireOwner();
  const professionalId = z.uuid().safeParse(input.professionalId);
  const ranges = weeklyHoursSchema.safeParse(input.ranges);
  if (!professionalId.success) return { ok: false, error: "Profissional inválido." };
  if (!ranges.success) return { ok: false, error: ranges.error.issues[0]!.message };

  const supabase = await createClient();
  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("id", professionalId.data)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!professional) return { ok: false, error: "Profissional não encontrado." };

  const removed = await supabase
    .from("working_hours")
    .delete()
    .eq("professional_id", professionalId.data);
  if (removed.error) return { ok: false, error: "Não foi possível salvar." };
  if (ranges.data.length > 0) {
    const { error } = await supabase.from("working_hours").insert(
      ranges.data.map((r) => ({
        business_id: business.id,
        professional_id: professionalId.data,
        weekday: r.weekday,
        start_time: r.start,
        end_time: r.end,
      })),
    );
    if (error) return { ok: false, error: "Não foi possível salvar." };
  }
  refresh(business.slug);
  return { ok: true };
}

// ---------------------------------------------------------------------------

const timeOffSchema = z
  .object({
    professional_id: z.uuid(),
    start_date: z.iso.date("Data inválida"),
    end_date: z.iso.date("Data inválida"),
    all_day: z.preprocess((v) => v === "on", z.boolean()),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    reason: z.preprocess((v) => (v === "" ? null : v), z.string().trim().max(200).nullable()),
  })
  .refine((v) => v.all_day || (v.start_time && v.end_time), {
    path: ["start_time"],
    message: "Informe os horários",
  });

export async function addTimeOffAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireOwner();
  const parsed = timeOffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const v = parsed.data;

  const startsAt = localToUtc(v.start_date, v.all_day ? "00:00" : v.start_time!, business.timezone);
  const endsAt = localToUtc(v.end_date, v.all_day ? "24:00" : v.end_time!, business.timezone);
  if (endsAt <= startsAt) {
    return {
      ok: false,
      errors: { end_date: "O fim precisa ser depois do início." },
      values: formValues(formData),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("time_off").insert({
    business_id: business.id,
    professional_id: v.professional_id,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    reason: v.reason,
  });
  if (error) return { ok: false, message: "Não foi possível salvar o bloqueio." };
  refresh(business.slug);
  return { ok: true, message: "Bloqueio adicionado." };
}

export async function deleteTimeOffAction(id: string): Promise<{ ok: boolean }> {
  const { business } = await requireOwner();
  const supabase = await createClient();
  await supabase.from("time_off").delete().eq("id", id).eq("business_id", business.id);
  refresh(business.slug);
  return { ok: true };
}

// ---------------------------------------------------------------------------

const pixSchema = z.object({
  pix_key: z.string().transform((v, ctx) => {
    if (!v.trim()) return null;
    const key = normalizePixKey(v);
    if (!key) {
      ctx.addIssue({
        code: "custom",
        message: "Chave Pix inválida (CPF, CNPJ, e-mail, celular ou chave aleatória).",
      });
      return z.NEVER;
    }
    return key.key;
  }),
  pix_receiver_name: z.string().transform((v) => pixText(v, 25) || null),
  deposit_deadline_minutes: z.coerce.number().int().min(5).max(2880),
});

export async function savePixAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireOwner();
  const parsed = pixSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  if (parsed.data.pix_key && !parsed.data.pix_receiver_name) {
    return {
      ok: false,
      errors: { pix_receiver_name: "Informe o nome de quem recebe." },
      values: formValues(formData),
    };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("page_settings")
    .upsert({ business_id: business.id, ...parsed.data, updated_at: new Date().toISOString() });
  if (error) return { ok: false, message: "Não foi possível salvar." };
  return { ok: true, message: "Dados do Pix salvos." };
}
