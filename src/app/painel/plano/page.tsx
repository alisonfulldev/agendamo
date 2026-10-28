import { formatInTimeZone } from "date-fns-tz";
import type { Metadata } from "next";

import { PageHeader, Section } from "@/components/panel/page-header";
import {
  isAsaasConfigured,
  listSubscriptionPayments,
  type AsaasPayment,
} from "@/lib/billing/asaas";
import { requireOwner } from "@/lib/business/context";
import { syncPixAutomatic } from "@/lib/billing/service";
import type { Business, Subscription } from "@/lib/db/types";
import { formatBRL } from "@/lib/money";
import { handoffsThisMonth } from "@/lib/handoffs";
import { trialCounter } from "@/lib/plan-text";
import { getPlanFeatures, PLAN_NAME, PLAN_PRICES, planLabel, PRICE_TEXT } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

import { CancelAddonButton, CancelPlanButton, PlanCheckout } from "./checkout";
import { PendingPixButton } from "./payment";

export const metadata: Metadata = { title: "Assinatura" };

const SUBSCRIPTION_STATUS = {
  pending: "Aguardando pagamento",
  active: "Ativa",
  overdue: "Em atraso",
  cancelled: "Cancelada",
} as const;
const PAYMENT_STATUS: Record<string, string> = {
  PENDING: "Aguardando",
  RECEIVED: "Pago",
  CONFIRMED: "Pago",
  OVERDUE: "Vencido",
  REFUNDED: "Estornado",
  RECEIVED_IN_CASH: "Pago",
};

/** Applies a Pix Automático confirmed at Asaas and returns the business plan after it. */
async function syncedPlan(businessId: string) {
  await syncPixAutomatic(businessId).catch((error) =>
    console.error("pix automatic sync failed", error instanceof Error ? error.message : "unknown"),
  );
  const { data } = await (
    await createClient()
  )
    .from("businesses")
    .select("plan")
    .eq("id", businessId)
    .maybeSingle();
  return (data?.plan as Business["plan"] | undefined) ?? null;
}

export default async function PlanPage() {
  // Open in waiting mode: it is the only panel screen then.
  const { business: loaded } = await requireOwner({ allowWaiting: true });
  // A payment confirmed at the bank but not yet seen here (webhook late or missing) is applied
  // before the screen is drawn.
  let business = loaded;
  if (isAsaasConfigured()) {
    const before = await syncedPlan(loaded.id);
    if (before !== loaded.plan && before) business = { ...loaded, plan: before };
  }
  const features = getPlanFeatures(business);
  const handoffs = features.active ? 0 : await handoffsThisMonth(business);
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("business_id", business.id)
    .maybeSingle();
  const subscription = data as Subscription | null;
  const { count: activeProfessionals } = await supabase
    .from("professionals")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("active", true);

  let payments: AsaasPayment[] = [];
  if (subscription?.provider_subscription_id && isAsaasConfigured()) {
    payments = await listSubscriptionPayments(subscription.provider_subscription_id).catch(
      () => [],
    );
  }
  const active = subscription?.status === "active" || subscription?.status === "overdue";
  const automatic = subscription?.pix_automatic_status === "active";
  const pendingInvoice = payments.find((p) => p.status === "PENDING" || p.status === "OVERDUE");
  const date = (iso: string) =>
    formatInTimeZone(
      new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso),
      business.timezone,
      "dd/MM/yyyy",
    );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Assinatura" description={`Seu plano: ${planLabel(features)}`} />

      {features.trialActive && features.trialEndsAt ? (
        <p role="status" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          {trialCounter(features)} (até{" "}
          {formatInTimeZone(features.trialEndsAt, business.timezone, "dd/MM/yyyy")}). Assine quando
          quiser: libera na hora e o teste continua valendo até o fim.
        </p>
      ) : null}

      {!features.active ? (
        <section
          aria-labelledby="espera"
          className="rounded-2xl border-2 border-primary bg-card p-5 text-card-foreground"
        >
          <h2 id="espera" className="text-xl font-bold tracking-tight">
            {subscription
              ? "Sua assinatura não está ativa"
              : features.trialEndsAt
                ? "Seu teste terminou"
                : "O teste grátis já foi usado"}
          </h2>
          <p className="mt-2 text-lg font-medium text-pretty">
            {handoffs > 0
              ? `Este mês, ${handoffs} ${handoffs === 1 ? "cliente pediu" : "clientes pediram"} horário pelo seu link e ${handoffs === 1 ? "foi" : "foram"} para o seu WhatsApp. Com o ${PLAN_NAME}, ${handoffs === 1 ? "ele marcaria sozinho" : "eles marcariam sozinhos"}.`
              : `Seus clientes ainda pedem horário pelo seu link, mas o pedido vai para o seu WhatsApp. Com o ${PLAN_NAME}, eles marcam sozinhos.`}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Agenda, clientes e configurações estão guardados, e os horários já marcados continuam
            valendo. Assinando, tudo volta na hora: {PRICE_TEXT.summary}.
          </p>
          <a
            href="#assinar"
            className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground"
          >
            Assinar o {PLAN_NAME}
          </a>
        </section>
      ) : null}

      {subscription ? (
        <Section title="Minha assinatura">
          <dl className="grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">Plano</dt>
            <dd>
              {PLAN_NAME} · {subscription.billing_cycle === "yearly" ? "Anual" : "Mensal"} ·{" "}
              {(subscription.extra_professionals ?? 0) + 1} profissiona
              {(subscription.extra_professionals ?? 0) + 1 === 1 ? "l" : "is"}
            </dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{SUBSCRIPTION_STATUS[subscription.status]}</dd>
            {subscription.current_period_end ? (
              <>
                <dt className="text-muted-foreground">
                  {subscription.status === "cancelled" ? "Ativa até" : "Próxima cobrança"}
                </dt>
                <dd>{date(subscription.current_period_end)}</dd>
              </>
            ) : null}
          </dl>
          {active ? (
            <p className="mt-3 text-sm">
              Forma de pagamento:{" "}
              <span className="font-medium">
                {automatic
                  ? "Pix Automático (debitado sozinho na data de cada mensalidade)"
                  : "Pix (você paga pelo QR code). Ao pagar a próxima mensalidade, você ativa o Pix Automático."}
              </span>
            </p>
          ) : null}
          {pendingInvoice && active ? (
            <div className="mt-3 flex flex-col gap-1">
              <p className="text-sm">
                Mensalidade em aberto: {formatBRL(Math.round(pendingInvoice.value * 100))} (vence{" "}
                {date(pendingInvoice.dueDate)})
                {automatic && pendingInvoice.status === "PENDING"
                  ? ". Será debitada pelo Pix Automático; se preferir, pague agora."
                  : null}
              </p>
              <PendingPixButton
                label={automatic ? "Pagar agora com Pix" : "Pagar e ativar o Pix Automático"}
              />
            </div>
          ) : null}
          {payments.length > 0 ? (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold">Histórico</h3>
              <ul className="divide-y rounded-lg border text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span>{date(p.dueDate)}</span>
                    <span>{formatBRL(Math.round(p.value * 100))}</span>
                    <span className="text-muted-foreground">
                      {PAYMENT_STATUS[p.status] ?? p.status}
                    </span>
                    <span className="text-muted-foreground">
                      {p.billingType === "CREDIT_CARD" ? "Cartão" : "Pix"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {subscription.addons.featured?.length || subscription.addons.custom_domain ? (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold">Adicionais</h3>
              <ul className="divide-y rounded-lg border text-sm">
                {(
                  subscription.addons as {
                    featured?: { city: string; subscription_id: string; status: string }[];
                  }
                ).featured?.map((f) => (
                  <li
                    key={f.subscription_id}
                    className="flex items-center justify-between gap-2 px-3 py-2"
                  >
                    <span>Destaque · {f.city}</span>
                    <span className="text-muted-foreground">
                      {f.status === "active"
                        ? "Ativo"
                        : f.status === "pending"
                          ? "Aguardando pagamento"
                          : "Cancelado"}
                    </span>
                    {f.status !== "cancelled" ? (
                      <CancelAddonButton subscriptionId={f.subscription_id} />
                    ) : (
                      <span />
                    )}
                  </li>
                ))}
                {(() => {
                  const domain = (
                    subscription.addons as {
                      custom_domain?: { subscription_id: string; status: string };
                    }
                  ).custom_domain;
                  return domain ? (
                    <li className="flex items-center justify-between gap-2 px-3 py-2">
                      <span>Domínio próprio</span>
                      <span className="text-muted-foreground">
                        {domain.status === "active"
                          ? "Ativo"
                          : domain.status === "pending"
                            ? "Aguardando pagamento"
                            : "Cancelado"}
                      </span>
                      {domain.status !== "cancelled" ? (
                        <CancelAddonButton subscriptionId={domain.subscription_id} />
                      ) : (
                        <span />
                      )}
                    </li>
                  ) : null;
                })()}
              </ul>
            </div>
          ) : null}
          {active ? (
            <div className="mt-4">
              <CancelPlanButton />
            </div>
          ) : null}
        </Section>
      ) : null}

      <Section id="assinar" title={active ? "Alterar assinatura" : `Assinar o ${PLAN_NAME}`}>
        <PlanCheckout
          initialCycle={subscription?.billing_cycle ?? "monthly"}
          initialExtras={active ? (subscription?.extra_professionals ?? 0) : 0}
          activeProfessionals={activeProfessionals ?? 1}
          hasActiveSubscription={active}
          addonPrices={{
            featured: PLAN_PRICES.featured.monthly,
          }}
        />
      </Section>
    </div>
  );
}
