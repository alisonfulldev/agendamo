"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { mapCustomerHeaders, parseCsv } from "@/lib/csv";
import { formatBrPhone, normalizeBrPhone } from "@/lib/phone";

import { importCustomersAction, type ImportReport } from "./actions";

interface PreviewRow {
  line: number;
  name: string;
  phone: string;
  email?: string;
  birthdate?: string;
  problem: string | null;
}

export function ImportDialog() {
  const router = useRouter();
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [pending, startTransition] = useTransition();

  async function read(file: File) {
    setError(null);
    setReport(null);
    const table = parseCsv(await file.text());
    const map = table[0] ? mapCustomerHeaders(table[0]) : null;
    if (!map) {
      setError(
        "Não encontramos as colunas “Nome” e “Telefone”. Confira a primeira linha do arquivo.",
      );
      setRows(null);
      return;
    }
    const seen = new Set<string>();
    setRows(
      table.slice(1, 2001).map((cells, i) => {
        const phone = cells[map.phone!] ?? "";
        const normalized = normalizeBrPhone(phone);
        let problem: string | null = null;
        if (!cells[map.name!]?.trim()) problem = "Sem nome";
        else if (!normalized) problem = "Telefone inválido";
        else if (seen.has(normalized)) problem = "Repetido no arquivo";
        if (normalized) seen.add(normalized);
        return {
          line: i + 2,
          name: cells[map.name!] ?? "",
          phone,
          email: map.email !== undefined ? cells[map.email] : undefined,
          birthdate: map.birthdate !== undefined ? cells[map.birthdate] : undefined,
          problem,
        };
      }),
    );
  }

  const okRows = rows?.filter((r) => !r.problem) ?? [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload /> Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar clientes</DialogTitle>
          <DialogDescription>
            Arquivo CSV com as colunas Nome, Telefone e, se quiser, E-mail e Aniversário. Clientes
            com o mesmo telefone não se repetem.
          </DialogDescription>
        </DialogHeader>
        <input
          type="file"
          accept=".csv,text/csv"
          aria-label="Arquivo CSV"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void read(file);
          }}
          className="text-sm"
        />
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {rows ? (
          <>
            <p className="text-sm">
              {okRows.length} prontas para importar · {rows.length - okRows.length} com problema
            </p>
            <div className="max-h-64 overflow-y-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card text-left text-muted-foreground">
                  <tr>
                    <th className="p-2">Linha</th>
                    <th className="p-2">Nome</th>
                    <th className="p-2">Telefone</th>
                    <th className="p-2">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.slice(0, 200).map((row) => (
                    <tr key={row.line} className={row.problem ? "text-muted-foreground" : ""}>
                      <td className="p-2">{row.line}</td>
                      <td className="p-2">{row.name}</td>
                      <td className="p-2">
                        {normalizeBrPhone(row.phone)
                          ? formatBrPhone(normalizeBrPhone(row.phone))
                          : row.phone}
                      </td>
                      <td className={`p-2 ${row.problem ? "text-destructive" : ""}`}>
                        {row.problem ?? "OK"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              type="button"
              disabled={pending || okRows.length === 0}
              onClick={() =>
                startTransition(async () => {
                  const result = await importCustomersAction(
                    okRows.map(({ line, name, phone, email, birthdate }) => ({
                      line,
                      name,
                      phone,
                      email,
                      birthdate,
                    })),
                  );
                  setReport(result);
                  setRows(null);
                  router.refresh();
                })
              }
            >
              {pending ? "Importando…" : `Importar ${okRows.length} clientes`}
            </Button>
          </>
        ) : null}
        {report ? (
          <div role="status" className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">
            <p>
              {report.created} novas · {report.updated} atualizadas · {report.duplicatesInFile}{" "}
              repetidas ignoradas
            </p>
            {report.errors.length ? (
              <ul className="mt-2 list-disc pl-5">
                {report.errors.slice(0, 50).map((e, i) => (
                  <li key={i}>
                    {e.line ? `Linha ${e.line}: ` : ""}
                    {e.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
