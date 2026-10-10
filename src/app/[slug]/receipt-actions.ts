"use server";

import { z } from "zod";

import { confirmReceipt, signReceiptUpload } from "@/lib/deposits/receipts";
import { hashedClientIp, rateLimitRequest } from "@/lib/rate-limit";

const token = z.string().regex(/^[A-Za-z0-9_-]{16,64}$/);

export type ReceiptActionError =
  | "invalid"
  | "expired"
  | "not_waiting"
  | "too_many"
  | "rate_limited"
  | "missing"
  | "invalid_file"
  | "duplicate";

/** "Já paguei, enviar comprovante": a 5-minute URL to upload the receipt straight to storage. */
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
