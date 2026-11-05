"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  ChatBubble,
  ChatComposer,
  ChatDayPill,
  ChatNotice,
  ChatOption,
  ChatOptions,
  ChatTyping,
  ChatWindow,
  useChatClock,
} from "@/components/chat/chat-ui";
import { formatBRL, formatDuration } from "@/lib/money";

export interface ExampleChatData {
  businessName: string;
  avatarUrl: string | null;
  services: { name: string; durationMinutes: number; priceCents: number }[];
  messages: {
    greeting: string;
    askDate: string;
    askTime: string;
    askName: string;
    successConfirmed: string;
  };
  siteHref: string;
}

type Step = "service" | "day" | "time" | "name" | "done";
interface Bubble {
  from: "system" | "user";
  text: string;
}

const TIMES = ["09:00", "10:30", "14:00", "15:30", "17:00"];

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

/** The next business days (Monday to Saturday), as chat options. */
function nextDays(count: number): string[] {
  const days: string[] = [];
  const date = new Date();
  while (days.length < count) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() === 0) continue;
    days.push(
      date.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" }),
    );
  }
  return days;
}

/**
 * Booking chat of the example sites (/exemplo/<ramo>/agendar, 2026-11-06): the same steps and
 * look as the real chat (service, day, time, name), but nothing is checked or saved. At the end it
 * says it was an example and goes back to the site.
 */
export function ExampleBookingChat({ data }: { data: ExampleChatData }) {
  const time = useChatClock();
  const [step, setStep] = useState<Step>("service");
  const [log, setLog] = useState<Bubble[]>([]);
  const [typing, setTyping] = useState(true);
  const [days, setDays] = useState<string[]>([]);

  useEffect(() => {
    // Days from the visitor's own clock (in the callback, so the server render never differs).
    const timer = setTimeout(() => {
      setDays(nextDays(4));
      setTyping(false);
      setLog([
        { from: "system", text: fill(data.messages.greeting, { business: data.businessName }) },
      ]);
    }, 700);
    return () => clearTimeout(timer);
  }, [data]);

  function answer(text: string, next: Step, reply: string) {
    setLog((l) => [...l, { from: "user", text }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setLog((l) => [...l, { from: "system", text: reply }]);
      setStep(next);
    }, 650);
  }

  const options =
    typing || step === "name" || step === "done" ? null : step === "service" ? (
      <ChatOptions>
        {data.services.map((s) => (
          <ChatOption key={s.name} onClick={() => answer(s.name, "day", data.messages.askDate)}>
            <span className="block font-medium">{s.name}</span>
            <span className="block text-sm text-muted-foreground">
              {formatDuration(s.durationMinutes)}
              {s.priceCents ? ` · ${formatBRL(s.priceCents)}` : ""}
            </span>
          </ChatOption>
        ))}
      </ChatOptions>
    ) : step === "day" ? (
      <ChatOptions columns={2}>
        {days.map((d) => (
          <ChatOption
            key={d}
            onClick={() => answer(d, "time", fill(data.messages.askTime, { date: d }))}
          >
            {d}
          </ChatOption>
        ))}
      </ChatOptions>
    ) : (
      <ChatOptions columns={3}>
        {TIMES.map((t) => (
          <ChatOption
            key={t}
            className="text-center"
            onClick={() => answer(t, "name", data.messages.askName)}
          >
            {t}
          </ChatOption>
        ))}
      </ChatOptions>
    );

  return (
    <ChatWindow
      businessName={data.businessName}
      avatarUrl={data.avatarUrl}
      titlePrefix="Agendar com"
      footer={
        step === "name" && !typing ? (
          <ChatComposer
            label="Seu nome"
            placeholder="Digite seu nome"
            autoComplete="given-name"
            validate={(v) => (v.trim().length < 2 ? "Digite seu nome" : null)}
            onSubmit={(name) => {
              const first = name.trim().split(" ")[0] ?? name;
              answer(
                name.trim(),
                "done",
                fill(data.messages.successConfirmed, { customerName: first }),
              );
            }}
          />
        ) : (
          <ChatComposer label={null} placeholder="Escolha uma opção acima" />
        )
      }
      className="h-full"
    >
      <ChatDayPill>Hoje</ChatDayPill>
      <ChatNotice>Exemplo: nada aqui é agendado de verdade.</ChatNotice>
      {log.map((b, i) => (
        <ChatBubble key={i} from={b.from} time={time} tail={i === 0 || log[i - 1]?.from !== b.from}>
          {b.text}
        </ChatBubble>
      ))}
      {typing ? <ChatTyping /> : null}
      {options}
      {step === "done" && !typing ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl bg-card p-4 text-center text-sm shadow-sm">
          <p>
            É assim que seus clientes vão agendar: escolhem o serviço, o dia e um horário livre, e
            você recebe um aviso no celular na hora. Neste exemplo, nenhum horário foi marcado.
          </p>
          <Link
            href={data.siteHref}
            className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground"
          >
            Voltar ao site
          </Link>
        </div>
      ) : null}
    </ChatWindow>
  );
}
