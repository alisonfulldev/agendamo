"use server";

import { z } from "zod";

import { reminderStatus, saveCustomerDevice } from "@/lib/push/customer";
import { rateLimitRequest } from "@/lib/rate-limit";

const token = z.string().regex(/^[0-9a-f]{32}$/);

/**
 * "Ativar lembrete": the device's push subscription for the customer of this appointment (by the
 * secret link). A test notification goes right away; tested=false means it did not arrive.
 */
export async function saveReminderDeviceAction(
  input: unknown,
): Promise<
  { ok: true; tested: boolean } | { ok: false; error: "invalid" | "unavailable" | "rate_limited" }
> {
  const parsed = z
    .object({
      token,
      platform: z.enum(["android", "ios", "other"]),
      subscription: z.object({
        endpoint: z.url().max(1000),
        keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(10).max(100) }),
      }),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (!(await rateLimitRequest("publicAction", "reminder-device")))
    return { ok: false, error: "rate_limited" };
  return saveCustomerDevice({
    token: parsed.data.token,
    platform: parsed.data.platform,
    subscription: {
      endpoint: parsed.data.subscription.endpoint,
      p256dh: parsed.data.subscription.keys.p256dh,
      auth: parsed.data.subscription.keys.auth,
    },
  });
}

/**
 * What the reminder step shows: available (plan and server keys), whether the customer already
 * gets reminders on some device (then nothing is asked), and the public key to subscribe.
 */
export async function reminderStatusAction(
  input: unknown,
): Promise<{ available: boolean; active: boolean; vapidPublicKey: string | null }> {
  const parsed = token.safeParse(input);
  if (!parsed.success) return { available: false, active: false, vapidPublicKey: null };
  return reminderStatus(parsed.data);
}
