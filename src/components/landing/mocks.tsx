import { Bell, CalendarClock, Link2, Mail } from "lucide-react";

import type { MockVisual, PhoneMock } from "@/content/copy/landing";

/**
 * Static mocks of the product for the landing pages (server components, no JavaScript): the bio
 * with the link, the owner's notification, the reminder e-mail (same texts as the real one in
 * src/lib/booking/notify.ts) and the day agenda with a cancelled slot coming back. All marked
 * as examples; no real data.
 */
export function MockVisualFor({ visual, mock }: { visual: MockVisual; mock: PhoneMock }) {
  switch (visual) {
    case "bio":
      return <BioMock mock={mock} />;
    case "notification":
      return <NotificationMock mock={mock} />;
    case "reminder":
      return <ReminderMock mock={mock} />;
    case "agenda":
      return <AgendaMock mock={mock} />;
  }
}

const frame = "lp-shadow w-full max-w-[340px] rounded-3xl border bg-card text-card-foreground";
const exampleTag = (
  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-800">
    exemplo
  </span>
);

/** A social profile (no third-party branding) with the booking link in the bio. */
function BioMock({ mock }: { mock: PhoneMock }) {
  return (
    <figure
      className={`${frame} p-5`}
      aria-label="Exemplo: perfil com o link de agendamento na bio"
    >
      <div className="flex items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand-400 to-brand-700 p-[3px]">
          <span className="flex size-full items-center justify-center rounded-full bg-card font-heading text-xl font-semibold">
            {mock.business.charAt(0)}
          </span>
        </span>
        <div className="grid flex-1 grid-cols-3 text-center text-xs text-muted-foreground">
          <span>
            <b className="block text-base text-foreground">—</b>posts
          </span>
          <span>
            <b className="block text-base text-foreground">—</b>seguidores
          </span>
          <span>
            <b className="block text-base text-foreground">—</b>seguindo
          </span>
        </div>
      </div>
      <figcaption className="mt-3 text-sm">
        <span className="flex items-center gap-2 font-semibold">
          {mock.business} {exampleTag}
        </span>
        <span className="block text-muted-foreground">@{mock.handle}</span>
        <span className="mt-1 block">{mock.bio}</span>
        <span className="mt-1 block">📅 Agende pelo link 👇</span>
        <span className="mt-1.5 flex items-center gap-1.5 font-semibold text-primary">
          <Link2 className="size-4" aria-hidden />
          meetchat.com.br/{mock.slug}
        </span>
      </figcaption>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-semibold">
        <span className="flex h-9 items-center justify-center rounded-xl bg-muted">Seguir</span>
        <span className="flex h-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          Agendar
        </span>
      </div>
    </figure>
  );
}

/** The owner's phone notification of a booking made at night. */
function NotificationMock({ mock }: { mock: PhoneMock }) {
  const service = mock.services[mock.services.length - 1]!.name;
  return (
    <figure
      className="relative w-full max-w-[340px]"
      aria-label="Exemplo: aviso no celular de um agendamento feito à noite"
    >
      <div className="rounded-[2rem] bg-foreground/90 px-4 pt-6 pb-28 text-background">
        <p className="text-center font-heading text-5xl font-semibold tabular-nums">23:12</p>
        <p className="text-center text-sm opacity-75">Quinta-feira</p>
      </div>
      <figcaption className={`${frame} lp-reveal absolute inset-x-3 -bottom-6 w-auto p-4 text-sm`}>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <Bell className="size-3.5 text-primary" aria-hidden /> MeetChat · agora {exampleTag}
        </span>
        <span className="mt-1.5 block font-semibold">Novo agendamento</span>
        <span className="block text-muted-foreground">
          {mock.customer} marcou {service}
          {mock.professionals.length > 1 ? ` com ${mock.professionals[0]}` : ""} para sábado às{" "}
          <span className="tabular-nums">10:00</span>.
        </span>
      </figcaption>
    </figure>
  );
}

/** The reminder e-mail the customer gets the day before (texts of the real e-mail). */
function ReminderMock({ mock }: { mock: PhoneMock }) {
  const service = mock.services[0]!.name;
  return (
    <figure className={`${frame} overflow-hidden`} aria-label="Exemplo: e-mail de lembrete">
      <div className="flex items-center gap-2 border-b bg-muted px-4 py-3 text-xs text-muted-foreground">
        <Mail className="size-4" aria-hidden />
        <span className="min-w-0 flex-1 truncate">
          Lembrete: {service} amanhã · {mock.business}
        </span>
        {exampleTag}
      </div>
      <figcaption className="p-5 text-sm">
        <span className="block font-heading text-xl font-semibold">
          Até amanhã, {mock.customer}!
        </span>
        <span className="mt-2 block text-muted-foreground">
          Passando para lembrar do seu horário.
        </span>
        <span className="mt-3 flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5">
          <CalendarClock className="size-4 text-primary" aria-hidden />
          {service} · sábado, <span className="tabular-nums">10:00</span>
        </span>
        <span className="mt-2 block text-muted-foreground">
          Se não puder vir, remarque em poucos toques: o horário fica livre para outra pessoa.
        </span>
        <span className="mt-4 flex h-11 items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground">
          Preciso remarcar
        </span>
        <span className="mt-2 block text-center text-sm text-muted-foreground underline underline-offset-4">
          Cancelar horário
        </span>
      </figcaption>
    </figure>
  );
}

/** A day of the agenda where a cancelled slot fades back to free (CSS loop). */
function AgendaMock({ mock }: { mock: PhoneMock }) {
  const pro = (i: number) => mock.professionals[i % mock.professionals.length]!;
  const service = (i: number) => mock.services[i % mock.services.length]!.name;
  const rows = [
    { time: "09:00", text: `${service(0)} · ${pro(0)}` },
    { time: "10:00", text: `${service(2)} · ${pro(1)}` },
  ];
  const after = [{ time: "13:00", text: `${service(1)} · ${pro(0)}` }];
  const row = "flex min-h-14 items-center gap-3 border-b px-4 last:border-b-0";
  return (
    <figure
      className={frame}
      aria-label="Exemplo: agenda do dia com um horário cancelado voltando a ficar livre"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold">Sábado</span>
        {exampleTag}
      </div>
      <figcaption className="text-sm">
        {rows.map((r) => (
          <span key={r.time} className={row}>
            <span className="w-12 font-medium tabular-nums text-muted-foreground">{r.time}</span>
            <span className="flex-1 rounded-lg bg-brand-100 px-2.5 py-1.5">{r.text}</span>
          </span>
        ))}
        <span className={`${row} relative`}>
          <span className="w-12 font-medium tabular-nums text-muted-foreground">11:00</span>
          <span className="relative h-9 flex-1">
            <span className="lp-slot-cycle absolute inset-0 flex items-center rounded-lg bg-muted px-2.5 text-muted-foreground line-through">
              {service(1)} · cancelado
            </span>
            <span className="lp-slot-cycle-free absolute inset-0 flex items-center justify-between rounded-lg border border-dashed border-primary px-2.5 font-medium text-primary">
              Livre <span className="text-xs font-normal">lista de espera avisada</span>
            </span>
          </span>
        </span>
        {after.map((r) => (
          <span key={r.time} className={row}>
            <span className="w-12 font-medium tabular-nums text-muted-foreground">{r.time}</span>
            <span className="flex-1 rounded-lg bg-brand-100 px-2.5 py-1.5">{r.text}</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
