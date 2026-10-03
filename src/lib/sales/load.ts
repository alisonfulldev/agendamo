import "server-only";

import type { BrandConfig } from "@/brands";
import { createAdminClient } from "@/lib/supabase/admin";

import { resolveSettings, type MarketingSettings } from "./settings";

export async function loadMarketingSettings(
  businessId: string,
  brand: BrandConfig,
): Promise<MarketingSettings> {
  const { data } = await createAdminClient()
    .from("marketing_settings")
    .select("*")
    .eq("business_id", businessId)
    .maybeSingle();
  return resolveSettings(data as Partial<MarketingSettings> | null, brand);
}
