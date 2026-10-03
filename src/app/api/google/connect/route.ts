import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getRequestOrigin } from "@/brands/server";
import { getBusinessContext } from "@/lib/business/context";
import { authorizationUrl, isGoogleConfigured } from "@/lib/google/client";
import { getPlanFeatures } from "@/lib/plans";
import { createSignedToken } from "@/lib/signed-token";
import { createAdminClient } from "@/lib/supabase/admin";

/** Starts Google OAuth for one professional (owner, or the staff member linked to it). */
export async function GET(request: NextRequest) {
  const context = await getBusinessContext();
  const professionalId = z.uuid().safeParse(request.nextUrl.searchParams.get("profissional"));
  if (!context || !professionalId.success)
    return NextResponse.redirect(new URL("/painel/integracoes", request.url));
  if (!isGoogleConfigured() || !getPlanFeatures(context.business).googleCalendar) {
    return NextResponse.redirect(new URL("/painel/integracoes?google=indisponivel", request.url));
  }
  if (!context.isOwner && context.professionalId !== professionalId.data) {
    return NextResponse.redirect(new URL("/painel/integracoes", request.url));
  }
  const { data: professional } = await createAdminClient()
    .from("professionals")
    .select("id")
    .eq("id", professionalId.data)
    .eq("business_id", context.business.id)
    .maybeSingle();
  if (!professional) return NextResponse.redirect(new URL("/painel/integracoes", request.url));

  const origin = await getRequestOrigin();
  const state = createSignedToken({
    p: professionalId.data,
    b: context.business.id,
    u: context.user.id,
    o: origin,
    e: Date.now() + 10 * 60_000,
  });
  return NextResponse.redirect(authorizationUrl(origin, state));
}
