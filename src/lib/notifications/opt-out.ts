import "server-only";

import type { BrandConfig } from "@/brands";
import { brandUrl } from "@/brands/urls";
import { createSignedToken, verifySignedToken } from "@/lib/signed-token";
import { createAdminClient } from "@/lib/supabase/admin";

import { OWNER_NOTIFICATION_TYPES, type OwnerNotificationType } from "./owner-types";

interface OptOutPayload extends Record<string, unknown> {
  u: string;
  t: string;
}

/**
 * One-click opt-out of an owner notification type by e-mail (rule 10, "Novidades e dicas"): the
 * link opens a confirmation page; the List-Unsubscribe header posts to /api/notifications/off.
 */
export function optOutUrl(brand: BrandConfig, userId: string, type: OwnerNotificationType): string {
  const token = createSignedToken({ u: userId, t: type } satisfies OptOutPayload);
  return brandUrl(brand, `/avisos/desligar?t=${encodeURIComponent(token)}`);
}

export function readOptOutToken(
  token: string | null | undefined,
): { userId: string; type: OwnerNotificationType } | null {
  const payload = verifySignedToken<OptOutPayload>(token);
  if (!payload || !(payload.t in OWNER_NOTIFICATION_TYPES)) return null;
  return { userId: payload.u, type: payload.t as OwnerNotificationType };
}

/** Turns off the e-mails of that type for the person (push stays as it was). Idempotent. */
export async function optOut(userId: string, type: OwnerNotificationType): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("notification_preferences")
    .select("push")
    .eq("user_id", userId)
    .eq("type", type)
    .maybeSingle();
  const { error } = await admin
    .from("notification_preferences")
    .upsert({ user_id: userId, type, email: false, push: (data?.push as boolean) ?? true });
  if (error) throw new Error(`opt-out failed: ${error.message}`);
}
