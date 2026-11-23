"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { audit } from "@/lib/audit";
import { payPartner } from "@/lib/partners/service";
import { createAdminClient } from "@/lib/supabase/admin";

/** Records the Pix sent to the partner: every released commission becomes paid. */
export async function payPartnerAction(partnerId: string): Promise<{ ok: boolean }> {
  const adminUser = await requireAdmin();
  const result = await payPartner(z.uuid().parse(partnerId), adminUser.id);
  revalidatePath("/admin/parceiros");
  return { ok: result.ok };
}

export async function setPartnerStatusAction(
  partnerId: string,
  status: "active" | "blocked",
): Promise<{ ok: boolean }> {
  const adminUser = await requireAdmin();
  const id = z.uuid().parse(partnerId);
  const next = z.enum(["active", "blocked"]).parse(status);
  await createAdminClient().from("partners").update({ status: next }).eq("id", id);
  await audit({
    businessId: null,
    userId: adminUser.id,
    action: next === "blocked" ? "admin.partner_blocked" : "admin.partner_unblocked",
    details: { partner_id: id },
  });
  revalidatePath("/admin/parceiros");
  return { ok: true };
}
