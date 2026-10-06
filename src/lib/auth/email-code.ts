import "server-only";

import type { BrandConfig } from "@/brands";
import { sendEmail } from "@/lib/email/send";
import { rateLimitRequest } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Our rules on top of Supabase Auth's e-mail code. */
export const CODE_TTL_MS = 10 * 60 * 1000;
export const RESEND_AFTER_MS = 30 * 1000;
export const MAX_ATTEMPTS = 5;

export type SendCodeResult =
  | { ok: true; existing: boolean }
  | { ok: false; error: "rate_limited" | "failed" }
  | { ok: false; error: "wait"; waitSeconds: number };

export type VerifyCodeResult =
  { ok: true; userId: string } | { ok: false; error: "expired" | "too_many" | "wrong" };

/**
 * Sends a 6-digit sign-in code (Supabase Auth e-mail OTP, delivered by our own e-mail with the
 * code in the subject so it shows in the phone's notification). `create`: makes the account when
 * the e-mail has none (sign-up); otherwise nothing is sent and the answer is the same.
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
  const code = data?.properties?.email_otp;
  if (error || !code) {
    console.error("generateLink (code) failed", error);
    return { ok: false, error: "failed" };
  }
  await admin
    .from("email_codes")
    .upsert({ email, sent_at: new Date().toISOString(), attempts: 0 }, { onConflict: "email" });
  await sendEmail({
    brand,
    to: email,
    subject: `Seu código do Agendamo: ${code}`,
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
    .select("sent_at, attempts")
    .eq("email", email)
    .maybeSingle();
  if (!row || Date.now() - new Date(row.sent_at as string).getTime() > CODE_TTL_MS) {
    return { ok: false, error: "expired" };
  }
  const attempts = row.attempts as number;
  if (attempts >= MAX_ATTEMPTS) return { ok: false, error: "too_many" };
  await admin
    .from("email_codes")
    .update({ attempts: attempts + 1 })
    .eq("email", email);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  if (error || !data.user) {
    return { ok: false, error: attempts + 1 >= MAX_ATTEMPTS ? "too_many" : "wrong" };
  }
  await admin.from("email_codes").delete().eq("email", email);
  return { ok: true, userId: data.user.id };
}
