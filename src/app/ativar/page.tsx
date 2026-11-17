import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { NICHES, PLATFORM } from "@/brands";
import { brandThemeStyle } from "@/brands/theme";
import { businessUrl } from "@/brands/urls";
import { LazyCreationChat } from "@/components/creation/lazy-creation-chat";
import { OpenCreationLink } from "@/components/creation/open-creation";
import { ACTIVATION } from "@/content/activation";
import { getSessionUser } from "@/lib/auth/session";
import { getBusinessContext } from "@/lib/business/context";
import { getPlanFeatures, subscriptionPrice } from "@/lib/plans";
import { isStorageConfigured } from "@/lib/storage/r2";
import { createAdminClient } from "@/lib/supabase/admin";

import { loadTestBooking } from "./data";
import { ActivationFlow, PaidTracker } from "./flow";

export const metadata: Metadata = {
  title: ACTIVATION.meta.title,
  description: ACTIVATION.meta.description,
  // Only for whoever clicks the Meta ad: out of search engines and of the site's menus.
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const T = ACTIVATION;

/**
 * Meta ad page (2026-11-17): booking only, no 14-day trial. The person creates her real link in
 * the creation conversation (?ramo= from the ad skips the niche question), books herself as a
 * customer to see it working (the "demonstration", until that booking or 1 hour) and pays right
 * after by Pix. Without paying, the link stays in waiting mode (requests go to her WhatsApp).
 * The Meta pixel runs here (site-paths.ts): PageView, CompleteRegistration, Lead, InitiateCheckout
 * and Purchase.
 */
export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { ramo } = await searchParams;
  const user = await getSessionUser();
  const context = user ? await getBusinessContext() : null;

  if (!context) {
    const niche =
      typeof ramo === "string" && NICHES.some((b) => b.niche!.route === ramo) ? ramo : undefined;
    return (
      <Shell>
        <Landing niche={niche} />
        <LazyCreationChat photos={isStorageConfigured()} activation />
      </Shell>
    );
  }

  // Accounts from the normal sign-up (and staff) have nothing to do here.
  const { business, brand } = context;
  if (!business.activation_demo || !context.isOwner) redirect("/painel");
  const features = getPlanFeatures(business);
  const pageUrl = businessUrl(brand, `/${business.slug}`);

  if (features.subscribed) {
    const { data: subscription } = await createAdminClient()
      .from("subscriptions")
      .select("value_cents, billing_cycle, tier")
      .eq("business_id", business.id)
      .maybeSingle();
    const valueCents =
      (subscription?.value_cents as number | null) ??
      subscriptionPrice(
        (subscription?.billing_cycle as "monthly" | "yearly" | undefined) ?? "monthly",
        0,
        0,
        (subscription?.tier as "complete" | "site" | undefined) ?? "complete",
      );
    return (
      <Shell>
        <PaidTracker businessId={business.id} valueCents={valueCents} />
        <Done pageUrl={pageUrl} />
      </Shell>
    );
  }

  return (
    <Shell>
      <ActivationFlow
        businessId={business.id}
        pageUrl={pageUrl}
        initialBooking={await loadTestBooking(business.id)}
        demoActive={features.trialActive}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme-scope=""
      data-palette="meetchat"
      style={brandThemeStyle(PLATFORM)}
      className="flex min-h-[100dvh] flex-col bg-background font-sans text-foreground"
    >
      <header className="mx-auto flex w-full max-w-xl items-center gap-2 px-4 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- small static SVG logo */}
        <img src={PLATFORM.logo} alt="" width={32} height={32} className="size-8 rounded-lg" />
        <span className="text-lg font-semibold">{PLATFORM.name}</span>
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-2 pb-16">{children}</main>
    </div>
  );
}

function Landing({ niche }: { niche?: string }) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-semibold tracking-wide text-primary uppercase">
          {T.landing.eyebrow}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {T.landing.title}
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-pretty text-muted-foreground">
          {T.landing.intro}
        </p>
      </div>
      <OpenCreationLink
        niche={niche}
        className="flex h-14 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground shadow-lg"
      >
        {T.landing.cta}
      </OpenCreationLink>
      <ol className="flex flex-col gap-3">
        {T.landing.steps.map((step, i) => (
          <li key={step.title} className="flex gap-3 rounded-2xl border bg-card p-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
              {i + 1}
            </span>
            <span>
              <span className="block font-semibold">{step.title}</span>
              <span className="block text-muted-foreground">{step.text}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="text-center text-muted-foreground">{T.landing.noApp}</p>
      <Link href="/entrar" className="self-center text-sm font-medium underline underline-offset-2">
        {T.landing.login}
      </Link>
    </section>
  );
}

function Done({ pageUrl }: { pageUrl: string }) {
  return (
    <section className="flex flex-col gap-5 text-center">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-balance">
        {T.done.title}
      </h1>
      <p className="text-lg text-muted-foreground">{T.done.intro}</p>
      <p className="rounded-xl bg-muted px-4 py-3 font-medium break-all">
        {pageUrl.replace(/^https?:\/\//, "")}
      </p>
      <p className="text-muted-foreground">{T.done.share}</p>
      {/* Full load: the panel layout renders from scratch with the paid plan. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/painel"
        className="flex h-14 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground shadow-lg"
      >
        {T.done.panel}
      </a>
    </section>
  );
}
