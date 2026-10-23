import "server-only";

import sharp, { type Sharp } from "sharp";

import { IMAGE_PRESETS, MAX_UPLOAD_BYTES, type ImageKind } from "./presets";

export class ConvertError extends Error {}

/**
 * Server fallback (rule 7 exception, 2026-10-23): turns the original photo the phone could not
 * prepare into the same WebP the browser would make (EXIF rotation, crop or fit of the preset,
 * at most MAX_UPLOAD_BYTES). Uses sharp/libvips, which reads large JPEG, PNG, WebP, AVIF, GIF and
 * TIFF files with little memory. Nothing is logged or kept besides the result.
 */
export async function convertToWebp(
  input: Uint8Array,
  kind: ImageKind,
): Promise<{ bytes: Buffer; width: number; height: number }> {
  const preset = IMAGE_PRESETS[kind];
  let pipeline: Sharp;
  try {
    pipeline = sharp(input, { failOn: "none", limitInputPixels: 300_000_000, sequentialRead: true })
      .rotate()
      .resize(
        preset.square
          ? { width: preset.square, height: preset.square, fit: "cover", position: "centre" }
          : {
              width: preset.maxWidth,
              height: preset.maxHeight,
              fit: "inside",
              withoutEnlargement: true,
            },
      );
    for (const quality of [75, 65, 55, 45]) {
      const { data, info } = await pipeline
        .clone()
        .webp({ quality })
        .toBuffer({ resolveWithObject: true });
      if (data.length <= MAX_UPLOAD_BYTES) return { bytes: data, width: info.width, height: info.height };
    }
  } catch (error) {
    throw new ConvertError(error instanceof Error ? error.message : "unreadable");
  }
  throw new ConvertError("too_large_after_compression");
}
