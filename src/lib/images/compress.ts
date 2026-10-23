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

/** HEIC/HEIF (iPhone, Samsung "alta eficiência"): only Safari decodes it natively. */
function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

/** Image files, also when the system gives no type (some HEIC and downloaded files). */
function looksLikeImage(file: File): boolean {
  return (
    file.type.startsWith("image/") ||
    /\.(jpe?g|png|webp|gif|bmp|avif|hei[cf]|tiff?)$/i.test(file.name)
  );
}

/** Width the image is decoded at when the full size does not fit in the browser's memory. */
const SAFE_DECODE_WIDTH = 2400;

function loadImageElement(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  return image
    .decode()
    .then(() => image)
    .finally(() => URL.revokeObjectURL(url));
}

/**
 * Decodes any photo the browser can read, in steps, so huge photos (50 to 200 MP phone cameras,
 * full-screen downloads) do not fail: the full image; if that fails (usually memory), the image
 * already reduced while decoding; then the browser's <img> decoder. Orientation follows the
 * photo's EXIF in all of them.
 */
async function decodeImage(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Too big for the browser's memory, or a format createImageBitmap does not take.
  }
  try {
    return await createImageBitmap(file, {
      imageOrientation: "from-image",
      resizeWidth: SAFE_DECODE_WIDTH,
      resizeQuality: "high",
    });
  } catch {
    // Next decoder.
  }
  const element = await loadImageElement(file);
  const scale = Math.min(1, SAFE_DECODE_WIDTH / element.naturalWidth);
  return createImageBitmap(element, {
    resizeWidth: Math.max(1, Math.round(element.naturalWidth * scale)),
    resizeHeight: Math.max(1, Math.round(element.naturalHeight * scale)),
    resizeQuality: "high",
  });
}

/**
 * Resizes and converts to WebP with the native canvas (rule 7). Accepts any photo the browser can
 * read, of any size up to MAX_ORIGINAL_BYTES (only the compressed result is uploaded). Lowers the
 * quality step by step if needed to stay under the 300 KB the server accepts.
 */
export async function compressImage(file: File, kind: ImageKind): Promise<CompressedImage> {
  if (!looksLikeImage(file)) throw new ImageError("Escolha um arquivo de foto ou imagem.");
  if (file.size > MAX_ORIGINAL_BYTES)
    throw new ImageError("Essa foto passa de 50 MB. Escolha outra ou tire um print dela.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await decodeImage(file);
  } catch {
    throw new ImageError(
      isHeic(file)
        ? "Essa foto está no formato HEIC, que este navegador não abre. No celular, compartilhe a foto como JPG (ou tire um print dela) e envie de novo."
        : "Não conseguimos abrir essa foto neste navegador. Tente tirar um print dela e enviar o print.",
    );
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
