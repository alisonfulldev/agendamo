import "server-only";

import { formatInTimeZone } from "date-fns-tz";

import { layoutBlock, pickProfessional } from "@/lib/availability";
import type { AppointmentStatus } from "@/lib/db/types";
import { baseDeposit, uniqueDepositAmount } from "@/lib/deposits/amount";
import { getBookingAllowance } from "@/lib/plan-usage";
import { getPlanFeatures } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  countAppointmentsOn,
  getSlots,
  priceFor,
  resolveSelection,
  stepsFor,
  type Catalog,
  type Selection,
} from "./data";
import { chargedPrices } from "./pricing";

export type BookingError =
  | "conflict"
  | "blocked"
  | "invalid"
  | "unavailable"
  | "coupon_invalid"
  /** A deposit applies and the policy was not accepted (the chat shows it first). */
  | "policy_required"
  /** Grátis plan: the 10 chat bookings of the cycle are used (the chat hands off to WhatsApp). */
  | "limit";

export interface BookingCustomer {
  name: string;
  /** Normalized digits with country code. */
  phone: string;
  email: string | null;
  marketingOptIn: boolean;
}

export interface CreateBookingInput {
  catalog: Catalog;
  selection: Selection;
  professional: string | "any";
  /** UTC ISO start chosen from the offered slots. */
  startsAt: string;
  /** New or returning customer (matched by phone), or an existing customer by id (manual booking). */
  customer: BookingCustomer | { existingId: string };
  source: "chat" | "manual";
  couponCode?: string | null;
  referralCode?: string | null;
  /** Customer packages: use one session (Prompt 27). */
  customerPackageId?: string | null;
  /** The customer accepted the deposit policy shown in the chat (required when a deposit applies). */
  depositPolicyAccepted?: boolean;
  now?: Date;
}

export interface CreatedBooking {
  id: string;
  status: AppointmentStatus;
  professionalId: string;
  customerId: string;
  customerCreated: boolean;
  startsAt: string;
  endsAt: string;
  priceCents: number;
  discountCents: number;
  depositCents: number;
  depositExpiresAt: string | null;
  cancelToken: string;
}

export type CreateBookingResult =
  { ok: true; booking: CreatedBooking } | { ok: false; error: BookingError };

/**
 * Books an appointment (chat or manual). The start must be one of the slots the engine offers;
 * the database exclusion constraints are the final guard against double booking.
 */
export async function createBooking(input: CreateBookingInput): Promise<CreateBookingResult> {
  const { catalog } = input;
  const business = catalog.business;
  const now = input.now ?? new Date();
  const resolved = resolveSelection(catalog, input.selection);
  if (!resolved) return { ok: false, error: "invalid" };
  const { services, combo } = resolved;

  // 0. Grátis plan: 10 automatic (chat) bookings per cycle, checked on the server (rule 6).
  if (input.source === "chat") {
    const allowance = await getBookingAllowance(business, now);
    if (allowance.limited && allowance.remaining <= 0) return { ok: false, error: "limit" };
  }

  // 1. The start must be offered by the engine, for this professional (or anyone, for "any").
  const date = formatInTimeZone(new Date(input.startsAt), business.timezone, "yyyy-MM-dd");
  const slots = await getSlots({ catalog, services, professional: input.professional, now }, date);
  const slot = slots.find((s) => s.startsAt === new Date(input.startsAt).toISOString());
  if (!slot) return { ok: false, error: "conflict" };

  let professionalId = input.professional;
  if (professionalId === "any") {
    const counts = await countAppointmentsOn(
      business.id,
      slot.professionalIds,
      date,
      business.timezone,
    );
    professionalId = pickProfessional(slot.professionalIds, counts) ?? "";
  }
  if (!professionalId || !slot.professionalIds.includes(professionalId))
    return { ok: false, error: "conflict" };

  // 2. Customer: existing by id (manual), or by phone (reused or created).
  const admin = createAdminClient();
  let referredBy: string | null = null;
  let customer: { id: string; blocked: boolean; no_show_count: number; created: boolean };
  if ("existingId" in input.customer) {
    const { data: existing } = await admin
      .from("customers")
      .select("id, blocked, no_show_count")
      .eq("id", input.customer.existingId)
      .eq("business_id", business.id)
      .maybeSingle();
    if (!existing) return { ok: false, error: "invalid" };
    customer = {
      ...(existing as { id: string; blocked: boolean; no_show_count: number }),
      created: false,
    };
  } else {
    if (input.referralCode) {
      const { data: referrer } = await admin
        .from("customers")
        .select("id, phone")
        .eq("business_id", business.id)
        .eq("referral_code", input.referralCode)
        .maybeSingle();
      if (referrer && referrer.phone !== input.customer.phone) referredBy = referrer.id as string;
    }
    const { data: customerRows, error: customerError } = await admin.rpc("upsert_customer", {
      p_business_id: business.id,
      p_name: input.customer.name,
      p_phone: input.customer.phone,
      p_email: input.customer.email,
      p_marketing_opt_in: input.customer.marketingOptIn,
      p_referred_by: referredBy,
    });
    if (customerError || !customerRows?.[0])
      throw new Error(`upsert_customer failed: ${customerError?.message}`);
    customer = customerRows[0] as {
      id: string;
      blocked: boolean;
      no_show_count: number;
      created: boolean;
    };
  }
  if (customer.blocked && input.source === "chat") return { ok: false, error: "blocked" };

  // 3. Prices, coupon and deposit.
  const steps = stepsFor(catalog, professionalId, services);
  const priced = services.map((service) => {
    const override = catalog.professionalServices.find(
      (ps) => ps.professional_id === professionalId && ps.service_id === service.id,
    );
    return {
      priceCents: override?.price_override ?? service.price_cents,
      depositType: service.deposit_type,
      depositValue: service.deposit_value,
    };
  });
  const charged = chargedPrices(priced, combo ? combo.price_cents : null);
  const total = priceFor(catalog, professionalId, services, combo);

  let discount = 0;
  const couponCode = input.couponCode?.trim().toUpperCase() || null;
  if (couponCode) {
    const { data } = await admin.rpc("preview_business_coupon", {
      p_business_id: business.id,
      p_code: couponCode,
      p_amount: total,
    });
    if (data === null || data === undefined) return { ok: false, error: "coupon_invalid" };
    discount = data as number;
  }

  const features = getPlanFeatures(business, now);
  const { data: page } = await admin
    .from("page_settings")
    .select(
      "pix_key, deposit_hold_minutes, deposit_min_cents, deposit_policy_text, deposit_policy_version",
    )
    .eq("business_id", business.id)
    .maybeSingle();
  // Deposit or full payment by Pix (Pro): before the unique cents.
  const deposit =
    features.deposits && page?.pix_key && !input.customerPackageId
      ? baseDeposit(
          priced.map((p, i) => ({
            depositType: p.depositType,
            depositValue: p.depositValue,
            chargedCents: charged[i]!,
          })),
          total - discount,
          (page.deposit_min_cents as number) ?? 0,
        )
      : 0;

  // 4. Status.
  let status: AppointmentStatus = "confirmed";
  if (input.source === "chat") {
    const overNoShowLimit =
      business.no_show_limit !== null && customer.no_show_count >= business.no_show_limit;
    if (overNoShowLimit || business.booking_confirmation === "manual") status = "pending";
    else if (deposit > 0) status = "awaiting_deposit";
  }
  const policyText = (page?.deposit_policy_text as string | null)?.trim() || null;
  if (status === "awaiting_deposit" && policyText && !input.depositPolicyAccepted)
    return { ok: false, error: "policy_required" };
  // The time stays reserved while waiting for the receipt (20 minutes by default).
  const depositExpiresAt =
    status === "awaiting_deposit"
      ? new Date(
          Math.min(
            now.getTime() + ((page?.deposit_hold_minutes as number) ?? 20) * 60_000,
            new Date(slot.startsAt).getTime(),
          ),
        ).toISOString()
      : null;

  // 5. Atomic insert (appointment + services + resources). With a deposit, the amount gets unique
  // cents among the professional's pending payments (the database guarantees it: a clash retries).
  const block = layoutBlock(new Date(slot.startsAt), steps);
  const minimum = (page?.deposit_min_cents as number) ?? 0;
  let appointmentId: unknown = null;
  let depositCents = 0;
  for (let attempt = 0; attempt < 5 && !appointmentId; attempt++) {
    if (status === "awaiting_deposit") {
      const { data: pending } = await admin
        .from("appointments")
        .select("deposit_cents")
        .eq("professional_id", professionalId)
        .in("deposit_status", ["waiting", "sent"])
        .gt("deposit_cents", 0);
      const taken = new Set((pending ?? []).map((r) => r.deposit_cents as number));
      const amount = uniqueDepositAmount(deposit, minimum, taken);
      if (amount === null) return { ok: false, error: "unavailable" };
      depositCents = amount;
    }
    const { data, error } = await admin.rpc("book_appointment", {
      p: {
        business_id: business.id,
        professional_id: professionalId,
        customer_id: customer.id,
        starts_at: block.start.toISOString(),
        ends_at: block.end.toISOString(),
        status,
        source: input.source,
        deposit_cents: status === "awaiting_deposit" ? depositCents : 0,
        deposit_status: status === "awaiting_deposit" ? "waiting" : "none",
        deposit_expires_at: depositExpiresAt,
        coupon_code: couponCode,
        discount_cents: discount,
        referral_code: referredBy ? input.referralCode : null,
        package_id: input.customerPackageId ?? null,
        services: services.map((service, i) => ({
          service_id: service.id,
          name: service.name,
          duration_minutes: steps[i]!.durationMinutes,
          price_cents: charged[i],
        })),
        resources: block.steps.flatMap((step) =>
          step.resourceIds.map((resourceId) => ({
            resource_id: resourceId,
            starts_at: step.start.toISOString(),
            ends_at: step.end.toISOString(),
          })),
        ),
      },
    });
    if (error) {
      if (error.code === "23505" && status === "awaiting_deposit") continue;
      if (error.code === "23P01") return { ok: false, error: "conflict" };
      if (error.message.includes("coupon_invalid")) return { ok: false, error: "coupon_invalid" };
      throw new Error(`book_appointment failed: ${error.message}`);
    }
    appointmentId = data;
  }
  if (!appointmentId) return { ok: false, error: "unavailable" };
  if (status === "awaiting_deposit") {
    const id = appointmentId as string;
    // Identifier of the booking in the Pix code (txid), and the policy the customer accepted.
    await admin
      .from("appointments")
      .update({ deposit_reference: `MC${id.replace(/-/g, "").slice(0, 20)}` })
      .eq("id", id);
    if (policyText) {
      await admin.from("deposit_policy_acceptances").insert({
        business_id: business.id,
        appointment_id: id,
        policy_text: policyText,
        policy_version: (page?.deposit_policy_version as number) ?? 1,
      });
    }
  }

  const { data: created } = await admin
    .from("appointments")
    .select("cancel_token")
    .eq("id", appointmentId)
    .single();

  // A new customer who came with a valid referral code starts a pending referral (Prompt 32).
  if (referredBy && customer.created) {
    await admin.from("referrals").upsert(
      {
        business_id: business.id,
        referrer_customer_id: referredBy,
        referred_customer_id: customer.id,
        appointment_id: appointmentId,
      },
      { onConflict: "referred_customer_id", ignoreDuplicates: true },
    );
  }

  return {
    ok: true,
    booking: {
      id: appointmentId as string,
      status,
      professionalId,
      customerId: customer.id,
      customerCreated: customer.created,
      startsAt: block.start.toISOString(),
      endsAt: block.end.toISOString(),
      priceCents: total - discount,
      discountCents: discount,
      depositCents: status === "awaiting_deposit" ? depositCents : 0,
      depositExpiresAt,
      cancelToken: created?.cancel_token as string,
    },
  };
}
