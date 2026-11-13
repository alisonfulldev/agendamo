"use server";

import { getSessionUser } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { getBusinessContext } from "@/lib/business/context";
import { heardFromSchema } from "@/lib/signup-origin";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * "Como conheceu o MeetChat?" answered on the sign-up success screen (optional). Saved once per
 * business in audit_log (signup.heard_from), next to the sign-up's source; later answers are
 * ignored. Only the owner of the business, signed in.
 */
export async function saveHeardFromAction(input: unknown): Promise<{ ok: boolean }> {
  const parsed = heardFromSchema.safeParse(input);
  if (!parsed.success || !(await getSessionUser())) return { ok: false };
  const context = await getBusinessContext();
  if (!context?.isOwner) return { ok: false };

  const { count } = await createAdminClient()
    .from("audit_log")
    .select("id", { count: "exact", head: true })
    .eq("business_id", context.business.id)
    .eq("action", "signup.heard_from");
  if ((count ?? 0) > 0) return { ok: true };

  await audit({
    businessId: context.business.id,
    userId: context.user.id,
    action: "signup.heard_from",
    details: { heard_from: parsed.data },
  });
  return { ok: true };
}
