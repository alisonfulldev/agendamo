"use server";

import { endActivationPanel } from "@/lib/activation";
import { requireUser } from "@/lib/auth/session";
import { getBusinessContext } from "@/lib/business/context";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * First-access tutorial: pending only for accounts created in the sign-up conversation
 * (user_metadata.tour_pending, set there). Read once per panel load, not on every page.
 */
export async function tourPendingAction(): Promise<boolean> {
  const user = await requireUser();
  const { data } = await createAdminClient().auth.admin.getUserById(user.id);
  return data.user?.user_metadata?.tour_pending === true;
}

/**
 * Finished or skipped: it does not start by itself again, on any device. For an account from the
 * Meta ad page the tutorial ends on the plan choice: its panel closes until the payment.
 */
export async function finishTourAction(): Promise<void> {
  const user = await requireUser();
  await createAdminClient().auth.admin.updateUserById(user.id, {
    user_metadata: { tour_pending: false },
  });
  const context = await getBusinessContext();
  if (context?.isOwner && context.business.activation_demo) {
    await endActivationPanel(context.business);
  }
}
