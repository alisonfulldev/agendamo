import type { ComponentType } from "react";

import type { SiteViewProps } from "../site-view";

/**
 * Custom sites (2026-11-06): a template made for one business from its briefing, keyed by the
 * business id (the slug can change). It gets the same live data as the standard templates
 * (services, prices, reviews, photos) and every "Agendar" still opens the chat. Add one file per
 * business in this folder and register it here.
 */
export const CUSTOM_SITES: Record<string, ComponentType<SiteViewProps>> = {};
