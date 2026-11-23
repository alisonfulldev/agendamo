import { formatInTimeZone } from "date-fns-tz";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/(auth)/actions";
import { NICHES } from "@/brands";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import type { Business } from "@/lib/db/types";
import { formatAmount } from "@/lib/money";
import {
  HOLD_DAYS,
  MIN_PAYOUT_CENTS,
  PARTNER_PARAM,
  RECURRING_PERCENT,
  balanceOf,
  commissionState,
} from "@/lib/partners/rules";
import { partnerCommissions, partnerOfUser } from "@/lib/partners/service";
import { getPlanFeatures } from "@/lib/plans";
import { siteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";

import { CopyLink } from "./copy-link";

export const metadata: Metadata = { title: "Área do parceiro", robots: { index: false } };

const TZ = "America/Sao_Paulo";
const brl = (cents: number) => `R$ ${formatAmount(cents)}`;
const day = (iso: string) => formatInTimeZone(new Date(iso), TZ, "dd/MM/yyyy");

const STATE_TEXT = {
  waiting: "Aguardando liberação",
  available: "Liberada",
  paid: "Paga",
  cancelled: "Cancelada (estorno)",
} as const;

/** Partner area: the link, the balance, the clients and every commission. */
export default async function PartnerPanelPage() {
  const user = await getSessionUser();
  if (!user) redirect("/parceiros/entrar");
  const partner = await partnerOfUser(user.id);
  if (!partner) redirect("/parceiros/cadastro");

  const admin = createAdminClient();
  const [commissions, { data: clientRows }, { data: payoutRows }] = await Promise.all([
    partnerCommissions(partner.id),
    admin
      .from("businesses")
      .select("id, name, plan, plan_tier, trial_ends_at, product, partner_attributed_at")
      .eq("partner_id", partner.id)
      .order("partner_attributed_at", { ascending: false }),
    admin
      .from("partner_payouts")
      .select("id, amount_cents, paid_at")
      .eq("partner_id", partner.id)
      .order("paid_at", { ascending: false }),
  ]);
  const clients = (clientRows ?? []) as (Pick<
    Business,
    "id" | "name" | "plan" | "plan_tier" | "trial_ends_at" | "product"
  > & { partner_attributed_at: string | null })[];
  const balance = balanceOf(commissions);
  const names = new Map(clients.map((c) => [c.id, c.name]));
  const link = siteUrl(`/?${PARTNER_PARAM}=${partner.code}`);
  const paying = clients.filter((c) => c.plan === "complete").length;
  const nicheLinks = NICHES.filter((n) =>
    ["beleza", "barbearia", "psicologia", "estetica"].includes(n.niche!.route),
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Olá, {partner.name.split(" ")[0]}!</h1>
          <p className="text-sm text-muted-foreground">
            Você ganha a 1ª mensalidade inteira e {RECURRING_PERCENT}% de cada mensalidade seguinte
            dos negócios que assinarem pelo seu link.
          </p>
        </div>
        <form action={signOutAction}>
          <input type="hidden" name="next" value="/parceiros/entrar" />
          <Button type="submit" variant="ghost" size="sm">
            Sair
          </Button>
        </form>
      </header>

      {partner.status === "blocked" ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Sua parceria está suspensa. Fale com contato@brandcodesolutions.com.br.
        </p>
      ) : null}

      <section className="flex flex-col gap-3 rounded-2xl border p-5">
        <h2 className="font-semibold">Seu link</h2>
        <CopyLink url={link} />
        <p className="text-sm text-muted-foreground">
          Funciona em qualquer página do MeetChat. Para um nicho, use o link da página dele:
        </p>
        <ul className="flex flex-col gap-2">
          {nicheLinks.map((n) => (
            <li key={n.key}>
              <CopyLink url={siteUrl(`/${n.niche!.route}?${PARTNER_PARAM}=${partner.code}`)} />
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Dica: na conversa de criação, o negócio pode tocar em “Ver como meu cliente vai agendar” e
          ver o agendamento funcionando antes de criar a conta.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Aguardando liberação", value: balance.waitingCents },
          { label: "Liberado para receber", value: balance.availableCents },
          { label: "Já recebido", value: balance.paidCents },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border p-4">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-bold">{brl(item.value)}</p>
          </div>
        ))}
        <p className="text-sm text-muted-foreground sm:col-span-3">
          Cada comissão é liberada {HOLD_DAYS} dias depois do pagamento do cliente. Pagamos por Pix
          a partir de {brl(MIN_PAYOUT_CENTS)} liberados.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">
          Seus clientes ({clients.length}, {paying} assinando)
        </h2>
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum cliente ainda. Quando alguém criar a conta pelo seu link, aparece aqui.
          </p>
        ) : (
          <ul className="divide-y rounded-2xl border text-sm">
            {clients.map((c) => {
              const features = getPlanFeatures(c);
              const status =
                features.status === "subscribed"
                  ? "Assinante"
                  : features.status === "trial"
                    ? "Em teste"
                    : "Ainda não assinou";
              return (
                <li key={c.id} className="flex flex-wrap justify-between gap-2 px-4 py-3">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">
                    {status}
                    {c.partner_attributed_at ? ` · desde ${day(c.partner_attributed_at)}` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Comissões</h2>
        {commissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            As comissões aparecem aqui quando os seus clientes pagarem.
          </p>
        ) : (
          <ul className="divide-y rounded-2xl border text-sm">
            {commissions.map((c) => (
              <li key={c.id} className="flex flex-wrap justify-between gap-2 px-4 py-3">
                <span>
                  <span className="font-medium">{names.get(c.business_id) ?? "Cliente"}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {c.kind === "first" ? "1ª mensalidade" : "mensalidade"} de {day(c.created_at)}
                  </span>
                </span>
                <span>
                  <span className="font-medium">{brl(c.amount_cents)}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {STATE_TEXT[commissionState(c)]}
                    {commissionState(c) === "waiting" ? ` até ${day(c.available_at)}` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {payoutRows?.length ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Pagamentos recebidos</h2>
          <ul className="divide-y rounded-2xl border text-sm">
            {payoutRows.map((p) => (
              <li key={p.id as string} className="flex justify-between px-4 py-3">
                <span>{day(p.paid_at as string)}</span>
                <span className="font-medium">{brl(p.amount_cents as number)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
