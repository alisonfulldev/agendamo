import type { SiteTemplate } from "@/lib/db/types";

import { CUSTOM_SITES } from "./custom";
import { ElegantSiteView } from "./elegant-view";
import { SiteView, type SiteViewProps } from "./site-view";

/**
 * The business site in its template: a custom one made for this business, else the owner's choice
 * (or a forced one on the example pages).
 */
export function BusinessSite({ template, ...props }: SiteViewProps & { template?: SiteTemplate }) {
  const Custom = template ? undefined : CUSTOM_SITES[props.data.business.id];
  if (Custom) return <Custom {...props} />;
  const chosen = template ?? props.settings?.template ?? "vibrant";
  return chosen === "elegant" ? <ElegantSiteView {...props} /> : <SiteView {...props} />;
}
