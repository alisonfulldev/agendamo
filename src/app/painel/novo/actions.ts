"use server";

import { getCurrentBrand } from "@/brands/server";
import { brandUrl } from "@/brands/urls";
import { requireUser } from "@/lib/auth/session";
import { onboardingSchema, slugSchema } from "@/lib/business/schemas";
import { fieldErrors } from "@/lib/forms";
import { rateLimitRequest } from "@/lib/rate-limit";
import { slugify } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SlugCheck {
  available: boolean;
  message?: string;
  suggestion?: string;
}

async function isAvailable(slug: string): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("slug_is_available", { p_slug: slug });
  if (error) throw new Error(error.message);
  return data === true;
}

/** Real-time slug validation for step 2 (format, reserved words, taken). */
export async function checkSlugAction(raw: string): Promise<SlugCheck> {
  await requireUser();
  if (!(await rateLimitRequest("publicAction", "slug-check"))) {
    return { available: false, message: "Muitas verificações. Espere um pouco." };
  }
  const parsed = slugSchema.safeParse(raw);
  if (!parsed.success) return { available: false, message: parsed.error.issues[0]!.message };
  if (await isAvailable(parsed.data)) return { available: true };

  for (let n = 2; n <= 9; n++) {
    const candidate = slugify(`${parsed.data}-${n}`);
    if (await isAvailable(candidate)) {
      return { available: false, message: "Esse endereço já está em uso.", suggestion: candidate };
    }
  }
  return { available: false, message: "Esse endereço já está em uso." };
}

export type CreateBusinessResult =
  | { ok: true; slug: string; pageUrl: string }
  | { ok: false; message: string; errors?: Record<string, string> };

/** Creates the business with the brand of the current domain (rule 14). */
export async function createBusinessAction(input: unknown): Promise<CreateBusinessResult> {
  const user = await requireUser();
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Confira os dados informados.",
      errors: fieldErrors(parsed.error),
    };
  }
  const data = parsed.data;
  const brand = await getCurrentBrand();

  if (!(await isAvailable(data.slug))) {
    return {
      ok: false,
      message: "Esse endereço acabou de ser usado. Escolha outro.",
      errors: { slug: "Indisponível" },
    };
  }

  const { error } = await createAdminClient().rpc("create_business", {
    p_user_id: user.id,
    p_payload: {
      name: data.name,
      slug: data.slug,
      brand_key: brand.key,
      segment: data.segment,
      timezone: "America/Sao_Paulo",
      page: {
        whatsapp_number: data.whatsapp,
        instagram_url: data.instagram,
        address: data.address,
        city: data.city,
        neighborhood: data.neighborhood,
      },
      services: data.services.map((s) => ({
        name: s.name,
        duration_minutes: s.durationMinutes,
        price_cents: s.priceCents,
      })),
      hours: data.hours.map((h) => ({ weekday: h.weekday, start_time: h.start, end_time: h.end })),
    },
  });

  if (error) {
    if (error.message.includes("already has a business")) {
      return { ok: false, message: "Você já tem um negócio cadastrado." };
    }
    console.error("create_business failed", error);
    return { ok: false, message: "Não foi possível criar agora. Tente de novo em instantes." };
  }

  // No revalidatePath here: re-rendering the panel layout would redirect away from the success screen.
  return { ok: true, slug: data.slug, pageUrl: brandUrl(brand, `/${data.slug}`) };
}
