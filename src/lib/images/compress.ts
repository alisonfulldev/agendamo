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

/**
 * The phone could not prepare this photo (decode or WebP encode failed). The upload then goes
 * through the server fallback, which converts the original (rule 7 exception, 2026-10-23).
 * `reason` says which step failed, for the log (no personal data).
 */
export class PrepareError extends ImageError {
  constructor(public reason: string) {
    super("prepare_failed");
  }
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

/** HEIC by content (files with no type or extension, e.g. some downloads). */
async function looksLikeHeic(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const brand = String.fromCharCode(...head.slice(4, 12));
  return /^ftyp(heic|heix|hevc|hevx|heim|heis|mif1|msf1)/.test(brand);
}

/** A decoded picture ready to draw, with its size (EXIF orientation already applied). */
interface Decoded {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

/**
 * The browser's own display path: the same decoder that shows the photo in the gallery preview.
 * Mobile Chrome's createImageBitmap(Blob) fails on photos <img> shows fine (large, progressive,
 * EXIF-heavy JPEGs, some PNGs), so this comes first. Drawing an <img> follows its EXIF orientation.
 */
async function decodeWithImageElement(file: File): Promise<Decoded> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  try {
    await image.decode();
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    release: () => URL.revokeObjectURL(url),
  };
}

function fromBitmap(bitmap: ImageBitmap): Decoded {
  return {
    source: bitmap,
    width: bitmap.width,
    height: bitmap.height,
    release: () => bitmap.close(),
  };
}

/** HEIC/HEIF decoder (libheif, heic-to "csp" build, worker), loaded only for these photos. */
async function decodeHeic(file: File): Promise<Decoded> {
  const { heicTo } = await import("heic-to/csp");
  return fromBitmap(
    await heicTo({ blob: file, type: "bitmap", options: { imageOrientation: "from-image" } }),
  );
}

/** Tries each decoder in turn; throws what failed when none works. */
async function decodeImage(file: File): Promise<Decoded> {
  const failures: string[] = [];
  const attempts: [string, () => Promise<Decoded>][] = [
    ["img", () => decodeWithImageElement(file)],
    [
      "bitmap",
      async () => fromBitmap(await createImageBitmap(file, { imageOrientation: "from-image" })),
    ],
  ];
  if (isHeic(file) || (await looksLikeHeic(file).catch(() => false))) {
    attempts.push(["heic", () => decodeHeic(file)]);
  }
  for (const [name, attempt] of attempts) {
    try {
      return await attempt();
    } catch (error) {
      failures.push(`${name}:${error instanceof Error ? error.name : "error"}`);
    }
  }
  throw new PrepareError(`decode ${failures.join(" ")}`);
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, UPLOAD_CONTENT_TYPE, quality));
}

/**
 * Resizes and converts to WebP in the browser (rule 7): crop or fit of the preset, quality lowered
 * step by step to stay under the 300 KB the server accepts. Throws ImageError with a message for
 * the person (not an image, over 50 MB) or PrepareError when the phone cannot do it, so the
 * caller sends the original to the server fallback instead.
 */
export async function compressImage(file: File, kind: ImageKind): Promise<CompressedImage> {
  // Refused up front only when the type says it is not an image (a PDF, a video). Files with no
  // type are tried by content.
  if (file.type && !looksLikeImage(file)) {
    throw new ImageError("Escolha um arquivo de foto ou imagem.");
  }
  if (file.size > MAX_ORIGINAL_BYTES) {
    throw new ImageError("Essa foto passa de 50 MB. Escolha outra ou tire um print dela.");
  }

  const decoded = await decodeImage(file);
  try {
    const preset = IMAGE_PRESETS[kind];
    let sx = 0;
    let sy = 0;
    let sw = decoded.width;
    let sh = decoded.height;
    let width: number;
    let height: number;

    if (preset.square) {
      const side = Math.min(decoded.width, decoded.height);
      sx = (decoded.width - side) / 2;
      sy = (decoded.height - side) / 2;
      sw = sh = side;
      width = height = Math.min(preset.square, side);
    } else {
      const scale = Math.min(
        1,
        (preset.maxWidth ?? Infinity) / decoded.width,
        (preset.maxHeight ?? Infinity) / decoded.height,
      );
      width = Math.max(1, Math.round(decoded.width * scale));
      height = Math.max(1, Math.round(decoded.height * scale));
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new PrepareError("canvas no_context");
    context.imageSmoothingQuality = "high";
    try {
      context.drawImage(decoded.source, sx, sy, sw, sh, 0, 0, width, height);
    } catch (error) {
      throw new PrepareError(`draw ${error instanceof Error ? error.name : "error"}`);
    }

    for (const quality of [WEBP_QUALITY, 0.65, 0.55, 0.45]) {
      const blob = await toBlob(canvas, quality);
      if (!blob || blob.type !== UPLOAD_CONTENT_TYPE) {
        throw new PrepareError(`encode ${blob ? blob.type : "null"}`);
      }
      if (blob.size <= MAX_UPLOAD_BYTES) return { blob, width, height };
    }
    throw new PrepareError("encode too_large");
  } finally {
    decoded.release();
  }
}
