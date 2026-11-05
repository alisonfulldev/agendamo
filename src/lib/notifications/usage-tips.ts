import "server-only";

import { getNiche } from "@/brands";
import { brandUrl } from "@/brands/urls";
import type { Business } from "@/lib/db/types";
import { getPlanFeatures } from "@/lib/plans";
import { PROFILE_INDEX_RULES } from "@/lib/public/indexable";
import { createAdminClient } from "@/lib/supabase/admin";
import { LINK_BONUS_DAYS } from "@/lib/trial-bonus-shared";

import { claimNotification, notifyTeam } from "./owner";

const DAY = 86_400_000;
/** Below this, visit counts are never shown (rule 5). */
const MIN_SHOWN = 5;

/** What the tips look at, per business (counts only, no visitor data). */
export interface TipFacts {
  daysIn: number;
  daysLeft: number;
  customerViews: number;
  weekViews: number;
  chatBookings: number;
  pushOn: boolean;
  pushPossible: boolean;
  missing: string[];
  bonuses: number;
}

export type TipKey = "link" | "app" | "profile" | "share" | "week";

export interface Tip {
  key: TipKey;
  /** Day of the trial from which it can go. */
  day: number;
  /** Still worth sending (the owner has not done it yet). */
  due: (facts: TipFacts) => boolean;
}

/** The incentive sequence (2026-11-05), in order. At most one tip per business per day. */
export const TIPS: Tip[] = [
  { key: "link", day: 1, due: (f) => f.customerViews < MIN_SHOWN },
  { key: "app", day: 2, due: (f) => f.pushPossible && !f.pushOn },
  { key: "profile", day: 3, due: (f) => f.missing.length > 0 },
  { key: "share", day: 5, due: (f) => f.chatBookings === 0 },
  { key: "week", day: 7, due: () => true },
];

/** The next tip for a business (first one due and not sent), or null. */
export function nextTip(facts: TipFacts, sent: ReadonlySet<TipKey>): Tip | null {
  // The last days belong to the trial notices (day 10, 13 and 14).
  if (facts.daysLeft <= 5) return null;
  return TIPS.find((t) => facts.daysIn >= t.day && !sent.has(t.key) && t.due(facts)) ?? null;
}

interface TipCopy {
  subject: string;
  heading: string;
  paragraphs: string[];
  cta: { label: string; url: string };
  push: string;
}

/** Text of each tip, in the niche's words ("clientes", "pacientes", "alunos"). */
export function tipCopy(
  key: TipKey,
  facts: TipFacts,
  ctx: { customers: string; link: string },
): TipCopy {
  const bonusLeft = 2 - facts.bonuses;
  switch (key) {
    case "link":
      return {
        subject: `Seu link está pronto: coloque onde seus ${ctx.customers} já estão`,
        heading: "Seu link de agendamento está pronto",
        paragraphs: [
          `Agora falta os ${ctx.customers} acharem ele. Os dois lugares que mais trazem agendamentos são a bio do Instagram e a mensagem de saudação do WhatsApp Business.`,
          `Seu link: ${ctx.link}`,
          ...(bonusLeft > 0
            ? [
                `E tem bônus: quando a primeira visita chegar por cada um desses links, seu teste ganha +${LINK_BONUS_DAYS} dias. Os links certos, prontos para copiar, estão no Início do painel.`,
              ]
            : []),
        ],
        cta: { label: "Pegar meus links", url: "/painel" },
        push: "Coloque seu link na bio e na saudação do WhatsApp e ganhe dias de teste.",
      };
    case "app":
      return {
        subject: "Saiba na hora quando alguém agendar",
        heading: "Instale o app e ative os avisos",
        paragraphs: [
          `Com o app no celular, você recebe um aviso a cada agendamento, cancelamento e remarcação, sem precisar abrir o painel. É o jeito de não perder nenhum dos seus ${ctx.customers}.`,
          "No celular, abra o painel: ele mostra como instalar (leva 10 segundos). Depois, toque em “Ativar avisos”.",
        ],
        cta: { label: "Abrir o painel no celular", url: "/painel" },
        push: "Ative os avisos para saber na hora quando alguém agendar.",
      };
    case "profile":
      return {
        subject: "Falta pouco para o seu perfil e o seu site ficarem completos",
        heading: "Complete seu perfil e seu site",
        paragraphs: [
          `Perfil completo passa confiança e aparece no Google. Para os seus ${ctx.customers}, é a diferença entre agendar ou não.`,
          `O que falta: ${facts.missing.join(", ")}.`,
        ],
        cta: { label: "Completar agora", url: "/painel/pagina" },
        push: `Falta pouco: ${facts.missing[0]}.`,
      };
    case "share":
      return {
        subject: `Mande seu link para 5 ${ctx.customers} hoje`,
        heading: `Mande seu link para 5 ${ctx.customers}`,
        paragraphs: [
          "O jeito mais rápido de ver o primeiro agendamento chegar: mandar o link para quem já é seu cliente.",
          `Copie e mande no WhatsApp: “Oi! Agora você pode marcar seu horário comigo por aqui, a qualquer hora: ${ctx.link}”`,
          "No Início do painel também tem os horários livres de hoje, prontos para postar no status.",
        ],
        cta: { label: "Abrir meu painel", url: "/painel" },
        push: `Mande seu link para 5 ${ctx.customers} e veja o primeiro agendamento chegar.`,
      };
    case "week":
      return {
        subject: "Sua primeira semana no MeetChat",
        heading: "Sua primeira semana",
        paragraphs: [
          facts.weekViews >= MIN_SHOWN
            ? `Seu link teve ${facts.weekViews} visitas nesta semana.`
            : "Seu link ainda está começando.",
          facts.chatBookings > 0
            ? `E já chegaram ${facts.chatBookings} agendamentos pelo chat. Quanto mais o link aparecer, mais agendamentos chegam sozinhos.`
            : "Dica que funciona: poste seus horários livres no status do WhatsApp e nos stories, com o link. O Início do painel monta o texto para você.",
        ],
        cta: { label: "Abrir meu painel", url: "/painel" },
        push:
          facts.weekViews >= MIN_SHOWN
            ? `Seu link teve ${facts.weekViews} visitas nesta semana.`
            : "Poste seus horários livres no status com o seu link.",
      };
  }
}

/** Gathers the facts of each business in one pass (counts only). */
async function factsOf(businesses: Business[], now: number): Promise<Map<string, TipFacts>> {
  const admin = createAdminClient();
  const ids = businesses.map((b) => b.id);
  const weekAgo = new Date(now - 7 * DAY).toISOString();
  const [pages, services, views, appts, members, logs] = await Promise.all([
    admin.from("page_settings").select("business_id, avatar_key, bio, city").in("business_id", ids),
    admin
      .from("services")
      .select("business_id")
      .in("business_id", ids)
      .eq("active", true)
      .gt("price_cents", 0),
    admin
      .from("page_events")
      .select("business_id, created_at")
      .in("business_id", ids)
      .eq("type", "view")
      .limit(50_000),
    admin.from("appointments").select("business_id").in("business_id", ids).eq("source", "chat"),
    admin.from("members").select("business_id, user_id").in("business_id", ids),
    admin
      .from("notification_log")
      .select("business_id, type")
      .in("business_id", ids)
      .in("type", ["bonus_bio", "bonus_saudacao"]),
  ]);
  const userIds = [...new Set((members.data ?? []).map((m) => m.user_id as string))];
  const { data: subs } = userIds.length
    ? await admin.from("push_subscriptions").select("user_id").in("user_id", userIds)
    : { data: [] };
  const withPush = new Set((subs ?? []).map((s) => s.user_id as string));

  const count = (rows: { business_id: unknown }[] | null, id: string) =>
    (rows ?? []).filter((r) => r.business_id === id).length;
  const pushPossible = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);

  const result = new Map<string, TipFacts>();
  for (const business of businesses) {
    const page = (pages.data ?? []).find((p) => p.business_id === business.id);
    const businessViews = (views.data ?? []).filter((v) => v.business_id === business.id);
    const priced = count(services.data, business.id);
    const missing = [
      ...(page?.avatar_key ? [] : ["foto do perfil"]),
      ...((page?.bio?.length ?? 0) >= PROFILE_INDEX_RULES.minBioLength
        ? []
        : ["descrição do negócio"]),
      ...(page?.city ? [] : ["cidade"]),
      ...(priced >= PROFILE_INDEX_RULES.minPricedServices
        ? []
        : [`${PROFILE_INDEX_RULES.minPricedServices} serviços com preço (tem ${priced})`]),
    ];
    const started = new Date(business.trial_started_at ?? business.created_at).getTime();
    result.set(business.id, {
      daysIn: Math.floor((now - started) / DAY),
      daysLeft: (new Date(business.trial_ends_at!).getTime() - now) / DAY,
      customerViews: businessViews.length,
      weekViews: businessViews.filter((v) => (v.created_at as string) >= weekAgo).length,
      chatBookings: count(appts.data, business.id),
      pushOn: (members.data ?? []).some(
        (m) => m.business_id === business.id && withPush.has(m.user_id as string),
      ),
      pushPossible,
      missing,
      bonuses: count(logs.data, business.id),
    });
  }
  return result;
}

/**
 * Incentive e-mails and push during the trial (2026-11-05, "Novidades e dicas", with one-click
 * opt-out): link in the bio and greeting, the app and its notices, a complete profile, sharing the
 * link, the first week. Each tip once per business and only while still useful; at most one per
 * business per run (accounts already in the trial pick up from where they are). Idempotent.
 */
export async function sendUsageTips(now = Date.now()): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("businesses")
    .select("*")
    .eq("plan", "free")
    .is("suspended_at", null)
    .gt("trial_ends_at", new Date(now).toISOString());
  if (error) throw new Error(error.message);
  const businesses = ((data ?? []) as Business[]).filter((b) => getPlanFeatures(b).trialActive);
  if (businesses.length === 0) return 0;

  const facts = await factsOf(businesses, now);
  const { data: sentRows } = await admin
    .from("notification_log")
    .select("business_id, type")
    .in(
      "business_id",
      businesses.map((b) => b.id),
    )
    .like("type", "tip_%");

  let sent = 0;
  for (const business of businesses) {
    const f = facts.get(business.id)!;
    const done = new Set(
      (sentRows ?? [])
        .filter((r) => r.business_id === business.id)
        .map((r) => (r.type as string).slice(4) as TipKey),
    );
    const tip = nextTip(f, done);
    if (!tip) continue;
    if (!(await claimNotification(business.id, `tip_${tip.key}`, "1"))) continue;
    const brand = getNiche(business.brand_key);
    const copy = tipCopy(tip.key, f, {
      customers: brand.terms.customer.plural,
      link: brandUrl(brand, `/${business.slug}`),
    });
    await notifyTeam({
      businessId: business.id,
      type: "news",
      subject: copy.subject,
      content: { heading: copy.heading, paragraphs: copy.paragraphs, cta: copy.cta },
      push: { title: copy.subject, body: copy.push, url: copy.cta.url },
    });
    sent++;
  }
  return sent;
}
