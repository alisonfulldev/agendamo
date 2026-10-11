import "server-only";

import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { type BrandConfig, getNiche } from "@/brands";
import { getPlanFeatures } from "@/lib/plans";
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

export interface RequireOptions {
  /** Pages and actions that stay open in waiting mode (subscription and account). */
  allowWaiting?: boolean;
}

/**
 * Business context, sending users without a business to onboarding. In waiting mode (no trial and
 * no active subscription) everything except the subscription screen and the account is closed:
 * checked by each page and action on the server (rule 6), so it also holds on client navigation.
 */
export async function requireBusiness(options: RequireOptions = {}): Promise<BusinessContext> {
  const context = await getBusinessContext();
  if (!context) redirect("/painel/novo");
  if (!options.allowWaiting && !getPlanFeatures(context.business).active) {
    redirect(context.isOwner ? "/painel/plano" : "/painel/conta");
  }
  return context;
}

/** Owner-only pages and actions. Staff get a 404. */
export async function requireOwner(options: RequireOptions = {}): Promise<BusinessContext> {
  const context = await requireBusiness(options);
  if (!context.isOwner) notFound();
  return context;
}
