import "server-only";

import type { BrandConfig } from "@/brands";
import { audit } from "@/lib/audit";
import { invalidatePublicPage } from "@/lib/cache";
import type { Business, PaidPlan, Subscription } from "@/lib/db/types";
import { claimNotification, notifyTeam } from "@/lib/notifications/owner";
import { PLAN_NAMES, PLAN_PRICES, paidPlanOf, subscriptionPrice, type Cycle } from "@/lib/plans";
import { recordTrialClaims } from "@/lib/trial";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  createCustomer,
  createSubscription,
  deleteSubscription,
  getPixQrCode,
  listSubscriptionPayments,
  tokenizeCreditCard,
  updateSubscription,
  updateSubscriptionCard,
  type AsaasCycle,
  type AsaasPayment,
  type CardHolderInput,
  type CardInput,
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

export type PaymentMethod = "pix" | "credit_card";

export interface PixCharge {
  /** data:image/png;base64,… */
  image: string;
  payload: string;
  expiresAt: string;
  valueCents: number;
}

export type SubscribeResult =
  | { kind: "changed" }
  | { kind: "pix"; pix: PixCharge }
  | { kind: "card"; last4: string; brand: string };

interface CardPayment {
  card: CardInput;
  holder: Omit<CardHolderInput, "name" | "email" | "cpfCnpj">;
}

async function pixOfPendingPayment(subscriptionId: string): Promise<PixCharge | null> {
  const payments = await listSubscriptionPayments(subscriptionId);
  const pending = payments.find((p) => p.status === "PENDING" || p.status === "OVERDUE");
  if (!pending) return null;
  const qr = await getPixQrCode(pending.id);
  return {
    image: `data:image/png;base64,${qr.encodedImage}`,
    payload: qr.payload,
    expiresAt: qr.expirationDate,
    valueCents: Math.round(pending.value * 100),
  };
}

/**
 * Own checkout (Asaas behind the scenes). Subscribes to Agenda or Pro paying by Pix (returns the
 * QR code of the first charge) or card (tokenized at Asaas, charged right away); the billing cycle
 * starts on that day, with no proportional charge. The webhook activates the plan on payment.
 * On an active subscription: Agenda → Pro applies right away (Pro price from the next charge),
 * Pro → Agenda is scheduled for the end of the paid period, and cycle / extra professionals change.
 */
export async function subscribePlan(input: {
  business: Business;
  brand: BrandConfig;
  userId: string;
  plan: PaidPlan;
  cycle: Cycle;
  extraProfessionals: number;
  payer: { name: string; cpfCnpj: string; email: string };
  paymentMethod: PaymentMethod;
  cardPayment?: CardPayment;
  remoteIp: string;
  couponCode?: string | null;
}): Promise<SubscribeResult> {
  const admin = createAdminClient();
  const existing = await loadSubscription(input.business.id);
  const extras = Math.max(0, Math.min(49, Math.floor(input.extraProfessionals)));
  const seats = extras + 1;
  const description = `${input.brand.name} ${PLAN_NAMES[input.plan]} · ${
    input.cycle === "yearly" ? "anual" : "mensal"
  }${extras > 0 ? ` · ${seats} profissionais` : ""}`;

  let discount = 0;
  if (input.couponCode) {
    const { data } = await admin.rpc("redeem_platform_coupon", {
      p_code: input.couponCode,
      p_brand_key: input.brand.key,
    });
    if (data === null || data === undefined) throw new Error("coupon_invalid");
    discount = data as number;
  }
  const value = subscriptionPrice(input.plan, input.cycle, extras, discount);
  // The CPF/CNPJ informed here also counts for the one-trial-per-person rule.
  await recordTrialClaims(input.business.id, {
    email: input.payer.email,
    document: input.payer.cpfCnpj,
  }).catch(() => undefined);

  // Change on an active subscription: update it and apply the seats right away.
  if (
    existing?.provider_subscription_id &&
    (existing.status === "active" || existing.status === "overdue")
  ) {
    const current = paidPlanOf(existing.plan) ?? "agenda";
    const upgrade = current === "agenda" && input.plan === "pro";
    const downgrade = current === "pro" && input.plan === "agenda";
    // The new value applies from the next charge (no proportional charge now).
    await updateSubscription(existing.provider_subscription_id, {
      valueCents: value,
      cycle: CYCLES[input.cycle],
      description,
    });
    await admin
      .from("subscriptions")
      .update({
        // A downgrade keeps Pro until the paid period ends (applied by the webhook / billing job).
        plan: downgrade ? current : input.plan,
        pending_plan: downgrade ? input.plan : null,
        billing_cycle: input.cycle,
        extra_professionals: extras,
        needs_reprice: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    await admin.rpc("apply_professional_seats", {
      p_business_id: input.business.id,
      p_seats: seats,
    });
    if (upgrade) {
      await admin.from("businesses").update({ plan: "pro" }).eq("id", input.business.id);
    }
    invalidatePublicPage(input.business.slug);
    await audit({
      businessId: input.business.id,
      userId: input.userId,
      action: upgrade ? "plan.upgraded" : downgrade ? "plan.downgrade_scheduled" : "plan.changed",
      details: {
        from: current,
        to: input.plan,
        cycle: input.cycle,
        seats,
        value_cents: value,
        until: downgrade ? existing.current_period_end : undefined,
      },
    });
    return { kind: "changed" };
  }

  // A pending (unpaid) attempt is replaced, so a new choice never leaves two subscriptions.
  if (existing?.provider_subscription_id && existing.status === "pending") {
    await deleteSubscription(existing.provider_subscription_id).catch(() => undefined);
  }

  const customerId = await ensureCustomer(input.business, existing, input.payer);
  let card: { creditCardToken: string; creditCardNumber: string; creditCardBrand: string } | null =
    null;
  if (input.paymentMethod === "credit_card") {
    if (!input.cardPayment) throw new Error("card_missing");
    card = await tokenizeCreditCard({
      customer: customerId,
      card: input.cardPayment.card,
      holder: {
        ...input.cardPayment.holder,
        name: input.payer.name,
        email: input.payer.email,
        cpfCnpj: input.payer.cpfCnpj,
      },
      remoteIp: input.remoteIp,
    });
  }
  const subscription = await createSubscription({
    customer: customerId,
    valueCents: value,
    cycle: CYCLES[input.cycle],
    nextDueDate: today(),
    description,
    externalReference: `${input.business.id}:plan`,
    billingType: card ? "CREDIT_CARD" : "PIX",
    creditCardToken: card?.creditCardToken,
    remoteIp: input.remoteIp,
  });
  const { error } = await admin.from("subscriptions").upsert(
    {
      business_id: input.business.id,
      provider: "asaas",
      provider_customer_id: customerId,
      provider_subscription_id: subscription.id,
      plan: input.plan,
      pending_plan: null,
      needs_reprice: false,
      billing_cycle: input.cycle,
      extra_professionals: extras,
      billing_type: card ? "credit_card" : "pix",
      card_last4: card?.creditCardNumber ?? null,
      card_brand: card?.creditCardBrand ?? null,
      addons: existing?.addons ?? {},
      status: "pending",
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
      plan: input.plan,
      cycle: input.cycle,
      seats,
      value_cents: value,
      method: input.paymentMethod,
      coupon: input.couponCode ?? null,
    },
  });

  if (card) return { kind: "card", last4: card.creditCardNumber, brand: card.creditCardBrand };
  const pix = await pixOfPendingPayment(subscription.id);
  if (!pix) throw new Error("pix_unavailable");
  return { kind: "pix", pix };
}

/** Pix of the open charge (first payment, renewal or overdue), shown inside the panel. */
export async function pendingPix(businessId: string): Promise<PixCharge | null> {
  const existing = await loadSubscription(businessId);
  if (!existing?.provider_subscription_id || existing.status === "cancelled") return null;
  return pixOfPendingPayment(existing.provider_subscription_id);
}

/** Switches how an active subscription is paid: Pix, or a (new) card. No charge right now. */
export async function changePaymentMethod(input: {
  business: Business;
  userId: string;
  payer: { name: string; email: string; cpfCnpj: string };
  paymentMethod: PaymentMethod;
  cardPayment?: CardPayment;
  remoteIp: string;
}): Promise<void> {
  const existing = await loadSubscription(input.business.id);
  if (!existing?.provider_subscription_id || !existing.provider_customer_id)
    throw new Error("no_plan");
  const admin = createAdminClient();
  if (input.paymentMethod === "pix") {
    await updateSubscription(existing.provider_subscription_id, { billingType: "PIX" });
    await admin
      .from("subscriptions")
      .update({ billing_type: "pix", card_last4: null, card_brand: null })
      .eq("id", existing.id);
  } else {
    if (!input.cardPayment) throw new Error("card_missing");
    const card = await tokenizeCreditCard({
      customer: existing.provider_customer_id,
      card: input.cardPayment.card,
      holder: { ...input.cardPayment.holder, ...input.payer },
      remoteIp: input.remoteIp,
    });
    await updateSubscription(existing.provider_subscription_id, { billingType: "CREDIT_CARD" });
    await updateSubscriptionCard(existing.provider_subscription_id, {
      creditCardToken: card.creditCardToken,
      remoteIp: input.remoteIp,
    });
    await admin
      .from("subscriptions")
      .update({
        billing_type: "credit_card",
        card_last4: card.creditCardNumber,
        card_brand: card.creditCardBrand,
      })
      .eq("id", existing.id);
  }
  await audit({
    businessId: input.business.id,
    userId: input.userId,
    action: "plan.changed",
    details: { payment_method: input.paymentMethod },
  });
}

/** Stops future charges. The plan stays until the paid period ends (the billing cron downgrades). */
export async function cancelPlan(business: Business, userId: string): Promise<void> {
  const existing = await loadSubscription(business.id);
  if (!existing?.provider_subscription_id || existing.status === "cancelled") return;
  await deleteSubscription(existing.provider_subscription_id);
  await createAdminClient()
    .from("subscriptions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", existing.id);
  await audit({
    businessId: business.id,
    userId,
    action: "subscription.cancelled",
    details: { plan: existing.plan, until: existing.current_period_end },
  });
}

// ---------------------------------------------------------------------------
// Add-ons: each one is its own Asaas subscription (monthly).

interface FeaturedAddon {
  city: string;
  subscription_id: string;
  status: "pending" | "active" | "cancelled";
}
interface DomainAddon {
  subscription_id: string;
  status: "pending" | "active" | "cancelled";
  paid_until?: string;
}
interface Addons {
  featured?: FeaturedAddon[];
  custom_domain?: DomainAddon;
}

export async function subscribeAddon(input: {
  business: Business;
  brand: BrandConfig;
  userId: string;
  addon: "featured" | "custom_domain";
  city?: string;
  payer: { name: string; cpfCnpj: string; email: string };
}): Promise<PixCharge | null> {
  const admin = createAdminClient();
  const existing = await loadSubscription(input.business.id);
  if (!existing) throw new Error("no_plan");
  const addons = (existing.addons ?? {}) as Addons;
  const customerId = await ensureCustomer(input.business, existing, input.payer);
  const isFeatured = input.addon === "featured";
  const city = input.city?.trim() ?? "";
  if (
    isFeatured &&
    (!city ||
      addons.featured?.some(
        (f) => f.city.toLowerCase() === city.toLowerCase() && f.status !== "cancelled",
      ))
  ) {
    throw new Error("featured_exists");
  }

  const subscription = await createSubscription({
    customer: customerId,
    valueCents: isFeatured ? PLAN_PRICES.featured.monthly : PLAN_PRICES.customDomain.monthly,
    cycle: "MONTHLY",
    nextDueDate: today(),
    description: `${input.brand.name} · ${isFeatured ? `Destaque no portal (${city})` : "Domínio próprio"}`,
    externalReference: `${input.business.id}:${isFeatured ? `featured:${city}` : "domain"}`,
    // Add-ons are paid by Pix inside the panel (no card token is kept on our side).
    billingType: "PIX",
  });

  const next: Addons = isFeatured
    ? {
        ...addons,
        featured: [
          ...(addons.featured ?? []),
          { city, subscription_id: subscription.id, status: "pending" },
        ],
      }
    : { ...addons, custom_domain: { subscription_id: subscription.id, status: "pending" } };
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
  const owned =
    addons.featured?.some((f) => f.subscription_id === subscriptionId) ||
    addons.custom_domain?.subscription_id === subscriptionId;
  if (!owned) return;
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
  if (featured) {
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
  } else if (addons.custom_domain?.subscription_id === subscriptionId) {
    addons.custom_domain.status = status;
    if (paidUntil) addons.custom_domain.paid_until = paidUntil;
  } else {
    return;
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
  if (featured) return { row: featured as Subscription, kind: "addon" };
  const { data: domain } = await admin
    .from("subscriptions")
    .select("*")
    .contains("addons", { custom_domain: { subscription_id: subscriptionId } })
    .maybeSingle();
  return domain ? { row: domain as Subscription, kind: "addon" } : null;
}

async function businessOf(businessId: string): Promise<Business | null> {
  const { data } = await createAdminClient()
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .maybeSingle();
  return (data as Business | null) ?? null;
}

/** Applies one Asaas event. Callers guarantee each event id is handled once. */
export async function handleAsaasEvent(event: AsaasEvent): Promise<string> {
  const admin = createAdminClient();
  const subscriptionId = event.payment?.subscription ?? event.subscription?.id;
  if (!subscriptionId) return "ignored: no subscription";
  const found = await findBySubscription(subscriptionId);
  if (!found) return "ignored: unknown subscription";
  const { row, kind } = found;

  if (event.event === "PAYMENT_CONFIRMED" || event.event === "PAYMENT_RECEIVED") {
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
    // A downgrade scheduled for the end of the period takes effect with the next period's payment.
    const plan = row.pending_plan ?? paidPlanOf(row.plan) ?? "agenda";
    await admin
      .from("subscriptions")
      .update({
        status: "active",
        plan,
        pending_plan: null,
        current_period_end: paidUntil,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    const business = await businessOf(row.business_id);
    if (business) {
      await admin.rpc("apply_professional_seats", {
        p_business_id: business.id,
        p_seats: (row.extra_professionals ?? 0) + 1,
      });
    }
    if (business && business.plan !== plan) {
      await admin.from("businesses").update({ plan }).eq("id", business.id);
      await audit({
        businessId: business.id,
        userId: null,
        action: "plan.changed",
        details: {
          from: business.plan,
          to: plan,
          via: "payment",
          // Admin metrics: a paid plan right after (or during) a trial.
          trial_plan: business.trial_plan,
        },
      });
      invalidatePublicPage(business.slug);
    }
    return "plan active";
  }

  // Renewal by Pix: our own e-mail with the link to pay inside the panel (Asaas e-mails are off).
  if (event.event === "PAYMENT_CREATED") {
    if (kind === "plan" && row.status === "active" && row.billing_type === "pix" && event.payment) {
      if (await claimNotification(row.business_id, "billing_renewal", event.payment.id)) {
        const due = event.payment.dueDate.split("-").reverse().join("/");
        const value = Math.round(event.payment.value * 100);
        await notifyTeam({
          businessId: row.business_id,
          type: "account",
          subject: `Sua mensalidade vence em ${due}`,
          content: {
            heading: "Sua mensalidade está disponível",
            paragraphs: [
              `A mensalidade de R$ ${(value / 100).toFixed(2).replace(".", ",")} vence em ${due}.`,
              "Pague pelo Pix no seu painel, em Assinatura. Leva menos de um minuto.",
            ],
            cta: { label: "Pagar com Pix", url: "/painel/plano" },
          },
          push: {
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

/** Subscription ended without payment: same state as an ended trial (data kept). */
export async function downgradeToFree(businessId: string, reason: string): Promise<void> {
  const business = await businessOf(businessId);
  if (!business || business.plan === "free") return;
  // Nothing is hidden or deleted: the chat switches to the WhatsApp hand-off and the panel
  // shows only the plan screen until a new subscription is paid.
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
 * Daily billing job: plans cancelled whose period ended (or overdue for more than 5 days) go back
 * to Grátis, downgrades scheduled for a period that ended are applied, and subscriptions marked
 * with a new price get their Asaas value updated (from the next charge). Idempotent.
 */
export async function processBillingExpirations(): Promise<{
  downgraded: number;
  planChanges: number;
  repriced: number;
}> {
  const downgraded = await expireSubscriptions();
  const admin = createAdminClient();
  const now = new Date().toISOString();

  let planChanges = 0;
  const { data: pending } = await admin
    .from("subscriptions")
    .select("*")
    .not("pending_plan", "is", null)
    .lt("current_period_end", now);
  for (const row of (pending ?? []) as Subscription[]) {
    await admin
      .from("subscriptions")
      .update({ plan: row.pending_plan, pending_plan: null, updated_at: now })
      .eq("id", row.id);
    const business = await businessOf(row.business_id);
    if (business && paidPlanOf(business.plan)) {
      await admin.from("businesses").update({ plan: row.pending_plan }).eq("id", business.id);
      invalidatePublicPage(business.slug);
      await audit({
        businessId: business.id,
        userId: null,
        action: "plan.changed",
        details: { from: business.plan, to: row.pending_plan, reason: "scheduled downgrade" },
      });
    }
    planChanges++;
  }

  let repriced = 0;
  const { data: stale } = await admin
    .from("subscriptions")
    .select("*")
    .eq("needs_reprice", true)
    .in("status", ["pending", "active", "overdue"]);
  for (const row of (stale ?? []) as Subscription[]) {
    if (!row.provider_subscription_id) continue;
    const plan = paidPlanOf(row.plan) ?? "agenda";
    await updateSubscription(row.provider_subscription_id, {
      valueCents: subscriptionPrice(plan, row.billing_cycle, row.extra_professionals ?? 0),
    });
    await admin
      .from("subscriptions")
      .update({ needs_reprice: false, updated_at: now })
      .eq("id", row.id);
    repriced++;
  }
  return { downgraded, planChanges, repriced };
}

async function expireSubscriptions(): Promise<number> {
  const admin = createAdminClient();
  const now = Date.now();
  const { data } = await admin
    .from("subscriptions")
    .select("*")
    .in("status", ["cancelled", "overdue"]);
  let downgraded = 0;
  for (const row of (data ?? []) as Subscription[]) {
    const end = row.current_period_end ? new Date(row.current_period_end).getTime() : 0;
    const expired = row.status === "cancelled" ? end < now : end + 5 * 86_400_000 < now;
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
