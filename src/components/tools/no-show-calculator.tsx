"use client";

import { useState } from "react";

import { formatBRL } from "@/lib/money";
import { noShowLoss } from "@/lib/tools/no-show";

import { ToolField, toolInputClass } from "./tool-field";

/** Calculator of what no-shows cost (/ferramentas/calculadora-de-faltas). Runs in the browser. */
export function NoShowCalculator() {
  const [appointments, setAppointments] = useState("120");
  const [noShow, setNoShow] = useState("10");
  const [ticket, setTicket] = useState("80");
  const [avoided, setAvoided] = useState("30");
  const number = (value: string) => Number(value.replace(",", ".")) || 0;
  const result = noShowLoss({
    appointments: number(appointments),
    noShowPercent: number(noShow),
    ticketCents: Math.round(number(ticket) * 100),
    avoidedPercent: number(avoided),
  });

  return (
    <div className="mt-8 grid gap-6 rounded-2xl border bg-card p-5 sm:grid-cols-2 sm:p-6">
      <div className="flex flex-col gap-4">
        <ToolField label="Atendimentos marcados por mês" htmlFor="atendimentos">
          <input
            id="atendimentos"
            inputMode="numeric"
            className={toolInputClass}
            value={appointments}
            onChange={(e) => setAppointments(e.target.value)}
          />
        </ToolField>
        <ToolField label="Faltas (% dos marcados)" htmlFor="faltas">
          <input
            id="faltas"
            inputMode="decimal"
            className={toolInputClass}
            value={noShow}
            onChange={(e) => setNoShow(e.target.value)}
          />
        </ToolField>
        <ToolField label="Ticket médio (R$)" htmlFor="ticket">
          <input
            id="ticket"
            inputMode="decimal"
            className={toolInputClass}
            value={ticket}
            onChange={(e) => setTicket(e.target.value)}
          />
        </ToolField>
        <ToolField
          label="Suposição: % das faltas que dariam para evitar"
          htmlFor="evitadas"
          hint="Valor seu, para simular. Não é promessa de resultado."
        >
          <input
            id="evitadas"
            inputMode="decimal"
            className={toolInputClass}
            value={avoided}
            onChange={(e) => setAvoided(e.target.value)}
          />
        </ToolField>
      </div>
      <div aria-live="polite" className="flex flex-col gap-4 rounded-xl bg-muted/50 p-5">
        <p className="text-sm text-muted-foreground">
          {result.noShowsPerMonth.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} faltas por
          mês
        </p>
        <div>
          <p className="text-sm font-medium">Deixa de entrar</p>
          <p className="text-3xl font-bold">{formatBRL(result.lossPerMonthCents)}/mês</p>
          <p className="text-muted-foreground">{formatBRL(result.lossPerYearCents)} por ano</p>
        </div>
        <div>
          <p className="text-sm font-medium">Voltaria com a sua suposição</p>
          <p className="text-2xl font-bold text-primary">
            {formatBRL(result.recoveredPerMonthCents)}/mês
          </p>
          <p className="text-muted-foreground">{formatBRL(result.recoveredPerYearCents)} por ano</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Estimativa com os números informados. Nada é enviado ou salvo.
        </p>
      </div>
    </div>
  );
}
