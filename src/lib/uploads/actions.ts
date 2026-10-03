"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { audit } from "@/lib/audit";
import { requireOwner } from "@/lib/business/context";
import { invalidatePublicPage } from "@/lib/cache";
import { IMAGE_KINDS, isKeyOf, MAX_UPLOAD_BYTES } from "@/lib/images/presets";
import { getPlanFeatures } from "@/lib/plans";
import { deleteObject, objectSize } from "@/lib/storage/r2";
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

function refresh(slug: string) {
  invalidatePublicPage(slug);
  revalidatePath("/painel", "layout");
}

/** Records an image after the browser uploaded it to R2 with the presigned URL. */
export async function registerUploadAction(input: unknown): Promise<UploadResult> {
  const { business } = await requireOwner();
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success || !isKeyOf(parsed.data.key, business.id, parsed.data.kind)) {
    return { ok: false, error: "Envio inválido." };
  }
  const { kind, key, width, height, professionalId } = parsed.data;

  const size = await objectSize(key);
  if (size === null) return { ok: false, error: "O envio não terminou. Tente de novo." };
  if (size > MAX_UPLOAD_BYTES) {
    await deleteObject(key);
    return { ok: false, error: "Imagem acima de 300 KB." };
  }

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
      return { ok: false, error: `Seu plano permite até ${photoLimit} fotos.` };
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

  refresh(business.slug);
  return { ok: true };
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
  refresh(business.slug);
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
  refresh(business.slug);
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
  refresh(business.slug);
  return { ok: true };
}
