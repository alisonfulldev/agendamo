"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { NICHES } from "@/brands";
import { requireAdmin } from "@/lib/admin";
import { audit } from "@/lib/audit";
import { adminOrderStep } from "@/lib/custom-site/orders";
import { sendAnnouncement } from "@/lib/notifications/announcement";
import { SITE_TEMPLATES, WEB_SITE_TEMPLATES, WEB_STORE_TEMPLATES } from "@/lib/db/types";
import { normalizeBrPhone } from "@/lib/phone";
import { validCnpj, validCpf } from "@/lib/pix";
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
  tier: z.enum(["complete", "site", "web"]),
  cycle: z.enum(["monthly", "yearly"]),
  template: z.enum([...SITE_TEMPLATES, ...WEB_SITE_TEMPLATES, ...WEB_STORE_TEMPLATES]),
  /** "Site ou Loja" (tier "web"): a site or a store. */
  product: z.enum(["site", "store"]).optional(),
  couponCode: z
    .string()
    .trim()
    .max(40)
    .transform((v) => (v ? v.toUpperCase() : null)),
  customSite: z.boolean().default(false),
});

/** The template must match the plan: booking templates, or the site's or the store's ones. */
function templateFits(data: z.infer<typeof saleSchema>): boolean {
  const allowed: readonly string[] =
    data.tier !== "web"
      ? SITE_TEMPLATES
      : data.product === "store"
        ? WEB_STORE_TEMPLATES
        : WEB_SITE_TEMPLATES;
  return allowed.includes(data.template) && (data.tier === "web") === Boolean(data.product);
}

export type SaleActionResult = { ok: true; saleId: string } | { ok: false; message: string };

/** Admin › Vendas › Nova venda: creates the account and the Pix of the first payment. */
export async function createSaleAction(input: unknown): Promise<SaleActionResult> {
  const admin = await requireAdmin();
  const parsed = saleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Confira os campos." };
  }
  if (!templateFits(parsed.data)) return { ok: false, message: "Escolha o modelo do plano." };
  const result = await createAssistedSale(parsed.data, { id: admin.id, email: admin.email });
  if (!result.ok) {
    return {
      ok: false,
      message:
        result.error === "has_business"
          ? "Esse e-mail já tem um negócio no MeetChat. Peça outro e-mail ou fale com a pessoa."
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

/** Admin › Sites personalizados: delivered, finished (after the adjustment) or cancelled. */
export async function customSiteStepAction(
  id: string,
  step: "deliver" | "finish" | "cancel",
): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { ok: false, message: "Pedido inválido." };
  const message = await adminOrderStep(id, step);
  await audit({
    businessId: null,
    userId: admin.id,
    action: "admin.custom_site",
    details: { order: id, step, by: admin.email },
  });
  revalidatePath("/admin/sites");
  return { ok: true, message };
}

/** Admin › Anúncio: sends the one-time "Site + Agenda" e-mail to the accounts that did not get it. */
export async function sendAnnouncementAction(): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdmin();
  const { sent, left } = await sendAnnouncement();
  await audit({
    businessId: null,
    userId: admin.id,
    action: "admin.announcement_sent",
    details: { sent, left, by: admin.email },
  });
  revalidatePath("/admin/anuncio");
  return {
    ok: true,
    message: left
      ? `Enviado para ${sent}. Faltam ${left}: clique de novo.`
      : `Enviado para ${sent}.`,
  };
}
