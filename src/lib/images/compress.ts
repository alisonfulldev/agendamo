"use client";

import {
  IMAGE_PRESETS,
  MAX_ORIGINAL_BYTES,
  MAX_UPLOAD_BYTES,
  UPLOAD_CONTENT_TYPE,
  WEBP_QUALITY,
  type ImageKind,
} from "./presets";

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
}

export class ImageError extends Error {}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, UPLOAD_CONTENT_TYPE, quality));
}

/**
 * Resizes and converts to WebP with the native canvas (rule 7). Lowers the quality step by step
 * if needed to stay under the 300 KB the server accepts.
 */
export async function compressImage(file: File, kind: ImageKind): Promise<CompressedImage> {
  if (!file.type.startsWith("image/")) throw new ImageError("Escolha um arquivo de imagem.");
  if (file.size > MAX_ORIGINAL_BYTES)
    throw new ImageError("A imagem passa de 15 MB. Escolha uma menor.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImageError("Não conseguimos ler essa imagem. Tente outra (JPG, PNG ou WebP).");
  }

  const preset = IMAGE_PRESETS[kind];
  let sx = 0;
  let sy = 0;
  let sw = bitmap.width;
  let sh = bitmap.height;
  let width: number;
  let height: number;

  if (preset.square) {
    const side = Math.min(bitmap.width, bitmap.height);
    sx = (bitmap.width - side) / 2;
    sy = (bitmap.height - side) / 2;
    sw = sh = side;
    width = height = Math.min(preset.square, side);
  } else {
    const scale = Math.min(
      1,
      (preset.maxWidth ?? Infinity) / bitmap.width,
      (preset.maxHeight ?? Infinity) / bitmap.height,
    );
    width = Math.round(bitmap.width * scale);
    height = Math.round(bitmap.height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new ImageError("Seu navegador não conseguiu processar a imagem.");
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
  bitmap.close();

  for (const quality of [WEBP_QUALITY, 0.65, 0.55, 0.45]) {
    const blob = await toBlob(canvas, quality);
    if (!blob || blob.type !== UPLOAD_CONTENT_TYPE) {
      throw new ImageError("Seu navegador não gera WebP. Atualize o navegador e tente de novo.");
    }
    if (blob.size <= MAX_UPLOAD_BYTES) return { blob, width, height };
  }
  throw new ImageError("A imagem ficou grande demais mesmo comprimida. Tente outra.");
}
