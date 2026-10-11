"use server";

import { getCurrentBrand } from "@/brands/server";
import { brandUrl } from "@/brands/urls";
import { requireUser } from "@/lib/auth/session";
import { onboardingSchema } from "@/lib/business/schemas";
import { checkSlug, isSlugAvailable, type SlugCheck } from "@/lib/business/slug-check";
import { fieldErrors } from "@/lib/forms";
import type { Business } from "@/lib/db/types";
import { notifyAdminsOfSignup } from "@/lib/notifications/admin-signup";
import { startTrial } from "@/lib/trial";
import { rateLimitRequest } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export type { SlugCheck } from "@/lib/business/slug-check";

/** Real-time slug validation for step 2 (format, reserved words, taken). */
export async function checkSlugAction(raw: string): Promise<SlugCheck> {
  await requireUser();
  if (!(await rateLimitRequest("publicAction", "slug-check"))) {
    return { available: false, message: "Muitas verificações. Espere um pouco." };
  }
  return checkSlug(raw);
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

  if (!(await isSlugAvailable(data.slug))) {
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

  // Every account starts with the 14-day trial of Completo (once per person: e-mail and phone).
  const admin = createAdminClient();
  const { data: created } = await admin
    .from("businesses")
    .select("*")
    .eq("slug", data.slug)
    .single();
  const started = await startTrial({
    business: created as Business,
    identity: { email: user.email, phone: data.whatsapp },
    userId: user.id,
    via: "signup",
  });
  const pageUrl = brandUrl(brand, `/${data.slug}`);
  await notifyAdminsOfSignup({
    businessName: data.name,
    nicheName: brand.niche?.name ?? brand.name,
    email: user.email,
    whatsapp: data.whatsapp || null,
    pageUrl,
    via: "formulário",
    trial: started.ok ? "started" : "used",
  });
  // No revalidatePath here: re-rendering the panel layout would redirect away from the success screen.
  return { ok: true, slug: data.slug, pageUrl };
}
