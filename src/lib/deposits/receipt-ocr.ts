import "server-only";

import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { createWorker, type Worker } from "tesseract.js";

import type { ReceiptContentType } from "./receipt-file";

/**
 * Reads the text of a receipt screenshot with Tesseract (OCR, no AI; 2026-11-26). Runs on our
 * server, in memory: nothing of the receipt is written or logged. The Portuguese data ships with
 * the app (assets/tessdata), so nothing is downloaded at runtime.
 */

/** A slow or stuck reading never blocks the customer: the receipt goes to the owner instead. */
const OCR_TIMEOUT_MS = 20_000;

let workerPromise: Promise<Worker> | null = null;

/** One worker for the whole server (it reads one image at a time, in order). */
function getWorker(): Promise<Worker> {
  workerPromise ??= createWorker("por", 1, {
    langPath: path.join(process.cwd(), "assets", "tessdata"),
    gzip: false,
    cachePath: tmpdir(),
  }).catch((error: unknown) => {
    workerPromise = null;
    throw error;
  });
  return workerPromise;
}

/** Bank screenshots are clean text: grayscale, contrast and enough pixels help the OCR. */
async function prepare(bytes: Uint8Array): Promise<Buffer> {
  const { width = 0 } = await sharp(bytes).metadata();
  const image = sharp(bytes).rotate();
  if (width < 1200) image.resize({ width: 1600 });
  // 300 dpi: screenshots carry no density and Tesseract would warn about it on every receipt.
  return image.grayscale().normalize().withMetadata({ density: 300 }).png().toBuffer();
}

/**
 * The receipt's text, or null when it cannot be read (PDF for now, a failure or the time limit):
 * then the receipt goes to the owner, as before.
 */
export async function readReceiptText(
  bytes: Uint8Array,
  type: ReceiptContentType,
): Promise<string | null> {
  if (type === "application/pdf") return null;
  let timer: NodeJS.Timeout | undefined;
  try {
    const reading = (async () => {
      const [worker, image] = await Promise.all([getWorker(), prepare(bytes)]);
      const { data } = await worker.recognize(image);
      return data.text;
    })();
    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), OCR_TIMEOUT_MS);
    });
    return await Promise.race([reading, timeout]);
  } catch (error) {
    console.error("receipt ocr failed", error instanceof Error ? error.message : "unknown");
    return null;
  } finally {
    clearTimeout(timer);
  }
}
