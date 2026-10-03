"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { getBusinessContext } from "@/lib/business/context";
import { invalid, type FormState } from "@/lib/forms";
import { rateLimitRequest } from "@/lib/rate-limit";
import { businessPrefix, deletePrefix } from "@/lib/storage/r2";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Informe a senha atual."),
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(72),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "As senhas não conferem.",
  });

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, formData);
  if (!(await rateLimitRequest("signIn", `email:${user.email}`))) {
    return { ok: false, message: "Muitas tentativas. Espere alguns minutos." };
  }

  const supabase = await createClient();
  const check = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current,
  });
  if (check.error) return { ok: false, errors: { current: "Senha atual incorreta." } };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      ok: false,
      message:
        error.code === "same_password"
          ? "A nova senha precisa ser diferente da atual."
          : error.message,
    };
  }
  return { ok: true, message: "Senha alterada." };
}

/**
 * Deletes the account. Owners confirm by typing the slug: the business, all its data (cascade)
 * and its R2 images are removed, and the action is written to audit_log first.
 */
export async function deleteAccountAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const context = await getBusinessContext();
  const confirmation = String(formData.get("confirmation") ?? "")
    .trim()
    .toLowerCase();
  const expected = context?.isOwner ? context.business.slug : "excluir";
  if (confirmation !== expected) {
    return { ok: false, errors: { confirmation: `Digite “${expected}” para confirmar.` } };
  }

  const admin = createAdminClient();
  if (context?.isOwner) {
    const { business } = context;
    await audit({
      businessId: business.id,
      userId: user.id,
      action: "account.deleted",
      details: {
        business_id: business.id,
        slug: business.slug,
        name: business.name,
        brand_key: business.brand_key,
      },
    });
    await deletePrefix(businessPrefix(business.id));
    const { error } = await admin.from("businesses").delete().eq("id", business.id);
    if (error) return { ok: false, message: "Não foi possível excluir agora. Tente de novo." };
  } else {
    await audit({
      businessId: context?.business.id ?? null,
      userId: user.id,
      action: "account.deleted",
    });
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error)
    return { ok: false, message: "Não foi possível excluir a conta agora. Tente de novo." };

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/?conta=excluida");
}
