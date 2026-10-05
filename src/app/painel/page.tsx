import { CalendarClock, CheckCircle2, Circle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { brandUrl } from "@/brands/urls";
import { CopyLink } from "@/components/panel/copy-link";
import { CopyTextButton } from "@/components/panel/copy-text-button";
import { InstallGuide } from "@/components/panel/install-guide";
import { PageHeader } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { todayIn } from "@/lib/availability";
import { loadCatalog } from "@/lib/booking/data";
import { freeTimesOn } from "@/lib/booking/free-times";
import { requireBusiness } from "@/lib/business/context";
import { getPlanFeatures, PLAN_STATUS_LABELS } from "@/lib/plans";
import { freeSlotsMessage, listTimes } from "@/lib/sales/free-slots";
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
        label: "Coloque o link na bio",
        hint: "Instagram, TikTok, status do WhatsApp. Marca sozinho com a primeira visita.",
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

  // Free times left today: the fastest way to fill them is posting them right now.
  let todayTimes: string[] = [];
  if (isOwner && features.salesTools) {
    const catalog = await loadCatalog(business.id);
    if (catalog) todayTimes = await freeTimesOn(catalog, todayIn(business.timezone, new Date()));
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
        description={
          features.trialActive
            ? `Teste grátis: faltam ${features.trialDaysLeft} dias`
            : PLAN_STATUS_LABELS[features.status]
        }
      />
      {senha === "alterada" ? (
        <p role="status" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          Senha alterada com sucesso.
        </p>
      ) : null}

      <div className="rounded-xl border bg-card p-5">
        <p className="font-medium">Seu link de agendamento</p>
        <p className="mb-2 text-sm text-muted-foreground">
          Abre direto no chat. Cole na bio do Instagram, no Google e nos botões do seu site.
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
