"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getRequestOrigin } from "@/brands/server";
import { audit } from "@/lib/audit";
import { requireOwner, type BusinessContext } from "@/lib/business/context";
import { invalidatePublicPage } from "@/lib/cache";
import { sendEmail } from "@/lib/email/send";
import { getPlanFeatures } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function refresh(context: BusinessContext) {
  invalidatePublicPage(context.business.slug);
  revalidatePath("/painel/equipe");
}

type Result = { ok: true; message?: string } | { ok: false; message: string };

async function activeCount(businessId: string, excludeId?: string): Promise<number> {
  const supabase = await createClient();
  let query = supabase
    .from("professionals")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("active", true);
  if (excludeId) query = query.neq("id", excludeId);
  const { count } = await query;
  return count ?? 0;
}

const professionalSchema = z.object({
  id: z.uuid().nullable(),
  name: z.string().trim().min(1, "Informe o nome").max(80),
  active: z.boolean(),
});

export async function saveProfessionalAction(input: unknown): Promise<Result> {
  const context = await requireOwner();
  const parsed = professionalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]!.message };
  const { id, name, active } = parsed.data;
  const { professionalLimit } = getPlanFeatures(context.business);
  if (active && (await activeCount(context.business.id, id ?? undefined)) >= professionalLimit) {
    return {
      ok: false,
      message: `Seu plano permite até ${professionalLimit} profissional(is) ativo(s).`,
    };
  }

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase
      .from("professionals")
      .update({ name, active })
      .eq("id", id)
      .eq("business_id", context.business.id);
    if (error) return { ok: false, message: "Não foi possível salvar." };
  } else {
    const { data: last } = await supabase
      .from("professionals")
      .select("position")
      .eq("business_id", context.business.id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase.from("professionals").insert({
      business_id: context.business.id,
      name,
      active,
      position: ((last?.position as number | undefined) ?? -1) + 1,
    });
    if (error) return { ok: false, message: "Não foi possível criar." };
  }
  refresh(context);
  return { ok: true };
}

export async function deleteProfessionalAction(id: string): Promise<Result> {
  const context = await requireOwner();
  const professionalId = z.uuid().parse(id);
  const admin = createAdminClient();
  const { count } = await admin
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", professionalId)
    .in("status", ["confirmed", "pending", "awaiting_deposit"])
    .gte("starts_at", new Date().toISOString());
  if ((count ?? 0) > 0)
    return {
      ok: false,
      message:
        "Há agendamentos futuros com este profissional. Remarque ou desative em vez de excluir.",
    };
  if ((await activeCount(context.business.id, professionalId)) === 0) {
    return { ok: false, message: "O negócio precisa de pelo menos 1 profissional ativo." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("professionals")
    .delete()
    .eq("id", professionalId)
    .eq("business_id", context.business.id);
  if (error)
    return {
      ok: false,
      message: "Não foi possível excluir (há histórico de agendamentos). Desative o profissional.",
    };
  await audit({
    businessId: context.business.id,
    userId: context.user.id,
    action: "professional.deleted",
    details: { professional_id: professionalId },
  });
  refresh(context);
  return { ok: true };
}

const servicesSchema = z.object({
  professionalId: z.uuid(),
  items: z
    .array(
      z.object({
        serviceId: z.uuid(),
        enabled: z.boolean(),
        durationOverride: z.number().int().min(5).max(720).multipleOf(5).nullable(),
        priceOverride: z.number().int().min(0).nullable(),
      }),
    )
    .max(100),
});

/** Which services a professional does, with their own duration and price. */
export async function saveProfessionalServicesAction(input: unknown): Promise<Result> {
  const context = await requireOwner();
  const parsed = servicesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const supabase = await createClient();
  const { professionalId, items } = parsed.data;
  const removed = await supabase
    .from("professional_services")
    .delete()
    .eq("professional_id", professionalId)
    .eq("business_id", context.business.id);
  if (removed.error) return { ok: false, message: "Não foi possível salvar." };
  const rows = items
    .filter((i) => i.enabled)
    .map((i) => ({
      business_id: context.business.id,
      professional_id: professionalId,
      service_id: i.serviceId,
      duration_override: i.durationOverride,
      price_override: i.priceOverride,
    }));
  if (rows.length) {
    const { error } = await supabase.from("professional_services").insert(rows);
    if (error) return { ok: false, message: "Não foi possível salvar." };
  }
  refresh(context);
  return { ok: true, message: "Serviços salvos." };
}

const inviteSchema = z.object({
  professionalId: z.uuid(),
  email: z.email("E-mail inválido").trim().toLowerCase(),
});

/**
 * Invites a staff member linked to a professional. New people get an invite link (sets the account
 * up); existing accounts are just linked. The e-mail carries the business's brand.
 */
export async function inviteStaffAction(input: unknown): Promise<Result> {
  const context = await requireOwner();
  if (!getPlanFeatures(context.business).teamPermissions)
    return { ok: false, message: "Convites de equipe são do plano Equipe." };
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]!.message };
  const { professionalId, email } = parsed.data;
  if (email === context.user.email.toLowerCase())
    return { ok: false, message: "Esse é o seu e-mail." };

  const admin = createAdminClient();
  const { data: professional } = await admin
    .from("professionals")
    .select("id, name")
    .eq("id", professionalId)
    .eq("business_id", context.business.id)
    .maybeSingle();
  if (!professional) return { ok: false, message: "Profissional não encontrado." };

  const origin = await getRequestOrigin();
  let userId: string;
  let link: string;
  const invite = await admin.auth.admin.generateLink({ type: "invite", email });
  if (!invite.error && invite.data.user) {
    userId = invite.data.user.id;
    const url = new URL("/auth/confirm", origin);
    url.searchParams.set("token_hash", invite.data.properties.hashed_token);
    url.searchParams.set("type", "invite");
    url.searchParams.set("next", "/redefinir-senha");
    link = url.toString();
  } else {
    // Existing account: find it and link it.
    const magic = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (magic.error || !magic.data.user)
      return { ok: false, message: "Não foi possível convidar esse e-mail." };
    userId = magic.data.user.id;
    link = new URL("/entrar", origin).toString();
  }

  const { error } = await admin.from("members").upsert(
    {
      business_id: context.business.id,
      user_id: userId,
      role: "staff",
      professional_id: professionalId,
    },
    { onConflict: "business_id,user_id" },
  );
  if (error) return { ok: false, message: "Não foi possível vincular." };

  await sendEmail({
    brand: context.brand,
    to: email,
    subject: `Convite para a equipe de ${context.business.name}`,
    content: {
      heading: `Você foi convidada para ${context.business.name}`,
      paragraphs: [
        `${context.business.name} adicionou você à equipe como ${professional.name}.`,
        "Você vai ver e gerenciar só a sua agenda e receber só os seus avisos.",
      ],
      cta: { label: invite.error ? "Entrar" : "Aceitar convite e criar senha", url: link },
    },
  });
  await audit({
    businessId: context.business.id,
    userId: context.user.id,
    action: "member.invited",
    details: { email, professional_id: professionalId },
  });
  refresh(context);
  return { ok: true, message: `Convite enviado para ${email}.` };
}

export async function removeMemberAction(memberId: string): Promise<Result> {
  const context = await requireOwner();
  const admin = createAdminClient();
  const { data: member } = await admin
    .from("members")
    .select("id, role, user_id")
    .eq("id", z.uuid().parse(memberId))
    .eq("business_id", context.business.id)
    .maybeSingle();
  if (!member || member.role !== "staff") return { ok: false, message: "Membro não encontrado." };
  await admin.from("members").delete().eq("id", member.id);
  await audit({
    businessId: context.business.id,
    userId: context.user.id,
    action: "member.removed",
    details: { user_id: member.user_id },
  });
  refresh(context);
  return { ok: true };
}

const resourceSchema = z.object({
  id: z.uuid().nullable(),
  name: z.string().trim().min(1, "Informe o nome").max(80),
  serviceIds: z.array(z.uuid()).max(100),
});

export async function saveResourceAction(input: unknown): Promise<Result> {
  const context = await requireOwner();
  if (!getPlanFeatures(context.business).resources)
    return { ok: false, message: "Recursos compartilhados são do plano Equipe." };
  const parsed = resourceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]!.message };
  const supabase = await createClient();
  let id = parsed.data.id;
  if (id) {
    await supabase
      .from("resources")
      .update({ name: parsed.data.name })
      .eq("id", id)
      .eq("business_id", context.business.id);
    await supabase
      .from("service_resources")
      .delete()
      .eq("resource_id", id)
      .eq("business_id", context.business.id);
  } else {
    const { data, error } = await supabase
      .from("resources")
      .insert({ business_id: context.business.id, name: parsed.data.name })
      .select("id")
      .single();
    if (error || !data) return { ok: false, message: "Não foi possível criar." };
    id = data.id as string;
  }
  if (parsed.data.serviceIds.length) {
    const { error } = await supabase.from("service_resources").insert(
      parsed.data.serviceIds.map((serviceId) => ({
        business_id: context.business.id,
        service_id: serviceId,
        resource_id: id,
      })),
    );
    if (error) return { ok: false, message: "Não foi possível vincular os serviços." };
  }
  refresh(context);
  return { ok: true };
}

export async function deleteResourceAction(id: string): Promise<Result> {
  const context = await requireOwner();
  const supabase = await createClient();
  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", z.uuid().parse(id))
    .eq("business_id", context.business.id);
  if (error) return { ok: false, message: "Não foi possível excluir." };
  refresh(context);
  return { ok: true };
}
