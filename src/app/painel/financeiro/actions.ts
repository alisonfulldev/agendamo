"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { audit } from "@/lib/audit";
import { requireOwner } from "@/lib/business/context";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/finance";
import { parseBRL } from "@/lib/money";
import { getPlanFeatures } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

export type FinanceResult = { ok: true } | { ok: false; message: string };

const methodSchema = z.enum(["pix", "cash", "card", "other"]);

const entrySchema = z
  .object({
    kind: z.enum(["income", "expense"]),
    category: z.string().trim().min(1).max(40),
    description: z.string().trim().min(1, "Descreva o lançamento").max(200),
    amount: z.string().transform((v, ctx) => {
      const cents = parseBRL(v);
      if (!cents || cents <= 0 || cents > 100_000_000) {
        ctx.addIssue({ code: "custom", message: "Valor inválido" });
        return z.NEVER;
      }
      return cents;
    }),
    occurredOn: z.iso.date({ error: "Data inválida" }),
    paymentMethod: z.preprocess((v) => (v === "" ? null : v), methodSchema.nullable()),
    customerId: z.preprocess((v) => (v === "" ? null : v), z.uuid().nullable()),
  })
  .refine(
    (v) =>
      (v.kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).some((c) => c === v.category),
    { path: ["category"], message: "Categoria inválida" },
  );

async function ownerWithFinance() {
  const context = await requireOwner();
  if (!getPlanFeatures(context.business).finance) return null;
  return context;
}

export async function createEntryAction(input: unknown): Promise<FinanceResult> {
  const context = await ownerWithFinance();
  if (!context) return { ok: false, message: "Assine para usar o financeiro." };
  const parsed = entrySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]!.message };
  const data = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("finance_entries").insert({
    business_id: context.business.id,
    kind: data.kind,
    category: data.category,
    description: data.description,
    amount_cents: data.amount,
    occurred_on: data.occurredOn,
    payment_method: data.kind === "income" ? data.paymentMethod : null,
    customer_id: data.kind === "income" ? data.customerId : null,
  });
  if (error) return { ok: false, message: "Não foi possível salvar." };
  revalidatePath("/painel/financeiro");
  return { ok: true };
}

/** Payment method of a revenue (also on the automatic ones from appointments). */
export async function setPaymentMethodAction(id: string, method: string): Promise<FinanceResult> {
  const context = await ownerWithFinance();
  if (!context) return { ok: false, message: "Assine para usar o financeiro." };
  const parsed = z
    .object({
      id: z.uuid(),
      method: z.preprocess((v) => (v === "" ? null : v), methodSchema.nullable()),
    })
    .safeParse({ id, method });
  if (!parsed.success) return { ok: false, message: "Forma de pagamento inválida." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("finance_entries")
    .update({ payment_method: parsed.data.method })
    .eq("id", parsed.data.id)
    .eq("business_id", context.business.id)
    .eq("kind", "income");
  revalidatePath("/painel/financeiro");
  return error ? { ok: false, message: "Não foi possível salvar." } : { ok: true };
}

/** Manual entries only: automatic revenues follow the appointment (cancel / no-show removes them). */
export async function deleteEntryAction(id: string): Promise<FinanceResult> {
  const context = await ownerWithFinance();
  if (!context) return { ok: false, message: "Assine para usar o financeiro." };
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Lançamento inválido." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("finance_entries")
    .delete()
    .eq("id", id)
    .eq("business_id", context.business.id)
    .is("appointment_id", null)
    .select("kind, description, amount_cents, occurred_on");
  if (error || !data?.length) return { ok: false, message: "Não foi possível excluir." };
  await audit({
    businessId: context.business.id,
    userId: context.user.id,
    action: "finance.entry_deleted",
    details: data[0] as Record<string, unknown>,
  });
  revalidatePath("/painel/financeiro");
  return { ok: true };
}
