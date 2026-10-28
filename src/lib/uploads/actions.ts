"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { audit } from "@/lib/audit";
import { requireOwner } from "@/lib/business/context";
import { invalidatePublicPage } from "@/lib/cache";
import { notifyProfileChanged } from "@/lib/seo/profile-indexnow";
import { convertToWebp } from "@/lib/images/convert";
import {
  IMAGE_KINDS,
  isIncomingKeyOf,
  isKeyOf,
  MAX_ORIGINAL_BYTES,
  MAX_UPLOAD_BYTES,
  objectKey,
  UPLOAD_CONTENT_TYPE,
  type ImageKind,
} from "@/lib/images/presets";
import { getPlanFeatures } from "@/lib/plans";
import { deleteObject, objectSize, readObject, writeObject } from "@/lib/storage/r2";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type UploadResult = { ok: true } | { ok: false; error: string };

const registerSchema = z.object({
  kind: z.enum(IMAGE_KINDS),
  key: z.string(),
  width: z.number().int().positive().max(4000),
  height: z.number().int().positive().max(4000),
  professionalId: z.uuid().optional(),
});

/** Profile content changed: fresh public page, panel and IndexNow (when the profile is complete). */
function refresh(business: { slug: string; brand_key: string | null }) {
  invalidatePublicPage(business.slug);
  revalidatePath("/painel", "layout");
  notifyProfileChanged(business);
}

/** Records an image after the browser uploaded it to R2 with the presigned URL. */
export async function registerUploadAction(input: unknown): Promise<UploadResult> {
  const { business } = await requireOwner();
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success || !isKeyOf(parsed.data.key, business.id, parsed.data.kind)) {
    console.error("upload register refused", { reason: "invalid_input", business: business.id });
    return { ok: false, error: "Envio inválido." };
  }
  const { kind, key, width, height, professionalId } = parsed.data;

  const size = await objectSize(key);
  if (size === null) {
    // Logged with the reason (no personal data, no image) so failures can be traced.
    console.error("upload register refused", {
      reason: "object_missing",
      kind,
      business: business.id,
    });
    return { ok: false, error: "O envio não terminou. Tente de novo." };
  }
  if (size > MAX_UPLOAD_BYTES) {
    await deleteObject(key);
    return { ok: false, error: "Imagem acima de 300 KB." };
  }

  return saveImage(business, { kind, key, width, height, size, professionalId });
}

type Owner = Awaited<ReturnType<typeof requireOwner>>["business"];

/**
 * Records an uploaded image in the database (gallery photo, profile photo, cover or professional
 * photo), replacing and deleting the previous one. Shared by the browser path and the server
 * fallback.
 */
async function saveImage(
  business: Owner,
  image: {
    kind: ImageKind;
    key: string;
    width: number;
    height: number;
    size: number;
    professionalId?: string;
  },
): Promise<UploadResult> {
  const { kind, key, width, height, size, professionalId } = image;
  const supabase = await createClient();

  if (kind === "photo") {
    const { photoLimit } = getPlanFeatures(business);
    const { data: photos } = await supabase
      .from("page_photos")
      .select("position, hidden")
      .eq("business_id", business.id);
    const visible = (photos ?? []).filter((p) => !p.hidden).length;
    if (visible >= photoLimit) {
      await deleteObject(key);
      return {
        ok: false,
        error: `O limite é de ${photoLimit} fotos. Exclua alguma para adicionar outra.`,
      };
    }
    const position = Math.max(-1, ...(photos ?? []).map((p) => p.position as number)) + 1;
    // Inserted with the service role: page_photos has no insert policy for users.
    const { error } = await createAdminClient().from("page_photos").insert({
      business_id: business.id,
      object_key: key,
      width,
      height,
      size_bytes: size,
      position,
    });
    if (error) {
      await deleteObject(key);
      return { ok: false, error: "Não foi possível salvar a foto." };
    }
  } else if (kind === "avatar" || kind === "cover") {
    const column = kind === "avatar" ? "avatar_key" : "cover_key";
    const { data: current } = await supabase
      .from("page_settings")
      .select(column)
      .eq("business_id", business.id)
      .maybeSingle();
    const { error } = await supabase
      .from("page_settings")
      .upsert({ business_id: business.id, [column]: key, updated_at: new Date().toISOString() });
    if (error) {
      console.error("upload register refused", { reason: "save_failed", kind, code: error.code });
      await deleteObject(key);
      return { ok: false, error: "Não foi possível salvar a imagem." };
    }
    const previous = (current as Record<string, string | null> | null)?.[column];
    if (previous) await deleteObject(previous);
  } else {
    const { data: current } = await supabase
      .from("professionals")
      .select("photo_key")
      .eq("id", professionalId!)
      .eq("business_id", business.id)
      .maybeSingle();
    const { error } = await supabase
      .from("professionals")
      .update({ photo_key: key })
      .eq("id", professionalId!)
      .eq("business_id", business.id);
    if (error) {
      await deleteObject(key);
      return { ok: false, error: "Não foi possível salvar a foto." };
    }
    if (current?.photo_key) await deleteObject(current.photo_key as string);
  }

  refresh(business);
  return { ok: true };
}

const originalSchema = z.object({
  kind: z.enum(IMAGE_KINDS),
  key: z.string(),
  professionalId: z.uuid().optional(),
  /** Why the phone could not prepare the photo (logged, to know what fails). */
  reason: z.string().max(120).optional(),
});

/**
 * Server fallback (rule 7 exception, 2026-10-23): converts the original photo the phone could not
 * prepare (already in a private temporary key) into the usual WebP, saves it like any upload and
 * deletes the original. The photo is read in memory only; nothing about it is logged.
 */
export async function processOriginalAction(input: unknown): Promise<UploadResult> {
  const { business } = await requireOwner();
  const parsed = originalSchema.safeParse(input);
  if (!parsed.success || !isIncomingKeyOf(parsed.data.key, business.id)) {
    return { ok: false, error: "Envio inválido." };
  }
  const { kind, key, professionalId, reason } = parsed.data;

  const original = await readObject(key, MAX_ORIGINAL_BYTES);
  if (!original) {
    console.error("photo fallback refused", { reason: "object_missing", kind });
    await deleteObject(key).catch(() => undefined);
    return { ok: false, error: "O envio não terminou. Tente de novo." };
  }

  let converted: Awaited<ReturnType<typeof convertToWebp>>;
  try {
    converted = await convertToWebp(original, kind);
  } catch (error) {
    console.error("photo fallback failed", {
      kind,
      phone: reason,
      server: error instanceof Error ? error.message.slice(0, 120) : "unknown",
    });
    return { ok: false, error: "Não conseguimos usar essa foto. Tente outra foto." };
  } finally {
    await deleteObject(key).catch(() => undefined);
  }

  const finalKey = objectKey(business.id, kind, randomUUID());
  await writeObject(finalKey, converted.bytes, UPLOAD_CONTENT_TYPE);
  // The phone could not prepare it; the server did (kept in the log to follow how often).
  console.info("photo converted on the server", { kind, phone: reason });
  return saveImage(business, {
    kind,
    key: finalKey,
    width: converted.width,
    height: converted.height,
    size: converted.bytes.length,
    professionalId,
  });
}

/** Deletes a gallery photo and its R2 object. */
export async function deletePhotoAction(photoId: string): Promise<UploadResult> {
  const { business, user } = await requireOwner();
  const supabase = await createClient();
  const { data: photo } = await supabase
    .from("page_photos")
    .select("object_key")
    .eq("id", photoId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!photo) return { ok: false, error: "Foto não encontrada." };

  const { error } = await createAdminClient()
    .from("page_photos")
    .delete()
    .eq("id", photoId)
    .eq("business_id", business.id);
  if (error) return { ok: false, error: "Não foi possível excluir." };
  await deleteObject(photo.object_key as string);
  await audit({
    businessId: business.id,
    userId: user.id,
    action: "photo.deleted",
    details: { key: photo.object_key },
  });
  refresh(business);
  return { ok: true };
}

/** Removes the avatar or cover image. */
export async function removePageImageAction(kind: "avatar" | "cover"): Promise<UploadResult> {
  const { business } = await requireOwner();
  const column = kind === "avatar" ? "avatar_key" : "cover_key";
  const supabase = await createClient();
  const { data } = await supabase
    .from("page_settings")
    .select(column)
    .eq("business_id", business.id)
    .maybeSingle();
  const key = (data as Record<string, string | null> | null)?.[column];
  await supabase
    .from("page_settings")
    .update({ [column]: null })
    .eq("business_id", business.id);
  if (key) await deleteObject(key);
  refresh(business);
  return { ok: true };
}

/** Saves the gallery order after drag and drop. */
export async function reorderPhotosAction(orderedIds: string[]): Promise<UploadResult> {
  const { business } = await requireOwner();
  const ids = z.array(z.uuid()).max(100).safeParse(orderedIds);
  if (!ids.success) return { ok: false, error: "Ordem inválida." };
  const supabase = await createClient();
  const results = await Promise.all(
    ids.data.map((id, position) =>
      supabase.from("page_photos").update({ position }).eq("id", id).eq("business_id", business.id),
    ),
  );
  if (results.some((r) => r.error)) return { ok: false, error: "Não foi possível salvar a ordem." };
  refresh(business);
  return { ok: true };
}
