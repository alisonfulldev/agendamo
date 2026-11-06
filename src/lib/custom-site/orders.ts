import "server-only";

import type { BrandConfig } from "@/brands";
import { createPixPayment } from "@/lib/billing/asaas";
import { pixOfSinglePayment, subscribePlan, type PixCharge } from "@/lib/billing/service";
import type { Business } from "@/lib/db/types";
import { notifyTeam } from "@/lib/notifications/owner";
import { getPlanFeatures, PLAN_PRICES } from "@/lib/plans";
import { deleteObject } from "@/lib/storage/r2";
import { createAdminClient } from "@/lib/supabase/admin";

import { BRIEFING_MAX_PHOTOS, briefingMissing, briefingSchema, type Briefing } from "./briefing";
import {
  notifyCustomSiteAdmins,
  openOrderOf,
  startProductionIfReady,
  type CustomSiteOrder,
} from "./paid";

/** Price of the custom site for this business: R$ 158 for "Site + Agenda" subscribers, else R$ 197 with the first month. */
export function customSiteOffer(business: Business): {
  kind: "single" | "with_plan" | "upgrade_first";
  priceCents: number;
} {
  const features = getPlanFeatures(business);
  // "Site ou Loja" (2026-11-07): R$ 197, with the first month when not subscribed yet.
  if (features.web) {
    return features.subscribed
      ? { kind: "single", priceCents: PLAN_PRICES.webCustomSite }
      : { kind: "with_plan", priceCents: PLAN_PRICES.web.monthly + PLAN_PRICES.webCustomSite };
  }
  if (features.subscribed && features.tier === "site") {
    return { kind: "single", priceCents: PLAN_PRICES.customSite };
  }
  // A "Completo" subscriber first moves to "Site + Agenda" (the custom site is a site).
  if (features.subscribed) return { kind: "upgrade_first", priceCents: PLAN_PRICES.customSite };
  return { kind: "with_plan", priceCents: PLAN_PRICES.site.monthly + PLAN_PRICES.customSite };
}

const now = () => new Date().toISOString();

async function update(id: string, fields: Partial<CustomSiteOrder>): Promise<void> {
  const { error } = await createAdminClient()
    .from("custom_site_orders")
    .update({ ...fields, updated_at: now() })
    .eq("id", id);
  if (error) throw new Error(`custom site order update failed: ${error.message}`);
}

/** The open order, or a new draft at this business's price. */
export async function ensureOrder(business: Business): Promise<CustomSiteOrder | null> {
  const open = await openOrderOf(business.id);
  if (open) return open;
  const offer = customSiteOffer(business);
  if (offer.kind === "upgrade_first") return null;
  const { data, error } = await createAdminClient()
    .from("custom_site_orders")
    .insert({ business_id: business.id, payment_kind: offer.kind, price_cents: offer.priceCents })
    .select("*")
    .single();
  if (error) {
    // Two tabs at once: the other one created it.
    return openOrderOf(business.id);
  }
  return data as CustomSiteOrder;
}

export type SaveBriefingResult = { ok: true } | { ok: false; error: string };

/** Saves the answers (photos stay as uploaded); `send` also checks what is required. */
export async function saveBriefing(
  business: Business,
  input: unknown,
  send: boolean,
): Promise<SaveBriefingResult> {
  const order = await ensureOrder(business);
  if (!order) return { ok: false, error: "Mude para o plano Site + Agenda primeiro." };
  if (order.briefing_sent_at) return { ok: false, error: "O briefing já foi enviado." };
  const parsed = briefingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Confira as respostas." };
  const briefing: Briefing = { ...parsed.data, photos: order.briefing.photos ?? [] };
  if (send) {
    const missing = briefingMissing(briefing);
    if (missing.length) return { ok: false, error: `Falta responder: ${missing.join(", ")}.` };
  }
  await update(order.id, {
    briefing,
    ...(send ? { briefing_sent_at: now() } : {}),
  });
  if (send) await startProductionIfReady(order.id);
  return { ok: true };
}

/** A photo uploaded for the briefing (image pipeline, kind "briefing"). */
export async function attachBriefingPhoto(businessId: string, key: string): Promise<boolean> {
  const order = await openOrderOf(businessId);
  const photos = order?.briefing.photos ?? [];
  if (!order || order.briefing_sent_at || photos.length >= BRIEFING_MAX_PHOTOS) return false;
  await update(order.id, { briefing: { ...order.briefing, photos: [...photos, key] } });
  return true;
}

export async function removeBriefingPhoto(businessId: string, key: string): Promise<void> {
  const order = await openOrderOf(businessId);
  if (!order || order.briefing_sent_at || !order.briefing.photos?.includes(key)) return;
  await update(order.id, {
    briefing: { ...order.briefing, photos: order.briefing.photos.filter((k) => k !== key) },
  });
  await deleteObject(key);
}

/**
 * Pix of the order: a subscriber pays the creation alone (one-off Pix); anyone else subscribes to
 * "Site + Agenda" with the creation added to the first payment (Pix Automático).
 */
export async function startOrderPayment(input: {
  business: Business;
  brand: BrandConfig;
  userId: string;
  email: string;
  payer: { name: string; cpfCnpj: string } | null;
}): Promise<PixCharge> {
  const order = await ensureOrder(input.business);
  if (!order) throw new Error("upgrade_first");
  if (order.paid_at) throw new Error("already_paid");
  let pix: PixCharge;
  let paymentId: string | null = null;
  if (order.payment_kind === "single") {
    const { data: sub } = await createAdminClient()
      .from("subscriptions")
      .select("provider_customer_id")
      .eq("business_id", input.business.id)
      .maybeSingle();
    if (!sub?.provider_customer_id) throw new Error("no_customer");
    const due = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
    const payment = await createPixPayment({
      customer: sub.provider_customer_id as string,
      valueCents: order.price_cents,
      dueDate: due,
      description: `Site personalizado · ${input.business.name}`,
      externalReference: `${input.business.id}:custom_site:${order.id}`,
    });
    paymentId = payment.id;
    pix = await pixOfSinglePayment(payment);
  } else {
    if (!input.payer) throw new Error("payer_required");
    const result = await subscribePlan({
      business: input.business,
      brand: input.brand,
      userId: input.userId,
      cycle: "monthly",
      extraProfessionals: 0,
      tier: "site",
      payer: { ...input.payer, email: input.email },
      firstExtraCents: PLAN_PRICES.customSite,
    });
    if (result.kind !== "pix") throw new Error("unexpected_change");
    pix = result.pix;
  }
  await update(order.id, {
    payment_id: paymentId,
    pix_payload: pix.payload,
    pix_image: pix.image,
    pix_expires_at: pix.expiresAt,
  });
  return pix;
}

/** The owner asks for the one adjustment included (after the delivery). */
export async function requestAdjustment(business: Business, text: string): Promise<boolean> {
  const order = await openOrderOf(business.id);
  if (!order?.delivered_at || order.adjustment_requested_at) return false;
  await update(order.id, { adjustment_text: text, adjustment_requested_at: now() });
  await notifyCustomSiteAdmins(
    `Ajuste pedido: ${business.name}`,
    "Pedido de ajuste no site personalizado",
    [`${business.name} pediu um ajuste:`, text],
    `/admin/sites/${order.id}`,
  );
  return true;
}

async function orderWithBusiness(id: string) {
  const { data } = await createAdminClient()
    .from("custom_site_orders")
    .select("*, business:businesses(id, name, slug)")
    .eq("id", id)
    .maybeSingle();
  return data as
    (CustomSiteOrder & { business: { id: string; name: string; slug: string } }) | null;
}

/**
 * Admin: the site is live (its template is in the code). "deliver" tells the owner, who can ask
 * for one adjustment; "finish" closes it (after the adjustment, or when none is needed).
 */
export async function adminOrderStep(
  id: string,
  step: "deliver" | "finish" | "cancel",
): Promise<string> {
  const order = await orderWithBusiness(id);
  if (!order) return "Pedido não encontrado.";
  if (step === "cancel") {
    await update(id, { cancelled_at: now() });
    return "Pedido cancelado.";
  }
  if (step === "deliver") {
    if (!order.paid_at) return "O pedido ainda não foi pago.";
    await update(id, { delivered_at: now() });
    await notifyTeam({
      businessId: order.business_id,
      type: "account",
      subject: "Seu site personalizado está no ar 🎉",
      content: {
        heading: "Seu site novo está no ar",
        paragraphs: [
          `O site personalizado de ${order.business.name} ficou pronto e já está no ar.`,
          "Se quiser mudar alguma coisa, você tem 1 rodada de ajustes: peça em Meu site › Site personalizado.",
        ],
        cta: { label: "Ver no painel", url: "/painel/site/personalizado" },
      },
      push: {
        title: "Seu site novo está no ar",
        body: "Confira e peça um ajuste se quiser.",
        url: "/painel/site/personalizado",
      },
    });
    return "Entregue. O cliente foi avisado.";
  }
  await update(id, { finished_at: now() });
  if (order.adjustment_requested_at) {
    await notifyTeam({
      businessId: order.business_id,
      type: "account",
      subject: "Ajuste feito no seu site",
      content: {
        heading: "Ajuste feito",
        paragraphs: ["O ajuste que você pediu no site personalizado já está no ar."],
        cta: { label: "Ver no painel", url: "/painel/site" },
      },
      push: { title: "Ajuste feito no seu site", body: "Já está no ar.", url: "/painel/site" },
    });
  }
  return "Pedido concluído.";
}
