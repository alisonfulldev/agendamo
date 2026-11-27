import "server-only";

import { tmpdir } from "node:os";
import path from "node:path";

import sharp from "sharp";
import { createWorker, type Worker } from "tesseract.js";
import { extractText } from "unpdf";

import type { ReceiptContentType } from "./receipt-file";

/**
 * Reads the text of a receipt (no AI): a screenshot with Tesseract (OCR, 2026-11-26), a PDF by
 * the text inside it with unpdf (2026-11-27). Runs on our server, in memory: nothing of the
 * receipt is written or logged. The Portuguese data ships with the app (assets/tessdata), so
 * nothing is downloaded at runtime.
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
 * Bank PDFs carry the text itself (no OCR). A scanned PDF has no text: null, and the owner
 * checks it.
 */
async function pdfText(bytes: Uint8Array): Promise<string | null> {
  // unpdf may take over the buffer: it gets a copy.
  const { text } = await extractText(new Uint8Array(bytes), { mergePages: true });
  return text.trim() ? text : null;
}

/**
 * The receipt's text, or null when it cannot be read (a failure, a scanned PDF or the time
 * limit): then the receipt goes to the owner, as before.
 */
export async function readReceiptText(
  bytes: Uint8Array,
  type: ReceiptContentType,
): Promise<string | null> {
  let timer: NodeJS.Timeout | undefined;
  try {
    const reading = (async () => {
      if (type === "application/pdf") return pdfText(bytes);
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
