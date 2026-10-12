"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { isPlatformAdmin } from "@/lib/admin";
import { audit } from "@/lib/audit";
import type { FormState } from "@/lib/forms";
import { rateLimitRequest } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(200),
});

const WRONG = "E-mail ou senha incorretos.";

/**
 * /admin/entrar: e-mail and password only (no code). Anyone who is not a platform admin gets the
 * same message as a wrong password, and is signed out again.
 */
export async function adminSignInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: WRONG };
  const { email, password } = parsed.data;
  if (!(await rateLimitRequest("signIn", `admin:${email}`))) {
    return { ok: false, message: "Muitas tentativas. Espere alguns minutos e tente de novo." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, message: WRONG, values: { email } };
  const user = { id: data.user.id, email: data.user.email ?? email };
  if (!(await isPlatformAdmin(user))) {
    await supabase.auth.signOut();
    return { ok: false, message: WRONG, values: { email } };
  }
  await audit({ businessId: null, userId: user.id, action: "admin.signed_in" });
  redirect("/admin");
}
