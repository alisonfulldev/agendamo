"use server";

import { z } from "zod";

import { getNiche } from "@/brands";
import { checkSlug } from "@/lib/business/slug-check";
import { hashedClientIp, rateLimitRequest } from "@/lib/rate-limit";
import { slugify } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";

/** Below this, the form was filled by a robot (the conversation takes a few seconds at least). */
const MIN_ELAPSED_MS = 1500;

const sourceSchema = z
  .object({
    utm_source: z.string().max(100).optional(),
    utm_medium: z.string().max(100).optional(),
    utm_campaign: z.string().max(100).optional(),
    via: z.enum(["direct", "nome", "ramo"]).optional(),
    page: z.string().max(200).optional(),
    referrer: z.string().max(200).optional(),
  })
  .default({});

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  brandKey: z.string().max(40),
  nicheDescription: z.string().trim().max(200).nullable().default(null),
  source: sourceSchema,
  /** Honeypot: hidden field, always empty for people. */
  trap: z.string().max(0),
  elapsedMs: z.number().int().min(MIN_ELAPSED_MS),
});

export type CreateDemoResult =
  | { ok: true; id: string; suggestedSlug: string | null }
  | { ok: false; error: "invalid" | "rate_limited" };

/** Free link for the business name, or a free variation ("nome-2"); null when there is none. */
async function suggestSlug(name: string): Promise<string | null> {
  const candidate = slugify(name);
  const check = await checkSlug(candidate);
  if (check.available) return candidate;
  return check.suggestion ?? null;
}

/**
 * Saves the demonstration built in the creation conversation (no account yet). Rate limited per
 * IP, with a honeypot and a minimum time; expires in 7 days (cleanup cron).
 */
export async function createDemoAction(input: unknown): Promise<CreateDemoResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (!(await rateLimitRequest("demo"))) return { ok: false, error: "rate_limited" };
  const niche = getNiche(parsed.data.brandKey);
  const suggestedSlug = await suggestSlug(parsed.data.name);

  const { data, error } = await createAdminClient()
    .from("demos")
    .insert({
      name: parsed.data.name,
      brand_key: niche.key,
      niche_description: parsed.data.nicheDescription,
      services: niche.suggestedServices,
      suggested_slug: suggestedSlug,
      source: parsed.data.source,
      ip_hash: await hashedClientIp(),
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("demo insert failed", error);
    return { ok: false, error: "invalid" };
  }
  return { ok: true, id: data.id as string, suggestedSlug };
}

/** Counts a test booking of the demonstration (funnel metrics). */
export async function recordTestBookingAction(id: unknown): Promise<void> {
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success || !(await rateLimitRequest("slots", "demo-booking"))) return;
  const admin = createAdminClient();
  const { data } = await admin
    .from("demos")
    .select("test_bookings")
    .eq("id", parsed.data)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!data) return;
  await admin
    .from("demos")
    .update({ test_bookings: (data.test_bookings as number) + 1 })
    .eq("id", parsed.data);
}
