import type { BrandConfig } from "@/brands";

export interface MarketingSettings {
  inactive_days: number;
  return_email_enabled: boolean;
  birthday_email_enabled: boolean;
  birthday_coupon_code: string | null;
  referral_reward_text: string | null;
  empty_slots_threshold: number;
  templates: Record<TemplateKey, string>;
}

export type TemplateKey = "reactivation" | "return" | "birthday" | "abandoned";

export const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  reactivation: "Clientes que sumiram",
  return: "Hora de voltar",
  birthday: "Aniversário",
  abandoned: "Quase agendou",
};

/** Saved settings merged over defaults; templates fall back to the brand's suggestions. */
export function resolveSettings(
  row: Partial<MarketingSettings> | null,
  brand: BrandConfig,
): MarketingSettings {
  return {
    inactive_days: row?.inactive_days ?? 60,
    return_email_enabled: row?.return_email_enabled ?? true,
    birthday_email_enabled: row?.birthday_email_enabled ?? false,
    birthday_coupon_code: row?.birthday_coupon_code ?? null,
    referral_reward_text: row?.referral_reward_text ?? null,
    empty_slots_threshold: row?.empty_slots_threshold ?? 4,
    templates: {
      ...brand.messageTemplates,
      ...((row?.templates as Partial<Record<TemplateKey, string>>) ?? {}),
    },
  };
}

/** Replaces {customerName}, {business}, {service}. */
export function fillTemplate(
  template: string,
  vars: Partial<Record<"customerName" | "business" | "service", string>>,
): string {
  return template.replace(
    /\{(customerName|business|service)\}/g,
    (_, key: keyof typeof vars) => vars[key] ?? "",
  );
}

/** Coupon still usable (not expired, uses left). */
export function isCouponActive(coupon: {
  valid_until: string | null;
  max_uses: number | null;
  uses: number;
}): boolean {
  if (coupon.valid_until && new Date(coupon.valid_until).getTime() < Date.now()) return false;
  return coupon.max_uses === null || coupon.uses < coupon.max_uses;
}
