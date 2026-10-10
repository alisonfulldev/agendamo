"use client";

import { RECEIPT_MAX_BYTES, type ReceiptContentType } from "./receipt-file";

export class ReceiptFileError extends Error {}

/** Receipt photos stay readable: up to 1800 px, WebP from 0.85 quality, at most ~1.5 MB. */
const MAX_SIDE = 1800;
const TARGET_BYTES = 1.5 * 1024 * 1024;

function toWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
}

/**
 * Prepares the receipt in the browser (rule 7): JPG/PNG photos are resized and turned into WebP
 * (the original is kept when the browser cannot); PDFs go as they are. Empty, too big or other
 * files are refused here (and again on the server, by their bytes).
 */
export async function prepareReceipt(
  file: File,
): Promise<{ blob: Blob; contentType: ReceiptContentType }> {
  if (file.size === 0) throw new ReceiptFileError("Esse arquivo está vazio. Escolha outro.");
  if (file.type === "application/pdf") {
    if (file.size > RECEIPT_MAX_BYTES)
      throw new ReceiptFileError("O PDF passa de 5 MB. Envie uma foto ou um print do comprovante.");
    return { blob: file, contentType: "application/pdf" };
  }
  if (file.type !== "image/jpeg" && file.type !== "image/png")
    throw new ReceiptFileError("Envie uma foto (JPG ou PNG) ou um PDF do comprovante.");
  if (file.size > 15 * 1024 * 1024)
    throw new ReceiptFileError("A imagem passa de 15 MB. Envie um print do comprovante.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ReceiptFileError("Não conseguimos abrir essa imagem. Ela pode estar corrompida.");
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (context) {
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    for (const quality of [0.85, 0.75, 0.65]) {
      const blob = await toWebp(canvas, quality);
      if (!blob || blob.type !== "image/webp") break;
      if (blob.size <= TARGET_BYTES) return { blob, contentType: "image/webp" };
    }
  }
  // No WebP in this browser: the original photo, if it is small enough.
  if (file.size <= RECEIPT_MAX_BYTES)
    return { blob: file, contentType: file.type as ReceiptContentType };
  throw new ReceiptFileError("A imagem ficou grande demais. Envie um print do comprovante.");
}
