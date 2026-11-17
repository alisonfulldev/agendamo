import "server-only";

import { audit } from "@/lib/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordTrialClaims, type TrialIdentity } from "@/lib/trial";

/**
 * Meta ad page (/ativar, 2026-11-17): the person watches the animated tutorial (a customer
 * booking, then the panel step by step), creates the account and pays right away. No 14-day
 * trial: the account starts in waiting mode (requests go to the WhatsApp) until the payment, and
 * is marked activation_demo so its panel sends it back to /ativar to pay.
 */
export async function startActivationAccount(input: {
  businessId: string;
  identity: TrialIdentity;
  userId: string;
  now?: Date;
}): Promise<void> {
  const now = input.now ?? new Date();
  // A trial that already ended (the database wants the end after the start): it counts as used
  // and none is open.
  const { error } = await createAdminClient()
    .from("businesses")
    .update({
      activation_demo: true,
      trial_started_at: new Date(now.getTime() - 1000).toISOString(),
      trial_ends_at: now.toISOString(),
    })
    .eq("id", input.businessId)
    .is("trial_started_at", null);
  if (error) throw new Error(`activation account failed: ${error.message}`);
  // Her e-mail and phone count as a used trial: no 14 days through the normal sign-up later.
  await recordTrialClaims(input.businessId, input.identity);
  await audit({
    businessId: input.businessId,
    userId: input.userId,
    action: "plan.activation_demo_started",
    details: { via: "ad_page" },
  });
}
