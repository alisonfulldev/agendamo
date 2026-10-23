import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth/session";
import { getBusinessContext } from "@/lib/business/context";
import {
  IMAGE_KINDS,
  incomingKey,
  MAX_ORIGINAL_BYTES,
  MAX_UPLOAD_BYTES,
  objectKey,
  UPLOAD_CONTENT_TYPE,
} from "@/lib/images/presets";
import { getPlanFeatures } from "@/lib/plans";
import { rateLimit } from "@/lib/rate-limit";
import { createPrivateUploadUrl, createUploadUrl, isStorageConfigured } from "@/lib/storage/r2";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  kind: z.enum(IMAGE_KINDS),
  contentType: z.literal(UPLOAD_CONTENT_TYPE),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
  professionalId: z.uuid().optional(),
});

/**
 * Server fallback (rule 7 exception, 2026-10-23): the original photo the phone could not prepare,
 * any type, up to MAX_ORIGINAL_BYTES, to a private temporary key converted right after.
 */
const originalSchema = z.object({
  kind: z.enum(IMAGE_KINDS),
  original: z.literal(true),
  contentType: z.string().max(100),
  size: z.number().int().positive().max(MAX_ORIGINAL_BYTES),
  professionalId: z.uuid().optional(),
});

/** Returns a short-lived presigned PUT URL. The file never passes through this server (rule 7). */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Faça login de novo." }, { status: 401 });
  const context = await getBusinessContext();
  if (!context?.isOwner) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "Envio de imagens ainda não configurado." }, { status: 503 });
  }
  if (!(await rateLimit("upload", `user:${user.id}`))) {
    return NextResponse.json({ error: "Muitos envios. Espere um pouco." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const original = (body as { original?: unknown } | null)?.original === true;
  const parsed = (original ? originalSchema : bodySchema).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: original ? "A foto passa de 50 MB." : "Imagem inválida ou acima de 300 KB." },
      { status: 400 },
    );
  }
  const { kind, size, professionalId } = parsed.data;
  const { business } = context;
  const supabase = await createClient();

  if (kind === "photo") {
    const { photoLimit } = getPlanFeatures(business);
    const { count, error } = await supabase
      .from("page_photos")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("hidden", false);
    if (error) return NextResponse.json({ error: "Tente de novo." }, { status: 500 });
    if ((count ?? 0) >= photoLimit) {
      return NextResponse.json(
        { error: `Seu plano permite até ${photoLimit} fotos. Exclua alguma ou mude de plano.` },
        { status: 403 },
      );
    }
  }

  if (kind === "professional") {
    if (!professionalId)
      return NextResponse.json({ error: "Profissional não informado." }, { status: 400 });
    const { data } = await supabase
      .from("professionals")
      .select("id")
      .eq("id", professionalId)
      .eq("business_id", business.id)
      .maybeSingle();
    if (!data) return NextResponse.json({ error: "Profissional não encontrado." }, { status: 404 });
  }

  if (original) {
    // Some phones send no type: the signature then uses a generic one (the server reads the bytes).
    const contentType = /^image\/[\w.+-]+$/.test(parsed.data.contentType)
      ? parsed.data.contentType
      : "application/octet-stream";
    const key = incomingKey(business.id, randomUUID());
    const uploadUrl = await createPrivateUploadUrl(key, contentType, size);
    return NextResponse.json({
      key,
      uploadUrl,
      headers: { "Content-Type": contentType, "Cache-Control": "private, no-store" },
    });
  }

  const key = objectKey(business.id, kind, randomUUID());
  const uploadUrl = await createUploadUrl(key, UPLOAD_CONTENT_TYPE, size);
  return NextResponse.json({
    key,
    uploadUrl,
    headers: {
      "Content-Type": UPLOAD_CONTENT_TYPE,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
