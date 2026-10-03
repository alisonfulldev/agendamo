"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { audit } from "@/lib/audit";
import { requireBusiness, requireOwner } from "@/lib/business/context";
import { parseBirthdate } from "@/lib/csv";
import { normalizeBrPhone } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface ImportReport {
  created: number;
  updated: number;
  duplicatesInFile: number;
  errors: { line: number; message: string }[];
}

const rowSchema = z.object({
  line: z.number().int(),
  name: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  birthdate: z.string().optional(),
});

/**
 * Imports customers parsed in the browser. Deduplicates by phone: repeated phones in the file are
 * skipped and existing customers only get empty fields filled. Never touches marketing opt-in.
 */
export async function importCustomersAction(input: unknown): Promise<ImportReport> {
  const { business } = await requireOwner();
  const rows = z.array(rowSchema).max(2000).parse(input);
  const report: ImportReport = { created: 0, updated: 0, duplicatesInFile: 0, errors: [] };
  const seen = new Set<string>();
  const valid: { name: string; phone: string; email: string | null; birthdate: string | null }[] =
    [];

  for (const row of rows) {
    const name = row.name.trim();
    const phone = normalizeBrPhone(row.phone);
    const email = row.email?.trim().toLowerCase() || null;
    if (name.length < 2) {
      report.errors.push({ line: row.line, message: "Nome vazio" });
      continue;
    }
    if (!phone) {
      report.errors.push({ line: row.line, message: `Telefone inválido: ${row.phone}` });
      continue;
    }
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      report.errors.push({ line: row.line, message: `E-mail inválido: ${email}` });
      continue;
    }
    const birthdate = parseBirthdate(row.birthdate);
    if (row.birthdate?.trim() && !birthdate)
      report.errors.push({ line: row.line, message: `Aniversário ignorado: ${row.birthdate}` });
    if (seen.has(phone)) {
      report.duplicatesInFile++;
      continue;
    }
    seen.add(phone);
    valid.push({ name: name.slice(0, 120), phone, email, birthdate });
  }

  const admin = createAdminClient();
  for (let i = 0; i < valid.length; i += 500) {
    const chunk = valid.slice(i, i + 500);
    const { data: existing } = await admin
      .from("customers")
      .select("id, phone, email, birthdate")
      .eq("business_id", business.id)
      .in(
        "phone",
        chunk.map((c) => c.phone),
      );
    const byPhone = new Map((existing ?? []).map((c) => [c.phone as string, c]));
    const inserts = chunk
      .filter((c) => !byPhone.has(c.phone))
      .map((c) => ({ business_id: business.id, ...c }));
    if (inserts.length) {
      const { error } = await admin.from("customers").insert(inserts);
      if (error)
        report.errors.push({ line: 0, message: `Falha ao salvar um lote: ${error.message}` });
      else report.created += inserts.length;
    }
    for (const c of chunk) {
      const current = byPhone.get(c.phone);
      if (!current) continue;
      const patch: Record<string, string> = {};
      if (!current.email && c.email) patch.email = c.email;
      if (!current.birthdate && c.birthdate) patch.birthdate = c.birthdate;
      if (Object.keys(patch).length) {
        await admin.from("customers").update(patch).eq("id", current.id);
        report.updated++;
      }
    }
  }
  revalidatePath("/painel/clientes");
  return report;
}

const notesSchema = z.object({
  id: z.uuid(),
  notes: z.string().max(2000),
  birthdate: z.string().optional(),
});

export async function saveCustomerNotesAction(input: unknown): Promise<{ ok: boolean }> {
  await requireBusiness();
  const parsed = notesSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const supabase = await createClient();
  // RLS: owner, or staff linked to this customer.
  const { error } = await supabase
    .from("customers")
    .update({ notes: parsed.data.notes || null, birthdate: parseBirthdate(parsed.data.birthdate) })
    .eq("id", parsed.data.id);
  revalidatePath(`/painel/clientes/${parsed.data.id}`);
  return { ok: !error };
}

export async function setBlockedAction(
  customerId: string,
  blocked: boolean,
): Promise<{ ok: boolean }> {
  const { business, user } = await requireOwner();
  const id = z.uuid().parse(customerId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({ blocked })
    .eq("id", id)
    .eq("business_id", business.id);
  if (!error)
    await audit({
      businessId: business.id,
      userId: user.id,
      action: blocked ? "customer.blocked" : "customer.unblocked",
      details: { customer_id: id },
    });
  revalidatePath(`/painel/clientes/${id}`);
  return { ok: !error };
}

export async function removeOptInAction(customerId: string): Promise<{ ok: boolean }> {
  const { business } = await requireOwner();
  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({ marketing_opt_in: false })
    .eq("id", z.uuid().parse(customerId))
    .eq("business_id", business.id);
  revalidatePath(`/painel/clientes/${customerId}`);
  return { ok: !error };
}

/** LGPD request from the customer, handled by the owner: deletes the customer and their history. */
export async function deleteCustomerAction(customerId: string): Promise<void> {
  const { business, user } = await requireOwner();
  const id = z.uuid().parse(customerId);
  const admin = createAdminClient();
  const { data: customer } = await admin
    .from("customers")
    .select("id, email")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!customer) return;
  await audit({
    businessId: business.id,
    userId: user.id,
    action: "customer.deleted",
    details: { customer_id: id },
  });
  await admin.from("customers").delete().eq("id", id);
  if (customer.email) {
    await admin
      .from("abandoned_bookings")
      .delete()
      .eq("business_id", business.id)
      .ilike("email", customer.email as string);
    await admin
      .from("booking_requests")
      .delete()
      .eq("business_id", business.id)
      .ilike("email", customer.email as string);
    await admin
      .from("waitlist_entries")
      .delete()
      .eq("business_id", business.id)
      .ilike("email", customer.email as string);
  }
  revalidatePath("/painel/clientes");
  redirect("/painel/clientes?excluida=1");
}

export async function sellPackageAction(
  customerId: string,
  packageId: string,
): Promise<{ ok: boolean; message: string }> {
  const { business } = await requireOwner();
  const admin = createAdminClient();
  const { data: pack } = await admin
    .from("packages")
    .select("id, sessions, name")
    .eq("id", z.uuid().parse(packageId))
    .eq("business_id", business.id)
    .eq("active", true)
    .maybeSingle();
  if (!pack) return { ok: false, message: "Pacote não encontrado." };
  const supabase = await createClient();
  const { error } = await supabase.from("customer_packages").insert({
    business_id: business.id,
    customer_id: z.uuid().parse(customerId),
    package_id: pack.id,
    sessions_left: pack.sessions,
  });
  revalidatePath(`/painel/clientes/${customerId}`);
  return error
    ? { ok: false, message: "Não foi possível registrar." }
    : { ok: true, message: `${pack.name} registrado.` };
}
