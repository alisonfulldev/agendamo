import "server-only";

import { slugSchema } from "@/lib/business/schemas";
import { slugify } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SlugCheck {
  available: boolean;
  message?: string;
  suggestion?: string;
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("slug_is_available", { p_slug: slug });
  if (error) throw new Error(error.message);
  return data === true;
}

/** Format, reserved words and taken slugs, with a free suggestion ("nome-2") when taken. */
export async function checkSlug(raw: string): Promise<SlugCheck> {
  const parsed = slugSchema.safeParse(raw);
  if (!parsed.success) return { available: false, message: parsed.error.issues[0]!.message };
  if (await isSlugAvailable(parsed.data)) return { available: true };

  for (let n = 2; n <= 9; n++) {
    const candidate = slugify(`${parsed.data}-${n}`);
    if (await isSlugAvailable(candidate)) {
      return { available: false, message: "Esse endereço já está em uso.", suggestion: candidate };
    }
  }
  return { available: false, message: "Esse endereço já está em uso." };
}
