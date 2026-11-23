"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createApiKey, revokeApiKeys } from "@/lib/api/keys";
import { audit } from "@/lib/audit";
import { requireBusiness, requireOwner } from "@/lib/business/context";
import { disconnect } from "@/lib/google/client";
import { getPlanFeatures } from "@/lib/plans";

/** New key for the owner's own AI (revokes the previous one). Shown once. */
export async function createApiKeyAction(): Promise<{ ok: true; key: string } | { ok: false }> {
  const { business, user } = await requireOwner();
  if (!getPlanFeatures(business).agenda) return { ok: false };
  const key = await createApiKey(business.id, user.id);
  await audit({ businessId: business.id, userId: user.id, action: "api_key.created" });
  revalidatePath("/painel/integracoes");
  return { ok: true, key };
}

export async function revokeApiKeyAction(): Promise<{ ok: boolean }> {
  const { business, user } = await requireOwner();
  await revokeApiKeys(business.id);
  await audit({ businessId: business.id, userId: user.id, action: "api_key.revoked" });
  revalidatePath("/painel/integracoes");
  return { ok: true };
}

export async function disconnectGoogleAction(professionalId: string): Promise<{ ok: boolean }> {
  const context = await requireBusiness();
  const id = z.uuid().parse(professionalId);
  if (!context.isOwner && context.professionalId !== id) return { ok: false };
  await disconnect(id);
  await audit({
    businessId: context.business.id,
    userId: context.user.id,
    action: "calendar.disconnected",
    details: { professional_id: id },
  });
  revalidatePath("/painel/integracoes");
  return { ok: true };
}
