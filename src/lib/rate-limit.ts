import "server-only";

import { createHmac } from "node:crypto";

import { headers } from "next/headers";

import { isDemoMode } from "@/lib/demo/mode";
import { getServerEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export interface RateLimitRule {
  limit: number;
  windowSeconds: number;
}

/** Named limits so every route uses a reviewed value (see Prompt 40). */
export const RATE_LIMITS = {
  signIn: { limit: 10, windowSeconds: 15 * 60 },
  signUp: { limit: 5, windowSeconds: 60 * 60 },
  passwordReset: { limit: 5, windowSeconds: 60 * 60 },
  bookingRequest: { limit: 5, windowSeconds: 60 * 60 },
  booking: { limit: 20, windowSeconds: 60 * 60 },
  events: { limit: 120, windowSeconds: 60 },
  slots: { limit: 120, windowSeconds: 60 },
  upload: { limit: 60, windowSeconds: 60 * 60 },
  review: { limit: 10, windowSeconds: 60 * 60 },
  publicAction: { limit: 30, windowSeconds: 60 * 60 },
  /** Sign-in / sign-up codes by e-mail (per e-mail and per IP). */
  emailCode: { limit: 6, windowSeconds: 60 * 60 },
  /** Accounts created through the conversation, per IP and day. */
  accountCreate: { limit: 3, windowSeconds: 24 * 60 * 60 },
  /** Demonstrations of the creation conversation (home page). */
  demo: { limit: 10, windowSeconds: 60 * 60 },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitName = keyof typeof RATE_LIMITS;

/** Hashed client IP, for records that must not keep the raw IP (e.g. demos). */
export async function hashedClientIp(): Promise<string> {
  return hashKey(`ip:${await getClientIp()}`);
}

function hashKey(value: string): string {
  const env = getServerEnv();
  const secret = env.ENCRYPTION_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  return createHmac("sha256", secret).update(value).digest("base64url");
}

/** Client IP from proxy headers (Vercel sets x-forwarded-for). Used only hashed. */
export async function getClientIp(): Promise<string> {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Counts a hit and returns true while under the limit. `identifiers` are combined into the key
 * (e.g. IP and e-mail); each is limited separately so rotating one does not bypass the other.
 */
export async function rateLimit(name: RateLimitName, ...identifiers: string[]): Promise<boolean> {
  const rule = RATE_LIMITS[name];
  const supabase = createAdminClient();
  const results = await Promise.all(
    identifiers.map((identifier) =>
      supabase.rpc("check_rate_limit", {
        p_key: hashKey(`${name}:${identifier.toLowerCase()}`),
        // Local demo: everyone is "localhost", so limits are looser to allow repeated tests.
        p_limit: isDemoMode() ? rule.limit * 20 : rule.limit,
        p_window_seconds: rule.windowSeconds,
      }),
    ),
  );
  for (const { data, error } of results) {
    if (error) throw new Error(`Rate limit check failed: ${error.message}`);
    if (data === false) return false;
  }
  return true;
}

/** Rate limit by client IP plus optional extra identifiers. */
export async function rateLimitRequest(name: RateLimitName, ...extra: string[]): Promise<boolean> {
  const ip = await getClientIp();
  return rateLimit(name, `ip:${ip}`, ...extra);
}
