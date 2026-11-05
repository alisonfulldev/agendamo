import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import { ChevronRight, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { businessUrl } from "@/brands/urls";
import { CopyLink } from "@/components/panel/copy-link";
import { CopyTextButton } from "@/components/panel/copy-text-button";
import { PageHeader } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { localToUtc, todayIn } from "@/lib/availability";
import { loadCatalog } from "@/lib/booking/data";
import { freeTimesOn } from "@/lib/booking/free-times";
import { requireBusiness } from "@/lib/business/context";
import { trialCounter } from "@/lib/plan-text";
import { getPlanFeatures, planLabel, SITE_PLAN_NAME, SITE_PRICE_TEXT } from "@/lib/plans";
import { QR_PNG_DOWNLOAD_URL, SITE_QR_PNG_DOWNLOAD_URL } from "@/lib/qr";
import { freeSlotsMessage, listTimes } from "@/lib/sales/free-slots";
import { TOUR_TEXT } from "@/content/tour";
import { ACTIVE_APPOINTMENT_STATUSES } from "@/lib/db/types";
import { depositSetup, type DepositSetupService } from "@/lib/deposits/setup";
import { getLiveDomain } from "@/lib/public/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { earnedBonuses } from "@/lib/trial-bonus";
import { LINK_BONUS_DAYS, LINK_BONUS_PARAM } from "@/lib/trial-bonus-shared";

import { NextStepCard, type HomeStep } from "./next-step";

export const metadata: Metadata = { title: "Início" };

interface Attention {
  href: string;
  title: string;
  text: string;
  action: string;
}

interface TodayAppointment {
  id: string;
  starts_at: string;
  status: string;
  customer: { name: string } | null;
  appointment_services: { name: string; position: number }[];
}

/**
 * Início (cleaned up on 2026-11-05): what needs the owner now, today's agenda, one next step and
 * the two links. Everything else lives in the menu.
 */
export default async function PanelHomePage({ searchParams }: PageProps<"/painel">) {
  const { business, brand, user, isOwner } = await requireBusiness();
  const { senha } = await searchParams;
  const pageUrl = businessUrl(brand, `/${business.slug}`);
  // The own domain once live (sold with the plan), else the MeetChat address.
  const liveDomain = await getLiveDomain(business.slug, business.id);
  const siteUrl = liveDomain
    ? `https://${liveDomain}/`
    : businessUrl(brand, `/${business.slug}/site`);
  const features = getPlanFeatures(business);
  const admin = createAdminClient();
  const tz = business.timezone;
  const today = todayIn(tz, new Date());
  const dayStart = localToUtc(today, "00:00", tz).toISOString();
  const dayEnd = localToUtc(today, "24:00", tz).toISOString();

  // Today's agenda through the user's own access (staff see what the agenda shows them).
  const { data: todayRows } = await (
    await createClient()
  )
    .from("appointments")
    .select("id, starts_at, status, customer:customers(name), appointment_services(name, position)")
    .eq("business_id", business.id)
    .in("status", ACTIVE_APPOINTMENT_STATUSES)
    .gte("starts_at", dayStart)
    .lt("starts_at", dayEnd)
    .order("starts_at");
  const todayList = (todayRows ?? []) as unknown as TodayAppointment[];

  // What needs the owner now.
  const attention: Attention[] = [];
  let steps: HomeStep[] = [];
  let todayTimes: string[] = [];
  if (isOwner) {
    const [receipts, requests, pendingApproval, pix, services] = await Promise.all([
      admin
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id)
        .eq("deposit_status", "sent"),
      admin
        .from("booking_requests")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id)
        .eq("status", "new"),
      admin
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id)
        .eq("status", "pending")
        .gte("starts_at", new Date().toISOString()),
      features.deposits
        ? admin.from("page_settings").select("pix_key").eq("business_id", business.id).maybeSingle()
        : Promise.resolve({ data: null }),
      features.deposits
        ? admin
            .from("services")
            .select("name, active, price_cents, deposit_type")
            .eq("business_id", business.id)
        : Promise.resolve({ data: null }),
    ]);
    const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
    if (receipts.count) {
      attention.push({
        href: "/painel/sinais",
        title: `${receipts.count} ${plural(receipts.count, "Pix para conferir", "Pix para conferir")}`,
        text: "Procure o valor no seu extrato e confirme. Até lá, o horário fica reservado.",
        action: "Conferir",
      });
    }
    if (pendingApproval.count) {
      attention.push({
        href: "/painel/agenda",
        title: `${pendingApproval.count} ${plural(pendingApproval.count, "agendamento para aprovar", "agendamentos para aprovar")}`,
        text: "Confirme ou recuse na agenda. O cliente recebe a resposta por e-mail.",
        action: "Ver",
      });
    }
    if (requests.count) {
      attention.push({
        href: "/painel/pedidos",
        title: `${requests.count} ${plural(requests.count, "pedido de horário novo", "pedidos de horário novos")}`,
        text: "Pessoas que pediram horário pelo seu link. Responda pelo WhatsApp.",
        action: "Ver",
      });
    }
    if (features.deposits) {
      const setup = depositSetup(
        (pix.data?.pix_key as string | null) ?? null,
        (services.data ?? []) as DepositSetupService[],
      );
      if (setup.started && (!setup.ready || setup.zeroPrice.length)) {
        attention.push({
          href: "/painel/configuracoes#sinal",
          title: `Sinal pelo Pix: ${setup.missing.length === 1 ? "falta 1 passo" : `faltam ${setup.missing.length} passos`}`,
          text: setup.missing[0] ?? "",
          action: "Configurar",
        });
      }
    }

    // Steps computed from real data, so they tick themselves.
    const [page, photos, views, push, qr, bonuses] = await Promise.all([
      admin
        .from("page_settings")
        .select("bio, avatar_key")
        .eq("business_id", business.id)
        .maybeSingle(),
      admin
        .from("page_photos")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id)
        .eq("hidden", false),
      admin
        .from("page_events")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id)
        .eq("type", "view"),
      admin
        .from("push_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      admin
        .from("notification_log")
        .select("id")
        .eq("business_id", business.id)
        .eq("type", "checklist_qr")
        .maybeSingle(),
      features.trialActive ? earnedBonuses(business.id) : Promise.resolve(null),
    ]);
    const greeting = `Olá! Que bom falar com você 😊 Para agendar com ${business.name}, escolha o serviço e um horário livre aqui: ${pageUrl}?${LINK_BONUS_PARAM}=saudacao`;
    steps = [
      {
        id: "profile",
        done: Boolean(page.data?.bio && page.data?.avatar_key),
        label: "Complete seu perfil",
        hint: "Foto e uma descrição do seu negócio: é o que passa confiança para marcar.",
        action: { href: "/painel/pagina", label: "Completar perfil" },
      },
      {
        id: "app",
        done: (push.count ?? 0) > 0,
        label: "Ative os avisos no celular",
        hint: "Saiba na hora quando alguém agendar, cancelar ou remarcar.",
        action: { href: "/painel/notificacoes", label: "Ativar avisos" },
      },
      ...(bonuses
        ? ([
            {
              id: "bio",
              done: bonuses.has("bio"),
              label: "Coloque o link na bio do Instagram",
              hint: "No Instagram: Editar perfil › Links › Adicionar link externo. Quando o primeiro cliente chegar por ele, seu teste ganha mais dias.",
              badge: `+${LINK_BONUS_DAYS} dias`,
              action: { copy: `${pageUrl}?${LINK_BONUS_PARAM}=bio`, label: "Copiar link da bio" },
            },
            {
              id: "greeting",
              done: bonuses.has("saudacao"),
              label: "Coloque o link na saudação do WhatsApp",
              hint: "No WhatsApp Business: Ferramentas comerciais › Mensagem de saudação. Ative e cole o texto abaixo.",
              badge: `+${LINK_BONUS_DAYS} dias`,
              action: { copy: greeting, label: "Copiar saudação" },
            },
          ] satisfies HomeStep[])
        : ([
            {
              id: "share",
              done: (views.count ?? 0) > 0,
              label: "Divulgue seu link",
              hint: "Na bio do Instagram, no WhatsApp Business e no seu Perfil da Empresa no Google. Marca sozinho quando um cliente abrir.",
              action: { copy: pageUrl, label: "Copiar link" },
            },
          ] satisfies HomeStep[])),
      {
        id: "photos",
        done: (photos.count ?? 0) >= 3,
        label: "Mostre seus trabalhos",
        hint: "Pelo menos 3 fotos: aparecem no perfil e no site.",
        action: { href: "/painel/pagina", label: "Adicionar fotos" },
      },
      {
        id: "qr",
        done: Boolean(qr.data),
        label: "Baixe seu QR code",
        hint: "Para o balcão, o cartão ou o espelho.",
        action: { href: QR_PNG_DOWNLOAD_URL, label: "Baixar QR code", download: true },
      },
    ];

    // Free times left today: only once the day already has a booking (with an empty agenda every
    // time is free, and "only N left" would read as an almost full agenda).
    if (features.salesTools && todayList.length > 0) {
      const catalog = await loadCatalog(business.id);
      if (catalog) todayTimes = await freeTimesOn(catalog, today);
    }
  }
  const todayText = freeSlotsMessage({
    businessName: business.name,
    day: "hoje",
    times: todayTimes,
    url: pageUrl,
  });
  const dayLabel = formatInTimeZone(new Date(), tz, "EEEE, d 'de' MMMM", { locale: ptBR });
  const serviceOf = (a: TodayAppointment) =>
    [...a.appointment_services].sort((x, y) => x.position - y.position)[0]?.name ?? "";
  const shown = todayList.slice(0, 6);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={`Olá, ${business.name}!`}
        description={features.trialActive ? trialCounter(features) : planLabel(features)}
        actions={
          isOwner ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/painel?tour=1">
                <Sparkles aria-hidden />
                {TOUR_TEXT.replay}
              </Link>
            </Button>
          ) : null
        }
      />
      {senha === "alterada" ? (
        <p role="status" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          Senha alterada com sucesso.
        </p>
      ) : null}

      {attention.length ? (
        <section
          aria-labelledby="precisa"
          className="overflow-hidden rounded-xl border-2 border-primary/50 bg-card"
        >
          <h2 id="precisa" className="bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
            Precisa de você
          </h2>
          <ul className="divide-y">
            {attention.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="flex items-center gap-3 px-4 py-3 hover:bg-muted">
                  <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{item.title}</span>
                    <span className="block text-sm text-muted-foreground">{item.text}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-primary">
                    {item.action}
                    <ChevronRight className="size-4" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="hoje" className="rounded-xl border bg-card p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="hoje" className="font-semibold first-letter:uppercase">
            {dayLabel}
          </h2>
          <Link href="/painel/agenda" className="text-sm font-medium text-primary">
            Ver agenda
          </Link>
        </div>
        {shown.length ? (
          <ul className="mt-3 divide-y">
            {shown.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2.5">
                <span className="w-12 shrink-0 font-semibold tabular-nums">
                  {formatInTimeZone(new Date(a.starts_at), tz, "HH:mm")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{a.customer?.name ?? "—"}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {serviceOf(a)}
                  </span>
                </span>
                {a.status === "pending" || a.status === "awaiting_deposit" ? (
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {a.status === "pending" ? "Aprovar" : "Aguardando Pix"}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Nenhum horário marcado para hoje.</p>
        )}
        {todayList.length > shown.length ? (
          <Link
            href="/painel/agenda"
            className="mt-1 flex items-center gap-1 text-sm font-medium text-primary"
          >
            e mais {todayList.length - shown.length} <ChevronRight className="size-4" aria-hidden />
          </Link>
        ) : null}
        {todayText ? (
          <div className="mt-4 rounded-lg bg-muted p-4">
            <p className="text-sm">
              <span className="font-semibold">
                Ainda tem {todayTimes.length}{" "}
                {todayTimes.length === 1 ? "horário livre" : "horários livres"}:
              </span>{" "}
              {listTimes(todayTimes)}. Poste no status do WhatsApp ou nos stories para preencher.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyTextButton text={todayText} label="Copiar texto pro status" />
              <Button asChild variant="ghost">
                <Link href="/painel/vendas/artes?tipo=horarios-hoje">Criar arte</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {isOwner ? <NextStepCard steps={steps} /> : null}

      <section aria-labelledby="links" className="rounded-xl border bg-card p-5">
        <h2 id="links" className="font-semibold">
          Seus links
        </h2>
        <div className="mt-3 flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium">Agendamento (chat)</p>
            <p className="mb-1.5 text-xs text-muted-foreground">
              Para WhatsApp, Instagram, Google e onde os clientes estiverem.
            </p>
            <CopyLink url={pageUrl} />
          </div>
          {features.site ? (
            <div className="border-t pt-4">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-medium">Seu site</p>
                {isOwner ? (
                  <Link href="/painel/site" className="text-sm font-medium text-primary">
                    Editar site
                  </Link>
                ) : null}
              </div>
              <p className="mb-1.5 text-xs text-muted-foreground">
                Página completa do seu negócio, feita para o Google.
                {features.trialActive ? ` Incluso no teste e no plano ${SITE_PLAN_NAME}.` : ""}
              </p>
              <CopyLink url={siteUrl} qrHref={SITE_QR_PNG_DOWNLOAD_URL} tour={false} />
            </div>
          ) : isOwner ? (
            <Link
              href="/painel/plano#assinar"
              className="flex items-center gap-3 border-t pt-4 text-sm hover:text-primary"
            >
              <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
              <span className="flex-1">
                Tenha também o seu site: plano {SITE_PLAN_NAME} ({SITE_PRICE_TEXT.monthly})
              </span>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
