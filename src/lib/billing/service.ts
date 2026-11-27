import "server-only";

import { getNiche, type BrandConfig } from "@/brands";
import { audit } from "@/lib/audit";
import { invalidatePublicPage } from "@/lib/cache";
import type { Business, Subscription } from "@/lib/db/types";
import { isDemoMode } from "@/lib/demo/mode";
import { claimNotification, notifyTeam } from "@/lib/notifications/owner";
import {
  PLAN_PRICES,
  reais,
  subscriptionPrice,
  TIER_NAME,
  tierRank,
  type Cycle,
  type Tier,
} from "@/lib/plans";
import { cancelPartnerCommission, recordPartnerCommission } from "@/lib/partners/service";
import { recordTrialClaims } from "@/lib/trial";
import { markPlanOrderPaid, markSingleOrderPaid } from "@/lib/custom-site/paid";
import { completeAssistedSale } from "@/lib/sales/assisted-paid";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  cancelPixAutomaticAuthorization,
  createCustomer,
  createPixAutomaticAuthorization,
  createSubscription,
  deleteSubscription,
  getPixAutomaticAuthorization,
  getPixQrCode,
  listSubscriptionPayments,
  updateSubscription,
  type AsaasCycle,
  type AsaasPayment,
  type AsaasPixAutomaticAuthorization,
} from "./asaas";

export type { Cycle };

const CYCLES: Record<Cycle, AsaasCycle> = { monthly: "MONTHLY", yearly: "YEARLY" };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function addPeriod(date: string, cycle: Cycle): string {
  const d = new Date(`${date}T12:00:00Z`);
  if (cycle === "yearly") d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString();
}

async function loadSubscription(businessId: string): Promise<Subscription | null> {
  const { data } = await createAdminClient()
    .from("subscriptions")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  return (data as Subscription | null) ?? null;
}

async function ensureCustomer(
  business: Business,
  existing: Subscription | null,
  payer: { name: string; cpfCnpj: string; email: string },
): Promise<string> {
  if (existing?.provider_customer_id) return existing.provider_customer_id;
  const customer = await createCustomer({
    name: payer.name,
    cpfCnpj: payer.cpfCnpj,
    email: payer.email,
    externalReference: business.id,
  });
  return customer.id;
}

export interface PixCharge {
  /** data:image/png;base64,… */
  image: string;
  payload: string;
  expiresAt: string;
  valueCents: number;
  /** Paying this QR also authorizes the Pix Automático (next charges debited by themselves). */
  automatic: boolean;
}

export type SubscribeResult =
  { kind: "changed"; reauthorize: boolean } | { kind: "pix"; pix: PixCharge };

const dateOnly = (iso: string) => iso.slice(0, 10);
const cents = (reais: number) => Math.round(reais * 100);

function planDescription(
  brandName: string,
  cycle: Cycle,
  extras: number,
  tier: Tier = "complete",
): string {
  return `${brandName} ${TIER_NAME[tier]} · ${cycle === "yearly" ? "anual" : "mensal"}${
    extras > 0 ? ` · ${extras + 1} profissionais` : ""
  }`;
}

/** Recurring value of a row (coupon included when known). */
function recurringValue(row: Subscription): number {
  return (
    row.value_cents ??
    subscriptionPrice(row.billing_cycle, row.extra_professionals ?? 0, 0, row.tier ?? "complete")
  );
}

/**
 * Date the period being paid starts from: today for a new subscription, the current period end
 * for a renewal (paying late keeps the schedule, as the regular Asaas subscription does).
 */
export function periodBase(
  row: Pick<Subscription, "status" | "current_period_end">,
  now: string = today(),
): string {
  const renewing = row.status === "active" || row.status === "overdue";
  return renewing && row.current_period_end ? dateOnly(row.current_period_end) : now;
}

/** Pix of a one-off charge (custom site of a subscriber). */
export function pixOfSinglePayment(payment: AsaasPayment): Promise<PixCharge> {
  return pixOfPayment(payment);
}

async function pixOfPayment(payment: AsaasPayment): Promise<PixCharge> {
  const qr = await getPixQrCode(payment.id);
  return {
    image: `data:image/png;base64,${qr.encodedImage}`,
    payload: qr.payload,
    expiresAt: qr.expirationDate,
    valueCents: cents(payment.value),
    automatic: false,
  };
}

async function pixOfPendingPayment(subscriptionId: string): Promise<PixCharge | null> {
  const payments = await listSubscriptionPayments(subscriptionId);
  const pending = payments.find((p) => p.status === "PENDING" || p.status === "OVERDUE");
  return pending ? pixOfPayment(pending) : null;
}

function pixOfAuthorization(
  authorization: AsaasPixAutomaticAuthorization,
  firstValueCents: number,
): PixCharge {
  const image = authorization.encodedImage ?? authorization.immediateQrCode?.encodedImage;
  const payload = authorization.payload ?? authorization.immediateQrCode?.payload;
  if (!image || !payload) throw new Error("pix_unavailable");
  return {
    image: `data:image/png;base64,${image}`,
    payload,
    expiresAt:
      authorization.immediateQrCode?.expirationDate ??
      new Date(Date.now() + 86_400_000).toISOString(),
    valueCents: firstValueCents,
    automatic: true,
  };
}

/**
 * New Pix Automático authorization for a row: its QR pays the current period (new subscription or
 * open renewal) and authorizes the next charges, debited from the end of that period. Any earlier
 * authorization still waiting for payment is cancelled, so there is never more than one.
 */
async function startPixAutomatic(
  row: Subscription,
  input: { brandName: string; valueCents: number; firstValueCents: number },
): Promise<{ authorization: AsaasPixAutomaticAuthorization; pix: PixCharge }> {
  if (!row.provider_customer_id) throw new Error("no_customer");
  if (row.pix_automatic_id && row.pix_automatic_status === "created") {
    await cancelPixAutomaticAuthorization(row.pix_automatic_id).catch(() => undefined);
  }
  const authorization = await createPixAutomaticAuthorization({
    customerId: row.provider_customer_id,
    valueCents: input.valueCents,
    firstValueCents: input.firstValueCents,
    cycle: CYCLES[row.billing_cycle],
    startDate: dateOnly(addPeriod(periodBase(row), row.billing_cycle)),
    description: planDescription(
      input.brandName,
      row.billing_cycle,
      row.extra_professionals ?? 0,
      row.tier ?? "complete",
    ),
  });
  return { authorization, pix: pixOfAuthorization(authorization, input.firstValueCents) };
}

/**
 * Own checkout (Asaas behind the scenes), Pix only (2026-10-28). A new subscription gets a Pix
 * Automático QR: paying it starts the plan (cycle from that day, no proportional charge) and
 * authorizes the next charges. On an active subscription, cycle and extra professionals change
 * from the next charge; with the Pix Automático active, a new value cancels the authorization
 * (the payer only authorized the old one) and the next charge is paid by QR, authorizing again.
 */
export async function subscribePlan(input: {
  business: Business;
  brand: BrandConfig;
  userId: string;
  cycle: Cycle;
  extraProfessionals: number;
  /** "complete" (chat + agenda), "site" (+ the landing page) or "premium" (+ deposit and reminders). */
  tier?: Tier;
  payer: { name: string; cpfCnpj: string; email: string };
  couponCode?: string | null;
  /** Added to the first payment only (the custom site's creation in a sale). */
  firstExtraCents?: number;
}): Promise<SubscribeResult> {
  const tier: Tier = input.tier ?? "complete";
  const admin = createAdminClient();
  const existing = await loadSubscription(input.business.id);
  const extras = Math.max(0, Math.min(49, Math.floor(input.extraProfessionals)));
  const seats = extras + 1;
  const description = planDescription(input.brand.name, input.cycle, extras, tier);

  let discount = 0;
  // Accounts from a partner link pay full price (the partner earns the first payment).
  if (input.couponCode && input.business.partner_id) throw new Error("coupon_invalid");
  if (input.couponCode) {
    const { data } = await admin.rpc("redeem_platform_coupon", {
      p_code: input.couponCode,
      p_brand_key: input.brand.key,
    });
    if (data === null || data === undefined) throw new Error("coupon_invalid");
    discount = data as number;
  }
  const value = subscriptionPrice(input.cycle, extras, discount, tier);
  // The CPF/CNPJ informed here also counts for the one-trial-per-person rule.
  await recordTrialClaims(input.business.id, {
    email: input.payer.email,
    document: input.payer.cpfCnpj,
  }).catch(() => undefined);

  // Change on an active subscription: update it and apply the seats right away.
  if (existing && (existing.status === "active" || existing.status === "overdue")) {
    // Between the first payment of a renewal by QR and the bank's confirmation there is no
    // subscription to change yet (a few minutes at most).
    if (!existing.provider_subscription_id) throw new Error("automatic_pending");
    const sameTerms = value === recurringValue(existing) && input.cycle === existing.billing_cycle;
    const reauthorize = existing.pix_automatic_status === "active" && !sameTerms;
    if (reauthorize) {
      // The new value applies from the next charge, paid by QR (which authorizes again).
      await fallbackToRegularPix(existing, {
        valueCents: value,
        cycle: input.cycle,
        description,
        status: "cancelled",
        notify: false,
      });
    } else {
      // The new value applies from the next charge (no proportional charge now).
      await updateSubscription(existing.provider_subscription_id, {
        valueCents: value,
        cycle: CYCLES[input.cycle],
        description,
      });
    }
    // Moving up (Completo → Site + Agenda → Premium): the new features turn on now (new value
    // from the next charge). Moving down: they stay until the paid period ends.
    const current: Tier = existing.tier ?? "complete";
    const upgrade = tierRank(tier) > tierRank(current);
    const downgrade = tierRank(tier) < tierRank(current);
    await admin
      .from("subscriptions")
      .update({
        billing_cycle: input.cycle,
        extra_professionals: extras,
        value_cents: value,
        needs_reprice: false,
        tier: downgrade ? current : tier,
        next_tier: downgrade ? tier : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (upgrade) {
      await admin.from("businesses").update({ plan_tier: tier }).eq("id", input.business.id);
    }
    await admin.rpc("apply_professional_seats", {
      p_business_id: input.business.id,
      p_seats: seats,
    });
    invalidatePublicPage(input.business.slug);
    await audit({
      businessId: input.business.id,
      userId: input.userId,
      action: "plan.changed",
      details: { cycle: input.cycle, seats, value_cents: value, reauthorize, tier, downgrade },
    });
    return { kind: "changed", reauthorize };
  }

  // A pending (unpaid) attempt is replaced, so a new choice never leaves two subscriptions.
  if (existing?.provider_subscription_id && existing.status === "pending") {
    await deleteSubscription(existing.provider_subscription_id).catch(() => undefined);
  }

  const customerId = await ensureCustomer(input.business, existing, input.payer);
  const draft: Subscription = {
    ...(existing ?? ({} as Subscription)),
    business_id: input.business.id,
    provider_customer_id: customerId,
    billing_cycle: input.cycle,
    extra_professionals: extras,
    status: "pending",
    current_period_end: null,
  };
  let started: Awaited<ReturnType<typeof startPixAutomatic>> | null = null;
  let regular: { id: string } | null = null;
  try {
    started = await startPixAutomatic(draft, {
      brandName: input.brand.name,
      valueCents: value,
      firstValueCents: value + (input.firstExtraCents ?? 0),
    });
  } catch (error) {
    // The regular Pix cannot charge a different first value: a sale with an extra tries again.
    if (input.firstExtraCents) throw new Error("pix_automatic_required");
    // Asaas could not create the authorization: the subscription starts on the regular Pix and
    // the next charge offers the Pix Automático again.
    console.error(
      "pix automatic unavailable on subscribe, regular pix used",
      error instanceof Error ? error.message.slice(0, 120) : "unknown",
    );
    regular = await createSubscription({
      customer: customerId,
      valueCents: value,
      cycle: CYCLES[input.cycle],
      nextDueDate: today(),
      description,
      externalReference: `${input.business.id}:plan`,
    });
  }
  const authorization = started?.authorization ?? null;
  const { error } = await admin.from("subscriptions").upsert(
    {
      business_id: input.business.id,
      provider: "asaas",
      provider_customer_id: customerId,
      // Asaas creates the subscription once the bank confirms (the simulation links it at once).
      provider_subscription_id: regular?.id ?? authorization?.subscriptionId ?? null,
      plan: "complete",
      tier,
      next_tier: null,
      needs_reprice: false,
      billing_cycle: input.cycle,
      extra_professionals: extras,
      value_cents: value,
      billing_type: "pix",
      card_last4: null,
      card_brand: null,
      pix_automatic_id: authorization?.id ?? null,
      pix_automatic_status: authorization ? "created" : null,
      pix_automatic_first_payment_id: null,
      addons: existing?.addons ?? {},
      status: "pending",
      // A plan cancelled but still paid keeps its end: if this new choice is never paid, the
      // billing job still downgrades the account when that period ends.
      current_period_end: carriedPeriodEnd(existing),
      sunset_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "business_id" },
  );
  if (error) throw new Error(`subscriptions upsert failed: ${error.message}`);
  await audit({
    businessId: input.business.id,
    userId: input.userId,
    action: "subscription.created",
    details: {
      plan: "complete",
      tier,
      cycle: input.cycle,
      seats,
      value_cents: value,
      method: authorization ? "pix_automatic" : "pix",
      coupon: input.couponCode ?? null,
    },
  });
  if (started) return { kind: "pix", pix: started.pix };
  const pix = await pixOfPendingPayment(regular!.id);
  if (!pix) throw new Error("pix_unavailable");
  return { kind: "pix", pix };
}

/** End of a cancelled plan that is still paid (kept while a new subscription waits for payment). */
function carriedPeriodEnd(existing: Subscription | null): string | null {
  if (existing?.status !== "cancelled" || !existing.current_period_end) return null;
  return new Date(existing.current_period_end) > new Date() ? existing.current_period_end : null;
}

/**
 * Pix of the open charge (renewal or overdue), shown inside the panel. Without an active Pix
 * Automático, the QR is a new authorization that pays this charge and the next ones by itself;
 * the regular QR of the charge is only the fallback (debit refused, or Asaas unavailable).
 */
export async function pendingPix(businessId: string, brandName: string): Promise<PixCharge | null> {
  const row = await loadSubscription(businessId);
  if (!row?.provider_subscription_id || row.status === "cancelled") return null;
  const payments = await listSubscriptionPayments(row.provider_subscription_id);
  const pending = payments.find((p) => p.status === "PENDING" || p.status === "OVERDUE");
  if (!pending) return null;
  if (row.pix_automatic_status !== "active" && row.status !== "pending") {
    try {
      const { authorization, pix } = await startPixAutomatic(row, {
        brandName,
        valueCents: recurringValue(row),
        firstValueCents: cents(pending.value),
      });
      await createAdminClient()
        .from("subscriptions")
        .update({
          pix_automatic_id: authorization.id,
          pix_automatic_status: "created",
          pix_automatic_first_payment_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      return pix;
    } catch (error) {
      console.error(
        "pix automatic unavailable, regular pix shown",
        error instanceof Error ? error.message.slice(0, 120) : "unknown",
      );
    }
  }
  return pixOfPayment(pending);
}

/**
 * The Pix Automático stopped (bank refused or the payer cancelled it, or the value changed): the
 * plan goes on with a regular Pix subscription from the end of the paid period, each charge paid
 * by QR in the panel, where the next one authorizes the automatic debit again.
 */
async function fallbackToRegularPix(
  row: Subscription,
  input: {
    status: "refused" | "cancelled" | "expired";
    notify: boolean;
    valueCents?: number;
    cycle?: Cycle;
    description?: string;
  },
): Promise<void> {
  const admin = createAdminClient();
  const cycle = input.cycle ?? row.billing_cycle;
  const automaticSubscription =
    row.pix_automatic_status === "active" ? row.provider_subscription_id : null;
  let providerSubscriptionId = row.provider_subscription_id;
  if (row.status !== "cancelled" && (automaticSubscription || !providerSubscriptionId)) {
    const business = await businessOf(row.business_id);
    const end = row.current_period_end ? dateOnly(row.current_period_end) : today();
    const subscription = await createSubscription({
      customer: row.provider_customer_id!,
      valueCents: input.valueCents ?? recurringValue(row),
      cycle: CYCLES[cycle],
      nextDueDate: end > today() ? end : today(),
      description:
        input.description ??
        planDescription(
          getNiche(business?.brand_key).name,
          cycle,
          row.extra_professionals ?? 0,
          row.tier ?? "complete",
        ),
      externalReference: `${row.business_id}:plan`,
    });
    providerSubscriptionId = subscription.id;
  }
  // The row points to the new subscription before the old one is removed: its deletion webhook
  // then finds nothing to cancel.
  await admin
    .from("subscriptions")
    .update({
      provider_subscription_id: providerSubscriptionId,
      pix_automatic_status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);
  if (automaticSubscription && automaticSubscription !== providerSubscriptionId) {
    await deleteSubscription(automaticSubscription).catch(() => undefined);
  }
  if (row.pix_automatic_id && input.status === "cancelled") {
    await cancelPixAutomaticAuthorization(row.pix_automatic_id).catch(() => undefined);
  }
  await audit({
    businessId: row.business_id,
    userId: null,
    action: "plan.changed",
    details: { pix_automatic: input.status, fallback: "regular_pix" },
  });
  if (input.notify && row.status !== "cancelled") {
    await notifyTeam({
      businessId: row.business_id,
      type: "account",
      subject: "O Pix Automático da sua assinatura foi desativado",
      content: {
        heading: "Seu Pix Automático foi desativado",
        paragraphs: [
          "Seu plano continua ativo. A próxima mensalidade aparece no painel, em Assinatura, para pagar pelo Pix.",
          "Ao pagar por lá, você ativa o Pix Automático de novo e as seguintes voltam a ser debitadas sozinhas.",
        ],
        cta: { label: "Ver assinatura", url: "/painel/plano" },
      },
      push: {
        title: "Pix Automático desativado",
        body: "Seu plano continua ativo. Pague a próxima mensalidade pelo painel.",
        url: "/painel/plano",
      },
    });
  }
}

const AUTHORIZATION_EVENT: Record<string, string> = {
  ACTIVE: "PIX_AUTOMATIC_RECURRING_AUTHORIZATION_ACTIVATED",
  REFUSED: "PIX_AUTOMATIC_RECURRING_AUTHORIZATION_REFUSED",
  CANCELLED: "PIX_AUTOMATIC_RECURRING_AUTHORIZATION_CANCELLED",
  EXPIRED: "PIX_AUTOMATIC_RECURRING_AUTHORIZATION_EXPIRED",
};

/**
 * Asks Asaas for the state of an authorization still waiting on our side and applies it as the
 * webhook would. Called while the owner waits for the payment and when the subscription screen
 * opens: the first payment of the QR arrives at Asaas as a loose Pix (another customer, no link to
 * the subscription), so the confirmation from the bank is what activates the plan.
 */
export async function syncPixAutomatic(businessId: string): Promise<void> {
  if (isDemoMode()) return;
  const row = await loadSubscription(businessId);
  if (!row?.pix_automatic_id || row.pix_automatic_status !== "created") return;
  const authorization = await getPixAutomaticAuthorization(row.pix_automatic_id);
  const event = AUTHORIZATION_EVENT[authorization.status];
  if (!event) return;
  await handleAsaasEvent({
    id: `sync_${authorization.id}_${authorization.status}`,
    event,
    authorization: {
      id: authorization.id,
      status: authorization.status,
      subscriptionId: authorization.subscriptionId ?? null,
    },
  });
}

/** Stops future charges. The plan stays until the paid period ends (the billing cron downgrades). */
export async function cancelPlan(business: Business, userId: string): Promise<void> {
  const existing = await loadSubscription(business.id);
  if (!existing || existing.status === "cancelled") return;
  if (!existing.provider_subscription_id && !existing.pix_automatic_id) return;
  // Marked first: the deletion webhooks then see a plan cancelled by the owner, not a lost debit.
  await createAdminClient()
    .from("subscriptions")
    .update({
      status: "cancelled",
      pix_automatic_status:
        existing.pix_automatic_status === "active" || existing.pix_automatic_status === "created"
          ? "cancelled"
          : existing.pix_automatic_status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);
  if (existing.provider_subscription_id)
    await deleteSubscription(existing.provider_subscription_id);
  if (
    existing.pix_automatic_id &&
    (existing.pix_automatic_status === "active" || existing.pix_automatic_status === "created")
  ) {
    await cancelPixAutomaticAuthorization(existing.pix_automatic_id).catch(() => undefined);
  }
  await audit({
    businessId: business.id,
    userId,
    action: "subscription.cancelled",
    details: { plan: existing.plan, until: existing.current_period_end },
  });
}

/**
 * Plans from before the Premium (2026-11-27): the subscription does not renew. It runs until the
 * paid period ends (cancelPlan: the Asaas subscription and the Pix Automático authorization,
 * which is for a fixed value, are cancelled) and then the owner chooses a plan again. Started by
 * the admin (Admin › Assinaturas antigas), with an e-mail and a push to the owner.
 */
export async function sunsetLegacySubscription(
  businessId: string,
  adminUserId: string,
): Promise<boolean> {
  const business = await businessOf(businessId);
  const existing = await loadSubscription(businessId);
  if (!business || !existing || existing.sunset_at) return false;
  if (!["active", "overdue"].includes(existing.status)) return false;
  if (!["complete", "site"].includes(existing.tier ?? "complete")) return false;
  await cancelPlan(business, adminUserId);
  await createAdminClient()
    .from("subscriptions")
    .update({ sunset_at: new Date().toISOString() })
    .eq("id", existing.id);
  await notifySunset(business, existing.current_period_end, "start");
  await audit({
    businessId,
    userId: adminUserId,
    action: "subscription.sunset",
    details: { tier: existing.tier, until: existing.current_period_end },
  });
  return true;
}

/** E-mail and push about the plan change: when it starts, and 7, 3 and 1 day before the end. */
async function notifySunset(
  business: Business,
  periodEnd: string | null,
  moment: "start" | 7 | 3 | 1,
): Promise<void> {
  const until = periodEnd
    ? new Date(periodEnd).toLocaleDateString("pt-BR", { timeZone: business.timezone })
    : "o fim do período pago";
  const subject =
    moment === "start"
      ? "Seu plano do MeetChat mudou: escolha o novo plano até o vencimento"
      : `Faltam ${moment} ${moment === 1 ? "dia" : "dias"} para escolher seu plano no MeetChat`;
  await notifyTeam({
    businessId: business.id,
    type: "account",
    subject,
    content: {
      heading: moment === "start" ? "Novos planos do MeetChat" : "Escolha seu plano para continuar",
      paragraphs: [
        `Sua assinatura atual continua funcionando normalmente até ${until}. Ela não será renovada: os planos mudaram.`,
        `Até lá, escolha seu plano no painel: ${TIER_NAME.complete} (${reais(PLAN_PRICES.complete.monthly)}/mês), ${TIER_NAME.site} (${reais(PLAN_PRICES.site.monthly)}/mês) ou ${TIER_NAME.premium} (${reais(PLAN_PRICES.premium.monthly)}/mês). O sinal pelo Pix com o comprovante lido na hora e o lembrete automático para o cliente agora fazem parte do ${TIER_NAME.premium}.`,
        "Ao assinar, você paga a primeira mensalidade pelo QR do Pix, que já autoriza o débito automático das próximas.",
      ],
      cta: { label: "Escolher meu plano", url: "/painel/plano" },
    },
    push: {
      title: moment === "start" ? "Os planos do MeetChat mudaram" : "Escolha seu plano",
      body: `Sua assinatura vale até ${until}. Escolha o novo plano no painel.`,
      url: "/painel/plano",
    },
  });
}

/** Daily: the notices 7, 3 and 1 day before a plan from before the Premium ends (once each). */
async function remindSunsets(now: Date): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscriptions")
    .select("business_id, current_period_end, status")
    .not("sunset_at", "is", null)
    .eq("status", "cancelled")
    .gt("current_period_end", now.toISOString());
  let sent = 0;
  for (const row of data ?? []) {
    const days = Math.ceil(
      (new Date(row.current_period_end as string).getTime() - now.getTime()) / 86_400_000,
    );
    const moment = ([7, 3, 1] as const).find((d) => d === days);
    if (!moment) continue;
    const business = await businessOf(row.business_id as string);
    if (!business || business.plan === "free") continue;
    if (
      !(await claimNotification(business.id, `sunset_${moment}d`, row.current_period_end as string))
    )
      continue;
    await notifySunset(business, row.current_period_end as string, moment);
    sent++;
  }
  return sent;
}

// ---------------------------------------------------------------------------
// Add-ons: each one is its own Asaas subscription (monthly).

interface FeaturedAddon {
  city: string;
  subscription_id: string;
  status: "pending" | "active" | "cancelled";
}
interface Addons {
  featured?: FeaturedAddon[];
}

export async function subscribeAddon(input: {
  business: Business;
  brand: BrandConfig;
  userId: string;
  addon: "featured";
  city: string;
  payer: { name: string; cpfCnpj: string; email: string };
}): Promise<PixCharge | null> {
  const admin = createAdminClient();
  const existing = await loadSubscription(input.business.id);
  if (!existing) throw new Error("no_plan");
  const addons = (existing.addons ?? {}) as Addons;
  const customerId = await ensureCustomer(input.business, existing, input.payer);
  const city = input.city.trim();
  if (
    !city ||
    addons.featured?.some(
      (f) => f.city.toLowerCase() === city.toLowerCase() && f.status !== "cancelled",
    )
  ) {
    throw new Error("featured_exists");
  }

  const subscription = await createSubscription({
    customer: customerId,
    valueCents: PLAN_PRICES.featured.monthly,
    cycle: "MONTHLY",
    nextDueDate: today(),
    description: `${input.brand.name} · Destaque no portal (${city})`,
    externalReference: `${input.business.id}:featured:${city}`,
  });

  const next: Addons = {
    ...addons,
    featured: [
      ...(addons.featured ?? []),
      { city, subscription_id: subscription.id, status: "pending" },
    ],
  };
  await admin
    .from("subscriptions")
    .update({
      addons: next,
      provider_customer_id: customerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);
  await audit({
    businessId: input.business.id,
    userId: input.userId,
    action: "plan.changed",
    details: { addon: input.addon, city },
  });
  return pixOfPendingPayment(subscription.id);
}

export async function cancelAddon(
  business: Business,
  userId: string,
  subscriptionId: string,
): Promise<void> {
  const existing = await loadSubscription(business.id);
  if (!existing) return;
  const addons = (existing.addons ?? {}) as Addons;
  if (!addons.featured?.some((f) => f.subscription_id === subscriptionId)) return;
  await deleteSubscription(subscriptionId);
  await applyAddonStatus(existing, subscriptionId, "cancelled");
  await audit({
    businessId: business.id,
    userId,
    action: "subscription.cancelled",
    details: { addon_subscription: subscriptionId },
  });
}

async function applyAddonStatus(
  row: Subscription,
  subscriptionId: string,
  status: FeaturedAddon["status"],
  paidUntil?: string,
) {
  const admin = createAdminClient();
  const addons = (row.addons ?? {}) as Addons;
  const featured = addons.featured?.find((f) => f.subscription_id === subscriptionId);
  if (!featured) return;
  featured.status = status;
  if (status === "active" && paidUntil) {
    await admin
      .from("portal_featured")
      .upsert(
        { business_id: row.business_id, city: featured.city, active_until: paidUntil },
        { onConflict: "business_id,city" },
      );
  } else if (status === "cancelled") {
    await admin
      .from("portal_featured")
      .update({ active_until: new Date().toISOString() })
      .eq("business_id", row.business_id)
      .eq("city", featured.city);
  }
  await admin
    .from("subscriptions")
    .update({ addons, updated_at: new Date().toISOString() })
    .eq("id", row.id);
}

// ---------------------------------------------------------------------------
// Webhook

export interface AsaasEvent {
  id: string;
  event: string;
  payment?: AsaasPayment;
  subscription?: { id: string; status?: string };
  /** Pix Automático authorization events. */
  authorization?: { id: string; status?: string; subscriptionId?: string | null };
  /** Pix Automático debit of one charge. */
  paymentInstruction?: {
    id: string;
    status?: string;
    paymentId?: string | null;
    authorization?: { id: string } | null;
  };
}

async function findBySubscription(
  subscriptionId: string,
): Promise<{ row: Subscription; kind: "plan" | "addon" } | null> {
  const admin = createAdminClient();
  const { data: plan } = await admin
    .from("subscriptions")
    .select("*")
    .eq("provider_subscription_id", subscriptionId)
    .maybeSingle();
  if (plan) return { row: plan as Subscription, kind: "plan" };
  const { data: featured } = await admin
    .from("subscriptions")
    .select("*")
    .contains("addons", { featured: [{ subscription_id: subscriptionId }] })
    .maybeSingle();
  return featured ? { row: featured as Subscription, kind: "addon" } : null;
}

async function findByAuthorization(authorizationId: string): Promise<Subscription | null> {
  const { data } = await createAdminClient()
    .from("subscriptions")
    .select("*")
    .eq("pix_automatic_id", authorizationId)
    .maybeSingle();
  return (data as Subscription | null) ?? null;
}

async function businessOf(businessId: string): Promise<Business | null> {
  const { data } = await createAdminClient()
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .maybeSingle();
  return (data as Business | null) ?? null;
}

/** The plan is paid: Completo on, with the paid seats. */
async function activateBusinessPlan(row: Subscription): Promise<void> {
  const admin = createAdminClient();
  const plan = "complete";
  const business = await businessOf(row.business_id);
  if (!business) return;
  // The plan paid ("complete" or "site"). A move down to "Completo" asked during the period
  // takes effect with this payment: the site goes off from here on.
  const tier: Tier = row.next_tier ?? row.tier ?? "complete";
  if (row.next_tier) {
    await admin
      .from("subscriptions")
      .update({ tier: row.next_tier, next_tier: null, updated_at: new Date().toISOString() })
      .eq("id", row.id);
  }
  if ((business.plan_tier ?? "complete") !== tier) {
    await admin.from("businesses").update({ plan_tier: tier }).eq("id", business.id);
    invalidatePublicPage(business.slug);
  }
  await admin.rpc("apply_professional_seats", {
    p_business_id: business.id,
    p_seats: (row.extra_professionals ?? 0) + 1,
  });
  if (business.plan !== plan) {
    await admin.from("businesses").update({ plan }).eq("id", business.id);
    await audit({
      businessId: business.id,
      userId: null,
      action: "plan.changed",
      details: {
        from: business.plan,
        to: plan,
        via: "payment",
        // Admin metrics: a subscription right after (or during) the trial.
        after_trial: business.trial_ends_at !== null,
      },
    });
    invalidatePublicPage(business.slug);
  }
  // A custom site paid with this first payment (R$ 197 with the first month).
  await markPlanOrderPaid(business.id).catch((error) =>
    console.error("custom site order (plan) failed", error),
  );
  // A WhatsApp sale waiting for this payment: the customer gets the access e-mail.
  await completeAssistedSale(business.id).catch((error) =>
    console.error("assisted sale completion failed", error),
  );
}

/**
 * First payment of a Pix Automático authorization (its QR pays the current period): applied once,
 * whichever comes first, the payment event or the confirmation from the bank. On a renewal, the
 * regular subscription that had the open charge is removed; the authorization's own takes over.
 */
async function applyAutomaticFirstPayment(row: Subscription, reference: string): Promise<void> {
  if (row.pix_automatic_first_payment_id) return;
  const admin = createAdminClient();
  const paidUntil = addPeriod(periodBase(row), row.billing_cycle);
  const regularToDrop = row.status !== "pending" ? row.provider_subscription_id : null;
  await admin
    .from("subscriptions")
    .update({
      status: "active",
      plan: "complete",
      current_period_end: paidUntil,
      pix_automatic_first_payment_id: reference,
      provider_subscription_id: regularToDrop ? null : row.provider_subscription_id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id);
  if (regularToDrop) await deleteSubscription(regularToDrop).catch(() => undefined);
  await activateBusinessPlan(row);
}

const AUTHORIZATION_END: Record<string, "refused" | "cancelled" | "expired"> = {
  PIX_AUTOMATIC_RECURRING_AUTHORIZATION_REFUSED: "refused",
  PIX_AUTOMATIC_RECURRING_AUTHORIZATION_CANCELLED: "cancelled",
  PIX_AUTOMATIC_RECURRING_AUTHORIZATION_EXPIRED: "expired",
};

async function handleAuthorizationEvent(event: AsaasEvent): Promise<string> {
  const authorization = event.authorization!;
  const row = await findByAuthorization(authorization.id);
  // An older authorization (replaced or cancelled on our side) is no longer followed.
  if (!row) return "ignored: unknown authorization";
  const admin = createAdminClient();

  if (event.event === "PIX_AUTOMATIC_RECURRING_AUTHORIZATION_ACTIVATED") {
    if (row.pix_automatic_status === "active" || row.status === "cancelled") return "ignored";
    await applyAutomaticFirstPayment(row, "activation");
    const subscriptionId =
      authorization.subscriptionId ??
      (await getPixAutomaticAuthorization(authorization.id).catch(() => null))?.subscriptionId ??
      null;
    await admin
      .from("subscriptions")
      .update({
        pix_automatic_status: "active",
        ...(subscriptionId ? { provider_subscription_id: subscriptionId } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (!subscriptionId) console.error("pix automatic active without subscription", row.id);
    return "pix automatic active";
  }

  const status = AUTHORIZATION_END[event.event];
  if (!status) return `ignored: ${event.event}`;
  if (row.pix_automatic_status === status) return "ignored: repeated";
  const fresh = (await loadSubscription(row.business_id)) ?? row;
  const paid = fresh.status === "active" || fresh.status === "overdue";
  // Paid plan without the automatic debit any more: next charges by QR in the panel.
  if (paid && (fresh.pix_automatic_status === "active" || !fresh.provider_subscription_id)) {
    await fallbackToRegularPix(fresh, { status, notify: true });
    return `pix automatic ${status}: regular pix`;
  }
  // Not paid (QR expired or never confirmed): the owner generates a new QR in the panel.
  await admin
    .from("subscriptions")
    .update({ pix_automatic_status: status, updated_at: new Date().toISOString() })
    .eq("id", row.id);
  return `pix automatic ${status}`;
}

/** The bank did not debit a charge: the owner can pay it by QR in the panel (retries may follow). */
async function handleDebitRefused(event: AsaasEvent): Promise<string> {
  const authorizationId = event.paymentInstruction?.authorization?.id;
  const row = authorizationId ? await findByAuthorization(authorizationId) : null;
  const reference = event.paymentInstruction?.paymentId ?? event.paymentInstruction?.id;
  if (!row || !reference || row.status === "cancelled") return "ignored: debit refused";
  if (await claimNotification(row.business_id, "billing_debit_refused", reference)) {
    await notifyTeam({
      businessId: row.business_id,
      type: "account",
      subject: "O débito da sua mensalidade não foi feito",
      content: {
        heading: "Não conseguimos debitar sua mensalidade",
        paragraphs: [
          "O Pix Automático da sua assinatura não foi debitado pelo banco (por exemplo, por falta de saldo). O banco pode tentar de novo nos próximos dias.",
          "Para não pausar sua agenda, você também pode pagar agora pelo Pix no painel, em Assinatura.",
        ],
        cta: { label: "Pagar com Pix", url: "/painel/plano" },
      },
      push: {
        title: "Mensalidade não debitada",
        body: "Pague pelo Pix no painel para não pausar sua agenda.",
        url: "/painel/plano",
      },
    });
  }
  return "debit refused";
}

const formatValue = (valueCents: number) => `R$ ${(valueCents / 100).toFixed(2).replace(".", ",")}`;

/** Applies one Asaas event. Callers guarantee each event id is handled once. */
const PAYMENT_REVERSED_EVENTS = new Set([
  "PAYMENT_REFUNDED",
  "PAYMENT_PARTIALLY_REFUNDED",
  "PAYMENT_REFUND_IN_PROGRESS",
  "PAYMENT_CHARGEBACK_REQUESTED",
  "PAYMENT_CHARGEBACK_DISPUTE",
  "PAYMENT_DELETED",
]);

/**
 * Partner commission of a confirmed plan payment (never fails the webhook). It is computed on the
 * net value, after Asaas's fee, so the first payment never costs more than what came in.
 */
async function commissionOf(businessId: string, event: AsaasEvent): Promise<void> {
  if (!event.payment?.id) return;
  const { value, netValue } = event.payment;
  await recordPartnerCommission({
    businessId,
    paymentId: event.payment.id,
    paymentCents: cents(netValue && netValue > 0 && netValue <= value ? netValue : value),
  }).catch((error) => console.error("partner commission failed", error));
}

export async function handleAsaasEvent(event: AsaasEvent): Promise<string> {
  const admin = createAdminClient();

  if (event.authorization?.id && event.event.startsWith("PIX_AUTOMATIC_RECURRING_AUTHORIZATION")) {
    return handleAuthorizationEvent(event);
  }
  if (event.event === "PIX_AUTOMATIC_RECURRING_PAYMENT_INSTRUCTION_REFUSED") {
    return handleDebitRefused(event);
  }

  // Refund or chargeback of a client payment: the partner commission of it is not paid.
  if (event.payment?.id && PAYMENT_REVERSED_EVENTS.has(event.event)) {
    await cancelPartnerCommission(event.payment.id);
  }

  const subscriptionId = event.payment?.subscription ?? event.subscription?.id;
  const found = subscriptionId ? await findBySubscription(subscriptionId) : null;

  // First payment of a Pix Automático QR: Asaas has not linked it to our subscription yet.
  if (
    !found &&
    event.payment?.customer &&
    (event.event === "PAYMENT_CONFIRMED" || event.event === "PAYMENT_RECEIVED")
  ) {
    const { data } = await admin
      .from("subscriptions")
      .select("*")
      .eq("provider_customer_id", event.payment.customer)
      .eq("pix_automatic_status", "created")
      .maybeSingle();
    if (data) {
      await applyAutomaticFirstPayment(data as Subscription, event.payment.id);
      await commissionOf((data as Subscription).business_id, event);
      return "plan active (pix automatic first payment)";
    }
  }
  // One-off Pix (custom site of a subscriber): no subscription behind it.
  if (
    !subscriptionId &&
    event.payment?.id &&
    (event.event === "PAYMENT_CONFIRMED" || event.event === "PAYMENT_RECEIVED")
  ) {
    if (await markSingleOrderPaid(event.payment.id)) return "custom site paid";
  }
  if (!subscriptionId) return "ignored: no subscription";
  if (!found) return "ignored: unknown subscription";
  const { row, kind } = found;

  if (event.event === "PAYMENT_CONFIRMED" || event.event === "PAYMENT_RECEIVED") {
    if (kind === "plan" && row.pix_automatic_status === "created") {
      await applyAutomaticFirstPayment(row, event.payment!.id);
      await commissionOf(row.business_id, event);
      return "plan active (pix automatic first payment)";
    }
    const cycle: Cycle = kind === "plan" ? row.billing_cycle : "monthly";
    const paidUntil = addPeriod(event.payment!.dueDate, cycle);
    if (kind === "addon") {
      // A few days of tolerance until the next charge is paid.
      await applyAddonStatus(
        row,
        subscriptionId,
        "active",
        new Date(new Date(paidUntil).getTime() + 3 * 86_400_000).toISOString(),
      );
      return "addon active";
    }
    await admin
      .from("subscriptions")
      .update({
        status: "active",
        plan: "complete",
        current_period_end: paidUntil,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    await activateBusinessPlan(row);
    await commissionOf(row.business_id, event);
    return "plan active";
  }

  // Renewal: our own e-mail (Asaas e-mails are off). With the Pix Automático it only tells the
  // date of the debit; otherwise it points to the QR in the panel (which authorizes the debit).
  if (event.event === "PAYMENT_CREATED") {
    if (kind === "plan" && row.status === "active" && event.payment) {
      if (await claimNotification(row.business_id, "billing_renewal", event.payment.id)) {
        const due = event.payment.dueDate.split("-").reverse().join("/");
        const value = formatValue(cents(event.payment.value));
        const automatic = row.pix_automatic_status === "active";
        await notifyTeam({
          businessId: row.business_id,
          type: "account",
          subject: automatic
            ? `Sua mensalidade será debitada em ${due}`
            : `Sua mensalidade vence em ${due}`,
          content: automatic
            ? {
                heading: "Sua mensalidade será debitada pelo Pix Automático",
                paragraphs: [
                  `A mensalidade de ${value} será debitada da sua conta em ${due}, pelo Pix Automático. Você não precisa fazer nada.`,
                ],
                cta: { label: "Ver assinatura", url: "/painel/plano" },
              }
            : {
                heading: "Sua mensalidade está disponível",
                paragraphs: [
                  `A mensalidade de ${value} vence em ${due}.`,
                  "Pague pelo Pix no seu painel, em Assinatura. Ao pagar, você ativa o Pix Automático e as próximas são debitadas sozinhas.",
                ],
                cta: { label: "Pagar com Pix", url: "/painel/plano" },
              },
          push: automatic
            ? {
                title: "Mensalidade no Pix Automático",
                body: `${value} será debitado em ${due}.`,
                url: "/painel/plano",
              }
            : {
                title: "Mensalidade disponível",
                body: `Vence em ${due}. Pague pelo Pix no painel.`,
                url: "/painel/plano",
              },
        });
      }
    }
    return "payment created";
  }

  if (event.event === "PAYMENT_OVERDUE") {
    if (kind === "plan") {
      await admin
        .from("subscriptions")
        .update({ status: "overdue", updated_at: new Date().toISOString() })
        .eq("id", row.id);
      if (await claimNotification(row.business_id, "billing_overdue", event.payment!.id)) {
        await notifyTeam({
          businessId: row.business_id,
          type: "account",
          subject: "Pagamento da assinatura em atraso",
          content: {
            heading: "Seu pagamento está em atraso",
            paragraphs: [
              "Não identificamos o pagamento da sua assinatura. Pague em até 5 dias para não pausar sua agenda.",
            ],
            cta: { label: "Pagar agora", url: "/painel/plano" },
          },
          push: {
            title: "Assinatura em atraso",
            body: "Pague em até 5 dias para manter seu plano.",
            url: "/painel/plano",
          },
        });
      }
    }
    return "overdue";
  }

  if (event.event === "SUBSCRIPTION_DELETED" || event.event === "SUBSCRIPTION_INACTIVATED") {
    if (kind === "addon") {
      await applyAddonStatus(row, subscriptionId, "cancelled");
      return "addon cancelled";
    }
    // The subscription of an active Pix Automático ended without the owner cancelling (the payer
    // revoked the authorization at the bank): the plan goes on, paid by QR.
    if (row.status !== "cancelled" && row.pix_automatic_status === "active") {
      await fallbackToRegularPix(row, { status: "cancelled", notify: true });
      return "pix automatic ended: regular pix";
    }
    const stillPaid = row.current_period_end && new Date(row.current_period_end) > new Date();
    await admin
      .from("subscriptions")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", row.id);
    // Cancelled by the owner with a paid period left: the billing cron downgrades at period end.
    if (!stillPaid) await downgradeToFree(row.business_id, "subscription cancelled");
    return "plan cancelled";
  }

  return `ignored: ${event.event}`;
}

/** Subscription ended without payment: waiting mode, same as an ended trial (data kept). */
export async function downgradeToFree(businessId: string, reason: string): Promise<void> {
  const business = await businessOf(businessId);
  if (!business || business.plan === "free") return;
  // Nothing is hidden or deleted: the chat switches to the WhatsApp hand-off and the panel
  // shows only the subscription screen until a new subscription is paid.
  await createAdminClient().from("businesses").update({ plan: "free" }).eq("id", businessId);
  invalidatePublicPage(business.slug);
  await audit({
    businessId,
    userId: null,
    action: "plan.changed",
    details: { from: business.plan, to: "free", reason },
  });
}

/**
 * Daily billing job: plans cancelled whose period ended (or overdue for more than 5 days) go to
 * waiting mode, and subscriptions marked with a new price get their Asaas value updated (from the
 * next charge). Idempotent.
 */
export async function processBillingExpirations(): Promise<{
  downgraded: number;
  repriced: number;
  sunsetNotices: number;
}> {
  const sunsetNotices = await remindSunsets(new Date());
  const downgraded = await expireSubscriptions();
  const admin = createAdminClient();
  const now = new Date().toISOString();

  let repriced = 0;
  const { data: stale } = await admin
    .from("subscriptions")
    .select("*")
    .eq("needs_reprice", true)
    .in("status", ["pending", "active", "overdue"]);
  for (const row of (stale ?? []) as Subscription[]) {
    if (!row.provider_subscription_id) continue;
    const business = await businessOf(row.business_id);
    const valueCents = subscriptionPrice(
      row.billing_cycle,
      row.extra_professionals ?? 0,
      0,
      row.tier ?? "complete",
    );
    const description = planDescription(
      getNiche(business?.brand_key).name,
      row.billing_cycle,
      row.extra_professionals ?? 0,
      row.tier ?? "complete",
    );
    if (row.pix_automatic_status === "active") {
      // The payer authorized the old value: the next charge goes by QR and authorizes the new one.
      await fallbackToRegularPix(row, {
        valueCents,
        description,
        status: "cancelled",
        notify: true,
      });
    } else {
      await updateSubscription(row.provider_subscription_id, { valueCents, description });
    }
    await admin
      .from("subscriptions")
      .update({ needs_reprice: false, value_cents: valueCents, updated_at: now })
      .eq("id", row.id);
    repriced++;
  }
  return { downgraded, repriced, sunsetNotices };
}

async function expireSubscriptions(): Promise<number> {
  const admin = createAdminClient();
  const now = Date.now();
  const { data } = await admin
    .from("subscriptions")
    .select("*")
    .in("status", ["cancelled", "overdue", "pending"]);
  let downgraded = 0;
  for (const row of (data ?? []) as Subscription[]) {
    // Pending with an end: a new plan chosen after a cancellation and never paid (the old plan's
    // period still decides). Pending without an end: a first subscription, nothing to expire.
    if (row.status === "pending" && !row.current_period_end) continue;
    const end = row.current_period_end ? new Date(row.current_period_end).getTime() : 0;
    const expired = row.status === "overdue" ? end + 5 * 86_400_000 < now : end < now;
    if (expired) {
      await downgradeToFree(
        row.business_id,
        row.status === "cancelled" ? "cancelled period ended" : "overdue 5 days",
      );
      downgraded++;
    }
  }
  return downgraded;
}
