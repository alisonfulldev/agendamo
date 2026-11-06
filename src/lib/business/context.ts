import "server-only";

import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { cache } from "react";

import { type BrandConfig, getNiche } from "@/brands";
import { getPlanFeatures } from "@/lib/plans";
import { requireUser, type SessionUser } from "@/lib/auth/session";
import type { Business, Member } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";
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

const SEEN_EVERY_MS = 60 * 60 * 1000;

/**
 * Last panel visit of the owner, for the admin list of businesses. At most once an hour, after the
 * response (never slows the page down) and with the service role (owners cannot write it).
 */
function recordOwnerSeen(business: Business) {
  const last = business.owner_last_seen_at ? Date.parse(business.owner_last_seen_at) : 0;
  if (Date.now() - last < SEEN_EVERY_MS) return;
  after(async () => {
    const { error } = await createAdminClient()
      .from("businesses")
      .update({ owner_last_seen_at: new Date().toISOString() })
      .eq("id", business.id);
    if (error) console.error("owner last seen update failed", error.message);
  });
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
  if (data.role === "owner") recordOwnerSeen(business);
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
  /** Pages and actions of the "Site ou Loja" panel (/painel/web). */
  web?: boolean;
  /** Shared actions (image uploads): both the booking and the "Site ou Loja" accounts. */
  anyProduct?: boolean;
}

/**
 * Business context, sending users without a business to onboarding. In waiting mode (no trial and
 * no active subscription) everything except the subscription screen and the account is closed:
 * checked by each page and action on the server (rule 6), so it also holds on client navigation.
 */
export async function requireBusiness(options: RequireOptions = {}): Promise<BusinessContext> {
  const context = await getBusinessContext();
  if (!context) redirect("/painel/novo");
  // "Site ou Loja" accounts only have their own panel (plus the subscription and the account);
  // booking accounts never open it.
  const web = (context.business.product ?? "booking") !== "booking";
  if (!options.anyProduct) {
    if (web && !options.web && !options.allowWaiting) redirect("/painel/web");
    if (!web && options.web) redirect("/painel");
  }
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
