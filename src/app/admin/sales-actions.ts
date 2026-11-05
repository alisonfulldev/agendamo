"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { NICHES } from "@/brands";
import { requireAdmin } from "@/lib/admin";
import { SITE_TEMPLATES } from "@/lib/db/types";
import { normalizeBrPhone } from "@/lib/phone";
import { validCnpj, validCpf } from "@/lib/pix";
import { connectDomain, checkDomain, renewDomain } from "@/lib/domains/jobs";
import { brDomainAvailability, normalizeBrDomain } from "@/lib/domains/registro";
import { createAssistedSale, renewSalePix } from "@/lib/sales/assisted";

const digits = (v: string) => v.replace(/\D/g, "");
const nicheKeys: [string, ...string[]] = ["general", ...NICHES.map((b) => b.key)];

const saleSchema = z.object({
  businessName: z.string().trim().min(2, "Informe o nome do negócio").max(80),
  nicheKey: z.enum(nicheKeys),
  payerName: z.string().trim().min(3, "Informe o nome completo ou a razão social").max(120),
  email: z.email("E-mail inválido").max(254),
  whatsapp: z
    .string()
    .trim()
    .max(30)
    .transform((v) => (v ? normalizeBrPhone(v) : null)),
  cpfCnpj: z.string().transform((v, ctx) => {
    const value = digits(v);
    if (!(validCpf(value) || validCnpj(value))) {
      ctx.addIssue({ code: "custom", message: "CPF ou CNPJ inválido" });
      return z.NEVER;
    }
    return value;
  }),
  tier: z.enum(["complete", "site"]),
  cycle: z.enum(["monthly", "yearly"]),
  template: z.enum(SITE_TEMPLATES),
  couponCode: z
    .string()
    .trim()
    .max(40)
    .transform((v) => (v ? v.toUpperCase() : null)),
  domain: z
    .string()
    .trim()
    .max(253)
    .transform((v, ctx) => {
      if (!v) return null;
      const domain = normalizeBrDomain(v);
      if (!domain) {
        ctx.addIssue({ code: "custom", message: "Domínio inválido. Ex.: studiobela.com.br" });
        return z.NEVER;
      }
      return domain;
    }),
});

export type SaleActionResult = { ok: true; saleId: string } | { ok: false; message: string };

/** Admin › Vendas › Nova venda: creates the account and the Pix of the first payment. */
export async function createSaleAction(input: unknown): Promise<SaleActionResult> {
  const admin = await requireAdmin();
  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Confira os campos." };
  }
  const result = await createAssistedSale(parsed.data, { id: admin.id, email: admin.email });
  if (!result.ok) {
    return {
      ok: false,
      message:
        result.error === "has_business"
          ? "Esse e-mail já tem um negócio no MeetChat. Peça outro e-mail ou fale com a pessoa."
          : result.error === "domain_taken"
            ? "Esse domínio já está ligado a outro negócio."
            : result.error === "coupon_invalid"
              ? "Cupom inválido ou esgotado."
              : "Não foi possível criar a venda. Tente de novo.",
    };
  }
  revalidatePath("/admin/vendas");
  return { ok: true, saleId: result.saleId };
}

/** New Pix when the previous one expired (24 h). */
export async function renewSalePixAction(
  saleId: string,
): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdmin();
  if (!z.uuid().safeParse(saleId).success) return { ok: false, message: "Venda inválida." };
  const ok = await renewSalePix(saleId, { id: admin.id, email: admin.email }).catch((error) => {
    console.error(
      "renew sale pix failed",
      error instanceof Error ? error.message.slice(0, 120) : "",
    );
    return false;
  });
  revalidatePath(`/admin/vendas/${saleId}`);
  return ok
    ? { ok: true, message: "Novo Pix gerado." }
    : { ok: false, message: "Não foi possível gerar o Pix. Tente de novo." };
}

/** Nova venda: is the .br domain free? (Registro.br public lookup) */
export async function domainAvailabilityAction(
  input: string,
): Promise<{ domain: string | null; status: "available" | "taken" | "unknown" | "invalid" }> {
  await requireAdmin();
  const domain = normalizeBrDomain(String(input ?? ""));
  if (!domain) return { domain: null, status: "invalid" };
  return { domain, status: await brDomainAvailability(domain) };
}

type DomainStep = "connect" | "check" | "renew";

/** Admin › Vendas › Domínios: "Já registrei, conectar", "Verificar agora" and "Renovei". */
export async function domainStepAction(
  id: string,
  step: DomainStep,
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Domínio inválido." };
  const result =
    step === "connect"
      ? await connectDomain(id)
      : step === "check"
        ? await checkDomain(id)
        : await renewDomain(id).then(() => ({
            ok: true,
            message: "Renovação registrada (+1 ano).",
          }));
  revalidatePath("/admin/vendas/dominios");
  return result;
}
