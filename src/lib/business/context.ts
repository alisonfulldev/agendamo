import "server-only";

import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { type BrandConfig, getNiche } from "@/brands";
import { LOCK_TEXT } from "@/content/plan-locks";
import { getPlanFeatures, type LockedFeature } from "@/lib/plans";
import { requireUser, type SessionUser } from "@/lib/auth/session";
import type { Business, Member } from "@/lib/db/types";
import { createClient } from "@/lib/supabase/server";

export interface BusinessContext {
  user: SessionUser;
  business: Business;
  /** Brand of the business (not of the domain being visited). */
  brand: BrandConfig;
  role: Member["role"];
  /** Set for staff: the professional they manage. */
  professionalId: string | null;
  isOwner: boolean;
}

/** First membership of the signed-in user, or null before onboarding. Cached per request. */
export const getBusinessContext = cache(async (): Promise<BusinessContext | null> => {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("members")
    .select("role, professional_id, business:businesses(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Could not load membership: ${error.message}`);
  if (!data?.business) return null;

  const business = data.business as unknown as Business;
  return {
    user,
    business,
    brand: getNiche(business.brand_key),
    role: data.role as Member["role"],
    professionalId: (data.professional_id as string | null) ?? null,
    isOwner: data.role === "owner",
  };
});

/**
 * Business context, sending users without a business to onboarding. The panel always opens: on
 * the Grátis plan, paid pages show a lock (lockedFeature / LockedPage) and paid actions refuse on
 * the server (hasFeature).
 */
export async function requireBusiness(): Promise<BusinessContext> {
  const context = await getBusinessContext();
  if (!context) redirect("/painel/novo");
  return context;
}

/** True when the business's plan includes the feature (checked on the server, rule 6). */
export function hasFeature(business: Business, feature: LockedFeature): boolean {
  return getPlanFeatures(business)[feature];
}

/** Server actions and routes of a paid feature: refused on the Grátis plan (rule 6). */
export async function requireFeature(feature: LockedFeature): Promise<BusinessContext> {
  const context = await requireBusiness();
  if (!hasFeature(context.business, feature)) throw new Error(LOCK_TEXT.denied);
  return context;
}

/** Owner-only pages and actions. Staff get a 404. */
export async function requireOwner(): Promise<BusinessContext> {
  const context = await requireBusiness();
  if (!context.isOwner) notFound();
  return context;
}
