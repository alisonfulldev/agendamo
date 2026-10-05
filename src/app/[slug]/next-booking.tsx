"use client";

import { CalendarPlus } from "lucide-react";
import { useState, useTransition } from "react";

import {
  CHAT_OPTION_CLASS,
  ChatBubble,
  ChatOption,
  ChatOptions,
  ChatTyping,
} from "@/components/chat/chat-ui";
import { addDaysToDate } from "@/lib/availability";
import { returnIntervalText } from "@/lib/booking/next-visit";
import { track } from "@/lib/tracking/client";

import {
  confirmChatBookingAction,
  getChatDaysAction,
  getChatSlotsAction,
  type ConfirmResult,
} from "./chat-actions";

type Phase = "offer" | "days" | "slots" | "done" | "declined";

/**
 * Right after a booking is confirmed: offers to book the next visit of the same service with the
 * same professional, starting from the service's usual return interval. Reuses the customer's
 * contact, so it takes two taps (day and time).
 */
export function NextBooking({
  slug,
  businessId,
  serviceId,
  serviceLabel,
  professionalId,
  bookedDate,
  returnAfterDays,
  contact,
  clock,
  conflictMessage,
  errorMessage,
}: {
  slug: string;
  businessId: string;
  serviceId: string;
  serviceLabel: string;
  professionalId: string;
  bookedDate: string;
  returnAfterDays: number;
  contact: { name: string; phone: string; email: string };
  clock: string;
  conflictMessage: string;
  errorMessage: string;
}) {
  const [phase, setPhase] = useState<Phase>("offer");
  const [days, setDays] = useState<{ date: string; label: string }[] | null>(null);
  const [day, setDay] = useState<{ date: string; label: string } | null>(null);
  const [slots, setSlots] = useState<{ startsAt: string; time: string }[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<Extract<ConfirmResult, { ok: true }> | null>(null);
  const [pending, startTransition] = useTransition();

  const selection = { slug, serviceIds: [serviceId], comboId: null, professional: professionalId };
  const linkClass = `${CHAT_OPTION_CLASS} justify-center text-primary`;

  function showDays() {
    setPhase("days");
    setDays(null);
    getChatDaysAction({ ...selection, from: addDaysToDate(bookedDate, returnAfterDays) })
      .then((list) => setDays(list.slice(0, 6)))
      .catch(() => setDays([]));
  }

  function showSlots(picked: { date: string; label: string }) {
    setDay(picked);
    setPhase("slots");
    setSlots(null);
    getChatSlotsAction({ ...selection, date: picked.date })
      .then(setSlots)
      .catch(() => setSlots([]));
  }

  function book(startsAt: string) {
    setNotice(null);
    startTransition(async () => {
      const confirmed = await confirmChatBookingAction({
        ...selection,
        startsAt,
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        optIn: false,
        couponCode: null,
        referralCode: null,
        abandonedId: null,
      }).catch(() => ({ ok: false as const, error: "invalid" as const }));
      if (confirmed.ok) {
        track(businessId, "booking_confirmed");
        setResult(confirmed);
        setPhase("done");
      } else if (confirmed.error === "conflict" && day) {
        setNotice(conflictMessage);
        showSlots(day);
      } else {
        setNotice(errorMessage);
      }
    });
  }

  return (
    <>
      <ChatBubble from="system" time={clock}>
        Quer já deixar o próximo {serviceLabel} marcado? O ideal é voltar em cerca de{" "}
        {returnIntervalText(returnAfterDays)}.
      </ChatBubble>

      {phase === "offer" ? (
        <ChatOptions columns={2}>
          <ChatOption className="text-center" onClick={showDays}>
            Sim, ver horários
          </ChatOption>
          <ChatOption className="text-center" onClick={() => setPhase("declined")}>
            Agora não
          </ChatOption>
        </ChatOptions>
      ) : (
        <ChatBubble from="user" time={clock}>
          {phase === "declined" ? "Agora não" : "Sim, ver horários"}
        </ChatBubble>
      )}

      {phase === "declined" ? (
        <ChatBubble from="system" time={clock}>
          Tudo bem! Quando quiser, é só voltar neste mesmo link.
        </ChatBubble>
      ) : null}

      {phase === "days" ? (
        days === null ? (
          <ChatTyping />
        ) : days.length === 0 ? (
          <ChatBubble from="system" time={clock}>
            A agenda ainda não abriu para essa época. Quando estiver perto, é só voltar neste link.
          </ChatBubble>
        ) : (
          <ChatOptions columns={2}>
            {days.map((d) => (
              <ChatOption key={d.date} onClick={() => showSlots(d)}>
                <span className="capitalize">{d.label}</span>
              </ChatOption>
            ))}
          </ChatOptions>
        )
      ) : null}

      {(phase === "slots" || phase === "done") && day ? (
        <ChatBubble from="user" time={clock}>
          <span className="capitalize">{day.label}</span>
        </ChatBubble>
      ) : null}

      {notice ? (
        <ChatBubble from="system" time={clock}>
          {notice}
        </ChatBubble>
      ) : null}

      {phase === "slots" ? (
        slots === null || pending ? (
          <ChatTyping />
        ) : slots.length === 0 ? (
          <>
            <ChatBubble from="system" time={clock}>
              Esse dia não tem mais horários. Quer escolher outro?
            </ChatBubble>
            <ChatOptions>
              <ChatOption className="text-center" onClick={showDays}>
                Escolher outro dia
              </ChatOption>
            </ChatOptions>
          </>
        ) : (
          <>
            <ChatOptions columns={3}>
              {slots.map((slot) => (
                <ChatOption
                  key={slot.startsAt}
                  className="text-center font-medium"
                  onClick={() => book(slot.startsAt)}
                >
                  {slot.time}
                </ChatOption>
              ))}
            </ChatOptions>
            <ChatOptions>
              <ChatOption className="text-center text-primary" onClick={showDays}>
                Escolher outro dia
              </ChatOption>
            </ChatOptions>
          </>
        )
      ) : null}

      {phase === "done" && result ? (
        <>
          <ChatBubble from="user" time={clock}>
            {result.vars.time}
          </ChatBubble>
          <ChatBubble from="system" time={clock}>
            {result.status === "confirmed"
              ? `Prontinho! Seu próximo horário ficou para ${result.vars.date} às ${result.vars.time}.`
              : result.status === "pending"
                ? `Recebemos o pedido para ${result.vars.date} às ${result.vars.time}. Você recebe a confirmação em breve.`
                : `Reservamos ${result.vars.date} às ${result.vars.time}. Para garantir, pague o sinal de R$ ${result.vars.depositAmount} pelo Pix até ${result.vars.deadline}.`}
          </ChatBubble>
          <ChatOptions>
            {result.status === "awaiting_deposit" ? (
              <a href={`/cancelar/${result.cancelToken}`} className={linkClass}>
                Ver o Pix do sinal
              </a>
            ) : null}
            <div className="grid grid-cols-2 gap-1.5">
              {result.googleCalendarUrl ? (
                <a
                  href={result.googleCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <CalendarPlus className="size-4" /> Google Agenda
                </a>
              ) : null}
              <a href={`/api/ics/${result.cancelToken}`} className={linkClass}>
                <CalendarPlus className="size-4" /> Calendário do iPhone
              </a>
            </div>
          </ChatOptions>
        </>
      ) : null}
    </>
  );
}
