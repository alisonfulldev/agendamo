import { describe, expect, it } from "vitest";

import { publishedArticles } from "@/content/articles";
import { INTENT_PAGES } from "@/content/intent-pages";

import { pageLabel } from "./page-labels";

describe("internal related links", () => {
  it.each(publishedArticles().map((a) => [`/${a.section}/${a.slug}`, a.related] as const))(
    "%s only relates to existing pages",
    (_path, related) => {
      for (const href of related) expect(pageLabel(href), href).not.toBeNull();
    },
  );

  it("intent pages only relate to existing intent pages", () => {
    const slugs = new Set(INTENT_PAGES.map((p) => p.slug));
    for (const page of INTENT_PAGES) for (const slug of page.related) expect(slugs).toContain(slug);
  });
});
