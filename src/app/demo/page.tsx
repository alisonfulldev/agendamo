import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BRANDS, getBrand } from "@/brands";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth/session";
import { CRON_JOBS } from "@/lib/demo/cron-jobs";
import { getDemoDb } from "@/lib/demo/db";
import { listDemoEmails } from "@/lib/demo/mailbox";
import { DEMO_PASSWORD, isDemoMode } from "@/lib/demo/mode";
import { DEMO_PERSONAS } from "@/lib/demo/seed";
import type { Business } from "@/lib/db/types";
import { getPlanFeatures } from "@/lib/plans";

import {
  demoClearEmailsAction,
  demoConfirmPaymentAction,
  demoResetAction,
  demoEnableDepositsAction,
  demoExpireDepositHoldsAction,
  demoFillFreeCycleAction,
  demoRunCronAction,
  demoSetPlanAction,
  demoSignInAction,
  demoSignOutAction,
  demoStartSignUpAction,
} from "./actions";

export const metadata: Metadata = { title: "Modo demonstração", robots: { index: false } };
export const dynamic = "force-dynamic";

const CRON_LABELS: Record<(typeof CRON_JOBS)[number], string> = {
  reminders: "Lembretes de horário",
  deposits: "Sinais Pix vencidos",
  trial: "Fim do teste grátis",
  "daily-alert": "Alerta diário da dona",
  "weekly-summary": "Resumo semanal",
  "empty-slots": "Horários vazios amanhã",
  stats: "Consolidar estatísticas",
  "portal-stats": "Estatísticas do portal",
  cleanup: "Limpeza de dados antigos",
};

const PLAN_OPTIONS = [
  ["free", "Grátis"],
  ["trial_agenda", "Teste do Agenda"],
  ["trial_pro", "Teste do Pro"],
  ["agenda", "Agenda"],
  ["pro", "Pro"],
  ["ended", "Teste encerrado"],
] as const;

/** Which demo option matches the business now. */
function planOption(business: BusinessRow): string {
  const features = getPlanFeatures(business);
  if (features.subscribed) return features.tier;
  if (features.trialActive) return `trial_${features.tier}`;
  return business.trial_ends_at ? "ended" : "free";
}

interface BusinessRow {
  id: string;
  name: string;
  slug: string;
  brand_key: string;
  plan: Business["plan"];
  trial_plan: Business["trial_plan"];
  trial_started_at: string | null;
  trial_ends_at: string | null;
  professional_seats: number;
}

function dateTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });
}

/** Demo control panel: log in as any persona, switch plans, run jobs, read captured e-mails. */
export default async function DemoPage({ searchParams }: PageProps<"/demo">) {
  if (!isDemoMode()) notFound();
  const params = await searchParams;
  const db = await getDemoDb();
  const businesses = (
    await db.query<BusinessRow>(
      "select id, name, slug, brand_key, plan, trial_plan, trial_started_at, trial_ends_at, professional_seats from public.businesses order by created_at",
    )
  ).rows;
  const user = await getSessionUser();
  const subscriptions = (
    await db.query<{
      name: string;
      status: string;
      billing_type: string;
      provider_subscription_id: string;
    }>(
      `select b.name, s.status, s.billing_type, s.provider_subscription_id
         from public.subscriptions s join public.businesses b on b.id = s.business_id
        where s.provider_subscription_id like 'sub_demo_%'
        order by s.updated_at desc`,
    )
  ).rows;
  const emails = listDemoEmails().slice(0, 40);
  const cron = typeof params.cron === "string" ? params.cron : null;
  const cronResult = typeof params.resultado === "string" ? params.resultado : null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold">Modo demonstração</h1>
        <p className="text-muted-foreground text-sm">
          Tudo roda neste computador: banco local, e-mails capturados aqui embaixo e fotos salvas em
          <code className="mx-1">.demo-data</code>. Nada é enviado para fora. Senha de todas as
          contas: <strong>{DEMO_PASSWORD}</strong>.
        </p>
        {user ? (
          <form action={demoSignOutAction} className="flex items-center gap-2 text-sm">
            <span>
              Conectado como <strong>{user.email}</strong>
            </span>
            <Button size="sm" variant="outline">
              Sair
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link href="/painel">Abrir painel</Link>
            </Button>
          </form>
        ) : null}
        {params.ok === "reset" ? (
          <p className="text-sm font-medium">Dados recriados do zero.</p>
        ) : null}
      </header>

      <Card id="cadastro">
        <CardHeader>
          <CardTitle>Cadastrar um negócio novo do zero</CardTitle>
          <CardDescription>
            Sai da conta atual e abre o cadastro na marca escolhida. Depois de criar a conta, o link
            de confirmação chega na caixa de e-mails desta página.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {BRANDS.map((brand) => (
            <form key={brand.key} action={demoStartSignUpAction}>
              <input type="hidden" name="brand" value={brand.key} />
              <Button size="sm">Cadastrar no {brand.name}</Button>
            </form>
          ))}
        </CardContent>
      </Card>

      <Card id="contas">
        <CardHeader>
          <CardTitle>Entrar como</CardTitle>
          <CardDescription>
            Um clique entra direto no painel da conta, na marca dela.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {DEMO_PERSONAS.map((persona) => (
            <form
              key={persona.email}
              action={demoSignInAction}
              className="flex flex-col gap-1 rounded-lg border p-3"
            >
              <input type="hidden" name="email" value={persona.email} />
              <span className="font-medium">{persona.label}</span>
              <span className="text-muted-foreground text-xs">{persona.email}</span>
              <span className="text-sm">{persona.description}</span>
              <Button size="sm" className="mt-2 self-start">
                Entrar
              </Button>
            </form>
          ))}
        </CardContent>
      </Card>

      <Card id="paginas">
        <CardHeader>
          <CardTitle>Páginas públicas</CardTitle>
          <CardDescription>
            O que o cliente final vê. Agende pelo chat e confira o e-mail chegando aqui embaixo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div className="flex flex-wrap gap-2">
            {BRANDS.map((brand) => (
              <Button key={brand.key} size="sm" variant="outline" asChild>
                <Link href={`/?brand=${brand.key}`}>Site de vendas · {brand.name}</Link>
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {BRANDS.map((brand) => (
              <Button key={brand.key} size="sm" variant="outline" asChild>
                <Link href={`/explorar?brand=${brand.key}`}>Portal · {brand.name}</Link>
              </Button>
            ))}
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {businesses.map((business) => (
              <li key={business.id} className="flex flex-wrap items-center gap-2">
                <Link
                  className="underline underline-offset-4"
                  href={`/${business.slug}?brand=${business.brand_key}`}
                >
                  {business.name}
                </Link>
                <Link
                  className="text-muted-foreground underline underline-offset-4"
                  href={`/${business.slug}/agendar?brand=${business.brand_key}`}
                >
                  chat
                </Link>
                <Badge variant="outline">{getBrand(business.brand_key)?.name}</Badge>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground">
            Modal para sites externos:{" "}
            <a className="underline underline-offset-4" href="/embed-teste.html?brand=beauty">
              página de teste do embed
            </a>
            .
          </p>
        </CardContent>
      </Card>

      <Card id="planos">
        <CardHeader>
          <CardTitle>Trocar situação da assinatura</CardTitle>
          <CardDescription>
            Muda na hora, sem cobrança. No Grátis (e em “Teste encerrado”), passando dos 10
            agendamentos do ciclo o chat termina no WhatsApp e as funções pagas ficam com cadeado.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {params.ok === "plano" ? <p className="text-sm font-medium">Situação alterada.</p> : null}
          {params.ok === "ciclo" ? (
            <p className="text-sm font-medium">Os 10 agendamentos do ciclo foram usados.</p>
          ) : null}
          {businesses.map((business) => {
            const current = planOption(business);
            return (
              <form
                key={business.id}
                action={demoSetPlanAction}
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                <input type="hidden" name="businessId" value={business.id} />
                <span className="min-w-44 font-medium">{business.name}</span>
                {PLAN_OPTIONS.map(([value, label]) => (
                  <Button
                    key={value}
                    name="plan"
                    value={value}
                    size="sm"
                    variant={current === value ? "default" : "outline"}
                  >
                    {label}
                  </Button>
                ))}
                <Button formAction={demoEnableDepositsAction} size="sm" variant="ghost">
                  Ligar sinal Pix
                </Button>
                <Button
                  formAction={demoFillFreeCycleAction}
                  size="sm"
                  variant="ghost"
                  title="Cria 10 agendamentos do chat no ciclo atual"
                >
                  Usar os 10 do Grátis
                </Button>
              </form>
            );
          })}
        </CardContent>
      </Card>

      <Card id="assinaturas">
        <CardHeader>
          <CardTitle>Pagamentos da assinatura (Asaas simulado)</CardTitle>
          <CardDescription>
            Assinaturas feitas pelo checkout do painel. “Confirmar pagamento” faz o que o Asaas
            faria em produção ao receber o Pix ou aprovar o cartão. Cartão terminado em 0000 é
            recusado.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {params.ok === "pagamento" ? (
            <p className="font-medium">Pagamento confirmado: a assinatura foi ativada.</p>
          ) : null}
          {subscriptions.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhuma ainda. Assine pelo painel (Assinatura) com Pix ou cartão.
            </p>
          ) : (
            subscriptions.map((sub) => (
              <form
                key={sub.provider_subscription_id}
                action={demoConfirmPaymentAction}
                className="flex flex-wrap items-center gap-2"
              >
                <input type="hidden" name="subscriptionId" value={sub.provider_subscription_id} />
                <span className="min-w-44 font-medium">{sub.name}</span>
                <Badge variant="outline">
                  {sub.billing_type === "pix" ? "Pix" : "Cartão"} · {sub.status}
                </Badge>
                <Button size="sm" variant="outline">
                  Confirmar pagamento
                </Button>
              </form>
            ))
          )}
        </CardContent>
      </Card>

      <Card id="tarefas">
        <CardHeader>
          <CardTitle>Tarefas agendadas</CardTitle>
          <CardDescription>
            Em produção rodam sozinhas (pg_cron). Aqui você dispara quando quiser; rodar duas vezes
            não envia nada em dobro.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <form action={demoExpireDepositHoldsAction}>
              <Button type="submit" size="sm" variant="outline">
                Vencer reservas de sinal
              </Button>
            </form>
            {CRON_JOBS.map((job) => (
              <form key={job} action={demoRunCronAction}>
                <input type="hidden" name="job" value={job} />
                <Button size="sm" variant="outline">
                  {CRON_LABELS[job]}
                </Button>
              </form>
            ))}
          </div>
          {cron && cronResult ? (
            <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
              {CRON_LABELS[cron as (typeof CRON_JOBS)[number]] ?? cron}: {cronResult}
            </pre>
          ) : null}
        </CardContent>
      </Card>

      <Card id="emails">
        <CardHeader>
          <CardTitle>Caixa de e-mails ({emails.length})</CardTitle>
          <CardDescription>
            Todo e-mail que o sistema enviaria. Os links funcionam (confirmar conta, cancelar,
            avaliar…).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {emails.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum e-mail ainda.</p>
          ) : (
            emails.map((email) => (
              <details key={email.id} className="rounded-lg border p-3 text-sm">
                <summary className="cursor-pointer">
                  <span className="font-medium">{email.subject}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · para {email.to.join(", ")} · {dateTime(email.sentAt)} ·{" "}
                    {getBrand(email.brandKey)?.name ?? email.brandKey}
                    {email.attachments.length > 0
                      ? ` · anexo: ${email.attachments.join(", ")}`
                      : ""}
                  </span>
                </summary>
                <iframe
                  title={email.subject}
                  className="mt-3 h-[32rem] w-full rounded-md border"
                  sandbox="allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
                  srcDoc={email.html.replace("<head>", '<head><base target="_top">')}
                />
              </details>
            ))
          )}
          <form action={demoClearEmailsAction}>
            <Button size="sm" variant="ghost">
              Limpar caixa
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card id="reset">
        <CardHeader>
          <CardTitle>Recomeçar</CardTitle>
          <CardDescription>
            Apaga banco, e-mails e fotos da demonstração e recria os dados de exemplo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={demoResetAction}>
            <Button variant="destructive">Apagar e recriar dados</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
