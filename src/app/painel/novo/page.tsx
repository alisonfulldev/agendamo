import type { Metadata } from "next";
import { cookies } from "next/headers";

import { getCurrentBrand } from "@/brands/server";
import { brandUrl } from "@/brands/urls";
import { DESIRED_SLUG_COOKIE } from "@/lib/desired-slug";
import { isValidSlugFormat } from "@/lib/slug";

import { OnboardingWizard } from "./wizard";

export const metadata: Metadata = { title: "Criar seu chat de agendamento" };

export default async function OnboardingPage() {
  const brand = await getCurrentBrand();
  const domain = new URL(brandUrl(brand, "/")).host;
  // Link picked on the sales page ("meetchat.com/seu-nome") before signing up.
  const desired = (await cookies()).get(DESIRED_SLUG_COOKIE)?.value ?? null;
  return (
    <OnboardingWizard
      defaultSegment={brand.defaultSegment}
      suggestions={brand.suggestedServices}
      brandName={brand.name}
      domain={domain}
      initialSlug={desired && isValidSlugFormat(desired) ? desired : null}
    />
  );
}
