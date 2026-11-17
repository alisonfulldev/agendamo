import "server-only";

import { after } from "next/server";

import { audit } from "@/lib/audit";
import { invalidatePublicPage } from "@/lib/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordTrialClaims, type TrialIdentity } from "@/lib/trial";

/**
 * Meta ad page (/ativar, 2026-11-17): the account is real from the start, but instead of the
 * 14-day trial it gets a "demonstration": the agenda works only until the owner books herself as a
 * customer (at most this long). Right after that test booking the account is in waiting mode
 * (requests go to the WhatsApp) until she pays. No new state in the plan rules: the demonstration
 * is a short trial window (trial_started_at / trial_ends_at) on an account marked activation_demo.
 */
export const ACTIVATION_DEMO_MINUTES = 60;

/**
 * Starts the demonstration of a just-created account. The person's e-mail and phone count as a
 * used trial, so the 14 days of the normal sign-up are not available afterwards.
 */
export async function startActivationDemo(input: {
  businessId: string;
  identity: TrialIdentity;
  userId: string;
  now?: Date;
}): Promise<void> {
  const now = input.now ?? new Date();
  const endsAt = new Date(now.getTime() + ACTIVATION_DEMO_MINUTES * 60_000).toISOString();
  const { error } = await createAdminClient()
    .from("businesses")
    .update({
      activation_demo: true,
      trial_started_at: now.toISOString(),
      trial_ends_at: endsAt,
    })
    .eq("id", input.businessId)
    .is("trial_started_at", null);
  if (error) throw new Error(`activation demo failed: ${error.message}`);
  await recordTrialClaims(input.businessId, input.identity);
  await audit({
    businessId: input.businessId,
    userId: input.userId,
    action: "plan.activation_demo_started",
    details: { ends_at: endsAt },
  });
}

/**
 * The owner's test booking was made: the demonstration ends now (the booking stays valid, with
 * its confirmation e-mail already sent). Only for a demonstration account still without payment;
 * any other business is untouched. Never fails the booking.
 */
export async function endActivationDemo(business: { id: string; slug: string }): Promise<void> {
  try {
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
    // After the response: revalidating inside the booking action would reload the customer's
    // page and hide her confirmation screen.
    after(() => invalidatePublicPage(business.slug));
    await audit({
      businessId: business.id,
      userId: null,
      action: "plan.activation_demo_ended",
      details: { reason: "test_booking" },
    });
  } catch (error) {
    console.error("end activation demo failed", error instanceof Error ? error.message : error);
  }
}
