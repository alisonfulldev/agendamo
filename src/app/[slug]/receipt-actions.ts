"use server";

import { z } from "zod";

import { confirmReceipt, declarePaid, signReceiptUpload } from "@/lib/deposits/receipts";
import { hashedClientIp, rateLimitRequest } from "@/lib/rate-limit";

const token = z.string().regex(/^[A-Za-z0-9_-]{16,64}$/);

export type ReceiptActionError =
  | "receipt_required"
  | "invalid"
  | "expired"
  | "not_waiting"
  | "too_many"
  | "rate_limited"
  | "missing"
  | "invalid_file"
  | "duplicate";

/** "Já fiz o Pix": no receipt needed (the owner checks the unique-cents amount in the bank). */
export async function declarePaidAction(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: ReceiptActionError }> {
  const parsed = z.object({ token }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (!(await rateLimitRequest("receipt"))) return { ok: false, error: "rate_limited" };
  return declarePaid(parsed.data);
}

/** "Anexar comprovante" (optional, or required after a "Não recebi"): a 5-minute URL to upload the receipt straight to storage. */
export async function signReceiptAction(
  input: unknown,
): Promise<
  { ok: true; receiptId: string; url: string } | { ok: false; error: ReceiptActionError }
> {
  const parsed = z
    .object({
      token,
      contentType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
      size: z.number().int().min(1),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_file" };
  if (!(await rateLimitRequest("receipt"))) return { ok: false, error: "rate_limited" };
  return signReceiptUpload({ ...parsed.data, ipKey: `ip:${await hashedClientIp()}` });
}

/** After the upload: checked on the server (type, hash); only then the time is pre-confirmed. */
export async function confirmReceiptAction(
  input: unknown,
): Promise<{ ok: true } | { ok: false; error: ReceiptActionError }> {
  const parsed = z.object({ token, receiptId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (!(await rateLimitRequest("receipt"))) return { ok: false, error: "rate_limited" };
  return confirmReceipt(parsed.data);
}
