import "server-only";

import webpush from "web-push";

import { PLATFORM } from "@/brands";
import { formatTime, loadAppointmentDetails, serviceNames } from "@/lib/booking/details";
import { sendReminderFallbackEmail } from "@/lib/booking/notify";
import { sendEmail } from "@/lib/email/send";
import { getServerEnv } from "@/lib/env";
import { claimNotification } from "@/lib/notifications/owner";
import { getPlanFeatures } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";

import { isPushConfigured, type PushPayload } from "./send";

/**
 * Customer reminders by web push (2026-11-27). The device is saved through the secret link of an
 * appointment and tied to the customer, so their next appointments are reminded too. Every send
 * is recorded (customer_push_deliveries) to measure delivery.
 */

export type CustomerPushKind = "test" | "reminder_24h" | "reminder_2h";
export type DevicePlatform = "android" | "ios" | "other";

export interface DeviceSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Sends to every active device of the customer; returns how many received it. */
async function sendToCustomerDevices(input: {
  businessId: string;
  customerId: string;
  appointmentId: string;
  kind: CustomerPushKind;
  payload: PushPayload;
  /** Only this device (the test right after activating). */
  endpoint?: string;
}): Promise<number> {
  if (!isPushConfigured()) return 0;
  const admin = createAdminClient();
  let query = admin
    .from("customer_push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("business_id", input.businessId)
    .eq("customer_id", input.customerId)
    .is("expired_at", null);
  if (input.endpoint) query = query.eq("endpoint", input.endpoint);
  const { data: devices } = await query;

  let delivered = 0;
  for (const device of devices ?? []) {
    let status: "sent" | "failed" | "expired" = "sent";
    let httpStatus: number | null = null;
    try {
      const response = await webpush.sendNotification(
        {
          endpoint: device.endpoint as string,
          keys: { p256dh: device.p256dh as string, auth: device.auth as string },
        },
        JSON.stringify(input.payload),
        // A reminder that arrives after the appointment is useless: it expires before.
        { TTL: input.kind === "reminder_2h" ? 60 * 90 : 60 * 60 * 12, urgency: "high" },
      );
      httpStatus = response.statusCode;
      delivered++;
    } catch (error) {
      httpStatus = (error as { statusCode?: number }).statusCode ?? null;
      status = httpStatus === 404 || httpStatus === 410 ? "expired" : "failed";
      if (status === "expired") {
        await admin
          .from("customer_push_subscriptions")
          .update({ expired_at: new Date().toISOString() })
          .eq("id", device.id as string);
      } else {
        console.error("customer push failed", httpStatus, (error as Error).message);
      }
    }
    await admin.from("customer_push_deliveries").insert({
      business_id: input.businessId,
      appointment_id: input.appointmentId,
      subscription_id: device.id as string,
      kind: input.kind,
      status,
      http_status: httpStatus,
    });
  }
  return delivered;
}

/**
 * "Ativar lembrete": saves the device for the customer of the appointment behind the secret link
 * and sends a test notification right away, which proves it works on that phone.
 */
export async function saveCustomerDevice(input: {
  token: string;
  subscription: DeviceSubscription;
  platform: DevicePlatform;
}): Promise<{ ok: true; tested: boolean } | { ok: false; error: "invalid" | "unavailable" }> {
  if (!isPushConfigured()) return { ok: false, error: "unavailable" };
  const admin = createAdminClient();
  const { data: appointment } = await admin
    .from("appointments")
    .select("id")
    .eq("cancel_token", input.token)
    .maybeSingle();
  const d = appointment ? await loadAppointmentDetails(appointment.id as string) : null;
  if (!d) return { ok: false, error: "invalid" };
  if (!getPlanFeatures(d.business).pushReminders) return { ok: false, error: "unavailable" };

  const { error } = await admin.from("customer_push_subscriptions").upsert(
    {
      business_id: d.business.id,
      customer_id: d.customer.id,
      endpoint: input.subscription.endpoint,
      p256dh: input.subscription.p256dh,
      auth: input.subscription.auth,
      platform: input.platform,
      expired_at: null,
    },
    { onConflict: "customer_id,endpoint" },
  );
  if (error) {
    console.error("customer device save failed", error.message);
    return { ok: false, error: "invalid" };
  }
  const delivered = await sendToCustomerDevices({
    businessId: d.business.id,
    customerId: d.customer.id,
    appointmentId: d.appointment.id,
    kind: "test",
    endpoint: input.subscription.endpoint,
    payload: {
      title: "Lembrete ativado ✓",
      body: `Você vai receber o aviso do seu horário em ${d.business.name} 1 dia e 2 horas antes.`,
      url: `/cancelar/${d.appointment.cancel_token}`,
      tag: `test-${d.appointment.id}`,
    },
  });
  return { ok: true, tested: delivered > 0 };
}

/**
 * For the reminder step: available (the plan has it and the server has the keys), whether the
 * customer of the appointment already has an active device, and the public key to subscribe.
 */
export async function reminderStatus(
  token: string,
): Promise<{ available: boolean; active: boolean; vapidPublicKey: string | null }> {
  const none = { available: false, active: false, vapidPublicKey: null };
  if (!isPushConfigured()) return none;
  const admin = createAdminClient();
  const { data: appointment } = await admin
    .from("appointments")
    .select(
      "business_id, customer_id, business:businesses(plan, trial_ends_at, plan_tier, product, professional_seats)",
    )
    .eq("cancel_token", token)
    .maybeSingle();
  // Many-to-one: one business row (typed as a list by the untyped client).
  const joined = appointment?.business as unknown;
  const business = (Array.isArray(joined) ? joined[0] : joined) as
    Parameters<typeof getPlanFeatures>[0] | null | undefined;
  if (!appointment || !business || !getPlanFeatures(business).pushReminders) return none;
  const { count } = await admin
    .from("customer_push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("business_id", appointment.business_id as string)
    .eq("customer_id", appointment.customer_id as string)
    .is("expired_at", null);
  return {
    available: true,
    active: (count ?? 0) > 0,
    vapidPublicKey: getServerEnv().NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null,
  };
}

const REMINDERS: {
  kind: "reminder_24h" | "reminder_2h";
  /** Sent when the appointment starts within this many minutes… */
  withinMinutes: number;
  /** …and is still at least this far away (otherwise the other reminder covers it). */
  atLeastMinutes: number;
}[] = [
  { kind: "reminder_24h", withinMinutes: 24 * 60, atLeastMinutes: 3 * 60 },
  { kind: "reminder_2h", withinMinutes: 2 * 60, atLeastMinutes: 15 },
];

/**
 * Every 15 minutes: the reminders 1 day and 2 hours before, once each (notification_log). Booked
 * less than an hour before the window: skipped (the customer has just booked). When no device
 * received the 1-day reminder and the customer has an e-mail, one fallback e-mail goes instead.
 */
export async function sendCustomerReminders(now: Date = new Date()): Promise<{
  sent: number;
  fallbackEmails: number;
}> {
  const admin = createAdminClient();
  let sent = 0;
  let fallbackEmails = 0;
  for (const reminder of REMINDERS) {
    const { data } = await admin
      .from("appointments")
      .select("id, created_at")
      .in("status", ["confirmed", "pending"])
      .gte("starts_at", new Date(now.getTime() + reminder.atLeastMinutes * 60_000).toISOString())
      .lte("starts_at", new Date(now.getTime() + reminder.withinMinutes * 60_000).toISOString());
    for (const row of data ?? []) {
      if (now.getTime() - new Date(row.created_at as string).getTime() < 60 * 60_000) continue;
      const d = await loadAppointmentDetails(row.id as string);
      if (!d || !getPlanFeatures(d.business).pushReminders) continue;
      if (!(await claimNotification(d.business.id, `push_${reminder.kind}`, d.appointment.id)))
        continue;
      const time = formatTime(d.appointment.starts_at, d.business.timezone);
      const delivered = await sendToCustomerDevices({
        businessId: d.business.id,
        customerId: d.customer.id,
        appointmentId: d.appointment.id,
        kind: reminder.kind,
        payload: {
          title:
            reminder.kind === "reminder_24h"
              ? `Amanhã às ${time}: ${d.business.name}`
              : `Daqui a pouco, às ${time}: ${d.business.name}`,
          body: `${serviceNames(d)}. Se não puder ir, toque para remarcar.`,
          url: `/cancelar/${d.appointment.cancel_token}`,
          tag: `reminder-${d.appointment.id}`,
        },
      });
      sent += delivered;
      if (delivered === 0 && reminder.kind === "reminder_24h" && d.customer.email) {
        if (await sendReminderFallbackEmail(d.appointment.id)) fallbackEmails++;
      }
    }
  }
  await alertOnFailures(now);
  return { sent, fallbackEmails };
}

/**
 * Delivery watch: more than 25% of the last 24 hours' reminders failing (at least 10 failures)
 * e-mails the platform admins, once a day.
 */
async function alertOnFailures(now: Date): Promise<void> {
  const admins = getServerEnv().ADMIN_EMAILS;
  if (!admins.length) return;
  const admin = createAdminClient();
  const { data } = await admin
    .from("customer_push_deliveries")
    .select("status")
    .gte("created_at", new Date(now.getTime() - 86_400_000).toISOString())
    .limit(5000);
  const rows = data ?? [];
  const failed = rows.filter((r) => r.status === "failed").length;
  if (failed < 10 || failed / rows.length <= 0.25) return;
  // Once a day (platform-level, so recorded in audit_log without a business).
  const day = now.toISOString().slice(0, 10);
  const { count } = await admin
    .from("audit_log")
    .select("id", { count: "exact", head: true })
    .eq("action", "push.failure_alert")
    .gte("created_at", `${day}T00:00:00Z`);
  if ((count ?? 0) > 0) return;
  await admin.from("audit_log").insert({
    business_id: null,
    action: "push.failure_alert",
    details: { failed, total: rows.length },
  });
  await sendEmail({
    brand: PLATFORM,
    to: admins,
    subject: `Alerta: ${failed} lembretes por notificação falharam nas últimas 24h`,
    content: {
      heading: "Lembretes por notificação falhando",
      paragraphs: [
        `${failed} de ${rows.length} notificações para clientes falharam nas últimas 24 horas.`,
        "Confira as chaves VAPID, o servidor e Admin › Lembretes.",
      ],
    },
  }).catch((error) => console.error("push alert failed", error));
}
