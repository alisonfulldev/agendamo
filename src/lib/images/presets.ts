// Shared by the browser (compression) and the server (validation of the signed upload).

export const IMAGE_KINDS = ["avatar", "cover", "photo", "professional"] as const;
export type ImageKind = (typeof IMAGE_KINDS)[number];

export interface ImagePreset {
  /** Exact square output (center crop) when set. */
  square?: number;
  /** Otherwise, fit inside these bounds keeping the aspect ratio. */
  maxWidth?: number;
  maxHeight?: number;
}

export const IMAGE_PRESETS: Record<ImageKind, ImagePreset> = {
  avatar: { square: 400 },
  professional: { square: 400 },
  cover: { maxWidth: 1200, maxHeight: 1200 },
  photo: { maxWidth: 800, maxHeight: 800 },
};

export const MAX_ORIGINAL_BYTES = 15 * 1024 * 1024;
export const MAX_UPLOAD_BYTES = 300 * 1024;
export const WEBP_QUALITY = 0.75;
export const UPLOAD_CONTENT_TYPE = "image/webp";

/** Object key layout: businesses/{business_id}/{kind}/{uuid}.webp */
export function objectKey(businessId: string, kind: ImageKind, id: string): string {
  return `businesses/${businessId}/${kind}/${id}.webp`;
}

export function isKeyOf(key: string, businessId: string, kind: ImageKind): boolean {
  return new RegExp(`^businesses/${businessId}/${kind}/[0-9a-f-]{36}\\.webp$`).test(key);
}
