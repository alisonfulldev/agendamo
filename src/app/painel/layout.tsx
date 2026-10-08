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
import { getPlanFeatures } from "@/lib/plans";

import { MobileNav } from "./mobile-nav";
import { PanelNav } from "./panel-nav";
import { PanelTour } from "./tour";

export const metadata: Metadata = { title: "Painel", robots: { index: false } };

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

  // Trial ended without a subscription: the pages lock themselves (requireBusiness); here only
  // the notice and the reduced menu.
  const expired = !getPlanFeatures(context.business).active;
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
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pt-4 pb-28 md:flex-row md:py-6">
        <aside className="md:w-52 md:shrink-0">
          {expired ? (
            <p className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {context.isOwner
                ? "Seu teste terminou. Assine para liberar o painel."
                : "O painel está pausado até a assinatura ser renovada."}
            </p>
          ) : null}
          <div className="hidden md:block">
            <PanelNav locked={expired} isOwner={context.isOwner} customersLabel={customersLabel} />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <MobileNav locked={expired} isOwner={context.isOwner} customersLabel={customersLabel} />
      {context.isOwner && !expired ? (
        <Suspense>
          <PanelTour />
        </Suspense>
      ) : null}
    </div>
  );
}
