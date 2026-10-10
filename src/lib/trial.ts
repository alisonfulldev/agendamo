import "server-only";

import { createHash } from "node:crypto";

import { audit } from "@/lib/audit";
import { invalidatePublicPage } from "@/lib/cache";
import type { Business, PaidPlan } from "@/lib/db/types";
import { normalizeBrPhone } from "@/lib/phone";
import { getPlanFeatures, TRIAL_DAYS } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

export type ClaimKind = "email" | "phone" | "document";

/** Same normalization and hash as the backfill in the three_plans migration. */
export function claimHash(kind: ClaimKind, value: string): string | null {
  let normalized: string | null;
  if (kind === "email") normalized = value.trim().toLowerCase() || null;
  else if (kind === "phone") normalized = normalizeBrPhone(value);
  else {
    const digits = value.replace(/\D/g, "");
    normalized = digits.length === 11 || digits.length === 14 ? digits : null;
  }
  return normalized ? createHash("sha256").update(normalized, "utf8").digest("hex") : null;
}

export interface TrialIdentity {
  email?: string | null;
  phone?: string | null;
  /** CPF or CNPJ, when informed. */
  document?: string | null;
}

function claimsOf(identity: TrialIdentity): { kind: ClaimKind; value_hash: string }[] {
  return (["email", "phone", "document"] as const).flatMap((kind) => {
    const value = identity[kind];
    const hash = value ? claimHash(kind, value) : null;
    return hash ? [{ kind, value_hash: hash }] : [];
  });
}

/** True when this e-mail, phone or CPF/CNPJ already used a trial (in any account). */
export async function trialAlreadyUsed(identity: TrialIdentity): Promise<boolean> {
  const claims = claimsOf(identity);
  if (!claims.length) return false;
  const admin = createAdminClient();
  for (const claim of claims) {
    const { data } = await admin
      .from("trial_claims")
      .select("kind")
      .eq("kind", claim.kind)
      .eq("value_hash", claim.value_hash)
      .maybeSingle();
    if (data) return true;
  }
  return false;
}

/** Records the person's data as used (e.g. the CPF/CNPJ informed at checkout). Never fails. */
export async function recordTrialClaims(businessId: string, identity: TrialIdentity) {
  const claims = claimsOf(identity).map((c) => ({ ...c, business_id: businessId }));
  if (!claims.length) return;
  await createAdminClient()
    .from("trial_claims")
    .upsert(claims, { onConflict: "kind,value_hash", ignoreDuplicates: true });
}

export type StartTrialResult =
  | { ok: true; endsAt: string }
  | { ok: false; error: "used" | "subscribed" };

/**
 * Starts the 7-day trial of Agenda or Pro: only once per account and per person (e-mail, phone
 * and CPF/CNPJ when informed). No card. When it ends without payment the account is on Grátis.
 */
export async function startTrial(input: {
  business: Pick<Business, "id" | "slug" | "plan" | "trial_started_at" | "trial_ends_at"> & {
    trial_plan?: Business["trial_plan"];
  };
  plan: PaidPlan;
  identity: TrialIdentity;
  userId: string | null;
  via: "signup" | "panel";
  now?: Date;
}): Promise<StartTrialResult> {
  const now = input.now ?? new Date();
  const features = getPlanFeatures(input.business, now);
  if (features.subscribed) return { ok: false, error: "subscribed" };
  if (!features.trialAvailable) return { ok: false, error: "used" };
  if (await trialAlreadyUsed(input.identity)) return { ok: false, error: "used" };

  const endsAt = new Date(now.getTime() + TRIAL_DAYS * 86_400_000).toISOString();
  const admin = createAdminClient();
  // Only an account that never had a trial (checked again in the update itself).
  const { data, error } = await admin
    .from("businesses")
    .update({ trial_plan: input.plan, trial_started_at: now.toISOString(), trial_ends_at: endsAt })
    .eq("id", input.business.id)
    .is("trial_started_at", null)
    .select("id");
  if (error) throw new Error(`start trial failed: ${error.message}`);
  if (!data?.length) return { ok: false, error: "used" };

  await recordTrialClaims(input.business.id, input.identity);
  invalidatePublicPage(input.business.slug);
  await audit({
    businessId: input.business.id,
    userId: input.userId,
    action: "plan.trial_started",
    details: { plan: input.plan, via: input.via, ends_at: endsAt },
  });
  return { ok: true, endsAt };
}
