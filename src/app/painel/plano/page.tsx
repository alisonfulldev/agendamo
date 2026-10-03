import { formatInTimeZone } from "date-fns-tz";
import type { Metadata } from "next";

import { PageHeader, Section } from "@/components/panel/page-header";
import {
  isAsaasConfigured,
  listSubscriptionPayments,
  type AsaasPayment,
} from "@/lib/billing/asaas";
import { requireOwner } from "@/lib/business/context";
import type { Subscription } from "@/lib/db/types";
import { formatBRL } from "@/lib/money";
import { getPlanFeatures, PLAN_PRICES, PLAN_STATUS_LABELS } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

import { CancelAddonButton, CancelPlanButton, PlanCheckout } from "./checkout";
import { PaymentMethodSection, PendingPixButton } from "./payment";

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

export default async function PlanPage() {
  const { business } = await requireOwner({ allowExpired: true });
  const features = getPlanFeatures(business);
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
  const pendingInvoice = payments.find((p) => p.status === "PENDING" || p.status === "OVERDUE");
  const date = (iso: string) =>
    formatInTimeZone(
      new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso),
      business.timezone,
      "dd/MM/yyyy",
    );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assinatura"
        description={`Situação: ${PLAN_STATUS_LABELS[features.status]}`}
      />

      {features.trialActive && features.trialEndsAt ? (
        <p role="status" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          {features.trialDaysLeft === 0
            ? "Seu teste grátis termina hoje."
            : `Faltam ${features.trialDaysLeft} dias do seu teste grátis (até ${formatInTimeZone(features.trialEndsAt, business.timezone, "dd/MM/yyyy")}).`}{" "}
          Assine antes para não pausar sua agenda.
        </p>
      ) : null}

      {features.status === "expired" ? (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="font-semibold">Seu teste grátis terminou</p>
          <p className="mt-1 text-sm">
            Seu link continua no ar, mas os pedidos chegam só pelo seu WhatsApp: nada entra na
            agenda e nenhum horário fica reservado. Assine para liberar o painel; seus clientes,
            agendamentos e fotos estão guardados.
          </p>
        </div>
      ) : null}

      {subscription ? (
        <Section title="Minha assinatura">
          <dl className="grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">Plano</dt>
            <dd>
              {subscription.billing_cycle === "yearly" ? "Anual" : "Mensal"} ·{" "}
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
          {pendingInvoice && subscription.billing_type === "pix" ? (
            <div className="mt-3 flex flex-col gap-1">
              <p className="text-sm">
                Mensalidade em aberto: {formatBRL(Math.round(pendingInvoice.value * 100))} (vence{" "}
                {date(pendingInvoice.dueDate)})
              </p>
              <PendingPixButton label="Pagar com Pix" />
            </div>
          ) : null}
          {pendingInvoice &&
          subscription.billing_type === "credit_card" &&
          pendingInvoice.status === "OVERDUE" ? (
            <p className="mt-3 text-sm text-destructive">
              A cobrança no cartão não foi aprovada. Troque o cartão ou mude para Pix abaixo.
            </p>
          ) : null}
          {active || subscription.status === "pending" ? (
            <div className="mt-4">
              <PaymentMethodSection
                method={subscription.billing_type}
                cardLabel={
                  subscription.card_last4
                    ? `Cartão ${subscription.card_brand ?? ""} final ${subscription.card_last4}`.replace(
                        "  ",
                        " ",
                      )
                    : "Cartão de crédito"
                }
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

      <Section title={active ? "Alterar assinatura" : "Assinar"}>
        <PlanCheckout
          initialCycle={subscription?.billing_cycle ?? "monthly"}
          initialExtras={active ? (subscription?.extra_professionals ?? 0) : 0}
          activeProfessionals={activeProfessionals ?? 1}
          hasActiveSubscription={active}
          addonPrices={{
            featured: PLAN_PRICES.featured.monthly,
            customDomain: PLAN_PRICES.customDomain.monthly,
          }}
        />
      </Section>
    </div>
  );
}
