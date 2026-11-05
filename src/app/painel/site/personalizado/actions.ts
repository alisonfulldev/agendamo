"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AsaasError } from "@/lib/billing/asaas";
import type { PixCharge } from "@/lib/billing/service";
import { requireOwner } from "@/lib/business/context";
import {
  removeBriefingPhoto,
  requestAdjustment,
  saveBriefing,
  startOrderPayment,
} from "@/lib/custom-site/orders";
import { validCnpj, validCpf } from "@/lib/pix";
import { rateLimitRequest } from "@/lib/rate-limit";

const PATH = "/painel/site/personalizado";

/** Saves the briefing; `send` sends it (required answers checked on the server). */
export async function saveBriefingAction(
  input: unknown,
  send: boolean,
): Promise<{ ok: boolean; message: string }> {
  const { business } = await requireOwner();
  const result = await saveBriefing(business, input, Boolean(send));
  revalidatePath(PATH);
  if (!result.ok) return { ok: false, message: result.error };
  return { ok: true, message: send ? "Briefing enviado!" : "Salvo. Continue quando quiser." };
}

export async function removeBriefingPhotoAction(key: string): Promise<void> {
  const { business } = await requireOwner();
  if (typeof key !== "string" || key.length > 300) return;
  await removeBriefingPhoto(business.id, key);
  revalidatePath(PATH);
}

const digits = (v: string) => v.replace(/\D/g, "");
const payerSchema = z
  .object({
    name: z.string().trim().min(3, "Informe o nome completo ou a razão social").max(120),
    cpfCnpj: z.string().transform((v, ctx) => {
      const value = digits(v);
      if (!(validCpf(value) || validCnpj(value))) {
        ctx.addIssue({ code: "custom", message: "CPF ou CNPJ inválido" });
        return z.NEVER;
      }
      return value;
    }),
  })
  .nullable();

/** Pix of the custom site (one-off for subscribers, with the first month otherwise). */
export async function startCustomSitePaymentAction(
  input: unknown,
): Promise<{ ok: true; pix: PixCharge } | { ok: false; message: string }> {
  const { business, brand, user } = await requireOwner();
  if (!(await rateLimitRequest("publicAction", `custom-site:${business.id}`))) {
    return { ok: false, message: "Muitas tentativas. Espere um pouco." };
  }
  const payer = payerSchema.safeParse(input ?? null);
  if (!payer.success) {
    return { ok: false, message: payer.error.issues[0]?.message ?? "Confira os dados." };
  }
  try {
    const pix = await startOrderPayment({
      business,
      brand,
      userId: user.id,
      email: user.email,
      payer: payer.data,
    });
    revalidatePath(PATH);
    return { ok: true, pix };
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    console.error("custom site payment failed", code.slice(0, 120));
    return {
      ok: false,
      message:
        code === "payer_required"
          ? "Informe o nome e o CPF ou CNPJ."
          : code === "already_paid"
            ? "Este pedido já foi pago."
            : error instanceof AsaasError
              ? "O Asaas recusou o pagamento. Confira os dados e tente de novo."
              : "Não foi possível gerar o Pix. Tente de novo.",
    };
  }
}

/** The one adjustment included, after the delivery. */
export async function requestAdjustmentAction(
  text: unknown,
): Promise<{ ok: boolean; message: string }> {
  const { business } = await requireOwner();
  const parsed = z.string().trim().min(10, "Conte o que quer mudar.").max(2000).safeParse(text);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "" };
  const ok = await requestAdjustment(business, parsed.data);
  revalidatePath(PATH);
  return ok
    ? { ok: true, message: "Pedido de ajuste enviado." }
    : { ok: false, message: "Não dá para pedir ajuste agora." };
}
