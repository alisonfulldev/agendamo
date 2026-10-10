"use server";

import { randomUUID } from "node:crypto";

import { z } from "zod";

import { getNiche } from "@/brands";
import { checkSlug } from "@/lib/business/slug-check";
import { MAX_UPLOAD_BYTES, UPLOAD_CONTENT_TYPE } from "@/lib/images/presets";
import { hashedClientIp, rateLimitRequest } from "@/lib/rate-limit";
import { slugify } from "@/lib/slug";
import {
  createUploadUrl,
  deleteObject,
  isStorageConfigured,
  objectSize,
  publicUrl,
} from "@/lib/storage/r2";
import { createAdminClient } from "@/lib/supabase/admin";

/** Below this, the form was filled by a robot (the conversation takes a few seconds at least). */
const MIN_ELAPSED_MS = 1500;

const sourceSchema = z
  .object({
    utm_source: z.string().max(100).optional(),
    utm_medium: z.string().max(100).optional(),
    utm_campaign: z.string().max(100).optional(),
    via: z.enum(["direct", "nome", "ramo"]).optional(),
    /** A/B test of the home's top (?v=b). */
    variant: z.enum(["a", "b"]).optional(),
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

const photoSignSchema = z.object({
  demoId: z.uuid(),
  contentType: z.literal(UPLOAD_CONTENT_TYPE),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});

export type DemoPhotoSign =
  | { ok: true; key: string; uploadUrl: string; headers: Record<string, string> }
  | { ok: false; message: string };

/**
 * Presigned upload for the photo of a demonstration (compressed in the browser, sent straight to
 * R2, rule 7). Optional: the owner can also add it later in the panel.
 */
export async function signDemoPhotoAction(input: unknown): Promise<DemoPhotoSign> {
  const parsed = photoSignSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Imagem inválida ou acima de 300 KB." };
  if (!isStorageConfigured()) return { ok: false, message: "Envio de fotos indisponível agora." };
  if (!(await rateLimitRequest("upload", `demo:${parsed.data.demoId}`))) {
    return { ok: false, message: "Muitos envios. Espere um pouco." };
  }
  const { data: demo } = await createAdminClient()
    .from("demos")
    .select("id")
    .eq("id", parsed.data.demoId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!demo) return { ok: false, message: "Recomece a conversa para enviar a foto." };
  const key = `demos/${parsed.data.demoId}/avatar/${randomUUID()}.webp`;
  return {
    ok: true,
    key,
    uploadUrl: await createUploadUrl(key, UPLOAD_CONTENT_TYPE, parsed.data.size),
    headers: {
      "Content-Type": UPLOAD_CONTENT_TYPE,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  };
}

/** Saves the uploaded photo on the demonstration (replacing a previous one). */
export async function saveDemoPhotoAction(
  input: unknown,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const parsed = z.object({ demoId: z.uuid(), key: z.string().max(200) }).safeParse(input);
  if (!parsed.success || !parsed.data.key.startsWith(`demos/${parsed.data.demoId}/avatar/`)) {
    return { ok: false, message: "Não foi possível salvar a foto." };
  }
  const size = await objectSize(parsed.data.key);
  if (!size || size > MAX_UPLOAD_BYTES)
    return { ok: false, message: "A foto não chegou. Tente de novo." };
  const admin = createAdminClient();
  const { data: demo } = await admin
    .from("demos")
    .select("photo_key")
    .eq("id", parsed.data.demoId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!demo) return { ok: false, message: "Recomece a conversa para enviar a foto." };
  await admin.from("demos").update({ photo_key: parsed.data.key }).eq("id", parsed.data.demoId);
  if (demo.photo_key) await deleteObject(demo.photo_key as string).catch(() => undefined);
  return { ok: true, url: publicUrl(parsed.data.key)! };
}
