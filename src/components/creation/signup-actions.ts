"use server";

import { randomUUID } from "node:crypto";

import QRCode from "qrcode";
import { z } from "zod";

import { getNiche } from "@/brands";
import { brandUrl } from "@/brands/urls";
import { TERMS } from "@/content/legal";
import { audit } from "@/lib/audit";
import { sendEmailCode, verifyEmailCode, type SendCodeResult } from "@/lib/auth/email-code";
import { DEFAULT_HOURS } from "@/lib/business/schemas";
import { checkSlug, isSlugAvailable } from "@/lib/business/slug-check";
import { EMAIL_PATTERN } from "@/lib/email-typos";
import { objectKey } from "@/lib/images/presets";
import { normalizeBrPhone } from "@/lib/phone";
import { rateLimitRequest } from "@/lib/rate-limit";
import { slugify } from "@/lib/slug";
import { copyObject, deleteObject } from "@/lib/storage/r2";
import { createAdminClient } from "@/lib/supabase/admin";

const email = z.string().trim().toLowerCase().max(254).regex(EMAIL_PATTERN);

interface DemoRow {
  id: string;
  name: string;
  brand_key: string;
  niche_description: string | null;
  photo_key: string | null;
  services: { name: string; durationMinutes: number }[];
  suggested_slug: string | null;
  source: Record<string, unknown>;
  consents: { text: string; version: string; at: string }[];
}

async function loadDemo(id: string): Promise<DemoRow | null> {
  const { data } = await createAdminClient()
    .from("demos")
    .select(
      "id, name, brand_key, niche_description, photo_key, services, suggested_slug, source, consents",
    )
    .eq("id", id)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return (data as DemoRow | null) ?? null;
}

/** Sends the sign-up code (the account is created on the first code), after the terms. */
export async function sendSignupCodeAction(
  input: unknown,
): Promise<SendCodeResult | { ok: false; error: "invalid" }> {
  const parsed = z
    .object({ demoId: z.uuid(), email, acceptedTerms: z.literal(true) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const demo = await loadDemo(parsed.data.demoId);
  if (!demo) return { ok: false, error: "invalid" };

  const consent = { text: TERMS.text, version: TERMS.version, at: new Date().toISOString() };
  await createAdminClient()
    .from("demos")
    .update({ consents: [...demo.consents, consent] })
    .eq("id", demo.id);
  return sendEmailCode(parsed.data.email, getNiche(demo.brand_key), { create: true });
}

/** Free link for the business: the suggested one if still free, else a free variation. */
async function freeSlug(demo: DemoRow): Promise<string> {
  if (demo.suggested_slug && (await isSlugAvailable(demo.suggested_slug)))
    return demo.suggested_slug;
  const base = slugify(demo.name) || "minha-agenda";
  const check = await checkSlug(base.length >= 3 ? base : `${base}-agenda`);
  if (check.available) return base;
  if (check.suggestion) return check.suggestion;
  return `${base.slice(0, 30)}-${Math.random().toString(36).slice(2, 6)}`;
}

export type VerifySignupResult =
  | { ok: true; outcome: "created"; name: string; slug: string; pageUrl: string; qr: string }
  | { ok: true; outcome: "has_business" }
  | { ok: false; error: "expired" | "too_many" | "wrong" | "invalid" | "rate_limited" | "failed" };

/**
 * Checks the code (session starts in this browser) and creates the business from the
 * demonstration: name, niche, "o que você faz" as the profile description, default services and
 * hours, and the suggested link. An account that already has a business just signs in.
 */
export async function verifySignupCodeAction(input: unknown): Promise<VerifySignupResult> {
  const parsed = z
    .object({
      demoId: z.uuid(),
      email,
      code: z.string().regex(/^\d{4}$/),
      whatsapp: z.string().max(30).nullable().default(null),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const verified = await verifyEmailCode(parsed.data.email, parsed.data.code);
  if (!verified.ok) return verified;
  const admin = createAdminClient();
  const demo = await loadDemo(parsed.data.demoId);

  const { data: membership } = await admin
    .from("members")
    .select("business_id")
    .eq("user_id", verified.userId)
    .limit(1)
    .maybeSingle();
  if (membership) {
    if (demo) await admin.from("demos").delete().eq("id", demo.id);
    return { ok: true, outcome: "has_business" };
  }
  if (!demo) return { ok: false, error: "invalid" };
  if (!(await rateLimitRequest("accountCreate"))) return { ok: false, error: "rate_limited" };

  const niche = getNiche(demo.brand_key);
  const slug = await freeSlug(demo);
  const { error } = await admin.rpc("create_business", {
    p_user_id: verified.userId,
    p_payload: {
      name: demo.name,
      slug,
      brand_key: niche.key,
      segment: niche.defaultSegment,
      timezone: "America/Sao_Paulo",
      page: { whatsapp_number: normalizeBrPhone(parsed.data.whatsapp) },
      services: demo.services.map((s) => ({
        name: s.name,
        duration_minutes: s.durationMinutes,
        price_cents: 0,
      })),
      hours: DEFAULT_HOURS.map((h) => ({
        weekday: h.weekday,
        start_time: h.start,
        end_time: h.end,
      })),
    },
  });
  if (error) {
    console.error("create_business (conversation) failed", error);
    return { ok: false, error: "failed" };
  }

  const { data: business } = await admin.from("businesses").select("id").eq("slug", slug).single();
  const businessId = business!.id as string;
  if (demo.niche_description) {
    await admin
      .from("businesses")
      .update({ niche_description: demo.niche_description })
      .eq("id", businessId);
    await admin
      .from("page_settings")
      .update({ bio: demo.niche_description })
      .eq("business_id", businessId);
  }
  // The photo added in the conversation becomes the profile photo (copied into the business
  // folder, so deleting the account deletes it too).
  if (demo.photo_key) {
    const avatarKey = objectKey(businessId, "avatar", randomUUID());
    try {
      await copyObject(demo.photo_key, avatarKey);
      await admin
        .from("page_settings")
        .update({ avatar_key: avatarKey })
        .eq("business_id", businessId);
      await deleteObject(demo.photo_key);
    } catch (copyError) {
      console.error("demo photo copy failed", copyError);
    }
  }
  const consent = demo.consents.at(-1);
  await admin.auth.admin.updateUserById(verified.userId, {
    // tour_pending: the panel opens with the first-access tutorial (src/app/painel/tour.tsx).
    user_metadata: {
      terms_version: consent?.version,
      terms_accepted_at: consent?.at,
      tour_pending: true,
    },
  });
  await audit({
    businessId,
    userId: verified.userId,
    action: "business.created",
    details: { via: "conversation", source: demo.source, terms: consent ?? null },
  });
  await admin.from("demos").delete().eq("id", demo.id);

  const pageUrl = brandUrl(niche, `/${slug}`);
  return {
    ok: true,
    outcome: "created",
    name: demo.name,
    slug,
    pageUrl,
    qr: await QRCode.toDataURL(pageUrl, { width: 360, margin: 1 }),
  };
}
