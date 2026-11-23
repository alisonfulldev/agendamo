"use server";

import { z } from "zod";

import { getCurrentBrand } from "@/brands/server";
import { PARTNER_TERMS } from "@/content/partners";
import { audit } from "@/lib/audit";
import { sendEmailCode, verifyEmailCode } from "@/lib/auth/email-code";
import { encrypt } from "@/lib/crypto";
import { EMAIL_PATTERN } from "@/lib/email-typos";
import { codeFromName } from "@/lib/partners/rules";
import { partnerOfUser } from "@/lib/partners/service";
import { normalizeBrPhone } from "@/lib/phone";
import { validCpf } from "@/lib/pix";
import { rateLimitRequest } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { claimHash } from "@/lib/trial";

const partnerSchema = z.object({
  name: z.string().trim().min(3, "Informe seu nome completo").max(120),
  email: z.string().trim().toLowerCase().max(254).regex(EMAIL_PATTERN, "E-mail inválido"),
  phone: z.string().transform((v, ctx) => {
    const phone = normalizeBrPhone(v);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "WhatsApp inválido" });
      return z.NEVER;
    }
    return phone;
  }),
  cpf: z.string().transform((v, ctx) => {
    const digits = v.replace(/\D/g, "");
    if (!validCpf(digits)) {
      ctx.addIssue({ code: "custom", message: "CPF inválido" });
      return z.NEVER;
    }
    return digits;
  }),
  pixKey: z.string().trim().min(5, "Informe sua chave Pix").max(140),
  acceptedTerms: z.literal(true, "Aceite as regras do programa"),
});

export type PartnerFormResult =
  { ok: true } | { ok: false; message: string; errors?: Record<string, string> };

function invalid(error: z.ZodError): PartnerFormResult {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false, message: "Confira os dados informados.", errors };
}

async function cpfInUse(cpf: string): Promise<boolean> {
  const { count } = await createAdminClient()
    .from("partners")
    .select("id", { count: "exact", head: true })
    .eq("cpf_hash", claimHash("document", cpf)!);
  return (count ?? 0) > 0;
}

/** Step 1: checks the data and sends the 4-digit code to the e-mail. */
export async function sendPartnerCodeAction(input: unknown): Promise<PartnerFormResult> {
  const parsed = partnerSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!(await rateLimitRequest("signUp", `partner:${parsed.data.email}`)))
    return { ok: false, message: "Muitas tentativas. Tente de novo mais tarde." };
  if (await cpfInUse(parsed.data.cpf))
    return {
      ok: false,
      message: "Este CPF já é parceiro. Entre com o e-mail cadastrado.",
      errors: { cpf: "Já cadastrado" },
    };
  const sent = await sendEmailCode(parsed.data.email, await getCurrentBrand(), { create: true });
  if (sent.ok) return { ok: true };
  if (sent.error === "wait")
    return { ok: false, message: `Aguarde ${sent.waitSeconds} segundos para pedir outro código.` };
  return { ok: false, message: "Não foi possível enviar o código. Tente de novo." };
}

/** Unique link code from the name: "mariasouza", "mariasouza2"… */
async function freeCode(name: string): Promise<string> {
  const base = codeFromName(name);
  const admin = createAdminClient();
  for (let i = 0; i < 20; i++) {
    const code = i === 0 ? base : `${base.slice(0, 16)}${i + 1}`;
    const { count } = await admin
      .from("partners")
      .select("id", { count: "exact", head: true })
      .eq("code", code);
    if (!count) return code;
  }
  return `${base.slice(0, 12)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Step 2: checks the code (the session starts) and creates the partner. */
export async function verifyPartnerCodeAction(input: unknown): Promise<PartnerFormResult> {
  const parsed = partnerSchema
    .extend({ code: z.string().regex(/^\d{4}$/, "Digite os 4 números do código") })
    .safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;
  const verified = await verifyEmailCode(data.email, data.code);
  if (!verified.ok)
    return {
      ok: false,
      message: {
        wrong: "Esse código não confere. Confira no e-mail e tente de novo.",
        too_many: "Foram muitas tentativas. Peça um código novo.",
        expired: "Esse código expirou. Peça um código novo.",
      }[verified.error],
    };
  if (await partnerOfUser(verified.userId)) return { ok: true };
  if (await cpfInUse(data.cpf))
    return { ok: false, message: "Este CPF já é parceiro. Entre com o e-mail cadastrado." };

  const code = await freeCode(data.name);
  const { data: created, error } = await createAdminClient()
    .from("partners")
    .insert({
      user_id: verified.userId,
      code,
      name: data.name,
      email: data.email,
      phone: data.phone,
      cpf_encrypted: encrypt(data.cpf),
      pix_key_encrypted: encrypt(data.pixKey),
      email_hash: claimHash("email", data.email),
      phone_hash: claimHash("phone", data.phone),
      cpf_hash: claimHash("document", data.cpf),
      terms_version: PARTNER_TERMS.version,
      terms_accepted_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !created) {
    console.error("partner create failed", error?.message);
    return { ok: false, message: "Não foi possível concluir agora. Tente de novo." };
  }
  await audit({
    businessId: null,
    userId: verified.userId,
    action: "partner.created",
    details: { partner_id: created.id, code, terms_version: PARTNER_TERMS.version },
  });
  return { ok: true };
}
