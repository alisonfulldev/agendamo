"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { sunsetLegacySubscription } from "@/lib/billing/service";

/**
 * "Encerrar no vencimento": the subscription from before the Premium stops renewing (it runs
 * until the paid period ends) and the owner is told to choose a plan again.
 */
export async function sunsetSubscriptionAction(
  businessId: unknown,
): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdmin();
  const parsed = z.uuid().safeParse(businessId);
  if (!parsed.success) return { ok: false, message: "Dados inválidos." };
  const done = await sunsetLegacySubscription(parsed.data, admin.id);
  revalidatePath("/admin/assinaturas-antigas");
  return done
    ? { ok: true, message: "Assinatura encerrada no vencimento. A dona foi avisada." }
    : { ok: false, message: "Essa assinatura não pode ser encerrada (já encerrada ou não ativa)." };
}
