import type { Metadata } from "next";

import { getCurrentBrand } from "@/brands/server";
import { brandUrl } from "@/brands/urls";

import { OnboardingWizard } from "./wizard";

export const metadata: Metadata = { title: "Criar seu chat de agendamento" };

export default async function OnboardingPage() {
  const brand = await getCurrentBrand();
  const domain = new URL(brandUrl(brand, "/")).host;
  return (
    <OnboardingWizard
      defaultSegment={brand.defaultSegment}
      suggestions={brand.suggestedServices}
      brandName={brand.name}
      domain={domain}
    />
  );
}
