"use server";

import { z } from "zod";

import { checkSlug, type SlugCheck } from "@/lib/business/slug-check";
import { rateLimitRequest } from "@/lib/rate-limit";

/** Availability of the link typed on the sales page (no account yet; rate limited per IP). */
export async function checkClaimSlugAction(input: unknown): Promise<SlugCheck> {
  const parsed = z.string().max(60).safeParse(input);
  if (!parsed.success) return { available: false, message: "Endereço inválido." };
  if (!(await rateLimitRequest("slots", "slug-claim"))) {
    return { available: false, message: "Muitas verificações. Espere um pouco." };
  }
  return checkSlug(parsed.data);
}
