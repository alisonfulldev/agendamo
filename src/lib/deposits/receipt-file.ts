/** Receipts: an image (JPG/PNG, sent as WebP after compression) or a PDF, up to 5 MB. */
export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;

export const RECEIPT_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
} as const;

export type ReceiptContentType = keyof typeof RECEIPT_TYPES;

export function isReceiptType(value: string): value is ReceiptContentType {
  return value in RECEIPT_TYPES;
}

/**
 * The real type from the first bytes (never trusting the name or the declared type): empty,
 * corrupted or other formats give null.
 */
export function sniffReceiptType(bytes: Uint8Array): ReceiptContentType | null {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (bytes.length < 12) return null;
  if (starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (
    starts(0x52, 0x49, 0x46, 0x46) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
    return "image/webp";
  if (starts(0x25, 0x50, 0x44, 0x46, 0x2d)) {
    // A PDF must also end with its end-of-file marker (truncated files are refused).
    const tail = new TextDecoder().decode(bytes.subarray(Math.max(0, bytes.length - 1024)));
    return tail.includes("%%EOF") ? "application/pdf" : null;
  }
  return null;
}
