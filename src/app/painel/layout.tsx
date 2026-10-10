import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { signOutAction } from "@/app/(auth)/actions";
import { getCurrentBrand, getRequestPath } from "@/brands/server";
import { brandThemeStyle } from "@/brands/theme";
import { brandUrl, isProductionDeployment } from "@/brands/urls";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getBusinessContext } from "@/lib/business/context";
import { getPlanFeatures, type LockedFeature } from "@/lib/plans";
import { trialCounter } from "@/lib/plan-text";

import { MobileNav } from "./mobile-nav";
import { PanelNav } from "./panel-nav";
import { PanelTour } from "./tour";

export const metadata: Metadata = { title: "Painel", robots: { index: false } };

/** Paid features with an item in the menu. */
const LOCKABLE: LockedFeature[] = [
  "customers",
  "finance",
  "salesTools",
  "reviews",
  "stats",
  "anyProfessional",
  "googleCalendar",
];

/** Panel pages that work before the business exists. */
const WITHOUT_BUSINESS = ["/painel/novo", "/painel/conta"];

export default async function PanelLayout({ children }: LayoutProps<"/painel">) {
  await requireUser();
  const [context, path, domainBrand] = await Promise.all([
    getBusinessContext(),
    getRequestPath(),
    getCurrentBrand(),
  ]);

  if (!context) {
    if (!WITHOUT_BUSINESS.includes(path)) redirect("/painel/novo");
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8">{children}</div>
    );
  }
  if (path === "/painel/novo") redirect("/painel");

  // Grátis plan: paid items of the menu show a lock (pages and actions check it themselves).
  const features = getPlanFeatures(context.business);
  const locked = LOCKABLE.filter((feature) => !features[feature]);
  const customers = context.brand.terms.customer.plural;
  const customersLabel = customers.charAt(0).toUpperCase() + customers.slice(1);

  // Rule 14: the panel uses the business's brand. In production, send owners to that domain.
  if (context.brand.key !== domainBrand.key && isProductionDeployment()) {
    redirect(brandUrl(context.brand, path));
  }

  return (
    <div
      className="flex flex-1 flex-col bg-background text-foreground"
      data-theme-scope={context.brand.key !== domainBrand.key ? "" : undefined}
      style={context.brand.key !== domainBrand.key ? brandThemeStyle(context.brand) : undefined}
    >
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/painel" className="flex min-w-0 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
            <img src={context.brand.logo} alt="" width={28} height={28} />
            <span className="truncate font-heading font-semibold">{context.business.name}</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/${context.business.slug}`} target="_blank" data-tour="view-chat">
                <ExternalLink aria-hidden />
                Ver chat
              </Link>
            </Button>
            {/* On the phone, "Sair" is in "Mais". */}
            <form action={signOutAction} className="hidden md:block">
              <Button type="submit" variant="ghost" size="sm">
                Sair
              </Button>
            </form>
          </div>
        </div>
      </header>
      {features.trialActive && context.isOwner ? (
        <Link
          href="/painel/plano"
          className="block bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground"
        >
          {trialCounter(features)} · Assinar
        </Link>
      ) : null}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pt-4 pb-28 md:flex-row md:py-6">
        <aside className="md:w-52 md:shrink-0">
          <div className="hidden md:block">
            <PanelNav
              locked={locked}
              trialAvailable={features.trialAvailable}
              isOwner={context.isOwner}
              customersLabel={customersLabel}
            />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <MobileNav
        locked={locked}
        trialAvailable={features.trialAvailable}
        isOwner={context.isOwner}
        customersLabel={customersLabel}
      />
      {context.isOwner ? (
        <Suspense>
          <PanelTour />
        </Suspense>
      ) : null}
    </div>
  );
}
