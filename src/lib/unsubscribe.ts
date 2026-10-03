import "server-only";

import type { BrandConfig } from "@/brands";
import { brandUrl } from "@/brands/urls";
import { createSignedToken, verifySignedToken } from "@/lib/signed-token";
import { createAdminClient } from "@/lib/supabase/admin";

interface UnsubscribePayload extends Record<string, unknown> {
  e: string;
  b: string;
}

/** Link for marketing e-mails (rule 10). The page confirms; the List-Unsubscribe header posts directly. */
export function unsubscribeUrl(brand: BrandConfig, email: string, businessId: string): string {
  const token = createSignedToken({
    e: email.toLowerCase(),
    b: businessId,
  } satisfies UnsubscribePayload);
  return brandUrl(brand, `/descadastrar?t=${encodeURIComponent(token)}`);
}

export function readUnsubscribeToken(
  token: string | null | undefined,
): { email: string; businessId: string } | null {
  const payload = verifySignedToken<UnsubscribePayload>(token);
  return payload ? { email: payload.e, businessId: payload.b } : null;
}

/** Records the opt-out and turns off marketing for that e-mail in the business. Idempotent. */
export async function unsubscribe(email: string, businessId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("email_unsubscribes")
    .upsert(
      { email, business_id: businessId },
      { onConflict: "email,business_id", ignoreDuplicates: true },
    );
  await admin
    .from("customers")
    .update({ marketing_opt_in: false })
    .eq("business_id", businessId)
    .ilike("email", email);
}

/** True when the e-mail may receive marketing from this business. */
export async function canSendMarketing(email: string, businessId: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("email_unsubscribes")
    .select("id")
    .eq("business_id", businessId)
    .ilike("email", email)
    .maybeSingle();
  return !data;
}
