import type { ReactNode } from "react";

import { PLATFORM } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { LazyCreationChat } from "@/components/creation/lazy-creation-chat";
import { SiteTracker } from "@/components/seo/site-tracker";
import { isStorageConfigured } from "@/lib/storage/r2";
import type { SiteTemplate } from "@/lib/tracking/site-events";

import { SiteFooter, SiteHeader } from "./site-chrome";

/**
 * Shell of the MeetChat site's own pages (guides, tools, comparisons, prices): MeetChat theme
 * whatever brand the visitor's cookie holds, header, footer and the creation conversation.
 */
export function SitePage({
  children,
  template,
  wide = false,
}: {
  children: ReactNode;
  /** Page template for the anonymous funnel events. */
  template: SiteTemplate;
  wide?: boolean;
}) {
  return (
    <div
      data-theme-scope=""
      style={brandThemeStyle(PLATFORM)}
      className="flex min-h-full flex-col bg-background font-sans text-foreground"
    >
      <SiteHeader />
      <main className={`mx-auto w-full flex-1 px-5 pt-4 pb-16 ${wide ? "max-w-5xl" : "max-w-3xl"}`}>
        {children}
      </main>
      <SiteFooter />
      <LazyCreationChat photos={isStorageConfigured()} />
      <SiteTracker template={template} />
    </div>
  );
}
