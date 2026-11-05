import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getNiche } from "@/brands";
import { getCurrentBrand } from "@/brands/server";
import { BrandScope } from "@/components/brand-scope";
import { CopyTextButton } from "@/components/panel/copy-text-button";
import { formatBRL } from "@/lib/money";
import { TIER_NAME } from "@/lib/plans";
import { pixExpired, saleByToken } from "@/lib/sales/assisted";

import { RefreshWhilePending } from "@/components/refresh-while-pending";

export const metadata: Metadata = { title: "Pagamento", robots: { index: false } };

/** What the customer gets, in a few words, for each plan. */
const INCLUDES = {
  site: [
    "Seu site pronto, na sua cor, feito para o Google",
    "Agenda online: os clientes marcam sozinhos, 24h",
    "Confirmação e lembrete automáticos",
    "Avisos no seu celular a cada agendamento",
  ],
  complete: [
    "Agenda online: os clientes marcam sozinhos, 24h",
    "Confirmação e lembrete automáticos",
    "Avisos no seu celular a cada agendamento",
    "Clientes, financeiro e sinal pelo Pix",
  ],
} as const;

/**
 * Payment page of a WhatsApp sale (/pagar/<token>, 2026-11-06): the Pix of the first payment with
 * its QR. Only whoever has the link opens it (random token, out of search engines). Once paid, it
 * says so and points to the access e-mail.
 */
export default async function PayPage({ params }: PageProps<"/pagar/[token]">) {
  const { token } = await params;
  const sale = await saleByToken(token);
  if (!sale) notFound();
  const brand = getNiche(sale.business.brand_key);
  const domainBrand = await getCurrentBrand();
  const paid = sale.status === "paid";
  const expired = pixExpired(sale);

  return (
    <BrandScope brand={brand} current={domainBrand}>
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col gap-5 bg-background px-5 py-10 text-foreground">
        <p className="text-sm font-semibold text-primary">{brand.name}</p>
        <h1 className="text-2xl font-bold">{sale.business.name}</h1>

        {paid ? (
          <section className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center">
            <CheckCircle2 className="size-12 text-primary" aria-hidden />
            <h2 className="text-xl font-semibold">Pagamento confirmado!</h2>
            <p className="text-muted-foreground">
              Sua conta está pronta. Enviamos o acesso para {sale.payer_email}: é só entrar com o
              código que chega no e-mail.
            </p>
            <Link
              href="/entrar"
              className="mt-2 inline-flex min-h-12 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground"
            >
              Entrar no meu painel
            </Link>
          </section>
        ) : expired ? (
          <section className="rounded-2xl border bg-card p-6 text-center">
            <h2 className="text-lg font-semibold">Este Pix venceu</h2>
            <p className="mt-2 text-muted-foreground">
              Peça um novo Pix para quem te atendeu no WhatsApp.
            </p>
          </section>
        ) : (
          <section className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
            <div>
              <p className="text-sm text-muted-foreground">
                {TIER_NAME[sale.tier]} · {sale.cycle === "yearly" ? "anual" : "1ª mensalidade"}
              </p>
              <p className="text-3xl font-bold">{formatBRL(sale.value_cents)}</p>
              {sale.domain ? (
                <p className="text-sm text-muted-foreground">
                  {formatBRL(sale.value_cents - sale.domain_cents)} da mensalidade +{" "}
                  {formatBRL(sale.domain_cents)} do domínio {sale.domain} (1º ano)
                </p>
              ) : null}
            </div>
            {sale.pix_image ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL from Asaas
              <img
                src={sale.pix_image}
                alt="QR code do Pix"
                width={240}
                height={240}
                className="mx-auto size-56 rounded-lg"
              />
            ) : null}
            <p className="text-sm text-muted-foreground">
              No app do seu banco, escolha Pix › Pix copia e cola e cole o código:
            </p>
            <p className="max-h-24 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs break-all">
              {sale.pix_payload}
            </p>
            <CopyTextButton text={sale.pix_payload!} label="Copiar código Pix" variant="default" />
            <p className="text-xs text-muted-foreground">
              Ao pagar, você autoriza as próximas mensalidades pelo Pix Automático (sem fidelidade:
              cancela quando quiser) e concorda com os{" "}
              <Link href="/termos" className="underline">
                Termos de uso
              </Link>{" "}
              e a{" "}
              <Link href="/privacidade" className="underline">
                Política de privacidade
              </Link>
              .
            </p>
            <RefreshWhilePending />
          </section>
        )}

        <section className="rounded-2xl border bg-card p-6">
          <h2 className="font-semibold">O que está incluso</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {[
              ...INCLUDES[sale.tier],
              ...(sale.domain ? [`Seu endereço próprio: ${sale.domain}`] : []),
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </BrandScope>
  );
}
