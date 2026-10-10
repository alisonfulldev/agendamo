import { CalendarClock, CheckCircle2, Circle, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { brandUrl } from "@/brands/urls";
import { CopyLink } from "@/components/panel/copy-link";
import { CopyTextButton } from "@/components/panel/copy-text-button";
import { InstallGuide } from "@/components/panel/install-guide";
import { PageHeader } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { localToUtc, todayIn } from "@/lib/availability";
import { loadCatalog } from "@/lib/booking/data";
import { freeTimesOn } from "@/lib/booking/free-times";
import { requireBusiness } from "@/lib/business/context";
import { getBookingAllowance } from "@/lib/plan-usage";
import { allowanceText, renewsText, trialCounter } from "@/lib/plan-text";
import { getPlanFeatures, planLabel } from "@/lib/plans";
import { freeSlotsMessage, listTimes } from "@/lib/sales/free-slots";
import { TOUR_TEXT } from "@/content/tour";
import { ACTIVE_APPOINTMENT_STATUSES } from "@/lib/db/types";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Início" };

interface Step {
  done: boolean;
  label: string;
  hint: string;
  href: string;
}

export default async function PanelHomePage({ searchParams }: PageProps<"/painel">) {
  const { business, brand, user, isOwner } = await requireBusiness();
  const { senha } = await searchParams;
  const pageUrl = brandUrl(brand, `/${business.slug}`);
  const features = getPlanFeatures(business);

  let steps: Step[] = [];
  if (isOwner) {
    // Checklist is computed from real data, so it ticks itself.
    const admin = createAdminClient();
    const [page, photos, views, push, qr] = await Promise.all([
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
    ]);
    steps = [
      {
        done: Boolean(page.data?.bio && page.data?.avatar_key),
        label: "Complete seu perfil",
        hint: "Foto de perfil e bio.",
        href: "/painel/pagina",
      },
      {
        done: (photos.count ?? 0) >= 3,
        label: "Mostre seus trabalhos",
        hint: "Adicione pelo menos 3 fotos.",
        href: "/painel/pagina",
      },
      {
        done: (views.count ?? 0) > 0,
        label: "Divulgue seu link",
        hint: "WhatsApp, Instagram, Facebook, botões do seu site… Marca sozinho quando alguém abrir seu link (suas visitas não contam).",
        href: "/painel/pagina",
      },
      {
        done: (push.count ?? 0) > 0,
        label: "Ative as notificações",
        hint: "Receba avisos no celular.",
        href: "/painel/notificacoes",
      },
      {
        done: Boolean(qr.data),
        label: "Baixe seu QR code",
        hint: "Para o balcão, cartão ou espelho.",
        href: "/painel/pagina",
      },
    ];
  }
  const doneCount = steps.filter((s) => s.done).length;
  const allowance = await getBookingAllowance(business);
  const { count: receiptsToCheck = 0 } = isOwner
    ? await createAdminClient()
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id)
        .eq("deposit_status", "sent")
    : { count: 0 };

  // Free times left today: the fastest way to fill them is posting them right now. Only once the
  // day already has a booking: with an empty agenda (a new business) every time is free, and "only
  // N left" would read as an almost full agenda.
  let todayTimes: string[] = [];
  if (isOwner && features.salesTools) {
    const today = todayIn(business.timezone, new Date());
    const { count } = await createAdminClient()
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .in("status", ACTIVE_APPOINTMENT_STATUSES)
      .gte("starts_at", localToUtc(today, "00:00", business.timezone).toISOString())
      .lt("starts_at", localToUtc(today, "24:00", business.timezone).toISOString());
    const catalog = (count ?? 0) > 0 ? await loadCatalog(business.id) : null;
    if (catalog) todayTimes = await freeTimesOn(catalog, today);
  }
  const todayText = freeSlotsMessage({
    businessName: business.name,
    day: "hoje",
    times: todayTimes,
    url: pageUrl,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Olá, ${business.name}!`}
        description={features.trialActive ? trialCounter(features) : planLabel(features)}
        actions={
          isOwner ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/painel?tour=1">
                <Sparkles aria-hidden />
                {TOUR_TEXT.replay}
              </Link>
            </Button>
          ) : null
        }
      />
      {(receiptsToCheck ?? 0) > 0 && isOwner ? (
        <Link
          href="/painel/sinais"
          className="flex items-center justify-between gap-3 rounded-xl border-2 border-primary bg-primary/5 p-5"
        >
          <span>
            <span className="block font-semibold">
              {receiptsToCheck === 1
                ? "1 comprovante de Pix para conferir"
                : `${receiptsToCheck} comprovantes de Pix para conferir`}
            </span>
            <span className="block text-sm text-muted-foreground">
              Confira no seu banco e confirme. Até lá, o horário fica pré-confirmado.
            </span>
          </span>
          <span className="font-medium text-primary">Conferir</span>
        </Link>
      ) : null}
      {allowance.limited && isOwner ? (
        <section
          aria-labelledby="plano-gratis"
          className="flex flex-col gap-3 rounded-xl border bg-card p-5"
        >
          <div>
            <h2 id="plano-gratis" className="font-semibold">
              Plano Grátis: {allowanceText(allowance)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {allowance.remaining > 0
                ? `O limite ${renewsText(allowance)}. Depois dos ${allowance.limit}, os pedidos chegam pelo seu WhatsApp.`
                : `Limite atingido: até o limite renovar (${renewsText(allowance).replace("renova em ", "")}), seu chat passa os pedidos para o seu WhatsApp.`}
            </p>
          </div>
          <Progress
            value={(allowance.used / allowance.limit) * 100}
            aria-label="Uso do plano Grátis"
          />
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/painel/plano">Agendamentos ilimitados</Link>
            </Button>
            {features.trialAvailable ? (
              <Button asChild variant="outline">
                <Link href="/painel/plano#teste">Testar 7 dias grátis</Link>
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}
      {senha === "alterada" ? (
        <p role="status" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          Senha alterada com sucesso.
        </p>
      ) : null}

      <div className="rounded-xl border bg-card p-5">
        <p className="font-medium">Seu link de agendamento</p>
        <p className="mb-2 text-sm text-muted-foreground">
          Abre direto no chat. Divulgue no WhatsApp, Instagram, Facebook, Google e nos botões do seu
          site.
        </p>
        <CopyLink url={pageUrl} />
      </div>

      {todayText ? (
        <section
          aria-labelledby="horarios-hoje"
          className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-card p-5"
        >
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 id="horarios-hoje" className="font-semibold">
                Hoje ainda tem {todayTimes.length}{" "}
                {todayTimes.length === 1 ? "horário livre" : "horários livres"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {listTimes(todayTimes)}. Poste agora no status do WhatsApp ou nos stories para
                preencher.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/painel/vendas/artes?tipo=horarios-hoje">Criar arte</Link>
            </Button>
            <CopyTextButton text={todayText} label="Copiar texto pro status" />
          </div>
        </section>
      ) : null}

      {isOwner && doneCount < steps.length ? (
        <section aria-labelledby="primeiros-passos" className="rounded-xl border bg-card p-5">
          <h2 id="primeiros-passos" className="text-lg font-semibold">
            Primeiros passos
          </h2>
          <p className="text-sm text-muted-foreground">
            {doneCount} de {steps.length} concluídos
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {steps.map((step) => (
              <li key={step.label}>
                <Link
                  href={step.href}
                  className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted"
                >
                  {step.done ? (
                    <CheckCircle2
                      className="mt-0.5 size-5 shrink-0 text-primary"
                      aria-label="Concluído"
                    />
                  ) : (
                    <Circle
                      className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                      aria-label="Pendente"
                    />
                  )}
                  <span>
                    <span
                      className={`font-medium ${step.done ? "text-muted-foreground line-through" : ""}`}
                    >
                      {step.label}
                    </span>
                    <span className="block text-sm text-muted-foreground">{step.hint}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <InstallGuide brandName={brand.name} />
    </div>
  );
}
