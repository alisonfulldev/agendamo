"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { audit } from "@/lib/audit";
import { requireBusiness } from "@/lib/business/context";
import { disconnect } from "@/lib/google/client";

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
