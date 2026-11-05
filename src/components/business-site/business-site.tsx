import type { SiteTemplate } from "@/lib/db/types";

import { ElegantSiteView } from "./elegant-view";
import { SiteView, type SiteViewProps } from "./site-view";

/** The business site in its template (the owner's choice, or a forced one on the example pages). */
export function BusinessSite({ template, ...props }: SiteViewProps & { template?: SiteTemplate }) {
  const chosen = template ?? props.settings?.template ?? "vibrant";
  return chosen === "elegant" ? <ElegantSiteView {...props} /> : <SiteView {...props} />;
}
