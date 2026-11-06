import { useMemo } from "react";

import { useBrand } from "@/components/brand-provider";
import { panelWords } from "@/lib/panel-words";

/** Panel wording of the business's niche, in Client Components (see panelWords). */
export function usePanelWords() {
  const brand = useBrand();
  return useMemo(() => panelWords(brand), [brand]);
}
