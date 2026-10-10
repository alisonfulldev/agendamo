import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { cancelAppointment, confirmDeposit } from "@/lib/booking/manage";
import { notifyReceiptReceived, notifyReceiptReminder } from "@/lib/booking/notify";
import type { Appointment, DepositReceipt } from "@/lib/db/types";
import { rateLimit } from "@/lib/rate-limit";
import { createPrivateUploadUrl, deleteObject, readObject } from "@/lib/storage/r2";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  isReceiptType,
  RECEIPT_MAX_BYTES,
  RECEIPT_TYPES,
  sniffReceiptType,
  type ReceiptContentType,
} from "./receipt-file";

/** Upload attempts allowed per appointment (each one signs a new URL). */
export const RECEIPT_MAX_ATTEMPTS = 5;
/** Files are deleted this long after the professional's decision. */
export const RECEIPT_KEEP_DAYS = 30;

type ReceiptError =
  | "invalid"
  | "expired"
  | "not_waiting"
  | "too_many"
  | "rate_limited"
  | "missing"
  | "invalid_file"
  | "duplicate";

/** The appointment of the customer's secret link (cancel token), or null. */
async function appointmentByToken(token: string): Promise<Appointment | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const { data } = await createAdminClient()
    .from("appointments")
    .select("*")
    .eq("cancel_token", token)
    .maybeSingle();
  return (data as Appointment | null) ?? null;
}

function stillWaiting(appointment: Appointment, now: Date): ReceiptError | null {
  if (appointment.status !== "awaiting_deposit" || appointment.deposit_status !== "waiting")
    return "not_waiting";
  if (!appointment.deposit_expires_at || new Date(appointment.deposit_expires_at) <= now)
    return "expired";
  return null;
}

/**
 * Step 1 ("Já paguei, enviar comprovante"): a presigned PUT (5 minutes) for a random key
 * receipts/<128-bit hex>.<ext>. Nothing about the business or the appointment is in the key.
 */
export async function signReceiptUpload(input: {
  token: string;
  contentType: string;
  size: number;
  ipKey: string;
  now?: Date;
}): Promise<{ ok: true; receiptId: string; url: string } | { ok: false; error: ReceiptError }> {
  const now = input.now ?? new Date();
  if (!isReceiptType(input.contentType)) return { ok: false, error: "invalid_file" };
  if (!Number.isInteger(input.size) || input.size < 1 || input.size > RECEIPT_MAX_BYTES)
    return { ok: false, error: "invalid_file" };
  const appointment = await appointmentByToken(input.token);
  if (!appointment) return { ok: false, error: "invalid" };
  const waiting = stillWaiting(appointment, now);
  if (waiting) return { ok: false, error: waiting };
  if (!(await rateLimit("receipt", `appt:${appointment.id}`, input.ipKey)))
    return { ok: false, error: "rate_limited" };

  const admin = createAdminClient();
  const { count } = await admin
    .from("deposit_receipts")
    .select("id", { count: "exact", head: true })
    .eq("appointment_id", appointment.id);
  if ((count ?? 0) >= RECEIPT_MAX_ATTEMPTS) return { ok: false, error: "too_many" };

  const key = `receipts/${randomBytes(16).toString("hex")}.${RECEIPT_TYPES[input.contentType]}`;
  const { data, error } = await admin
    .from("deposit_receipts")
    .insert({
      business_id: appointment.business_id,
      appointment_id: appointment.id,
      object_key: key,
      content_type: input.contentType,
      size_bytes: input.size,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("receipt row failed");
  const url = await createPrivateUploadUrl(key, input.contentType, input.size);
  return { ok: true, receiptId: data.id as string, url };
}

/**
 * Step 2, after the browser uploaded the file: the server reads it (in memory only, nothing is
 * written or logged), checks the real type by its bytes and computes the SHA-256. The same file
 * already used in another appointment is refused. Only then the appointment is pre-confirmed.
 */
export async function confirmReceipt(input: {
  token: string;
  receiptId: string;
  now?: Date;
}): Promise<{ ok: true } | { ok: false; error: ReceiptError }> {
  const now = input.now ?? new Date();
  const appointment = await appointmentByToken(input.token);
  if (!appointment) return { ok: false, error: "invalid" };
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("deposit_receipts")
    .select("*")
    .eq("id", input.receiptId)
    .eq("appointment_id", appointment.id)
    .maybeSingle();
  const receipt = row as DepositReceipt | null;
  if (!receipt || receipt.status !== "uploading" || !receipt.object_key)
    return { ok: false, error: "invalid" };

  const discard = async (status: DepositReceipt["status"]) => {
    await deleteObject(receipt.object_key!).catch(() => undefined);
    await admin
      .from("deposit_receipts")
      .update({ status, object_key: null, deleted_at: now.toISOString() })
      .eq("id", receipt.id);
  };

  const waiting = stillWaiting(appointment, now);
  if (waiting) {
    await discard("invalid");
    return { ok: false, error: waiting };
  }
  const bytes = await readObject(receipt.object_key, RECEIPT_MAX_BYTES);
  if (!bytes) {
    await discard("invalid");
    return { ok: false, error: "missing" };
  }
  const type: ReceiptContentType | null = sniffReceiptType(bytes);
  if (!type || type !== receipt.content_type || bytes.length !== receipt.size_bytes) {
    await discard("invalid");
    return { ok: false, error: "invalid_file" };
  }
  const sha256 = createHash("sha256").update(bytes).digest("hex");

  const { error } = await admin
    .from("deposit_receipts")
    .update({ sha256, status: "received", uploaded_at: now.toISOString() })
    .eq("id", receipt.id)
    .eq("status", "uploading");
  if (error) {
    // 23505: the same file was already used (unique hash), in any appointment.
    if (error.code === "23505") {
      await discard("duplicate");
      return { ok: false, error: "duplicate" };
    }
    throw new Error("receipt update failed");
  }

  // Pre-confirmed: the time stays blocked until the professional decides (never automatic).
  const { data: moved } = await admin
    .from("appointments")
    .update({ status: "pending", deposit_status: "sent", deposit_sent_at: now.toISOString() })
    .eq("id", appointment.id)
    .eq("status", "awaiting_deposit")
    .eq("deposit_status", "waiting")
    .select("id");
  if (!moved?.length) return { ok: false, error: "not_waiting" };
  await notifyReceiptReceived(appointment.id);
  return { ok: true };
}

/** "Confirmar recebimento" / "Não recebi": only the professional decides (never automatic). */
export async function decideDeposit(input: {
  businessId: string;
  appointmentId: string;
  decision: "confirm" | "refuse";
  reason?: string;
  now?: Date;
}): Promise<boolean> {
  const now = (input.now ?? new Date()).toISOString();
  const admin = createAdminClient();
  const { data } = await admin
    .from("appointments")
    .select("id, business_id, deposit_status")
    .eq("id", input.appointmentId)
    .eq("business_id", input.businessId)
    .maybeSingle();
  if (!data || !["waiting", "sent"].includes(data.deposit_status as string)) return false;

  if (input.decision === "confirm") {
    if (!(await confirmDeposit(input.appointmentId))) return false;
    await admin
      .from("deposit_receipts")
      .update({ status: "accepted", decided_at: now })
      .eq("appointment_id", input.appointmentId)
      .eq("status", "received");
    return true;
  }

  const reason = input.reason?.trim().slice(0, 300) || "Pagamento não identificado";
  await admin
    .from("appointments")
    .update({ deposit_status: "refused", deposit_refused_reason: reason, deposit_decided_at: now })
    .eq("id", input.appointmentId);
  await admin
    .from("deposit_receipts")
    .update({ status: "rejected", decided_at: now })
    .eq("appointment_id", input.appointmentId)
    .eq("status", "received");
  // Frees the time and tells the customer, kindly.
  await cancelAppointment(
    input.appointmentId,
    "business",
    "Não conseguimos identificar o pagamento do sinal, então o horário foi liberado. Se você já pagou, fale com a gente pelo WhatsApp que resolvemos.",
  );
  return true;
}

/** The professional returned the deposit (outside MeetChat): recorded with date and amount. */
export async function registerRefund(input: {
  businessId: string;
  appointmentId: string;
  cents: number;
  date: string;
}): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("appointments")
    .update({
      deposit_status: "refunded",
      deposit_refunded_cents: input.cents,
      deposit_refunded_at: input.date,
    })
    .eq("id", input.appointmentId)
    .eq("business_id", input.businessId)
    .in("deposit_status", ["confirmed", "refused"])
    .select("id");
  return (data?.length ?? 0) > 0;
}

/**
 * Every 5 minutes: holds that ended without a receipt free the time ("Seu horário expirou").
 * Idempotent: only appointments still waiting are touched.
 */
export async function expireDepositHolds(now: Date = new Date()): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("appointments")
    .select("id")
    .eq("status", "awaiting_deposit")
    .eq("deposit_status", "waiting")
    .lt("deposit_expires_at", now.toISOString());
  let expired = 0;
  for (const row of data ?? []) {
    const { data: marked } = await admin
      .from("appointments")
      .update({ deposit_status: "expired", deposit_decided_at: now.toISOString() })
      .eq("id", row.id as string)
      .eq("deposit_status", "waiting")
      .select("id");
    if (!marked?.length) continue;
    await cancelAppointment(
      row.id as string,
      "business",
      "O comprovante do sinal não chegou a tempo",
    );
    expired++;
  }
  return expired;
}

/** Hourly: receipts still not checked get reminders to the team after the configured hours. */
export async function remindPendingReceipts(now: Date = new Date()): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("appointments")
    .select("id, business_id, deposit_sent_at")
    .eq("deposit_status", "sent")
    .not("deposit_sent_at", "is", null);
  const rows = (data ?? []) as { id: string; business_id: string; deposit_sent_at: string }[];
  if (!rows.length) return 0;
  const { data: settings } = await admin
    .from("page_settings")
    .select("business_id, deposit_reminder_hours")
    .in(
      "business_id",
      rows.map((r) => r.business_id),
    );
  const hoursOf = new Map(
    (settings ?? []).map((s) => [
      s.business_id as string,
      (s.deposit_reminder_hours as number[]) ?? [2, 6],
    ]),
  );
  let sent = 0;
  for (const row of rows) {
    const waitedHours = (now.getTime() - new Date(row.deposit_sent_at).getTime()) / 3_600_000;
    for (const hours of hoursOf.get(row.business_id) ?? [2, 6]) {
      if (waitedHours >= hours && (await notifyReceiptReminder(row.id, hours))) sent++;
    }
  }
  return sent;
}

/**
 * Daily: receipt files are deleted 30 days after the decision (the hash stays, so the same file
 * is still refused), and abandoned uploads after one day. Idempotent.
 */
export async function purgeReceiptFiles(now: Date = new Date()): Promise<number> {
  const admin = createAdminClient();
  const decidedBefore = new Date(now.getTime() - RECEIPT_KEEP_DAYS * 86_400_000).toISOString();
  const abandonedBefore = new Date(now.getTime() - 86_400_000).toISOString();
  const [decided, abandoned] = await Promise.all([
    admin
      .from("deposit_receipts")
      .select("id, object_key")
      .not("object_key", "is", null)
      .lt("decided_at", decidedBefore),
    admin
      .from("deposit_receipts")
      .select("id, object_key")
      .not("object_key", "is", null)
      .eq("status", "uploading")
      .lt("created_at", abandonedBefore),
  ]);
  let purged = 0;
  for (const row of [...(decided.data ?? []), ...(abandoned.data ?? [])]) {
    await deleteObject(row.object_key as string).catch(() => undefined);
    await admin
      .from("deposit_receipts")
      .update({ object_key: null, deleted_at: now.toISOString() })
      .eq("id", row.id as string);
    purged++;
  }
  return purged;
}
