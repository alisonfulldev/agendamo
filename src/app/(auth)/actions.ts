"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentBrand, getRequestOrigin } from "@/brands/server";
import { sendEmailCode, verifyEmailCode } from "@/lib/auth/email-code";
import { safeNextPath } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email/send";
import {
  confirmSignupEmail,
  existingAccountEmail,
  resetPasswordEmail,
} from "@/lib/email/templates/auth";
import { invalid, type FormState } from "@/lib/forms";
import { rateLimitRequest } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const email = z.email("Informe um e-mail válido.").trim().toLowerCase();
const password = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .max(72, "A senha pode ter no máximo 72 caracteres.");

const TOO_MANY = "Muitas tentativas. Espere alguns minutos e tente de novo.";

/** Link to /auth/confirm on the domain the visitor is on (brand domain in production). */
async function confirmUrl(tokenHash: string, type: string, next: string) {
  const url = new URL("/auth/confirm", await getRequestOrigin());
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", type);
  url.searchParams.set("next", next);
  return url.toString();
}

// ---------------------------------------------------------------------------

const signUpSchema = z.object({
  email,
  password,
  terms: z.literal("on", { error: "Aceite os termos para continuar." }),
});

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { email, password } = parsed.data;

  if (!(await rateLimitRequest("signUp", `email:${email}`)))
    return { ok: false, message: TOO_MANY };

  const brand = await getCurrentBrand();
  const origin = await getRequestOrigin();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: "signup", email, password });

  if (error) {
    // Do not reveal whether the e-mail exists: tell the owner by e-mail instead.
    if (
      error.code === "email_exists" ||
      error.code === "user_already_exists" ||
      error.status === 422
    ) {
      const mail = existingAccountEmail(brand, `${origin}/entrar`, `${origin}/recuperar-senha`);
      await sendEmail({ brand, to: email, ...mail });
    } else {
      console.error("signUp generateLink failed", error);
      return {
        ok: false,
        message: "Não foi possível criar a conta agora. Tente de novo em instantes.",
      };
    }
  } else {
    const url = await confirmUrl(data.properties.hashed_token, "signup", "/painel");
    await sendEmail({ brand, to: email, ...confirmSignupEmail(brand, url) });
  }

  return {
    ok: true,
    message: `Enviamos um link de confirmação para ${email}. Abra seu e-mail para continuar.`,
  };
}

// ---------------------------------------------------------------------------

const signInSchema = z.object({
  email,
  password: z.string().min(1, "Informe sua senha."),
  next: z.string().optional(),
});

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { email, password, next } = parsed.data;

  if (!(await rateLimitRequest("signIn", `email:${email}`))) {
    return { ok: false, message: TOO_MANY, values: { email } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message =
      error.code === "email_not_confirmed"
        ? "Confirme seu e-mail antes de entrar. Procure o link na sua caixa de entrada."
        : "E-mail ou senha incorretos.";
    return { ok: false, message, values: { email } };
  }

  redirect(safeNextPath(next));
}

// ---------------------------------------------------------------------------

const resetSchema = z.object({ email });

export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  const { email } = parsed.data;

  if (!(await rateLimitRequest("passwordReset", `email:${email}`)))
    return { ok: false, message: TOO_MANY };

  const brand = await getCurrentBrand();
  const { data, error } = await createAdminClient().auth.admin.generateLink({
    type: "recovery",
    email,
  });
  // Same answer whether or not the account exists.
  if (!error && data.properties?.hashed_token) {
    const url = await confirmUrl(data.properties.hashed_token, "recovery", "/redefinir-senha");
    await sendEmail({ brand, to: email, ...resetPasswordEmail(brand, url) });
  }

  return {
    ok: true,
    message:
      "Se existir uma conta com esse e-mail, você vai receber um link para redefinir a senha.",
  };
}

// ---------------------------------------------------------------------------

const newPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "As senhas não conferem.",
  });

/** After a recovery link: the user has a session and sets a new password. */
export async function updatePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      ok: false,
      message:
        error.code === "same_password"
          ? "A nova senha precisa ser diferente da atual."
          : "O link expirou. Peça um novo em “Esqueci minha senha”.",
    };
  }
  redirect("/painel?senha=alterada");
}

/** Signs out; an optional "next" field keeps the person on that page (e.g. /cadastro). */
export async function signOutAction(formData?: FormData): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(safeNextPath(formData?.get("next"), "/entrar"));
}

// ---------------------------------------------------------------------------
// Sign-in by e-mail code (default on /entrar; password stays as an option).

export type LoginCodeResult = { ok: true } | { ok: false; message: string; waitSeconds?: number };

/** Sends a sign-in code. Same answer whether or not the e-mail has an account. */
export async function sendLoginCodeAction(input: unknown): Promise<LoginCodeResult> {
  const parsed = z.object({ email }).safeParse(input);
  if (!parsed.success) return { ok: false, message: "Informe um e-mail válido." };
  const result = await sendEmailCode(parsed.data.email, await getCurrentBrand(), {
    create: false,
  });
  if (result.ok) return { ok: true };
  if (result.error === "wait") {
    return {
      ok: false,
      message: `Espere ${result.waitSeconds} segundos para pedir outro código.`,
      waitSeconds: result.waitSeconds,
    };
  }
  return {
    ok: false,
    message: result.error === "rate_limited" ? TOO_MANY : "Não foi possível enviar agora.",
  };
}

/** Checks the code; on success the session starts and the page goes to `next` (or the panel). */
export async function verifyLoginCodeAction(
  input: unknown,
): Promise<{ ok: true; next: string } | { ok: false; message: string }> {
  const parsed = z
    .object({ email, code: z.string().regex(/^\d{6}$/), next: z.string().optional() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, message: "Digite os 6 números do código." };
  const result = await verifyEmailCode(parsed.data.email, parsed.data.code);
  if (result.ok) return { ok: true, next: safeNextPath(parsed.data.next) };
  return {
    ok: false,
    message: {
      wrong: "Esse código não confere. Confira no e-mail e tente de novo.",
      too_many: "Foram muitas tentativas. Peça um código novo.",
      expired: "Esse código expirou. Peça um código novo.",
    }[result.error],
  };
}
