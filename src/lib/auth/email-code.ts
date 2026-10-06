import "server-only";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import type { BrandConfig } from "@/brands";
import { sendEmail } from "@/lib/email/send";
import { getServerEnv } from "@/lib/env";
import { rateLimitRequest } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Sign-in codes: 4 digits (Supabase only issues 6+), generated and checked here. Only the HMAC of
 * the code is stored; once it matches, the session starts with Supabase's one-time sign-in token.
 */
export const CODE_LENGTH = 4;
export const CODE_TTL_MS = 10 * 60 * 1000;
export const RESEND_AFTER_MS = 30 * 1000;
export const MAX_ATTEMPTS = 5;

export type SendCodeResult =
  | { ok: true; existing: boolean }
  | { ok: false; error: "rate_limited" | "failed" }
  | { ok: false; error: "wait"; waitSeconds: number };

export type VerifyCodeResult =
  { ok: true; userId: string } | { ok: false; error: "expired" | "too_many" | "wrong" };

function codeHash(email: string, code: string): string {
  const env = getServerEnv();
  const secret = env.ENCRYPTION_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  return createHmac("sha256", secret).update(`login-code:${email}:${code}`).digest("base64url");
}

function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Sends a 4-digit sign-in code by our own e-mail, with the code in the subject so it shows in the
 * phone's notification. `create`: makes the account when the e-mail has none (sign-up); otherwise
 * nothing is sent and the answer is the same.
 */
export async function sendEmailCode(
  rawEmail: string,
  brand: BrandConfig,
  { create }: { create: boolean },
): Promise<SendCodeResult> {
  const email = rawEmail.trim().toLowerCase();
  const admin = createAdminClient();

  const { data: last } = await admin
    .from("email_codes")
    .select("sent_at")
    .eq("email", email)
    .maybeSingle();
  if (last) {
    const elapsed = Date.now() - new Date(last.sent_at as string).getTime();
    if (elapsed < RESEND_AFTER_MS) {
      return {
        ok: false,
        error: "wait",
        waitSeconds: Math.ceil((RESEND_AFTER_MS - elapsed) / 1000),
      };
    }
  }
  if (!(await rateLimitRequest("emailCode", `email:${email}`))) {
    return { ok: false, error: "rate_limited" };
  }

  const { data: existing, error: lookupError } = await admin.rpc("email_has_account", {
    p_email: email,
  });
  if (lookupError) {
    console.error("email_has_account failed", lookupError);
    return { ok: false, error: "failed" };
  }
  if (!existing) {
    if (!create) return { ok: true, existing: false };
    const { error } = await admin.auth.admin.createUser({
      email,
      user_metadata: { password_set: false },
    });
    if (error) {
      console.error("createUser failed", error);
      return { ok: false, error: "failed" };
    }
  }

  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const linkToken = data?.properties?.hashed_token;
  if (error || !linkToken) {
    console.error("generateLink (code) failed", error);
    return { ok: false, error: "failed" };
  }
  const code = String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");
  await admin.from("email_codes").upsert(
    {
      email,
      sent_at: new Date().toISOString(),
      attempts: 0,
      code_hash: codeHash(email, code),
      link_token: linkToken,
    },
    { onConflict: "email" },
  );
  await sendEmail({
    brand,
    to: email,
    subject: `Seu código do MeetChat: ${code}`,
    content: {
      preheader: `Seu código: ${code}`,
      heading: "Seu código de acesso",
      code,
      paragraphs: [
        "Digite esse código para continuar. Ele vale por 10 minutos.",
        "Se não foi você que pediu, pode ignorar este e-mail.",
      ],
    },
  });
  return { ok: true, existing: Boolean(existing) };
}

/**
 * Checks a code: valid for 10 minutes, at most 5 tries per code. On success the session starts in
 * this browser (Supabase Auth cookies) and the e-mail counts as confirmed.
 */
export async function verifyEmailCode(rawEmail: string, code: string): Promise<VerifyCodeResult> {
  const email = rawEmail.trim().toLowerCase();
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("email_codes")
    .select("sent_at, attempts, code_hash, link_token")
    .eq("email", email)
    .maybeSingle();
  if (
    !row?.code_hash ||
    !row.link_token ||
    Date.now() - new Date(row.sent_at as string).getTime() > CODE_TTL_MS
  ) {
    return { ok: false, error: "expired" };
  }
  const attempts = row.attempts as number;
  if (attempts >= MAX_ATTEMPTS) return { ok: false, error: "too_many" };
  await admin
    .from("email_codes")
    .update({ attempts: attempts + 1 })
    .eq("email", email);

  if (!sameHash(codeHash(email, code), row.code_hash as string)) {
    return { ok: false, error: attempts + 1 >= MAX_ATTEMPTS ? "too_many" : "wrong" };
  }
  // The code matches: the one-time Supabase token starts the session (and confirms the e-mail).
  await admin.from("email_codes").delete().eq("email", email);
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: row.link_token as string,
    type: "magiclink",
  });
  if (error || !data.user) {
    console.error("verifyOtp (sign-in token) failed", error);
    return { ok: false, error: "expired" };
  }
  return { ok: true, userId: data.user.id };
}
