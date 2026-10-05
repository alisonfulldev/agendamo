import { BadgeCheck, Bell, Check } from "lucide-react";

/*
 * Small product illustrations for the features grid, drawn with plain elements in the theme
 * colors (no images), so every niche shows them in its own palette.
 */

function Bubble({ me, children }: { me?: boolean; children: string }) {
  return (
    <div className={`flex ${me ? "justify-end" : "justify-start"}`}>
      <span
        className={`max-w-[80%] rounded-xl px-3 py-1.5 text-xs shadow-sm ${
          me ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-card"
        }`}
      >
        {children}
      </span>
    </div>
  );
}

export function ChatVisual() {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-muted p-3" aria-hidden>
      <Bubble>Qual serviço você quer agendar?</Bubble>
      <Bubble me>Avaliação</Bubble>
      <Bubble>Estes são os horários livres na terça:</Bubble>
      <div className="flex justify-end gap-1.5">
        {["17:00", "18:00", "19:00"].map((t, i) => (
          <span
            key={t}
            className={`rounded-lg border bg-card px-2 py-1 text-xs font-medium ${i === 2 ? "border-primary text-primary" : ""}`}
          >
            {t}
          </span>
        ))}
      </div>
      <Bubble>Obrigado! Seu horário está confirmado.</Bubble>
    </div>
  );
}

export function ProfileVisual() {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted p-3" aria-hidden>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
        S
      </span>
      <div className="min-w-0 flex-1">
        <span className="block h-2.5 w-24 rounded-full bg-foreground/70" />
        <span className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
          <BadgeCheck className="size-3 text-primary" /> Fotos · Serviços · Avaliações
        </span>
        <div className="mt-2 grid grid-cols-4 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="aspect-square rounded-md bg-primary/15" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function RemindersVisual() {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      {[
        ["Lembrete enviado", "Amanhã às 14:00 · Mariana"],
        ["Horário confirmado", "Sábado às 10:30 · Pedro"],
      ].map(([title, text], i) => (
        <div
          key={title}
          className={`flex items-center gap-2.5 rounded-xl border bg-card p-2.5 shadow-sm ${i === 1 ? "ml-4 opacity-80" : ""}`}
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bell className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold">{title}</span>
            <span className="block truncate text-xs text-muted-foreground">{text}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// A fixed pattern that reads as a QR code (decorative only).
const QR = ["1110111", "1010101", "1110111", "0001000", "1101011", "0110110", "1011101"];

export function PixVisual() {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-muted p-3" aria-hidden>
      <div className="grid grid-cols-7 gap-0.5 rounded-lg bg-card p-2 shadow-sm">
        {QR.flatMap((row, r) =>
          row
            .split("")
            .map((cell, c) => (
              <span
                key={`${r}-${c}`}
                className={`size-2 rounded-[2px] ${cell === "1" ? "bg-foreground" : "bg-transparent"}`}
              />
            )),
        )}
      </div>
      <div className="text-xs">
        <span className="block font-semibold">Sinal de R$ 50,00</span>
        <span className="block text-muted-foreground">Pix direto pra você</span>
        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
          <Check className="size-3" /> Pago
        </span>
      </div>
    </div>
  );
}

export function FinanceVisual() {
  const bars = [40, 55, 48, 70, 62, 85];
  return (
    <div className="rounded-xl bg-muted p-3" aria-hidden>
      <div className="mb-2 flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">Lucro do mês</span>
        <span className="font-semibold text-primary">+18%</span>
      </div>
      <div className="flex h-20 items-end gap-1.5">
        {bars.map((h, i) => (
          <span
            key={i}
            style={{ height: `${h}%` }}
            className={`flex-1 rounded-t-md ${i === bars.length - 1 ? "bg-primary" : "bg-primary/30"}`}
          />
        ))}
      </div>
    </div>
  );
}

export function CalendarVisual() {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const blocks: Record<number, [number, number][]> = {
    0: [[0, 2]],
    1: [
      [1, 1],
      [3, 2],
    ],
    2: [
      [0, 1],
      [2, 2],
    ],
    3: [[1, 2]],
    4: [
      [0, 1],
      [2, 1],
      [3, 2],
    ],
    5: [[0, 3]],
  };
  return (
    <div className="grid grid-cols-6 gap-1.5 rounded-xl bg-muted p-3" aria-hidden>
      {days.map((day, d) => (
        <div key={day} className="flex flex-col gap-1">
          <span className="text-center text-[10px] font-medium text-muted-foreground">{day}</span>
          <div className="relative h-24 rounded-md bg-card">
            {(blocks[d] ?? []).map(([start, len], i) => (
              <span
                key={i}
                style={{ top: `${start * 20 + 4}%`, height: `${len * 20 - 4}%` }}
                className={`absolute inset-x-0.5 rounded ${i % 2 ? "bg-primary/35" : "bg-primary/70"}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Illustrations in the same order as the brand's benefits list. */
export const FEATURE_VISUALS = [
  ChatVisual,
  ProfileVisual,
  RemindersVisual,
  PixVisual,
  FinanceVisual,
  CalendarVisual,
];
