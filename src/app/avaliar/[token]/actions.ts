"use server";

import { z } from "zod";

import { invalidatePublicPage } from "@/lib/cache";
import { rateLimitRequest } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  token: z.string().regex(/^[0-9a-f]{32}$/),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export type ReviewResult = { ok: true; googleUrl: string | null } | { ok: false; message: string };

/** Single-use, verified review: only a completed appointment's customer, once (Prompt 29). */
export async function submitReviewAction(input: unknown): Promise<ReviewResult> {
  if (!(await rateLimitRequest("review")))
    return { ok: false, message: "Muitas tentativas. Tente mais tarde." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Escolha de 1 a 5 estrelas." };

  const admin = createAdminClient();
  // Claim the token atomically: only one submission can win.
  const { data: claimed } = await admin
    .from("review_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token", parsed.data.token)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("business_id, appointment_id")
    .maybeSingle();
  if (!claimed) return { ok: false, message: "Este link já foi usado ou expirou." };

  const { data: appointment } = await admin
    .from("appointments")
    .select("customer_id, status, business:businesses(slug)")
    .eq("id", claimed.appointment_id)
    .single();
  if (!appointment || appointment.status !== "completed")
    return { ok: false, message: "Atendimento não concluído." };

  const { error } = await admin.from("reviews").insert({
    business_id: claimed.business_id,
    appointment_id: claimed.appointment_id,
    customer_id: appointment.customer_id,
    rating: parsed.data.rating,
    comment: parsed.data.comment || null,
  });
  if (error)
    return {
      ok: false,
      message:
        error.code === "23505" ? "Você já avaliou este atendimento." : "Não foi possível salvar.",
    };

  invalidatePublicPage((appointment.business as unknown as { slug: string }).slug);
  let googleUrl: string | null = null;
  if (parsed.data.rating >= 4) {
    const { data: page } = await admin
      .from("page_settings")
      .select("google_review_url")
      .eq("business_id", claimed.business_id)
      .maybeSingle();
    googleUrl = (page?.google_review_url as string | null) ?? null;
  }
  return { ok: true, googleUrl };
}
