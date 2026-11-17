"use client";

import { Bell, CalendarCheck, Check, ExternalLink, Mail, Repeat } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { trackMeta } from "@/components/google-tag";
import { ACTIVATION } from "@/content/activation";
import { PLAN_CARDS } from "@/content/plans";
import type { PixCharge } from "@/lib/billing/service";
import { formatBRL } from "@/lib/money";
import { subscriptionPrice, type Cycle } from "@/lib/plans";

import { checkoutAction } from "../painel/plano/actions";
import { PixPanel } from "../painel/plano/payment";

import { testBookingAction } from "./actions";
import type { TestBooking } from "./data";

const T = ACTIVATION;
const POLL_MS = 3000;

type PaidTier = "complete" | "site";

const cents = (value: number) => Math.round(value) / 100;

/**
 * The ad page after the account exists: the owner books herself on her real link (another tab),
 * this screen notices the booking by itself, shows what happened and asks for the payment.
 * Meta pixel: Lead (test booking), InitiateCheckout (Pix shown) and Purchase (paid).
 */
export function ActivationFlow({
  businessId,
  pageUrl,
  initialBooking,
  demoActive,
}: {
  businessId: string;
  pageUrl: string;
  initialBooking: TestBooking | null;
  /** The demonstration is still open (before the test booking, at most 1 hour). */
  demoActive: boolean;
}) {
  const [booking, setBooking] = useState<TestBooking | null>(initialBooking);
  const [skipped, setSkipped] = useState(false);

  // Waits for the test booking made in the other tab.
  useEffect(() => {
    if (booking || !demoActive) return;
    let stopped = false;
    const timer = setInterval(async () => {
      const found = await testBookingAction().catch(() => null);
      if (found && !stopped) {
        setBooking(found);
        clearInterval(timer);
      }
    }, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [booking, demoActive]);

  useEffect(() => {
    if (booking) trackMeta("Lead", { key: businessId });
  }, [booking, businessId]);

  if (!booking && demoActive && !skipped) {
    return <TestStep pageUrl={pageUrl} onSkip={() => setSkipped(true)} />;
  }
  return (
    <div className="flex flex-col gap-8">
      {booking ? (
        <Result booking={booking} />
      ) : !demoActive ? (
        <p className="rounded-2xl border bg-card p-4 text-[17px]">{T.test.ended}</p>
      ) : null}
      <Checkout businessId={businessId} />
    </div>
  );
}

function TestStep({ pageUrl, onSkip }: { pageUrl: string; onSkip: () => void }) {
  return (
    <section className="flex flex-col gap-5">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-balance">
        {T.test.title}
      </h1>
      <p className="text-lg leading-relaxed text-pretty text-muted-foreground">{T.test.intro}</p>
      <p className="rounded-xl bg-muted px-4 py-3 text-center font-medium break-all">
        {pageUrl.replace(/^https?:\/\//, "")}
      </p>
      <a
        href={pageUrl}
        target="_blank"
        rel="noopener"
        className="flex h-14 items-center justify-center gap-2 rounded-xl bg-primary text-lg font-semibold text-primary-foreground shadow-lg ring-4 ring-primary/30"
      >
        {T.test.open}
        <ExternalLink className="size-5" aria-hidden />
      </a>
      <p
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
        aria-live="polite"
      >
        <span className="size-2 animate-pulse rounded-full bg-primary" />
        {T.test.waiting}
      </p>
      <p className="text-center text-sm text-muted-foreground">{T.test.note}</p>
      <button
        type="button"
        onClick={onSkip}
        className="self-center text-sm font-medium underline underline-offset-2"
      >
        {T.test.skip}
      </button>
    </section>
  );
}

function Result({ booking }: { booking: TestBooking }) {
  const lines = [
    { icon: Bell, text: T.result.ownerNotice },
    { icon: Mail, text: T.result.customerNotice },
    { icon: Repeat, text: T.result.reminder },
  ];
  return (
    <section className="flex flex-col gap-4 motion-safe:animate-in motion-safe:fade-in">
      <h1 className="font-heading text-3xl font-bold tracking-tight">{T.result.title}</h1>
      <p className="text-lg text-muted-foreground">{T.result.intro}</p>
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <p className="mb-2 flex items-center gap-2 font-semibold">
          <CalendarCheck className="size-5 text-primary" aria-hidden /> {T.result.booked}
        </p>
        <div className="rounded-lg bg-accent px-3 py-2 text-accent-foreground">
          <p className="font-semibold">
            {booking.date}, às {booking.time}
          </p>
          <p className="text-sm">
            {booking.service} · {booking.customer}
          </p>
        </div>
      </div>
      <ul className="flex flex-col gap-3">
        {lines.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 text-[17px]">
            <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Checkout({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [tier, setTier] = useState<PaidTier>("complete");
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pix, setPix] = useState<PixCharge | null>(null);
  const [pending, startTransition] = useTransition();
  const total = subscriptionPrice(cycle, 0, 0, tier);

  const onPaid = useCallback(() => {
    trackMeta("Purchase", {
      key: businessId,
      value: cents(pix?.valueCents ?? total),
      eventId: `purchase-${businessId}`,
    });
  }, [businessId, pix, total]);

  if (pix) {
    return (
      <section className="flex flex-col gap-3">
        <PixPanel pix={pix} onActive={onPaid} />
        <button
          type="button"
          onClick={() => setPix(null)}
          className="self-center text-sm font-medium underline underline-offset-2"
        >
          Voltar
        </button>
      </section>
    );
  }

  function pay() {
    setError(null);
    startTransition(async () => {
      const result = await checkoutAction({
        name,
        cpfCnpj: document,
        cycle,
        extraProfessionals: 0,
        tier,
      }).catch(() => ({
        ok: false as const,
        message: "Não foi possível concluir agora. Tente de novo.",
      }));
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (result.kind === "pix") {
        trackMeta("InitiateCheckout", {
          key: `${businessId}_${tier}_${cycle}`,
          value: cents(result.pix.valueCents),
        });
        setPix(result.pix);
      } else router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-2xl font-bold text-balance">{T.checkout.title}</h2>
        <p className="mt-1 text-muted-foreground">{T.checkout.intro}</p>
      </div>

      <div
        className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1"
        role="group"
        aria-label="Ciclo"
      >
        {(["monthly", "yearly"] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={cycle === c}
            onClick={() => setCycle(c)}
            className={`h-10 rounded-lg text-sm font-semibold ${cycle === c ? "bg-background shadow-sm" : "text-muted-foreground"}`}
          >
            {c === "monthly" ? T.checkout.monthly : T.checkout.yearly}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3" role="group" aria-label={T.checkout.choosePlan}>
        {(["complete", "site"] as const).map((t) => {
          const card = PLAN_CARDS[t];
          const price = subscriptionPrice(cycle, 0, 0, t);
          return (
            <button
              key={t}
              type="button"
              aria-pressed={tier === t}
              onClick={() => setTier(t)}
              className={`rounded-xl border-2 p-4 text-left transition-colors ${tier === t ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-lg font-bold">{card.name}</span>
                <span className="font-semibold whitespace-nowrap">
                  {formatBRL(price)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{cycle === "monthly" ? "mês" : "ano"}
                  </span>
                </span>
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">{card.tagline}</span>
              {tier === t ? (
                <span className="mt-3 flex flex-col gap-1.5">
                  {card.includes.map((item) => (
                    <span key={item} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      {item}
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {T.checkout.payerName}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            maxLength={120}
            className="h-12 rounded-xl border bg-background px-3 text-base outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {T.checkout.payerDocument}
          <input
            value={document}
            onChange={(e) => setDocument(e.target.value)}
            inputMode="numeric"
            maxLength={20}
            className="h-12 rounded-xl border bg-background px-3 text-base outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={pending}
        onClick={pay}
        className="h-14 rounded-xl bg-primary text-lg font-semibold text-primary-foreground shadow-lg disabled:opacity-60"
      >
        {pending ? T.checkout.paying : `${T.checkout.pay} · ${formatBRL(total)}`}
      </button>
      <p className="text-sm text-muted-foreground">{T.checkout.automatic}</p>
      <p className="text-sm text-muted-foreground">{T.checkout.refund}</p>
    </section>
  );
}

/** Paid: the Purchase event (once; the same id as the one sent when the payment was noticed). */
export function PaidTracker({
  businessId,
  valueCents,
}: {
  businessId: string;
  valueCents: number;
}) {
  useEffect(() => {
    trackMeta("Purchase", {
      key: businessId,
      value: cents(valueCents),
      eventId: `purchase-${businessId}`,
    });
  }, [businessId, valueCents]);
  return null;
}
