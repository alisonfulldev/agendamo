import type { ComponentType, ReactNode } from "react";

import type { WebSiteData } from "../types";

/**
 * Custom "Site ou Loja" sites (2026-11-07): a template made by a person for one business from its
 * briefing (R$ 197), keyed by the business id (the slug can change). It gets the same live data as
 * the standard templates (texts, photos, services or products) and its buttons still open the
 * WhatsApp. Add one file per business in this folder and register it here.
 */
export const CUSTOM_WEB_SITES: Record<
  string,
  ComponentType<{ data: WebSiteData; badge: ReactNode }>
> = {};
