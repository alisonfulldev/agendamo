/** Link bonus (2026-11-05): +7 trial days for each link the owner puts where customers see it. */
export const LINK_BONUSES = ["bio", "saudacao"] as const;
export type LinkBonus = (typeof LINK_BONUSES)[number];

export const LINK_BONUS_DAYS = 7;

/** Query parameter of the bonus links (/<slug>?de=bio, /<slug>?de=saudacao). */
export const LINK_BONUS_PARAM = "de";

export function isLinkBonus(value: unknown): value is LinkBonus {
  return typeof value === "string" && (LINK_BONUSES as readonly string[]).includes(value);
}
