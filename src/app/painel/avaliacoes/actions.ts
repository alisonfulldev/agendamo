"use server";

import { requireFeature } from "@/lib/business/context";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { audit } from "@/lib/audit";
import { requireOwner } from "@/lib/business/context";
import { invalidatePublicPage } from "@/lib/cache";
import { createClient } from "@/lib/supabase/server";

export async function replyReviewAction(id: string, reply: string): Promise<{ ok: boolean }> {
  await requireFeature("reviews");
  const { business } = await requireOwner();
  const text = z.string().trim().max(1000).parse(reply);
  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({ reply: text || null })
    .eq("id", z.uuid().parse(id))
    .eq("business_id", business.id);
  invalidatePublicPage(business.slug);
  revalidatePath("/painel/avaliacoes");
  return { ok: !error };
}

export async function setReviewHiddenAction(id: string, hidden: boolean): Promise<{ ok: boolean }> {
  await requireFeature("reviews");
  const { business, user } = await requireOwner();
  const reviewId = z.uuid().parse(id);
  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({ hidden })
    .eq("id", reviewId)
    .eq("business_id", business.id);
  if (!error)
    await audit({
      businessId: business.id,
      userId: user.id,
      action: hidden ? "review.hidden" : "review.unhidden",
      details: { review_id: reviewId },
    });
  invalidatePublicPage(business.slug);
  revalidatePath("/painel/avaliacoes");
  return { ok: !error };
}
