"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOwner } from "@/lib/business/context";
import { decideDeposit, registerRefund } from "@/lib/deposits/receipts";
import { parseBRL } from "@/lib/money";

/**
 * "Confirmar recebimento" / "Não recebi": the professional's decision after checking the bank.
 * Works even after leaving Pro (deposits already created stay valid).
 */
export async function decideDepositAction(input: unknown): Promise<{ ok: boolean }> {
  const { business } = await requireOwner();
  const parsed = z
    .object({
      appointmentId: z.uuid(),
      decision: z.enum(["confirm", "refuse"]),
      reason: z.string().max(300).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false };
  const ok = await decideDeposit({ businessId: business.id, ...parsed.data });
  revalidatePath("/painel", "layout");
  return { ok };
}

/** Deposit returned outside MeetChat: recorded with the date and the amount. */
export async function registerRefundAction(
  input: unknown,
): Promise<{ ok: boolean; message?: string }> {
  const { business } = await requireOwner();
  const parsed = z
    .object({ appointmentId: z.uuid(), amount: z.string(), date: z.iso.date() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, message: "Confira a data." };
  const cents = parseBRL(parsed.data.amount);
  if (!cents || cents <= 0) return { ok: false, message: "Informe o valor devolvido." };
  const ok = await registerRefund({
    businessId: business.id,
    appointmentId: parsed.data.appointmentId,
    cents,
    date: parsed.data.date,
  });
  revalidatePath("/painel/sinais");
  return ok ? { ok } : { ok, message: "Não foi possível registrar." };
}
