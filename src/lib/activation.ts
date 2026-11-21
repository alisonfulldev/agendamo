import "server-only";

import { audit } from "@/lib/audit";
import { invalidatePublicPage } from "@/lib/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordTrialClaims, type TrialIdentity } from "@/lib/trial";

/**
 * Meta ad page (/ativar, 2026-11-17/18): no 14-day trial. The new account gets the panel for a
 * short while, only to go through the panel tutorial, which is mandatory and ends with the
 * payment (Completo or Site + Agenda). Choosing the plan, or this time running out, closes the
 * panel: waiting mode (requests go to the WhatsApp) until she pays on /ativar. The account is
 * marked activation_demo so its panel sends it back to /ativar to pay.
 */
export const ACTIVATION_PANEL_MINUTES = 120;

export async function startActivationAccount(input: {
  businessId: string;
  identity: TrialIdentity;
  userId: string;
  now?: Date;
}): Promise<void> {
  const now = input.now ?? new Date();
  const endsAt = new Date(now.getTime() + ACTIVATION_PANEL_MINUTES * 60_000).toISOString();
  const { error } = await createAdminClient()
    .from("businesses")
    .update({ activation_demo: true, trial_started_at: now.toISOString(), trial_ends_at: endsAt })
    .eq("id", input.businessId)
    .is("trial_started_at", null);
  if (error) throw new Error(`activation account failed: ${error.message}`);
  // Her e-mail and phone count as a used trial: no trial through the normal sign-up later.
  await recordTrialClaims(input.businessId, input.identity);
  await audit({
    businessId: input.businessId,
    userId: input.userId,
    action: "plan.activation_demo_started",
    details: { via: "ad_page", panel_until: endsAt },
  });
}

/**
 * The tutorial ended on the plan choice: the panel closes now (waiting mode until the payment).
 * Only for an ad page account still without payment; any other business is untouched.
 */
export async function endActivationPanel(business: { id: string; slug: string }): Promise<void> {
  const now = new Date().toISOString();
  const { data } = await createAdminClient()
    .from("businesses")
    .update({ trial_ends_at: now })
    .eq("id", business.id)
    .eq("activation_demo", true)
    .eq("plan", "free")
    .gt("trial_ends_at", now)
    .select("id");
  if (!data?.length) return;
  invalidatePublicPage(business.slug);
  await audit({
    businessId: business.id,
    userId: null,
    action: "plan.activation_demo_ended",
    details: { reason: "tour_finished" },
  });
}
