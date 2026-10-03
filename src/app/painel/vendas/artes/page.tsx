import type { Metadata } from "next";

import { PageHeader } from "@/components/panel/page-header";
import { UpgradeNotice } from "@/components/panel/upgrade-notice";
import { requireOwner } from "@/lib/business/context";
import type { BusinessCoupon } from "@/lib/db/types";
import { getPlanFeatures } from "@/lib/plans";
import { isCouponActive } from "@/lib/sales/settings";
import { createClient } from "@/lib/supabase/server";

import { ArtStudio } from "./art-studio";

export const metadata: Metadata = { title: "Artes para divulgar" };

export default async function ArtsPage({ searchParams }: PageProps<"/painel/vendas/artes">) {
  const { business } = await requireOwner();
  const features = getPlanFeatures(business);
  const { tipo } = await searchParams;
  if (!features.salesTools) {
    return (
      <div>
        <PageHeader title="Artes para divulgar" />
        <UpgradeNotice
          features={features}
          title="Artes prontas para os stories"
          description="Com os horários livres reais, o tema da sua marca e o QR code do seu link de agendamento."
        />
      </div>
    );
  }
  const supabase = await createClient();
  const [services, coupons] = await Promise.all([
    supabase
      .from("services")
      .select("id, name")
      .eq("business_id", business.id)
      .eq("active", true)
      .order("position"),
    supabase.from("business_coupons").select("*").eq("business_id", business.id),
  ]);
  return (
    <div>
      <PageHeader
        title="Artes para divulgar"
        description="Imagens no formato dos stories (1080×1920) com o QR code e o link do seu chat."
      />
      <ArtStudio
        initialType={typeof tipo === "string" ? tipo : "agenda-aberta"}
        services={(services.data ?? []) as { id: string; name: string }[]}
        coupons={((coupons.data ?? []) as BusinessCoupon[])
          .filter(isCouponActive)
          .map((c) => c.code)}
      />
    </div>
  );
}
