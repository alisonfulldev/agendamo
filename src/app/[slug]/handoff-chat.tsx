"use client";

import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

import {
  CHAT_OPTION_CLASS,
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
import { whatsappLink } from "@/lib/phone";
import { track } from "@/lib/tracking/client";

import { getRequestDaysAction } from "./actions";

/**
 * Chat of the Grátis plan once its 10 bookings of the cycle are used: the customer picks the
 * service, the day and the preferred period (morning, afternoon, evening) and gives a name, but
 * nothing is saved or reserved; the last step opens the owner's WhatsApp with the request ready.
 */
type Step = "service" | "day" | "period" | "name" | "message" | "send";

const PERIODS = ["Manhã", "Tarde", "Noite"] as const;

interface Answers {
  serviceId: string | null;
  serviceLabel: string;
  date: string | null;
  dateLabel: string;
  period: string;
  name: string;
  message: string;
}

const EMPTY: Answers = {
  serviceId: null,
  serviceLabel: "",
  date: null,
  dateLabel: "",
  period: "",
  name: "",
  message: "",
};

type Day = { date: string; label: string };

export function HandoffChat({
  businessId,
  businessName,
  avatarUrl,
  services,
  whatsapp,
  onProfile,
  branding,
}: {
  businessId: string;
  businessName: string;
  avatarUrl?: string | null;
  services: { id: string; name: string }[];
  whatsapp: string | null;
  onProfile?: () => void;
  branding?: React.ReactNode;
}) {
  const clock = useChatClock();
  const [step, setStep] = useState<Step>("service");
  const [history, setHistory] = useState<Step[]>([]);
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [days, setDays] = useState<Day[] | null>(null);
  const [sent, setSent] = useState(false);

  // Short "typing" pause before each question.
  const [revealed, setRevealed] = useState<string | null>(null);
  const messageKey = sent ? "sent" : step;
  const typing = revealed !== messageKey;
  useEffect(() => {
    const timer = setTimeout(() => setRevealed(messageKey), 300 + Math.round(Math.random() * 300));
    return () => clearTimeout(timer);
  }, [messageKey]);

  // Free days are only read (nothing is reserved).
  useEffect(() => {
    if (step === "day" && answers.serviceId && days === null) {
      let cancelled = false;
      getRequestDaysAction({ businessId, serviceId: answers.serviceId, from: null }).then(
        (list) => !cancelled && setDays(list),
      );
      return () => {
        cancelled = true;
      };
    }
  }, [step, answers.serviceId, days, businessId]);

  const prompts: Record<Step, string> = {
    service: `Oi! 👋 Você está na agenda de ${businessName}. Qual serviço você quer?`,
    day: "Qual dia fica melhor pra você?",
    period: `Qual turno você prefere em ${answers.dateLabel}?`,
    name: "Qual é o seu nome?",
    message: "Quer deixar algum recado? (opcional)",
    send: `Confere: ${answers.serviceLabel}, ${answers.dateLabel}, de ${answers.period.toLowerCase()}. Vou abrir o WhatsApp de ${businessName} com seu pedido pronto; é só enviar e o horário é combinado por lá.`,
  };
  const answerText: Record<Step, string> = {
    service: answers.serviceLabel,
    day: answers.dateLabel,
    period: answers.period,
    name: answers.name,
    message: answers.message || "Sem recado",
    send: "Enviar pelo WhatsApp",
  };

  function go(next: Step, patch: Partial<Answers> = {}) {
    if (history.length === 0) track(businessId, "request_started");
    setAnswers((a) => ({ ...a, ...patch }));
    setHistory((h) => [...h, step]);
    setStep(next);
  }

  function back() {
    const previous = history.at(-1);
    if (!previous) return;
    if (previous === "service") setDays(null);
    setHistory((h) => h.slice(0, -1));
    setStep(previous);
  }

  const whatsappText = [
    `Olá, ${businessName}! Quero agendar um horário.`,
    `Serviço: ${answers.serviceLabel}`,
    `Dia: ${answers.dateLabel}`,
    `Turno: ${answers.period}`,
    `Nome: ${answers.name}`,
    answers.message ? `Recado: ${answers.message}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  let composer: React.ReactNode = <ChatComposer label={null} />;
  if (sent) composer = null;
  else if (step === "name") {
    composer = (
      <ChatComposer
        key="name"
        label="Seu nome"
        placeholder="Seu nome"
        autoComplete="name"
        initial={answers.name}
        validate={(v) => (v.trim().length >= 2 ? null : "Informe seu nome")}
        onSubmit={(name) => go("message", { name: name.trim() })}
      />
    );
  } else if (step === "message") {
    composer = (
      <ChatComposer
        key="message"
        label="Recado"
        placeholder="Seu recado (opcional)"
        initial={answers.message}
        allowEmpty
        validate={(v) => (v.length > 500 ? "Recado muito longo" : null)}
        onSubmit={(message) => go("send", { message: message.trim() })}
      />
    );
  }

  const linkClass = `${CHAT_OPTION_CLASS} justify-center text-primary`;
  const unavailable = !whatsapp || services.length === 0;

  return (
    <ChatWindow
      businessName={businessName}
      avatarUrl={avatarUrl}
      titlePrefix="Agendar com"
      subtitle="responde pelo WhatsApp"
      onProfile={onProfile}
      branding={branding}
      footer={unavailable ? null : composer}
    >
      <ChatDayPill>Hoje</ChatDayPill>

      {unavailable ? (
        <ChatBubble from="system" time={clock}>
          {businessName} não está recebendo agendamentos online no momento.
        </ChatBubble>
      ) : (
        <>
          {history.map((entry, i) => (
            <div key={i} className="flex flex-col">
              <ChatBubble from="system" time={clock}>
                {prompts[entry]}
              </ChatBubble>
              <ChatBubble from="user" time={clock}>
                {answerText[entry]}
              </ChatBubble>
            </div>
          ))}

          {sent ? (
            typing ? (
              <ChatTyping />
            ) : (
              <ChatBubble from="system" time={clock}>
                Pronto! Agora é só enviar a mensagem no WhatsApp. {businessName} confirma seu
                horário por lá. 😊
              </ChatBubble>
            )
          ) : (
            <>
              {typing ? (
                <ChatTyping />
              ) : (
                <ChatBubble from="system" time={clock}>
                  {prompts[step]}
                </ChatBubble>
              )}

              {step === "service" ? (
                <ChatOptions>
                  {services.map((service) => (
                    <ChatOption
                      key={service.id}
                      onClick={() => {
                        setDays(null);
                        go("day", { serviceId: service.id, serviceLabel: service.name });
                      }}
                    >
                      {service.name}
                    </ChatOption>
                  ))}
                </ChatOptions>
              ) : null}

              {step === "day" ? (
                days === null ? (
                  <ChatTyping />
                ) : days.length === 0 ? (
                  <ChatOptions>
                    <a
                      href={whatsappLink(
                        whatsapp!,
                        `Olá, ${businessName}! Quero agendar um horário.`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-track="click_whatsapp"
                      className={linkClass}
                    >
                      <MessageCircle className="size-4" /> Combinar pelo WhatsApp
                    </a>
                  </ChatOptions>
                ) : (
                  <>
                    <ChatOptions columns={2}>
                      {days.map((day) => (
                        <ChatOption
                          key={day.date}
                          className="text-center capitalize"
                          onClick={() => go("period", { date: day.date, dateLabel: day.label })}
                        >
                          {day.label}
                        </ChatOption>
                      ))}
                    </ChatOptions>
                    <ChatOptions>
                      <ChatOption
                        className="text-center text-primary"
                        onClick={() => {
                          const last = days.at(-1)!.date;
                          const next = new Date(`${last}T12:00:00Z`);
                          next.setUTCDate(next.getUTCDate() + 1);
                          getRequestDaysAction({
                            businessId,
                            serviceId: answers.serviceId,
                            from: next.toISOString().slice(0, 10),
                          }).then((more) => setDays((list) => [...(list ?? []), ...more]));
                        }}
                      >
                        Ver mais dias
                      </ChatOption>
                    </ChatOptions>
                  </>
                )
              ) : null}

              {step === "period" ? (
                <ChatOptions columns={3}>
                  {PERIODS.map((period) => (
                    <ChatOption
                      key={period}
                      className="text-center font-medium"
                      onClick={() => go("name", { period })}
                    >
                      {period}
                    </ChatOption>
                  ))}
                </ChatOptions>
              ) : null}

              {step === "message" ? (
                <ChatOptions>
                  <ChatOption className="text-center" onClick={() => go("send", { message: "" })}>
                    Sem recado
                  </ChatOption>
                </ChatOptions>
              ) : null}

              {step === "send" ? (
                <ChatOptions>
                  <a
                    href={whatsappLink(whatsapp!, whatsappText)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-track="click_whatsapp"
                    onClick={() => {
                      setHistory((h) => [...h, "send"]);
                      setSent(true);
                    }}
                    className="flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-base font-medium text-primary-foreground shadow-sm hover:opacity-90"
                  >
                    <MessageCircle className="size-5" /> Enviar pelo WhatsApp
                  </a>
                </ChatOptions>
              ) : null}

              {history.length > 0 ? (
                <ChatNotice onClick={back}>↩ Voltar e mudar a resposta anterior</ChatNotice>
              ) : null}
            </>
          )}
        </>
      )}
    </ChatWindow>
  );
}
