import { SHORT_TRIAL_FROM } from "./plans";

/**
 * Link bonus (2026-11-05): extra trial days for each link the owner puts where customers see it.
 * +2 days on the short trial (started from 2026-11-22); +7 on the 14-day trials started before.
 */
export const LINK_BONUSES = ["bio", "saudacao"] as const;
export type LinkBonus = (typeof LINK_BONUSES)[number];

export const LINK_BONUS_DAYS = 2;
export const LEGACY_LINK_BONUS_DAYS = 7;

/** Bonus days of a business, by when its trial started. */
export function linkBonusDays(trialStartedAt: string | null | undefined): number {
  return trialStartedAt && Date.parse(trialStartedAt) < SHORT_TRIAL_FROM
    ? LEGACY_LINK_BONUS_DAYS
    : LINK_BONUS_DAYS;
}

/** Query parameter of the bonus links (/<slug>?de=bio, /<slug>?de=saudacao). */
export const LINK_BONUS_PARAM = "de";

export function isLinkBonus(value: unknown): value is LinkBonus {
  return typeof value === "string" && (LINK_BONUSES as readonly string[]).includes(value);
}
