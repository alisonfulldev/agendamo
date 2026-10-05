"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ChatBubble,
  ChatComposer,
  ChatDayPill,
  ChatOption,
  ChatOptions,
  ChatTyping,
  ChatWindow,
} from "@/components/chat/chat-ui";
import { formatBRL } from "@/lib/money";

/** Brand data needed by the demo (kept small: this is a client component). */
export interface DemoChatData {
  businessName: string;
  customerName: string;
  dayLabel: string;
  time: string;
  services: { name: string; price: number }[];
  messages: { greeting: string; askDate: string; askTime: string; successConfirmed: string };
  serviceTerm: string;
}

type Event =
  | { kind: "typing"; ms: number }
  | { kind: "system"; text: string; ms: number }
  | { kind: "options"; items: string[]; pick: number; ms: number }
  | { kind: "user"; text: string; ms: number }
  | { kind: "pause"; ms: number };

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

/**
 * Sales page hero: a booking conversation that plays by itself in a loop (no data, nothing is
 * saved). With reduced motion it shows the finished conversation.
 */
export function DemoChat({ data }: { data: DemoChatData }) {
  const events = useMemo<Event[]>(() => {
    const service = data.services[0]?.name ?? "";
    const vars = {
      business: data.businessName,
      service: data.serviceTerm,
      date: data.dayLabel.toLowerCase(),
      time: data.time,
      customerName: data.customerName,
    };
    return [
      { kind: "typing", ms: 700 },
      { kind: "system", text: fill(data.messages.greeting, vars), ms: 900 },
      {
        kind: "options",
        items: data.services
          .slice(0, 3)
          .map((s) => `${s.name} · ${s.price ? formatBRL(s.price) : "grátis"}`),
        pick: 0,
        ms: 1400,
      },
      { kind: "user", text: service, ms: 500 },
      { kind: "typing", ms: 700 },
      { kind: "system", text: fill(data.messages.askDate, vars), ms: 800 },
      { kind: "options", items: [data.dayLabel, "Ver mais dias"], pick: 0, ms: 1300 },
      { kind: "user", text: data.dayLabel, ms: 500 },
      { kind: "typing", ms: 700 },
      { kind: "system", text: fill(data.messages.askTime, vars), ms: 800 },
      { kind: "options", items: ["09:00", data.time, "16:30"], pick: 1, ms: 1300 },
      { kind: "user", text: data.time, ms: 500 },
      { kind: "typing", ms: 900 },
      { kind: "system", text: fill(data.messages.successConfirmed, vars), ms: 600 },
      { kind: "pause", ms: 4500 },
    ];
  }, [data]);

  const [step, setStep] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    const timer = setTimeout(update, 0);
    query.addEventListener("change", update);
    return () => {
      clearTimeout(timer);
      query.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (reduced) return;
    const timer = setTimeout(
      () => setStep((current) => (current + 1) % events.length),
      events[step]!.ms,
    );
    return () => clearTimeout(timer);
  }, [step, events, reduced]);

  const last = reduced ? events.length - 1 : step;
  const shown = events.slice(0, last + 1);
  const current = events[last]!;

  return (
    <div
      aria-hidden
      inert
      className="mx-auto h-[540px] w-[290px] overflow-hidden rounded-[2.4rem] border-8 border-foreground bg-background shadow-xl"
    >
      <ChatWindow
        businessName={data.businessName}
        subtitle="online · responde na hora"
        footer={<ChatComposer label={null} />}
      >
        <ChatDayPill>Hoje</ChatDayPill>
        {shown.map((event, index) => {
          if (event.kind === "system")
            return (
              <ChatBubble key={index} from="system" time="10:24">
                {event.text}
              </ChatBubble>
            );
          if (event.kind === "user")
            return (
              <ChatBubble key={index} from="user" time="10:24">
                {event.text}
              </ChatBubble>
            );
          if (event.kind === "options" && event === current)
            return (
              <ChatOptions key={index}>
                {event.items.map((item, i) => (
                  <ChatOption
                    key={item}
                    onClick={() => undefined}
                    className={i === event.pick ? "ring-2 ring-primary" : ""}
                  >
                    {item}
                  </ChatOption>
                ))}
              </ChatOptions>
            );
          if (event.kind === "typing" && event === current) return <ChatTyping key={index} />;
          return null;
        })}
      </ChatWindow>
    </div>
  );
}
